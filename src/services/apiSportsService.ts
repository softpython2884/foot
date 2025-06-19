
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
  LeagueApp,
  MatchApp,
  TeamApp,
  CoachApp,
  PlayerApp,
  ApiSportsPlayerInfoInSquad,
  SportDefinition
} from '@/lib/types';
import { supportedSports } from '@/lib/mockData'; // To get API key env var name

// This will be used for Football specifically, as other sports might have different optimal seasons.
const FOOTBALL_CURRENT_SEASON = 2023;

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
  }
  if (data.results === 0 && !(endpoint === '/status')) {
    console.warn(`API-Sports returned 0 results for ${url.toString()}`);
  }
  return data as T;
}

// Helper to get the API key for a given sport slug
function getApiKeyForSport(sportSlug: string): string | undefined {
    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) return undefined;
    // For now, all sports use the same API_SPORTS_KEY as per user's info
    // If different keys are needed, update sport.apiKeyEnvVar and process.env access
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
    const apiKey = getApiKeyForSport('football'); // Assuming 'football' is the slug
    const data = await fetchDataForSport<ApiSportsTeamApiResponse>(
        footballApiBaseUrl,
        '/teams',
        apiKey,
        'x-apisports-key', // Standard header for api-sports
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
  params: { status?: string; dateFrom?: string; dateTo?: string; next?: number /* last removed */ } = {},
  footballApiBaseUrl: string
): Promise<MatchApp[]> {
  const queryParams: Record<string, string | number> = { team: teamId, season: season };

  if (params.status) queryParams.status = params.status;
  if (params.dateFrom) queryParams.from = params.dateFrom;
  if (params.dateTo) queryParams.to = params.dateTo;
  if (params.next) queryParams.next = params.next;
  // `last` parameter is removed as it's not supported by the free plan for old seasons.

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

// Placeholder for other sports - to be implemented
// export async function getF1Drivers(f1ApiBaseUrl: string): Promise<any[]> {
//   const apiKey = getApiKeyForSport('formula-1');
//   // ... implementation ...
//   return [];
// }
