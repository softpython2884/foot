
'use server';

import type {
  ApiSportsFixturesApiResponse,
  ApiSportsFixtureResponseItem,
  ApiSportsTeamApiResponse,
  ApiSportsTeamResponseItem,
  ApiSportsLeaguesApiResponse,
  ApiSportsCoachApiResponse,
  ApiSportsCoachResponseItem,
  ApiSportsSquadApiResponse,
  ApiSportsSquadPlayerResponseItem,
  ApiSportsF1ConstructorApiResponse,
  ApiSportsF1ConstructorResponseItem,
  ApiSportsF1RankingDriversApiResponse,
  ApiSportsF1RankingDriverResponseItem,
  ApiSportsF1RacesApiResponse,
  ApiSportsF1RaceResponseItem,
  ApiSportsBasketballTeamApiResponse,
  ApiSportsBasketballTeamResponseItem,
  ApiSportsBasketballPlayersApiResponse,
  ApiSportsBasketballPlayerResponseItem,
  ApiSportsBasketballGamesApiResponse,
  ApiSportsBasketballGameResponseItem,
  LeagueApp,
  MatchApp,
  TeamApp,
  CoachApp,
  PlayerApp,
  F1DriverApp,
  F1RaceResultApp,
  BasketballPlayerApp,
  BasketballGameResultApp,
  ApiSportsPlayerInfoInSquad,
  ApiSportsF1DriverInfo,
} from '@/lib/types';
import { supportedSports } from '@/lib/mockData';

const FOOTBALL_CURRENT_SEASON = 2023;
const F1_CURRENT_SEASON = 2024; // Make sure this is the season you want data for
const BASKETBALL_CURRENT_SEASON_STRING = "2023-2024";

async function fetchDataForSport<T>(
  sportApiBaseUrl: string,
  endpoint: string,
  apiKey: string | undefined,
  apiKeyHeader: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  if (!apiKey) {
    console.error(`API Key for ${sportApiBaseUrl} is not configured.`);
    throw new Error(`API Key for ${sportApiBaseUrl} is not configured.`);
  }

  const url = new URL(`${sportApiBaseUrl}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const headers = new Headers();
  headers.append(apiKeyHeader, apiKey);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: headers,
    next: { revalidate: 3600 } // Cache for 1 hour
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API-Sports Error (${response.status}) for ${url.toString()}: ${errorBody}`);
    throw new Error(`Failed to fetch data from API-Sports: ${response.status} ${response.statusText}. Body: ${errorBody}`);
  }

  const data = await response.json();

  if (data.errors && (Object.keys(data.errors).length > 0 || (Array.isArray(data.errors) && data.errors.length > 0))) {
    console.error(`API-Sports logical error for ${url.toString()}:`, JSON.stringify(data.errors));
    // Potentially throw an error here or return a specific structure indicating API-level error
  }
  return data as T;
}

function getApiKeyForSport(sportSlug: string): string | undefined {
    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) {
        console.error(`Sport with slug ${sportSlug} not found in supportedSports.`);
        return undefined;
    }
    // All sports under api-sports.io use the same key for this project's setup
    return process.env.API_SPORTS_KEY;
}


// --- FOOTBALL SPECIFIC FUNCTIONS ---

function mapApiTeamToTeamApp(apiTeamData: ApiSportsTeamResponseItem, sportSlug: string): TeamApp {
  return {
    id: apiTeamData.team.id,
    name: apiTeamData.team.name,
    logoUrl: apiTeamData.team.logo,
    country: apiTeamData.team.country,
    founded: apiTeamData.team.founded,
    venueName: apiTeamData.venue.name,
    venueCity: apiTeamData.venue.city,
    venueCapacity: apiTeamData.venue.capacity,
    sportSlug: sportSlug,
  };
}

export async function getFootballTeamDetails(teamId: number, footballApiBaseUrl: string): Promise<TeamApp | null> {
  try {
    const apiKey = getApiKeyForSport('football');
    const data = await fetchDataForSport<ApiSportsTeamApiResponse>(
        footballApiBaseUrl,
        '/teams',
        apiKey,
        'x-apisports-key',
        { id: teamId }
    );
    if (data.response && data.response.length > 0) {
      return mapApiTeamToTeamApp(data.response[0], 'football');
    }
    return null;
  } catch (error) {
    console.error(`Error fetching football team details for ID ${teamId} from API-Sports:`, error);
    return null;
  }
}

function mapApiFixtureToMatchApp(apiFixture: ApiSportsFixtureResponseItem, sportSlug: string): MatchApp {
  const homeTeamApp: TeamApp = {
    id: apiFixture.teams.home.id,
    name: apiFixture.teams.home.name,
    logoUrl: apiFixture.teams.home.logo,
    sportSlug: sportSlug,
  };
  const awayTeamApp: TeamApp = {
    id: apiFixture.teams.away.id,
    name: apiFixture.teams.away.name,
    logoUrl: apiFixture.teams.away.logo,
    sportSlug: sportSlug,
  };
  const leagueApp: LeagueApp = {
    id: apiFixture.league.id,
    name: apiFixture.league.name,
    logoUrl: apiFixture.league.logo,
    country: apiFixture.league.country,
    season: typeof apiFixture.league.season === 'number' ? apiFixture.league.season : parseInt(String(apiFixture.league.season).split('-')[0]),
    sportSlug: sportSlug,
    type: apiFixture.league.type // Assuming type is present; adjust if not
  };

  return {
    id: apiFixture.fixture.id,
    league: leagueApp,
    homeTeam: homeTeamApp,
    awayTeam: awayTeamApp,
    matchTime: apiFixture.fixture.date,
    statusShort: apiFixture.fixture.status.short,
    statusLong: apiFixture.fixture.status.long,
    elapsedTime: apiFixture.fixture.status.elapsed,
    venueName: apiFixture.fixture.venue.name,
    venueCity: apiFixture.fixture.venue.city,
    homeScore: apiFixture.goals.home,
    awayScore: apiFixture.goals.away,
    sportSlug: sportSlug,
  };
}

export async function getFootballFixtureById(fixtureId: number, footballApiBaseUrl: string): Promise<MatchApp | null> {
  try {
    const apiKey = getApiKeyForSport('football');
    const data = await fetchDataForSport<ApiSportsFixturesApiResponse>(
        footballApiBaseUrl,
        '/fixtures',
        apiKey,
        'x-apisports-key',
        { id: fixtureId }
    );
    if (data.response && data.response.length > 0) {
      return mapApiFixtureToMatchApp(data.response[0], 'football');
    }
    return null;
  } catch (error) {
    console.error(`Error fetching football fixture details for ID ${fixtureId} from API-Sports:`, error);
    return null;
  }
}

export async function getFootballMatchesForTeam(
  teamId: number,
  season: number = FOOTBALL_CURRENT_SEASON,
  params: { status?: string; dateFrom?: string; dateTo?: string; next?: number } = {},
  footballApiBaseUrl: string
): Promise<MatchApp[]> {
  const queryParams: Record<string, string | number> = { team: teamId, season: season };
  if (params.status) queryParams.status = params.status;
  if (params.dateFrom) queryParams.from = params.dateFrom;
  if (params.dateTo) queryParams.to = params.dateTo;
  if (params.next) queryParams.next = params.next;

  try {
    const apiKey = getApiKeyForSport('football');
    const data = await fetchDataForSport<ApiSportsFixturesApiResponse>(
        footballApiBaseUrl,
        '/fixtures',
        apiKey,
        'x-apisports-key',
        queryParams
    );
    if (data.response && data.response.length > 0) {
      return data.response.map(fixture => mapApiFixtureToMatchApp(fixture, 'football'));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching football fixtures for team ${teamId} from API-Sports:`, error);
    return [];
  }
}

function mapApiCoachToCoachApp(apiCoachData: ApiSportsCoachResponseItem, sportSlug: string): CoachApp | null {
  if (!apiCoachData || !apiCoachData.id || !apiCoachData.name) return null;
  return {
    id: apiCoachData.id,
    name: apiCoachData.name,
    photoUrl: apiCoachData.photo,
    nationality: apiCoachData.nationality,
    age: apiCoachData.age,
    sportSlug: sportSlug,
  };
}

export async function getFootballCoachForTeam(teamId: number, footballApiBaseUrl: string): Promise<CoachApp | null> {
  try {
    const apiKey = getApiKeyForSport('football');
    const data = await fetchDataForSport<ApiSportsCoachApiResponse>(
        footballApiBaseUrl,
        '/coachs',
        apiKey,
        'x-apisports-key',
        { team: teamId }
    );
    if (data.response && data.response.length > 0) {
      return mapApiCoachToCoachApp(data.response[0], 'football');
    }
    return null;
  } catch (error) {
    console.error(`Error fetching football coach for team ${teamId} from API-Sports:`, error);
    return null;
  }
}

function mapApiPlayerInSquadToPlayerApp(apiPlayer: ApiSportsPlayerInfoInSquad, sportSlug: string): PlayerApp {
  return {
    id: apiPlayer.id,
    name: apiPlayer.name || 'N/A',
    photoUrl: apiPlayer.photo,
    number: apiPlayer.number,
    position: apiPlayer.position,
    age: apiPlayer.age,
    sportSlug: sportSlug,
  };
}

export async function getFootballSquadForTeam(teamId: number, footballApiBaseUrl: string): Promise<PlayerApp[]> {
  try {
    const apiKey = getApiKeyForSport('football');
    const data = await fetchDataForSport<ApiSportsSquadApiResponse>(
        footballApiBaseUrl,
        '/players/squads',
        apiKey,
        'x-apisports-key',
        { team: teamId }
    );
    if (data.response && data.response.length > 0 && data.response[0].players) {
      return data.response[0].players.map(player => mapApiPlayerInSquadToPlayerApp(player, 'football'));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching football squad for team ${teamId} from API-Sports:`, error);
    return [];
  }
}

// --- FORMULA 1 SPECIFIC FUNCTIONS ---

function mapApiF1ConstructorToTeamApp(apiConstructor: ApiSportsF1ConstructorResponseItem): TeamApp {
  return {
    id: apiConstructor.id,
    name: apiConstructor.name,
    logoUrl: apiConstructor.logo,
    sportSlug: 'formula-1',
    base: apiConstructor.base,
    championships: apiConstructor.world_championships,
    director: apiConstructor.director,
    technicalManager: apiConstructor.technical_manager,
    chassis: apiConstructor.chassis,
    engine: apiConstructor.engine,
    firstTeamEntry: apiConstructor.first_team_entry,
    polePositions: apiConstructor.pole_positions,
    fastestLaps: apiConstructor.fastest_laps,
  };
}

export async function getF1ConstructorDetails(constructorId: number, f1ApiBaseUrl: string): Promise<TeamApp | null> {
  try {
    const apiKey = getApiKeyForSport('formula-1');
    const data = await fetchDataForSport<ApiSportsF1ConstructorApiResponse>(
        f1ApiBaseUrl,
        '/teams', // Endpoint for F1 constructor details
        apiKey,
        'x-apisports-key',
        { id: constructorId }
    );
    if (data.response && data.response.length > 0) {
      return mapApiF1ConstructorToTeamApp(data.response[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching F1 constructor details for ID ${constructorId}:`, error);
    return null;
  }
}

function mapApiF1RankingDriverToF1DriverApp(apiRankingDriver: ApiSportsF1RankingDriverResponseItem): F1DriverApp {
  return {
    id: apiRankingDriver.driver.id,
    name: apiRankingDriver.driver.name,
    photoUrl: apiRankingDriver.driver.image, // Corrected: use 'image' from ApiSportsF1DriverInfo
    number: apiRankingDriver.driver.number,
    abbr: apiRankingDriver.driver.abbr,
    nationality: undefined, // Nationality is not in ApiSportsF1RankingDriverResponseItem.driver
    age: undefined,
    worldChampionships: undefined, // Not in this specific response item
    sportSlug: 'formula-1',
    position: 'Driver', // Generic position for F1
    teamName: apiRankingDriver.team.name, // Team name from the ranking context
  };
}

export async function getF1DriversForSeason(constructorId: number, season: number = F1_CURRENT_SEASON, f1ApiBaseUrl: string): Promise<F1DriverApp[]> {
  try {
    const apiKey = getApiKeyForSport('formula-1');
    const data = await fetchDataForSport<ApiSportsF1RankingDriversApiResponse>(
        f1ApiBaseUrl,
        '/rankings/drivers', // This endpoint allows filtering by team and season
        apiKey,
        'x-apisports-key',
        { team: constructorId, season: season }
    );
    if (data.response && data.response.length > 0) {
      return data.response.map(mapApiF1RankingDriverToF1DriverApp);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching F1 drivers for constructor ${constructorId}, season ${season}:`, error);
    return [];
  }
}

function mapApiF1RaceToF1RaceResultApp(apiRace: ApiSportsF1RaceResponseItem, constructorIdFocus: number): F1RaceResultApp | null {
  const driverResultsForTeam: F1RaceResultApp['driverResults'] = [];

  // The /races endpoint itself might not nest detailed per-driver results for a team directly.
  // Typically, you'd get a list of races, then for each race ID, query /rankings/races?race={id}
  // However, if apiRace.results or apiRace.teams[...].drivers is populated from /races, we use that.
  // Based on documentation, /races endpoint's "response" array items themselves might not have deep results.
  // We assume for this mapping that detailed results for the specific race are already part of `apiRace` (e.g., if fetched from /rankings/races)
  // Or, if apiRace.teams is present from a direct /races call that has that structure.

  const resultsSource = apiRace.results || apiRace.teams?.find(t => t.team.id === constructorIdFocus)?.drivers;

  if (resultsSource) {
    resultsSource.forEach(res => {
      // Need to adapt based on whether res is from apiRace.results or apiRace.teams[...].drivers
      const driverInfo: ApiSportsF1DriverInfo = (res as any).driver; // Cast needed if structure varies
      const teamInfo = (res as any).team; // If from apiRace.results

      if (driverInfo && (teamInfo?.id === constructorIdFocus || !(res as any).team) ) { // Check if team matches focus or if team context is implicit
         driverResultsForTeam.push({
          driverName: driverInfo.name,
          driverImage: driverInfo.image,
          driverNumber: driverInfo.number,
          position: (res as any).position,
          grid: (res as any).grid,
          laps: (res as any).laps,
          time: (res as any).time,
          points: (res as any).points,
        });
      }
    });
  }
  
  // Only return a result if there are drivers from the focused constructor
  if (driverResultsForTeam.length === 0 && apiRace.status === "Finished") {
      // This race might not have included drivers from the constructor, or results weren't mapped.
      // Depending on desired behavior, could return null or an empty driverResults array.
      // For now, let's still return the race info but with empty results for that team.
  }

  return {
    id: apiRace.id,
    competitionName: apiRace.competition.name,
    circuitName: apiRace.circuit.name,
    circuitImage: apiRace.circuit.image,
    date: apiRace.date,
    season: apiRace.season,
    type: apiRace.type,
    status: apiRace.status,
    weather: apiRace.weather,
    driverResults: driverResultsForTeam,
  };
}


export async function getF1RaceResultsForSeason(constructorId: number, season: number = F1_CURRENT_SEASON, f1ApiBaseUrl: string, limit: number = 5): Promise<F1RaceResultApp[]> {
  try {
    const apiKey = getApiKeyForSport('formula-1');
    // First, get all finished races for the season
    const racesData = await fetchDataForSport<ApiSportsF1RacesApiResponse>(
        f1ApiBaseUrl,
        '/races',
        apiKey,
        'x-apisports-key',
        { season: season, type: 'Race', status: 'Finished' } // Get all finished races
    );

    const raceResults: F1RaceResultApp[] = [];

    if (racesData.response && racesData.response.length > 0) {
      // Sort races by date descending to process most recent first
      const sortedRaces = racesData.response.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      for (const race of sortedRaces) {
        if (raceResults.length >= limit) break; // Stop if we have enough results

        // For each race, get the detailed ranking which includes all drivers
        const rankingData = await fetchDataForSport<ApiSportsF1RacesApiResponse>( // Re-using RacesApiResponse type for /rankings/races for simplicity
            f1ApiBaseUrl,
            '/rankings/races', // Endpoint to get results for a specific race
            apiKey,
            'x-apisports-key',
            { race: race.id }
        );
        
        if (rankingData.response && rankingData.response.length > 0) {
            // The response from /rankings/races is an array of driver results for that race.
            // We need to construct an F1RaceResultApp object from this.
            const currentRaceDetailedResults = rankingData.response; // This IS the array of driver results.
            
            const mappedRace = mapApiF1RaceToF1RaceResultApp({
                ...race, // Spread basic race info
                results: currentRaceDetailedResults as any // Add the detailed results here to be processed by the mapper
            }, constructorId);

            if (mappedRace && mappedRace.driverResults.length > 0) {
                raceResults.push(mappedRace);
            } else if (mappedRace) { // Include race even if no team drivers, if that's intended
                // raceResults.push(mappedRace); // Uncomment to include races where the team DNF or didn't participate
            }
        }
      }
    }
    return raceResults;
  } catch (error) {
    console.error(`Error fetching F1 race results for constructor ${constructorId}, season ${season}:`, error);
    return [];
  }
}


// --- BASKETBALL SPECIFIC FUNCTIONS ---

function mapApiBasketballTeamToTeamApp(apiTeam: ApiSportsBasketballTeamResponseItem): TeamApp {
  return {
    id: apiTeam.id,
    name: apiTeam.name,
    logoUrl: apiTeam.logo,
    country: apiTeam.country?.name,
    sportSlug: 'basketball',
    conference: apiTeam.conference,
    division: apiTeam.division,
    national: apiTeam.national,
  };
}

export async function getBasketballTeamDetails(teamId: number, basketballApiBaseUrl: string): Promise<TeamApp | null> {
  try {
    const apiKey = getApiKeyForSport('basketball');
    const data = await fetchDataForSport<ApiSportsBasketballTeamApiResponse>(
        basketballApiBaseUrl,
        '/teams',
        apiKey,
        'x-apisports-key',
        { id: teamId }
    );
    if (data.response && data.response.length > 0) {
      return mapApiBasketballTeamToTeamApp(data.response[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Basketball team details for ID ${teamId}:`, error);
    return null;
  }
}

function mapApiBasketballPlayerToPlayerApp(apiPlayer: ApiSportsBasketballPlayerResponseItem): BasketballPlayerApp {
  let age: number | undefined = undefined;
  if (apiPlayer.birth?.date) {
    try {
        const birthDate = new Date(apiPlayer.birth.date);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
    } catch(e){
        console.warn("Could not parse birth date for player", apiPlayer.id, apiPlayer.birth.date);
    }
  }

  // Try to get data from 'standard' league, then the first available league, or fallback
  const leagueInfo = apiPlayer.leagues?.standard || Object.values(apiPlayer.leagues || {})[0];

  return {
    id: apiPlayer.id,
    name: `${apiPlayer.firstname || ''} ${apiPlayer.lastname || ''}`.trim() || 'Unknown Player',
    firstName: apiPlayer.firstname,
    lastName: apiPlayer.lastname,
    // The API for /players?team=X&season=Y does not seem to provide player images.
    // We'll use placeholders as discussed.
    photoUrl: `https://placehold.co/80x80.png?text=${(apiPlayer.firstname?.charAt(0) || '')}${(apiPlayer.lastname?.charAt(0) || '')}`,
    number: leagueInfo?.jersey,
    position: leagueInfo?.pos,
    age: age,
    heightMeters: apiPlayer.height?.meters,
    weightKilograms: apiPlayer.weight?.kilograms,
    college: apiPlayer.college,
    birthDate: apiPlayer.birth?.date,
    nbaStartYear: apiPlayer.nba?.start,
    yearsPro: apiPlayer.nba?.pro,
    sportSlug: 'basketball',
  };
}


export async function getBasketballRoster(teamId: number, seasonString: string | number = BASKETBALL_CURRENT_SEASON_STRING, basketballApiBaseUrl: string): Promise<BasketballPlayerApp[]> {
  try {
    const apiKey = getApiKeyForSport('basketball');
    // The API expects season as YYYY-YYYY for multi-year seasons like NBA
    const seasonParam = typeof seasonString === 'number' ? `${seasonString}-${seasonString + 1}` : seasonString;

    const data = await fetchDataForSport<ApiSportsBasketballPlayersApiResponse>(
        basketballApiBaseUrl,
        '/players',
        apiKey,
        'x-apisports-key',
        { team: teamId, season: seasonParam }
    );
    if (data.response && data.response.length > 0) {
        return data.response.map(player => mapApiBasketballPlayerToPlayerApp(player));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching Basketball roster for team ${teamId}, season ${seasonString}:`, error);
    return [];
  }
}

function mapApiBasketballGameToGameResultApp(apiGame: ApiSportsBasketballGameResponseItem): BasketballGameResultApp {
  const homeTeamApp: TeamApp = {
    id: apiGame.teams.home.id,
    name: apiGame.teams.home.name,
    logoUrl: apiGame.teams.home.logo, // API provides logo here
    sportSlug: 'basketball',
  };
  const awayTeamApp: TeamApp = {
    id: apiGame.teams.away.id,
    name: apiGame.teams.away.name,
    logoUrl: apiGame.teams.away.logo, // API provides logo here
    sportSlug: 'basketball',
  };
   const leagueApp: LeagueApp = {
    id: apiGame.league.id,
    name: apiGame.league.name,
    logoUrl: apiGame.league.logo,
    country: apiGame.country?.name,
    season: apiGame.league.season, // Season is string YYYY-YYYY or YYYY
    type: apiGame.league.type,
    sportSlug: 'basketball',
  };

  return {
    id: apiGame.id,
    league: leagueApp,
    homeTeam: homeTeamApp,
    awayTeam: awayTeamApp,
    matchTime: apiGame.date, // This is a full ISO string
    statusShort: apiGame.status.short,
    statusLong: apiGame.status.long,
    homeScore: apiGame.scores.home.total,
    awayScore: apiGame.scores.away.total,
    sportSlug: 'basketball',
    homeQuarterScores: [
      apiGame.scores.home.quarter_1,
      apiGame.scores.home.quarter_2,
      apiGame.scores.home.quarter_3,
      apiGame.scores.home.quarter_4,
    ].filter(score => score !== undefined), // Keep nulls if present
    awayQuarterScores: [
      apiGame.scores.away.quarter_1,
      apiGame.scores.away.quarter_2,
      apiGame.scores.away.quarter_3,
      apiGame.scores.away.quarter_4,
    ].filter(score => score !== undefined),
    homeOvertimeScore: apiGame.scores.home.over_time,
    awayOvertimeScore: apiGame.scores.away.over_time,
  };
}

export async function getBasketballGamesForTeam(teamId: number, seasonString: string | number = BASKETBALL_CURRENT_SEASON_STRING, basketballApiBaseUrl: string, limit: number = 10): Promise<BasketballGameResultApp[]> {
  try {
    const apiKey = getApiKeyForSport('basketball');
    const seasonParam = typeof seasonString === 'number' ? `${seasonString}-${seasonString + 1}` : seasonString;
    const data = await fetchDataForSport<ApiSportsBasketballGamesApiResponse>(
        basketballApiBaseUrl,
        '/games',
        apiKey,
        'x-apisports-key',
        { team: teamId, season: seasonParam } // Removed status: 'Finished' to get upcoming too, will sort/filter client-side or by date. For recent results, should add status 'Finished'.
    );
    if (data.response && data.response.length > 0) {
      return data.response
        .filter(game => game.status.short === 'FT' || game.status.short === 'AOT') // Filter for finished games
        .map(mapApiBasketballGameToGameResultApp)
        .sort((a,b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime()) // Sort by most recent
        .slice(0, limit);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching Basketball games for team ${teamId}, season ${seasonString}:`, error);
    return [];
  }
}

    