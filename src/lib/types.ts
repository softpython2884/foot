
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
  country?: string;
  flag?: string | null;
  season?: number;
}

export interface ApiSportsFixtureInfo {
  id: number;
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
    long: string;
    short: string;
    elapsed: number | null;
  };
}

export interface ApiSportsGoalsInfo {
  home: number | null;
  away: number | null;
}

export interface ApiSportsFixtureResponseItem {
  fixture: ApiSportsFixtureInfo;
  league: ApiSportsLeagueMinimal & {
    round: string;
  };
  teams: {
    home: ApiSportsTeamMinimal & { winner?: boolean | null };
    away: ApiSportsTeamMinimal & { winner?: boolean | null };
  };
  goals: ApiSportsGoalsInfo;
  score: {
    halftime: ApiSportsGoalsInfo;
    fulltime: ApiSportsGoalsInfo;
    extratime: ApiSportsGoalsInfo | null;
    penalty: ApiSportsGoalsInfo | null;
  };
}

export interface ApiSportsFixturesApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsFixtureResponseItem[];
}

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

export interface ApiSportsFullLeagueDetails extends ApiSportsLeagueMinimal {
   type: string;
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
  coverage?: any;
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

// For /coachs endpoint
export interface ApiSportsCoachInfo {
  id: number | null;
  name: string | null;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birth: {
    date: string | null;
    place: string | null;
    country: string | null;
  };
  nationality: string | null;
  height: string | null;
  weight: string | null;
  photo: string | null;
}

export interface ApiSportsTeamMinimalForCoach {
  id: number;
  name: string;
  logo: string | null;
}

export interface ApiSportsCoachCareerItem {
  team: ApiSportsTeamMinimalForCoach;
  start: string | null;
  end: string | null;
}

export interface ApiSportsCoachResponseItem { // This is what's in the `response` array
  id: number | null; // Sometimes coach info is directly here
  name: string | null;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birth: {
    date: string | null;
    place: string | null;
    country: string | null;
  } | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  photo: string | null;
  team: ApiSportsTeamMinimalForCoach | null; // Current team
  career?: ApiSportsCoachCareerItem[];
}


export interface ApiSportsCoachApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsCoachResponseItem[];
}

// For /players/squads endpoint
export interface ApiSportsPlayerInfoInSquad {
  id: number | null;
  name: string | null;
  age: number | null;
  number: number | null;
  position: string | null; // e.g., "Attacker", "Midfielder"
  photo: string | null;
}

export interface ApiSportsSquadTeamInfo { // The team object inside the squad response
  id: number;
  name: string;
  logo: string | null;
}

export interface ApiSportsSquadPlayerResponseItem { // Item in the `response` array
  team: ApiSportsSquadTeamInfo;
  players: ApiSportsPlayerInfoInSquad[];
}

export interface ApiSportsSquadApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsSquadPlayerResponseItem[];
}


// --- Application specific, simplified types ---
export interface TeamApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  slug?: string;
  country?: string | null;
  founded?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  venueCapacity?: number | null;
}

export interface LeagueApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  country?: string;
  season?: number;
}

export interface MatchApp {
  id: number;
  league: LeagueApp;
  homeTeam: TeamApp;
  awayTeam: TeamApp;
  matchTime: string;
  statusShort: string;
  statusLong: string;
  elapsedTime?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  isWatchlisted?: boolean;
}

export interface CoachApp {
  id: number | null;
  name: string;
  photoUrl?: string | null;
  nationality?: string | null;
  age?: number | null;
}

export interface PlayerApp {
  id: number | null;
  name: string;
  photoUrl?: string | null;
  number?: number | null;
  position?: string | null;
  age?: number | null;
}


// --- User and Betting types ---
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
  matchId: number;
  teamIdBetOn: number;
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

// --- Mock Data specific types ---
export interface Team extends TeamApp {
  shortName?: string;
  crestUrl?: string; // Deprecated
}

export interface League extends LeagueApp {
  code?: string;
  emblemUrl?: string; // Deprecated
}
