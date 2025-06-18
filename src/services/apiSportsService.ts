
'use server';

import type {
  ApiSportsLeaguesApiResponse,
  ApiSportsLeagueResponseItem,
  ApiSportsFixturesApiResponse,
  ApiSportsFixtureResponseItem,
  LeagueApp,
  MatchApp,
  TeamApp
} from '@/lib/types';
import { getTodayDateString, getDateNDaysFromNowString } from '@/lib/dateUtils';

const BASE_URL = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_SPORTS_KEY;
export const CURRENT_SEASON = 2024; // Use 2024 for 2024-2025 season, or 2023 for 2023-2024

async function fetchFromApiSports<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
  if (!API_KEY) {
    throw new Error('API_SPORTS_KEY is not configured in .env');
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const headers = new Headers();
  headers.append('x-apisports-key', API_KEY);
  // As per docs, for direct API-Sports access, only x-apisports-key is needed.
  // x-rapidapi-host and x-rapidapi-key are for RapidAPI proxy.

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
    console.error(`API-Sports logical error for ${url.toString()}:`, data.errors);
    // Depending on the error structure, you might want to throw a more specific error.
    // For now, we'll let it proceed and the calling function can check data.response
  }
  return data as T;
}

// Targeted popular league IDs
const POPULAR_LEAGUE_IDS = {
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
  CHAMPIONS_LEAGUE: 2,
  // Add more as needed
  // EUROPA_LEAGUE: 3,
  // EREDIVISIE: 88, // Netherlands
  // PRIMEIRA_LIGA: 94, // Portugal
};

export async function getAppLeagues(): Promise<LeagueApp[]> {
  try {
    const leagueResponses: ApiSportsLeagueResponseItem[] = [];
    for (const id of Object.values(POPULAR_LEAGUE_IDS)) {
        // Fetching one by one to ensure we get details if the bulk ID query isn't supported or optimal
        const data = await fetchFromApiSports<ApiSportsLeaguesApiResponse>('/leagues', { id });
        if (data.response && data.response.length > 0) {
            leagueResponses.push(...data.response);
        } else {
            console.warn(`No league data returned for ID: ${id}`);
        }
    }
    
    return leagueResponses.map(item => ({
      id: item.league.id,
      name: item.league.name,
      logoUrl: item.league.logo,
      country: item.country.name,
    }));
  } catch (error) {
    console.error('Error fetching app leagues from API-Sports:', error);
    return [];
  }
}


function mapApiFixtureToMatchApp(apiFixture: ApiSportsFixtureResponseItem): MatchApp {
  return {
    id: apiFixture.fixture.id,
    league: {
      id: apiFixture.league.id,
      name: apiFixture.league.name,
      logoUrl: apiFixture.league.logo,
      country: apiFixture.league.country,
    },
    homeTeam: {
      id: apiFixture.teams.home.id,
      name: apiFixture.teams.home.name,
      logoUrl: apiFixture.teams.home.logo,
    },
    awayTeam: {
      id: apiFixture.teams.away.id,
      name: apiFixture.teams.away.name,
      logoUrl: apiFixture.teams.away.logo,
    },
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


export async function getFixtures(
  leagueId: number,
  filterType: 'upcoming' | 'live' | 'finished'
): Promise<MatchApp[]> {
  let params: Record<string, string | number> = { league: leagueId, season: CURRENT_SEASON };

  switch (filterType) {
    case 'upcoming':
      params.date = getTodayDateString(); // API-Sports uses 'date' for a specific day's upcoming matches
                                        // For a range, it's 'from' and 'to'
      // To get a range of upcoming matches (e.g., next 7 days):
      // params.from = getTodayDateString();
      // params.to = getDateNDaysFromNowString(7);
      params.status = 'NS'; // Not Started
      break;
    case 'live':
      // The 'live' parameter can take 'all' or 'L1-L2-L3' (league IDs)
      // For a specific league:
      params = { live: `${leagueId}` }; 
      // Note: season might not be needed or used with 'live' parameter, check API behavior
      delete params.season; // remove season if live takes precedence
      delete params.league;
      break;
    case 'finished':
      // For a range of finished matches (e.g., last 7 days):
      params.from = getDateNDaysFromNowString(-7);
      params.to = getTodayDateString();
      params.status = 'FT'; // Finished
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
