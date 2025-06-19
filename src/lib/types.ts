
// --- API-Sports Specific Response Types ---

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

export interface ApiSportsCoachResponseItem {
  id: number | null;
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
  team: ApiSportsTeamMinimalForCoach | null;
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

export interface ApiSportsPlayerInfoInSquad {
  id: number | null;
  name: string | null;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

export interface ApiSportsSquadTeamInfo {
  id: number;
  name: string;
  logo: string | null;
}

export interface ApiSportsSquadPlayerResponseItem {
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
export interface SportDefinition {
  name: string;
  slug: string;
  apiBaseUrl: string;
  apiKeyHeaderName: string; // e.g., 'x-apisports-key' or 'x-rapidapi-key'
  apiKeyEnvVar: string; // Name of the environment variable storing the key
  iconUrl?: string; // URL for a representative icon/image of the sport
  // Potentially add more sport-specific config here later
}

// TeamApp is the primary type for teams/entities used within the application logic
export interface TeamApp {
  id: number; // This will be the API-specific ID for the team/entity
  name: string;
  logoUrl?: string | null; // Standardized field name for logo/image
  slug?: string; // Generated for URL routing
  country?: string | null; // Applicable to many sports
  founded?: number | null; // Applicable to many sports
  venueName?: string | null; // Stadium/Venue name
  venueCity?: string | null;
  venueCapacity?: number | null;
  sportSlug: string; // To know which sport this team/entity belongs to

  // F1 specific (optional, for F1 entities)
  base?: string; // e.g., "Brackley, UK" for Mercedes F1
  championships?: number; // e.g., Total F1 championships

  // Basketball specific (optional, for Basketball entities)
  conference?: string; // e.g., "Western", "Eastern"
  division?: string; // e.g., "Pacific", "Atlantic"
}

export interface LeagueApp {
  id: number; // API-specific ID
  name: string;
  logoUrl?: string | null;
  country?: string;
  season?: number;
  sportSlug: string;
}

export interface MatchApp {
  id: number; // API-specific ID
  league: LeagueApp;
  homeTeam: TeamApp; // Or a more generic SportEntityApp if needed
  awayTeam: TeamApp; // Or a more generic SportEntityApp if needed
  matchTime: string; // ISO8601 string
  statusShort: string;
  statusLong: string;
  elapsedTime?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  isWatchlisted?: boolean;
  sportSlug: string;
}

export interface CoachApp {
  id: number | null;
  name: string;
  photoUrl?: string | null;
  nationality?: string | null;
  age?: number | null;
  sportSlug: string;
}

export interface PlayerApp {
  id: number | null;
  name: string;
  photoUrl?: string | null;
  number?: number | null;
  position?: string | null;
  age?: number | null;
  sportSlug: string;
}


// --- User and Betting types (remain largely the same for now) ---
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
  matchId: number; // This will be the API-specific fixture ID
  teamIdBetOn: number; // API-specific team ID
  amountBet: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
  updatedAt?: string;
  sportSlug: string; // To associate bet with a sport
}

export interface BetWithMatchDetails extends Bet {
  homeTeamName: string;
  awayTeamName: string;
  teamBetOnName: string;
  matchTime: string;
  leagueName: string;
}

// --- Mock Data specific types ---
// Team interface for mock data will use TeamApp to ensure consistency
export interface Team extends TeamApp {
  shortName?: string; // Kept for potential backward compatibility or specific display needs
}

// League interface for mock data can extend LeagueApp
export interface League extends LeagueApp {
  code?: string;
}

    