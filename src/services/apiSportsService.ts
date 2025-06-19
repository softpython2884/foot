
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
  ApiSportsF1DriversApiResponse,
  ApiSportsF1DriverResponseItem,
  ApiSportsF1RacesApiResponse,
  ApiSportsF1RaceResponseItem,
  ApiSportsBasketballTeamApiResponse,
  ApiSportsBasketballTeamResponseItem,
  ApiSportsBasketballPlayersApiResponse,
  ApiSportsBasketballPlayerResponseItem, // Added this
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
  SportDefinition
} from '@/lib/types';
import { supportedSports } from '@/lib/mockData';

const FOOTBALL_CURRENT_SEASON = 2023;
const F1_CURRENT_SEASON = 2024; 
const BASKETBALL_CURRENT_SEASON = 2023; // For NBA 2023-2024 season

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

  console.log(`Fetching from API-Sports (${sportApiBaseUrl}): ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: headers,
    next: { revalidate: 3600 } 
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API-Sports Error (${response.status}) for ${url.toString()}: ${errorBody}`);
    throw new Error(`Failed to fetch data from API-Sports: ${response.status} ${response.statusText}. Body: ${errorBody}`);
  }

  const data = await response.json();

  if (data.errors && (Object.keys(data.errors).length > 0 || (Array.isArray(data.errors) && data.errors.length > 0))) {
    console.error(`API-Sports logical error for ${url.toString()}:`, JSON.stringify(data.errors));
  }
  if (data.results === 0 && !(endpoint === '/status')) {
    console.warn(`API-Sports returned 0 results for ${url.toString()}`);
  }
  return data as T;
}

function getApiKeyForSport(sportSlug: string): string | undefined {
    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) return undefined;
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
    season: apiFixture.league.season,
    sportSlug: sportSlug,
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


export async function getFootballLeagues(footballApiBaseUrl: string, leagueIds: number[] = [39, 140, 135, 78, 61, 2]): Promise<LeagueApp[]> {
  const leagues: LeagueApp[] = [];
  const apiKey = getApiKeyForSport('football');
  for (const id of leagueIds) {
    try {
      const data = await fetchDataForSport<ApiSportsLeaguesApiResponse>(
          footballApiBaseUrl,
          '/leagues',
          apiKey,
          'x-apisports-key',
          { id: id, season: FOOTBALL_CURRENT_SEASON }
      );
      if (data.response && data.response.length > 0) {
        const leagueData = data.response[0];
        leagues.push({
          id: leagueData.league.id,
          name: leagueData.league.name,
          logoUrl: leagueData.league.logo,
          country: leagueData.country.name,
          season: leagueData.seasons.find(s => s.current)?.year || FOOTBALL_CURRENT_SEASON,
          sportSlug: 'football',
        });
      }
    } catch (error) {
      console.error(`Error fetching football league details for ID ${id} from API-Sports:`, error);
    }
  }
  return leagues;
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
  };
}

export async function getF1ConstructorDetails(constructorId: number, f1ApiBaseUrl: string): Promise<TeamApp | null> {
  try {
    const apiKey = getApiKeyForSport('formula-1');
    const data = await fetchDataForSport<ApiSportsF1ConstructorApiResponse>(
        f1ApiBaseUrl,
        '/teams', 
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

function mapApiF1DriverToF1DriverApp(apiDriver: ApiSportsF1DriverResponseItem): F1DriverApp {
  let age: number | undefined = undefined;
  if (apiDriver.birthdate) {
    const birthDate = new Date(apiDriver.birthdate);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }
  return {
    id: apiDriver.id,
    name: apiDriver.name,
    photoUrl: apiDriver.image,
    number: apiDriver.number,
    nationality: apiDriver.nationality,
    abbr: apiDriver.abbr,
    grandsPrixEntered: apiDriver.grands_prix_entered,
    worldChampionships: apiDriver.world_championships,
    podiums: apiDriver.podiums,
    careerPoints: apiDriver.career_points,
    birthDate: apiDriver.birthdate,
    age: age, 
    sportSlug: 'formula-1',
    position: 'Driver', 
  };
}

export async function getF1DriversForSeason(constructorId: number, season: number = F1_CURRENT_SEASON, f1ApiBaseUrl: string): Promise<F1DriverApp[]> {
  try {
    const apiKey = getApiKeyForSport('formula-1');
    const data = await fetchDataForSport<ApiSportsF1DriversApiResponse>(
        f1ApiBaseUrl,
        '/drivers',
        apiKey,
        'x-apisports-key',
        { team: constructorId, season: season } 
    );
    if (data.response && data.response.length > 0) {
      return data.response.map(mapApiF1DriverToF1DriverApp);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching F1 drivers for constructor ${constructorId}, season ${season}:`, error);
    return [];
  }
}

function mapApiF1RaceToF1RaceResultApp(apiRace: ApiSportsF1RaceResponseItem, constructorId: number): F1RaceResultApp {
  const driverResultsForTeam = [];
  if (apiRace.teams) {
    const targetTeam = apiRace.teams.find(t => t.team.id === constructorId);
    if (targetTeam) {
      driverResultsForTeam.push(...targetTeam.drivers.map(dr => ({
        driverName: dr.driver.name,
        driverImage: dr.driver.image,
        driverNumber: dr.driver.number,
        position: dr.position,
        grid: dr.grid,
        laps: dr.laps,
        time: dr.time,
        points: dr.points,
      })));
    }
  } else if (apiRace.results) { 
     driverResultsForTeam.push(...apiRace.results.filter(r => r.team.id === constructorId).map(dr => ({
        driverName: dr.driver.name,
        driverImage: dr.driver.image,
        driverNumber: dr.driver.number,
        position: dr.position,
        grid: dr.grid,
        laps: dr.laps,
        time: dr.time,
        points: dr.points,
      })));
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
    driverResults: driverResultsForTeam,
  };
}

export async function getF1RaceResultsForSeason(constructorId: number, season: number = F1_CURRENT_SEASON, f1ApiBaseUrl: string, limit: number = 5): Promise<F1RaceResultApp[]> {
  try {
    const apiKey = getApiKeyForSport('formula-1');
    const data = await fetchDataForSport<ApiSportsF1RacesApiResponse>(
        f1ApiBaseUrl,
        '/races',
        apiKey,
        'x-apisports-key',
        { season: season, type: 'Race', status: 'Finished' } 
    );
    if (data.response && data.response.length > 0) {
      return data.response
        .map(race => mapApiF1RaceToF1RaceResultApp(race, constructorId))
        .filter(raceApp => raceApp.driverResults.length > 0) 
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) 
        .slice(0, limit);
    }
    return [];
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
    const birthDate = new Date(apiPlayer.birth.date);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }
  
  // Try to find a relevant league (e.g., 'standard' for NBA regular season)
  const leagueInfo = apiPlayer.leagues?.standard || apiPlayer.leagues?.vegas || Object.values(apiPlayer.leagues || {})[0];

  return {
    id: apiPlayer.id,
    name: `${apiPlayer.firstname || ''} ${apiPlayer.lastname || ''}`.trim(),
    firstName: apiPlayer.firstname,
    lastName: apiPlayer.lastname,
    photoUrl: `https://placehold.co/80x80.png?text=${(apiPlayer.firstname?.charAt(0) || '')}${(apiPlayer.lastname?.charAt(0) || '')}`, 
    number: leagueInfo?.jersey,
    position: leagueInfo?.pos,
    age: age,
    heightMeters: apiPlayer.height?.meters,
    college: apiPlayer.college,
    birthDate: apiPlayer.birth?.date,
    nbaStartYear: apiPlayer.nba?.start,
    yearsPro: apiPlayer.nba?.pro,
    sportSlug: 'basketball',
  };
}


export async function getBasketballRoster(teamId: number, season: number = BASKETBALL_CURRENT_SEASON, basketballApiBaseUrl: string): Promise<BasketballPlayerApp[]> {
  try {
    const apiKey = getApiKeyForSport('basketball');
    const data = await fetchDataForSport<ApiSportsBasketballPlayersApiResponse>(
        basketballApiBaseUrl,
        '/players', 
        apiKey,
        'x-apisports-key',
        { team: teamId, season: season }
    );
    if (data.response && data.response.length > 0) {
        return data.response.map(player => mapApiBasketballPlayerToPlayerApp(player));
    }
    return [];
  } catch (error) {
    console.error(`Error fetching Basketball roster for team ${teamId}, season ${season}:`, error);
    return [];
  }
}

function mapApiBasketballGameToGameResultApp(apiGame: ApiSportsBasketballGameResponseItem): BasketballGameResultApp {
  const homeTeamApp: TeamApp = {
    id: apiGame.teams.home.id,
    name: apiGame.teams.home.name,
    logoUrl: apiGame.teams.home.logo,
    sportSlug: 'basketball',
  };
  const awayTeamApp: TeamApp = {
    id: apiGame.teams.away.id,
    name: apiGame.teams.away.name,
    logoUrl: apiGame.teams.away.logo,
    sportSlug: 'basketball',
  };
   const leagueApp: LeagueApp = {
    id: apiGame.league.id,
    name: apiGame.league.name,
    logoUrl: apiGame.league.logo,
    country: apiGame.country?.name,
    season: apiGame.league.season,
    sportSlug: 'basketball',
  };

  return {
    id: apiGame.id,
    league: leagueApp,
    homeTeam: homeTeamApp,
    awayTeam: awayTeamApp,
    matchTime: apiGame.date, 
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
    ],
    awayQuarterScores: [
      apiGame.scores.away.quarter_1,
      apiGame.scores.away.quarter_2,
      apiGame.scores.away.quarter_3,
      apiGame.scores.away.quarter_4,
    ],
    homeOvertimeScore: apiGame.scores.home.over_time,
    awayOvertimeScore: apiGame.scores.away.over_time,
  };
}

export async function getBasketballGamesForTeam(teamId: number, season: number = BASKETBALL_CURRENT_SEASON, basketballApiBaseUrl: string, limit: number = 10): Promise<BasketballGameResultApp[]> {
  try {
    const apiKey = getApiKeyForSport('basketball');
    const data = await fetchDataForSport<ApiSportsBasketballGamesApiResponse>(
        basketballApiBaseUrl,
        '/games',
        apiKey,
        'x-apisports-key',
        { team: teamId, season: season, status: 'Finished' } // Fetch finished games
    );
    if (data.response && data.response.length > 0) {
      return data.response
        .map(mapApiBasketballGameToGameResultApp)
        .sort((a,b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime()) 
        .slice(0, limit);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching Basketball games for team ${teamId}, season ${season}:`, error);
    return [];
  }
}

