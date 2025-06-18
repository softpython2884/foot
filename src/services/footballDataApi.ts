
'use server';

import type { ApiCompetitionsResponse, ApiMatchesResponse, ApiCompetition, ApiMatch } from '@/lib/types';

const BASE_URL = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

async function fetchWithToken<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error('FOOTBALL_DATA_API_KEY is not configured in .env');
  }

  const headers = new Headers(options.headers || {});
  headers.append('X-Auth-Token', API_KEY);

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    next: { revalidate: 3600 } // Cache for 1 hour, adjust as needed
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error (${response.status}) for ${endpoint}: ${errorBody}`);
    throw new Error(`Failed to fetch data from football-data.org: ${response.status} ${response.statusText}. Body: ${errorBody}`);
  }
  return response.json() as Promise<T>;
}

export async function getApiCompetitions(codes: string[] = ['PL', 'CL', 'BL1', 'SA', 'PD', 'FL1']): Promise<ApiCompetition[]> {
  // The free tier of football-data.org doesn't allow filtering competitions by code directly in one go.
  // We fetch all and then filter, or fetch one by one if needed.
  // For simplicity, fetching all and filtering.
  // Or, fetch specific ones if the API supports it for free tier (e.g. /v4/competitions/PL)
  // The API docs state "TIER_ONE" for /v4/competitions/{id} which is free.
  
  try {
    const competitions: ApiCompetition[] = [];
    for (const code of codes) {
      try {
        const competition = await fetchWithToken<ApiCompetition>(`/competitions/${code}`);
        competitions.push(competition);
      } catch (error) {
        console.warn(`Could not fetch competition with code ${code}:`, error);
        // Continue to fetch other competitions
      }
    }
    return competitions.filter(comp => comp != null); // Filter out any nulls if a fetch failed
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return [];
  }
}


export async function getApiMatchesForCompetition(
  competitionCode: string,
  params?: { dateFrom?: string; dateTo?: string; status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' }
): Promise<ApiMatch[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/competitions/${competitionCode}/matches${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetchWithToken<ApiMatchesResponse>(endpoint);
    return response.matches || [];
  } catch (error) {
    console.error(`Error fetching matches for competition ${competitionCode}:`, error);
    return [];
  }
}

// Example function to get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

// Example function to get date N days from now in YYYY-MM-DD format
export function getDateNDaysFromNowString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
