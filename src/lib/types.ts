
// --- API-Sports Specific Response Types --- (Based on footapidocs.md and common structure)

export interface ApiSportsTeamMinimal {
  id: number;
  name: string;
  logo: string | null;
}

export interface ApiSportsLeagueMinimal {
  id: number;
  name: string;
  logo: string | null;
  country?: string; // Sometimes present directly with league
  flag?: string | null; // Country flag if available
  season?: number; // Season year
}

export interface ApiSportsFixtureInfo {
  id: number; // This is the match ID
  referee: string | null;
  timezone: string;
  date: string; // ISO8601 datetime string
  timestamp: number;
  periods: {
    first: number | null;
    second: number | null;
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: {
    long: string; // e.g., "Match Finished", "Not Started"
    short: string; // e.g., "FT", "NS", "1H", "HT"
    elapsed: number | null;
  };
}

export interface ApiSportsGoalsInfo {
  home: number | null;
  away: number | null;
}

// For /fixtures endpoint response item
export interface ApiSportsFixtureResponseItem {
  fixture: ApiSportsFixtureInfo;
  league: ApiSportsLeagueMinimal & { // League info within fixture response
    round: string;
  };
  teams: {
    home: ApiSportsTeamMinimal & { winner?: boolean | null };
    away: ApiSportsTeamMinimal & { winner?: boolean | null };
  };
  goals: ApiSportsGoalsInfo;
  score: { // Detailed score breakdown
    halftime: ApiSportsGoalsInfo;
    fulltime: ApiSportsGoalsInfo;
    extratime: ApiSportsGoalsInfo | null;
    penalty: ApiSportsGoalsInfo | null;
  };
}

export interface ApiSportsFixturesApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>; // errors can be an array or an object
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsFixtureResponseItem[];
}

// For /teams endpoint response item
export interface ApiSportsTeamDetail extends ApiSportsTeamMinimal {
  code: string | null;
  country: string | null;
  founded: number | null;
  national: boolean;
}
export interface ApiSportsVenueDetail {
    id: number | null;
    name: string | null;
    address: string | null;
    city: string | null;
    capacity: number | null;
    surface: string | null;
    image: string | null;
}
export interface ApiSportsTeamResponseItem {
  team: ApiSportsTeamDetail;
  venue: ApiSportsVenueDetail;
}

export interface ApiSportsTeamApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsTeamResponseItem[];
}


// For /leagues endpoint response item
export interface ApiSportsFullLeagueDetails extends ApiSportsLeagueMinimal {
   type: string; // "League" or "Cup"
}
export interface ApiSportsCountryDetails {
  name: string;
  code: string | null;
  flag: string | null;
}
export interface ApiSportsSeasonDetails {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage?: any; // Can be extensive, keep as any for now or detail if needed
}
export interface ApiSportsLeagueResponseItem {
    league: ApiSportsFullLeagueDetails;
    country: ApiSportsCountryDetails;
    seasons: ApiSportsSeasonDetails[];
}
export interface ApiSportsLeaguesApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsLeagueResponseItem[];
}


// --- Application specific, simplified types, mapped from API-Sports ---
export interface TeamApp {
  id: number; // API ID
  name: string;
  logoUrl?: string | null;
  slug?: string; // For client-side routing, generated from name
  // Potentially more fields from ApiSportsTeamDetail if needed
  country?: string | null;
  founded?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  venueCapacity?: number | null;
}

export interface LeagueApp {
  id: number; // API ID
  name: string;
  logoUrl?: string | null;
  country?: string;
  season?: number; // Current or relevant season year
}

export interface MatchApp {
  id: number; // fixture.id from API
  league: LeagueApp;
  homeTeam: TeamApp; // Simplified, will map from ApiSportsTeamMinimal
  awayTeam: TeamApp; // Simplified, will map from ApiSportsTeamMinimal
  matchTime: string; // fixture.date (ISO string) from API
  statusShort: string; // fixture.status.short
  statusLong: string; // fixture.status.long
  elapsedTime?: number | null; // fixture.status.elapsed
  venueName?: string | null;
  venueCity?: string | null;
  homeScore?: number | null; // goals.home
  awayScore?: number | null; // goals.away
  isWatchlisted?: boolean; // Client-side state, not from API
}


// --- User and Betting types (remain mostly unchanged for now) ---
export interface User {
  id: number;
  name: string;
  email: string;
  hashedPassword?: string;
  score: number;
  rank: number;
  createdAt: string;
}

export type AuthenticatedUser = Omit<User, 'hashedPassword'>;
export type LeaderboardUser = Omit<User, 'hashedPassword'>;

export interface Bet {
  id: number;
  userId: number;
  matchId: number; // Will now be API fixture ID (number)
  teamIdBetOn: number; // Will now be API team ID (number)
  amountBet: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
  updatedAt?: string;
}

export interface BetWithMatchDetails extends Bet {
  homeTeamName: string;
  awayTeamName: string;
  teamBetOnName: string;
  matchTime: string; // ISO string
  leagueName: string;
}

// --- Mock Data specific types (kept for homepage team listing, but will include API ID) ---
export interface Team extends TeamApp { // Inherits from TeamApp, slug is essential
  shortName?: string; // Kept for compatibility if used, but API data is primary
  crestUrl?: string; // Deprecated in favor of logoUrl from TeamApp
}

export interface League extends LeagueApp { // Inherits from LeagueApp
  code?: string; // Kept for compatibility if used
  emblemUrl?: string; // Deprecated in favor of logoUrl from LeagueApp
}

// MockMatch might not be needed if team pages fetch directly from API
// export interface Match extends MatchApp { // Inherits from MatchApp
//   // any old fields if necessary, but ideally align with MatchApp
// }
