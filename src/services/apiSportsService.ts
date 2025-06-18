
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
import { getDateNDaysFromNowString, getTodayDateString } from '@/lib/dateUtils';

const BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_SPORTS_KEY;
const CURRENT_SEASON = 2024; // API-Sports uses the start year of the season (e.g., 2024 for 2024/25)

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
  // As per API-Football docs, x-rapidapi-host is for RapidAPI proxy, not direct API-Sports.
  // headers.append('x-rapidapi-host', 'v3.football.api-sports.io'); 

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

  // Check for logical errors returned by the API in the response body
  if (data.errors && (Object.keys(data.errors).length > 0 || (Array.isArray(data.errors) && data.errors.length > 0))) {
    console.error(`API-Sports logical error for ${url.toString()}:`, JSON.stringify(data.errors));
    // Depending on the severity or type of error, you might choose to throw here or return a partial/empty result.
    // For now, we'll let it pass and the calling function can handle empty `data.response`.
  }
  if (data.results === 0 && !(endpoint === '/status')) { // /status endpoint might have 0 results if not subscribed to a plan directly
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
    // slug is usually generated client-side or from mockData if needed for routing
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
   // Basic TeamApp structure from fixture data
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

// Fetch fixtures for a specific team
export async function getApiSportsMatchesForTeam(
  teamId: number,
  params?: { season?: number; status?: string; dateFrom?: string; dateTo?: string; last?: number; next?: number; league?: number }
): Promise<MatchApp[]> {
  const queryParams: Record<string, string | number> = { team: teamId, season: params?.season || CURRENT_SEASON };

  if (params?.status) queryParams.status = params.status;
  if (params?.dateFrom) queryParams.from = params.dateFrom;
  if (params?.dateTo) queryParams.to = params.dateTo;
  if (params?.last) queryParams.last = params.last;
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

// Fetches details for a list of league IDs.
export async function getApiSportsLeagues(leagueIds: number[]): Promise<LeagueApp[]> {
  const leagues: LeagueApp[] = [];
  // API-Sports league endpoint doesn't support fetching multiple leagues by ID in one call.
  // We must iterate or fetch them one by one if specific multiple leagues are needed.
  // For now, this will fetch individually if multiple IDs are passed.
  // Consider if this is needed frequently or if data can be seeded/cached differently.
  for (const id of leagueIds) {
    try {
      const data = await fetchFromApiSports<ApiSportsLeaguesApiResponse>('/leagues', { id: id, season: CURRENT_SEASON });
      if (data.response && data.response.length > 0) {
        const leagueData = data.response[0];
        leagues.push({
          id: leagueData.league.id,
          name: leagueData.league.name,
          logoUrl: leagueData.league.logo,
          country: leagueData.country.name,
          season: CURRENT_SEASON, // Assuming we fetched for current season
        });
      }
    } catch (error) {
      console.error(`Error fetching league details for ID ${id} from API-Sports:`, error);
    }
  }
  return leagues;
}


// This function is for the main match schedule page (if you build one)
// Not currently used by the homepage or team detail page in this iteration.
export async function getFixturesForLeaguePage(
  leagueId: number,
  filterType: 'upcoming' | 'live' | 'finished'
): Promise<MatchApp[]> {
  let params: Record<string, string | number> = { league: leagueId, season: CURRENT_SEASON };

  switch (filterType) {
    case 'upcoming':
      params.from = getTodayDateString();
      params.to = getDateNDaysFromNowString(14); // Fetch for next 14 days
      params.status = 'NS'; // Not Started
      break;
    case 'live':
      // For live games, API expects 'live' param with league ID(s) or 'all'
      // Example: live=39 (for Premier League) or live=all
      // If leagueId is specific, use it. Otherwise, 'all' might hit rate limits faster.
      params = { live: `${leagueId}` }; 
      break;
    case 'finished':
      params.from = getDateNDaysFromNowString(-14); // Fetch for last 14 days
      params.to = getTodayDateString();
      params.status = 'FT'; // Finished (or other finished statuses: AET, PEN)
      break;
  }

  try {
    const data = await fetchFromApiSports<ApiSportsFixturesApiResponse>('/fixtures', params);
    if (data.response && data.response.length > 0) {
      return data.response.map(mapApiFixtureToMatchApp);
    }
    return [];
  } catch (error) {
    console.error(`Error fetching ${filterType} fixtures for league ${leagueId}:`, error);
    return [];
  }
}
