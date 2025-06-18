
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
const CURRENT_SEASON = 2024; // Use 2024 for 2024-2025 season, or 2023 for 2023-2024

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
};

export async function getAppLeagues(): Promise<LeagueApp[]> {
  try {
    const leagueResponses: ApiSportsLeagueResponseItem[] = [];
    // Fetching details for each popular league
    for (const leagueId of Object.values(POPULAR_LEAGUE_IDS)) {
      const data = await fetchFromApiSports<ApiSportsLeaguesApiResponse>('/leagues', { id: leagueId, season: CURRENT_SEASON });
      if (data.response && data.response.length > 0) {
        // Find the specific season (CURRENT_SEASON) if multiple are returned
        const leagueWithSeason = data.response.find(r => r.seasons.some(s => s.year === CURRENT_SEASON && s.current));
        if (leagueWithSeason) {
            leagueResponses.push(leagueWithSeason);
        } else {
            // Fallback to the first response if the current season is not explicitly marked or found
            const fallbackLeague = data.response[0];
            if (fallbackLeague) {
                leagueResponses.push(fallbackLeague);
                console.warn(`League ID ${leagueId}: Current season ${CURRENT_SEASON} not explicitly found, using first available season data.`);
            } else {
                console.warn(`No league data returned for ID: ${leagueId}`);
            }
        }
      } else {
        console.warn(`No league data returned for ID: ${leagueId}`);
      }
    }
    
    return leagueResponses
      .filter(item => item && item.league) // Ensure item and item.league are defined
      .map(item => ({
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
      params.from = getTodayDateString();
      params.to = getDateNDaysFromNowString(14); // Fetch for next 14 days
      params.status = 'NS'; // Not Started
      break;
    case 'live':
      params = { live: `${leagueId}` }; // API supports specific league ID for live games
      break;
    case 'finished':
      params.from = getDateNDaysFromNowString(-14); // Fetch for last 14 days
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

// Function to get team details - not currently used but good for future
// export async function getTeamDetails(teamId: number): Promise<TeamApp | null> {
//   try {
//     const data = await fetchFromApiSports<any>('/teams', { id: teamId });
//     if (data.response && data.response.length > 0) {
//       const teamData = data.response[0].team;
//       return {
//         id: teamData.id,
//         name: teamData.name,
//         logoUrl: teamData.logo,
//         // slug: slugify(teamData.name) // If needed
//       };
//     }
//     return null;
//   } catch (error) {
//     console.error(`Error fetching team details for ID ${teamId}:`, error);
//     return null;
//   }
// }
