
'use server';

import type {
  ApiSportsFixturesApiResponse,
  ApiSportsFixtureResponseItem,
  ApiSportsTeamApiResponse,
  ApiSportsTeamResponseItem,
  ApiSportsLeaguesApiResponse,
  ApiSportsLeagueResponseItem,
  LeagueApp,
  MatchApp,
  TeamApp
} from '@/lib/types';
// import { getDateNDaysFromNowString, getTodayDateString } from '@/lib/dateUtils'; // Not used currently

const BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_SPORTS_KEY;
const CURRENT_SEASON = 2023; // Use 2023 for 2023-2024 season

async function fetchFromApiSports<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
  if (!API_KEY) {
    console.error('API_SPORTS_KEY is not configured in .env');
    throw new Error('API_SPORTS_KEY is not configured.');
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const headers = new Headers();
  headers.append('x-apisports-key', API_KEY);

  console.log(`Fetching from API-Sports: ${url.toString()}`);

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
    // Do not throw an error for logical API errors (like plan limitations), let the caller handle empty/error responses.
  }
  if (data.results === 0 && !(endpoint === '/status')) {
    console.warn(`API-Sports returned 0 results for ${url.toString()}`);
  }
  return data as T;
}

function mapApiTeamToTeamApp(apiTeamData: ApiSportsTeamResponseItem): TeamApp {
  return {
    id: apiTeamData.team.id,
    name: apiTeamData.team.name,
    logoUrl: apiTeamData.team.logo,
    country: apiTeamData.team.country,
    founded: apiTeamData.team.founded,
    venueName: apiTeamData.venue.name,
    venueCity: apiTeamData.venue.city,
    venueCapacity: apiTeamData.venue.capacity,
  };
}

export async function getApiSportsTeamDetails(teamId: number): Promise<TeamApp | null> {
  try {
    const data = await fetchFromApiSports<ApiSportsTeamApiResponse>('/teams', { id: teamId });
    if (data.response && data.response.length > 0) {
      return mapApiTeamToTeamApp(data.response[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching team details for ID ${teamId} from API-Sports:`, error);
    return null;
  }
}


function mapApiFixtureToMatchApp(apiFixture: ApiSportsFixtureResponseItem): MatchApp {
  const homeTeamApp: TeamApp = {
    id: apiFixture.teams.home.id,
    name: apiFixture.teams.home.name,
    logoUrl: apiFixture.teams.home.logo,
  };
  const awayTeamApp: TeamApp = {
    id: apiFixture.teams.away.id,
    name: apiFixture.teams.away.name,
    logoUrl: apiFixture.teams.away.logo,
  };
   const leagueApp: LeagueApp = {
    id: apiFixture.league.id,
    name: apiFixture.league.name,
    logoUrl: apiFixture.league.logo,
    country: apiFixture.league.country,
    season: apiFixture.league.season,
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
  };
}

export async function getApiSportsFixtureById(fixtureId: number): Promise<MatchApp | null> {
  try {
    const data = await fetchFromApiSports<ApiSportsFixturesApiResponse>('/fixtures', { id: fixtureId });
    if (data.response && data.response.length > 0) {
      return mapApiFixtureToMatchApp(data.response[0]);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching fixture details for ID ${fixtureId} from API-Sports:`, error);
    return null;
  }
}

export async function getApiSportsMatchesForTeam(
  teamId: number,
  params?: { season?: number; status?: string; dateFrom?: string; dateTo?: string; /* last?: number; */ next?: number; league?: number }
): Promise<MatchApp[]> {
  const seasonToQuery = params?.season || CURRENT_SEASON;
  // Remove 'last' parameter as it's not supported on free plan
  // const { last, ...otherParams } = params || {}; // eslint-disable-line @typescript-eslint/no-unused-vars
  const queryParams: Record<string, string | number> = { team: teamId, season: seasonToQuery };

  if (params?.status) queryParams.status = params.status;
  if (params?.dateFrom) queryParams.from = params.dateFrom; // 'from' for API
  if (params?.dateTo) queryParams.to = params.dateTo; // 'to' for API
  // if (params?.last) queryParams.last = params.last; // REMOVED
  if (params?.next) queryParams.next = params.next;
  if (params?.league) queryParams.league = params.league;


  try {
    const data = await fetchFromApiSports<ApiSportsFixturesApiResponse>('/fixtures', queryParams);
    if (data.response && data.response.length > 0) {
      return data.response.map(mapApiFixtureToMatchApp);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching fixtures for team ${teamId} from API-Sports:`, error);
    return [];
  }
}

// Not actively used but kept for potential future use
export async function getAppLeagues(ids: number[] = [39, 140, 135, 78, 61, 2]): Promise<LeagueApp[]> {
  const leagues: LeagueApp[] = [];
  for (const id of ids) {
    try {
      const data = await fetchFromApiSports<ApiSportsLeaguesApiResponse>('/leagues', { id: id, season: CURRENT_SEASON }); // Specify season
      if (data.response && data.response.length > 0) {
        const leagueData = data.response[0]; 
        leagues.push({
          id: leagueData.league.id,
          name: leagueData.league.name,
          logoUrl: leagueData.league.logo,
          country: leagueData.country.name,
          season: leagueData.seasons.find(s => s.current)?.year || CURRENT_SEASON,
        });
      }
    } catch (error) {
      console.error(`Error fetching league details for ID ${id} from API-Sports:`, error);
    }
  }
  return leagues;
}
