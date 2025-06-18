
// This file is no longer used and can be deleted.
// The new service for API-Sports is src/services/apiSportsService.ts

// 'use server';

// import type {
//   ApiCompetitionsResponse,
//   ApiMatchesResponse,
//   ApiCompetition,
//   ApiMatch,
//   LeagueApp,
//   MatchApp,
//   TeamApp
// } from '@/lib/types'; // Ensure types are correctly imported or defined
// import { getTodayDateString, getDateNDaysFromNowString } from '@/lib/dateUtils';


// const BASE_URL = 'https://api.football-data.org/v4';
// const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// async function fetchWithToken<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
//   if (!API_KEY) {
//     throw new Error('FOOTBALL_DATA_API_KEY is not configured in .env');
//   }

//   const headers = new Headers(options.headers || {});
//   headers.append('X-Auth-Token', API_KEY);

//   const response = await fetch(`${BASE_URL}${endpoint}`, {
//     ...options,
//     headers,
//     next: { revalidate: 3600 } // Cache for 1 hour, adjust as needed
//   });

//   if (!response.ok) {
//     const errorBody = await response.text();
//     console.error(`API Error (${response.status}) for ${endpoint}: ${errorBody}`);
//     throw new Error(`Failed to fetch data from football-data.org: ${response.status} ${response.statusText}. Body: ${errorBody}`);
//   }
//   return response.json() as Promise<T>;
// }


// function mapApiCompetitionToLeagueApp(apiCompetition: ApiCompetition): LeagueApp {
//   return {
//     id: apiCompetition.id,
//     name: apiCompetition.name,
//     logoUrl: apiCompetition.emblem,
//     country: apiCompetition.area.name,
//     // season is not directly available in ApiCompetition, might need to be passed or derived
//   };
// }

// export async function getAppLeagues(codes: string[] = ['PL', 'CL', 'BL1', 'SA', 'PD', 'FL1']): Promise<LeagueApp[]> {
//   try {
//     const apiCompetitions: ApiCompetition[] = [];
//     for (const code of codes) {
//       try {
//         const competition = await fetchWithToken<ApiCompetition>(`/competitions/${code}`);
//         apiCompetitions.push(competition);
//       } catch (error) {
//         console.warn(`Could not fetch competition with code ${code}:`, error);
//       }
//     }
//     return apiCompetitions.filter(comp => comp != null).map(mapApiCompetitionToLeagueApp);
//   } catch (error) {
//     console.error('Error fetching competitions:', error);
//     return [];
//   }
// }

// function mapApiMatchToMatchApp(apiMatch: ApiMatch): MatchApp {
//   return {
//     id: apiMatch.id,
//     league: {
//       id: apiMatch.competition.id,
//       name: apiMatch.competition.name,
//       logoUrl: apiMatch.competition.emblem,
//       country: apiMatch.area?.name, // area might not be on match.competition directly
//       season: apiMatch.season?.startDate ? parseInt(apiMatch.season.startDate.substring(0,4)) : undefined,
//     },
//     homeTeam: {
//       id: apiMatch.homeTeam.id,
//       name: apiMatch.homeTeam.name,
//       logoUrl: apiMatch.homeTeam.crest,
//     },
//     awayTeam: {
//       id: apiMatch.awayTeam.id,
//       name: apiMatch.awayTeam.name,
//       logoUrl: apiMatch.awayTeam.crest,
//     },
//     matchTime: apiMatch.utcDate,
//     statusShort: apiMatch.status.toUpperCase().replace(/_/g, ' ').substring(0,2), // Approximation
//     statusLong: apiMatch.status.replace(/_/g, ' '),
//     elapsedTime: undefined, // Not directly available in football-data.org like in API-Sports
//     venueName: undefined, // Not directly available
//     venueCity: undefined, // Not directly available
//     homeScore: apiMatch.score?.fullTime?.home,
//     awayScore: apiMatch.score?.fullTime?.away,
//   };
// }


// export async function getFixtures(
//   competitionCode: string,
//   filterType: 'upcoming' | 'live' | 'finished'
// ): Promise<MatchApp[]> {
//   let params: { dateFrom?: string; dateTo?: string; status?: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED' } = {};

//   switch (filterType) {
//     case 'upcoming':
//       params.dateFrom = getTodayDateString();
//       params.dateTo = getDateNDaysFromNowString(14);
//       params.status = 'SCHEDULED';
//       break;
//     case 'live':
//       params.status = 'LIVE'; // Or 'IN_PLAY', 'PAUSED' - football-data.org might group these
//       break;
//     case 'finished':
//       params.dateFrom = getDateNDaysFromNowString(-14);
//       params.dateTo = getTodayDateString();
//       params.status = 'FINISHED';
//       break;
//   }

//   try {
//     const queryParams = new URLSearchParams();
//     if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
//     if (params.dateTo) queryParams.append('dateTo', params.dateTo);
//     if (params.status) queryParams.append('status', params.status);

//     const queryString = queryParams.toString();
//     const endpoint = `/competitions/${competitionCode}/matches${queryString ? `?${queryString}` : ''}`;
    
//     const response = await fetchWithToken<ApiMatchesResponse>(endpoint);
//     return (response.matches || []).map(mapApiMatchToMatchApp);
//   } catch (error) {
//     console.error(`Error fetching ${filterType} matches for competition ${competitionCode}:`, error);
//     return [];
//   }
// }
