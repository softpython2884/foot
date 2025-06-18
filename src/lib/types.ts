
// Represents a team, compatible with both mock data and football-data.org API
export interface Team {
  id: string | number; // number from API, string from mockData
  name: string;
  shortName?: string; // From API
  crestUrl?: string;  // From API (team logo)
  logoImageUrl?: string; // From mockData (legacy)
  slug?: string; 
}

// Represents a league/competition, compatible with API
export interface League {
  id: string | number; // number from API, string from mockData
  name: string;
  code?: string; // e.g., "PL", "CL" - from API
  emblemUrl?: string; // Emblem of the competition - from API
}

// Represents a match, primarily for API data structure
export interface Match {
  id: string | number; // number from API, string from mockData
  league: League; // Simplified reference, or full object from API
  homeTeam: Team;
  awayTeam: Team;
  matchTime: string; // ISO string (utcDate from API)
  utcDate?: string; // Direct from API
  venue?: string;
  homeScore?: number | null; // API score is nested
  awayScore?: number | null; // API score is nested
  status?: 'COMPLETED' | 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED' | 'upcoming'; // API uses uppercase, mockData 'completed' | 'upcoming'
  score?: { // From API
    winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
    fullTime?: {
      home: number | null;
      away: number | null;
    };
    // other score types like halfTime, extraTime, penalties can be added
  };
  // For mock data compatibility
  leagueId?: string; 
  homeTeamId?: string;
  awayTeamId?: string;
}


export interface RecommendedMatch {
  matchId: string; // Could be number if based on API
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: string; 
  reason: string;
}

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
  matchId: string | number; // Can be string (mock) or number (API)
  teamIdBetOn: string | number; // Can be string (mock) or number (API)
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

// --- football-data.org API Specific Types ---

export interface ApiCompetition {
  id: number;
  name: string;
  code: string;
  emblem: string; // URL to the emblem
  area: {
    name: string;
    code: string;
    flag: string | null;
  };
  // add other fields as needed: type, currentSeason, etc.
}

export interface ApiTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string; // three letter acronym
  crest: string; // URL to team crest
  // add other fields: address, website, founded, clubColors, venue, etc.
}

export interface ApiScoreValue {
  home: number | null;
  away: number | null;
}

export interface ApiScore {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration: string; // e.g., "REGULAR"
  fullTime: ApiScoreValue;
  halfTime?: ApiScoreValue;
  // extraTime, penalties could be here
}

export interface ApiMatch {
  id: number;
  competition: ApiCompetition; // Can be simplified to just id/name if needed
  season: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number | null;
  };
  utcDate: string; // ISO date string
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED';
  matchday: number | null;
  stage: string; // e.g., "REGULAR_SEASON"
  group: string | null;
  lastUpdated: string; // ISO date string
  homeTeam: ApiTeam; // Can be simplified
  awayTeam: ApiTeam; // Can be simplified
  score: ApiScore;
  venue?: string; // Added, as API sometimes provides it, sometimes not in main match list
  // referees, odds can be added
}

export interface ApiMatchesResponse {
  filters: Record<string, any>;
  resultSet: {
    count: number;
    first: string; // date
    last: string; // date
    played: number;
  };
  matches: ApiMatch[];
}

export interface ApiCompetitionsResponse {
  count: number;
  filters: Record<string, any>;
  competitions: ApiCompetition[];
}
