
// --- Application specific, simplified types ---
export interface TeamApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  slug?: string; // For client-side routing to team pages (using mock data for now)
}

export interface LeagueApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  country?: string;
}

export interface MatchApp {
  id: number; // fixture.id from API
  league: LeagueApp;
  homeTeam: TeamApp;
  awayTeam: TeamApp;
  matchTime: string; // fixture.date (ISO string) from API
  statusShort: string; // fixture.status.short (e.g., "FT", "NS", "1H")
  statusLong: string; // fixture.status.long
  elapsedTime?: number | null; // fixture.status.elapsed
  venueName?: string | null;
  venueCity?: string | null;
  homeScore?: number | null; // goals.home
  awayScore?: number | null; // goals.away
  isWatchlisted?: boolean; // Client-side state
}


// --- API-Sports Specific Response Types ---

// For /leagues endpoint
export interface ApiSportsLeagueDetails {
  id: number;
  name: string;
  type: string; // "League" or "Cup"
  logo: string | null;
}

export interface ApiSportsCountry {
  name: string;
  code: string | null;
  flag: string | null;
}

export interface ApiSportsSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
  // coverage details can be extensive, simplified here
  coverage?: {
    fixtures: {
      events: boolean;
      lineups: boolean;
      statistics_fixtures: boolean;
      statistics_players: boolean;
    };
    standings: boolean;
    players: boolean;
    top_scorers: boolean;
    top_assists: boolean;
    top_cards: boolean;
    injuries: boolean;
    predictions: boolean;
    odds: boolean;
  };
}

export interface ApiSportsLeagueResponseItem {
  league: ApiSportsLeagueDetails;
  country: ApiSportsCountry;
  seasons: ApiSportsSeason[];
}

export interface ApiSportsLeaguesApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsLeagueResponseItem[];
}


// For /fixtures endpoint
export interface ApiSportsFixtureInfo {
  id: number;
  referee: string | null;
  timezone: string; // e.g., "UTC"
  date: string; // ISO8601 datetime string
  timestamp: number;
  periods: {
    first: number | null; // Timestamp
    second: number | null; // Timestamp
  };
  venue: {
    id: number | null;
    name: string | null;
    city: string | null;
  };
  status: {
    long: string; // e.g., "Match Finished", "Not Started"
    short: string; // e.g., "FT", "NS", "1H", "HT"
    elapsed: number | null; // Minutes elapsed, e.g., 90
  };
}

export interface ApiSportsTeamInfo {
  id: number;
  name: string;
  logo: string | null;
  winner: boolean | null; // Present if match is finished
}

export interface ApiSportsGoalsInfo {
  home: number | null;
  away: number | null;
}

export interface ApiSportsScoreInfo {
  halftime: ApiSportsGoalsInfo;
  fulltime: ApiSportsGoalsInfo;
  extratime: ApiSportsGoalsInfo | null;
  penalty: ApiSportsGoalsInfo | null;
}

export interface ApiSportsFixtureResponseItem {
  fixture: ApiSportsFixtureInfo;
  league: ApiSportsLeagueDetails & { // League info within fixture response
    country: string; // Country name
    flag: string | null;
    season: number; // Year of the season
    round: string;
  };
  teams: {
    home: ApiSportsTeamInfo;
    away: ApiSportsTeamInfo;
  };
  goals: ApiSportsGoalsInfo; // Typically represents fulltime or current goals
  score: ApiSportsScoreInfo; // Detailed score breakdown
  // events, lineups, statistics could be added if fetched
}

export interface ApiSportsFixturesApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsFixtureResponseItem[];
}


// --- Old types (from mockData and football-data.org, kept for reference or gradual phase-out) ---
export interface Team { // Used by mockData and team pages
  id: string | number;
  name: string;
  shortName?: string;
  crestUrl?: string;
  logoImageUrl?: string;
  slug?: string;
}

export interface League { // Used by mockData
  id: string | number;
  name: string;
  code?: string;
  emblemUrl?: string;
}

export interface Match { // Used by mockData and betting system for now
  id: string | number;
  league: League | LeagueApp; // Can be either for now during transition
  homeTeam: Team | TeamApp;
  awayTeam: Team | TeamApp;
  matchTime: string; // ISO string
  utcDate?: string;
  venue?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: 'COMPLETED' | 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED' | 'upcoming' | string; // API uses uppercase, mockData 'completed' | 'upcoming'
  score?: {
    winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    fullTime?: {
      home: number | null;
      away: number | null;
    };
  };
  leagueId?: string;
  homeTeamId?: string;
  awayTeamId?: string;
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
  matchId: string | number;
  teamIdBetOn: string | number;
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
  matchTime: string;
  leagueName: string;
}
