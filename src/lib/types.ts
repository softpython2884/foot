
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
  season?: number | string; // Season can be YYYY or YYYY-YYYY
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

export interface ApiSportsTeamDetail {
  id: number;
  name: string;
  logo: string | null;
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
export interface ApiSportsTeamResponseItem { // Used by Football /teams
  team: ApiSportsTeamDetail;
  venue: ApiSportsVenueDetail;
}

export interface ApiSportsTeamApiResponse { // Used by Football /teams
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
  year: number | string; // Can be YYYY or YYYY-YYYY
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

export interface ApiSportsCoachInfo { // Used by Football /coachs
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

export interface ApiSportsTeamMinimalForCoach { // Used by Football /coachs
  id: number;
  name: string;
  logo: string | null;
}

export interface ApiSportsCoachCareerItem { // Used by Football /coachs
  team: ApiSportsTeamMinimalForCoach;
  start: string | null;
  end: string | null;
}

export interface ApiSportsCoachResponseItem { // Used by Football /coachs
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


export interface ApiSportsCoachApiResponse { // Used by Football /coachs
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsCoachResponseItem[];
}

export interface ApiSportsPlayerInfoInSquad { // Used by Football /players/squads
  id: number | null;
  name: string | null;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

export interface ApiSportsSquadTeamInfo { // Used by Football /players/squads
  id: number;
  name: string;
  logo: string | null;
}

export interface ApiSportsSquadPlayerResponseItem { // Used by Football /players/squads
  team: ApiSportsSquadTeamInfo;
  players: ApiSportsPlayerInfoInSquad[];
}

export interface ApiSportsSquadApiResponse { // Used by Football /players/squads
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  paging: { current: number; total: number };
  response: ApiSportsSquadPlayerResponseItem[];
}

// --- F1 API Types ---
export interface ApiSportsF1ConstructorResponseItem { // Used by F1 /teams
  id: number;
  name: string;
  logo: string | null;
  base: string | null;
  first_team_entry: number | null;
  world_championships: number | null;
  highest_race_finish: {
    position: number | null;
    number: number | null;
  } | null;
  pole_positions: number | null;
  fastest_laps: number | null;
  president: string | null;
  director: string | null;
  technical_manager: string | null;
  chassis: string | null;
  engine: string | null;
  tyres: string | null;
}
export interface ApiSportsF1ConstructorApiResponse { // Used by F1 /teams
  response: ApiSportsF1ConstructorResponseItem[];
}

export interface ApiSportsF1DriverInfo { // Sub-object within rankings and potentially /drivers
  id: number;
  name: string;
  abbr: string | null;
  number: number | null;
  image: string | null; // Photo URL for driver
}

export interface ApiSportsF1DriverResponseItem { // Used by F1 /drivers (if ever needed for full details)
  id: number;
  name: string;
  abbr: string | null;
  image: string | null; // Photo URL
  nationality: string | null;
  country: {
    name: string | null;
    code: string | null;
  } | null;
  birthdate: string | null;
  birthplace: string | null;
  number: number | null;
  grands_prix_entered: number | null;
  world_championships: number | null;
  podiums: number | null;
  highest_race_finish: {
    position: number | null;
    number: number | null;
  } | null;
  highest_grid_position: number | null;
  career_points: string | null;
  teams: Array<{
    season: number;
    team: {
      id: number;
      name: string;
      logo: string | null;
    };
  }>;
}
export interface ApiSportsF1DriversApiResponse { // Used by F1 /drivers
  response: ApiSportsF1DriverResponseItem[];
}

export interface ApiSportsF1RankingDriverResponseItem { // For /rankings/drivers endpoint
  position: number;
  driver: ApiSportsF1DriverInfo; // Contains driver details including image
  team: {
    id: number;
    name: string;
    logo: string | null;
  };
  points: number | null;
  wins: number | null;
  behind: number | null;
  season: number;
}
export interface ApiSportsF1RankingDriversApiResponse { // For /rankings/drivers endpoint
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  response: ApiSportsF1RankingDriverResponseItem[];
}


export interface ApiSportsF1RaceResponseItem { // Used by F1 /races
  id: number;
  competition: {
    id: number;
    name: string;
    location: {
      country: string | null;
      city: string | null;
    };
  };
  circuit: {
    id: number;
    name: string;
    image: string | null;
  };
  season: number;
  type: string; // E.g., "Race", "1st Qualifying", "Sprint"
  date: string; // ISO 8601 date string
  status: string; // E.g., "Finished", "Scheduled"
  weather?: string | null;
  teams?: Array<{ // Results might be nested under teams
    team: {
      id: number;
      name: string;
      logo: string | null;
    };
    drivers: Array<{ // Driver result details for that team
      driver: ApiSportsF1DriverInfo; // Re-use the detailed driver info
      position: number | null;
      grid: number | null;
      laps: number | null;
      time: string | null;
      points: number | null;
    }>
  }>;
  results?: Array<{ // Or results might be a flat array
    driver: ApiSportsF1DriverInfo;
    team: {
      id: number;
      name: string;
      logo: string | null;
    };
    position: number | null;
    grid: number | null;
    laps: number | null;
    time: string | null;
    points: number | null;
  }>
}
export interface ApiSportsF1RacesApiResponse { // Used by F1 /races
  response: ApiSportsF1RaceResponseItem[];
}


// --- Basketball API Types ---
export interface ApiSportsBasketballTeamResponseItem { // Used by Basketball /teams
  id: number;
  name: string;
  logo: string | null;
  national: boolean;
  country: {
    id: number;
    name: string;
    code: string | null;
    flag: string | null;
  } | null;
  conference?: string | null; // Specific to basketball, e.g., NBA
  division?: string | null;   // Specific to basketball, e.g., NBA
}
export interface ApiSportsBasketballTeamApiResponse { // Used by Basketball /teams
  response: ApiSportsBasketballTeamResponseItem[];
}

export interface ApiSportsBasketballPlayerResponseItem { // Used by Basketball /players
  id: number;
  firstname: string | null;
  lastname: string | null;
  birth: {
    date: string | null; // e.g. "1984-12-30"
    country: string | null;
  } | null;
  nba: {
    start: number | null; // Start year in NBA, e.g. 2003
    pro: number | null; // Years pro, e.g. 19
  } | null;
  height: {
    feets: string | null; // e.g. "6"
    inches: string | null; // e.g. "9"
    meters: string | null; // e.g. "2.06"
  } | null;
  weight: {
    pounds: string | null; // e.g. "250"
    kilograms: string | null; // e.g. "113.4"
  } | null;
  college: string | null;
  affiliation: string | null; // Often same as college
  leagues: {
    [key: string]: { // e.g., "standard", "vegas", "utah", "sacramento"
      jersey: number | null; // Player's number
      active: boolean;
      pos: string | null; // Position e.g. "F", "G", "C", "F-G"
    }
  };
}
export interface ApiSportsBasketballPlayersApiResponse { // Used by Basketball /players
  response: ApiSportsBasketballPlayerResponseItem[];
}


export interface ApiSportsBasketballGameResponseItem { // Used by Basketball /games
  id: number;
  league: ApiSportsLeagueMinimal & {type: string}; // Includes type like "League" or "Cup"
  country: {
    id: number;
    name: string;
    code: string;
    flag: string | null;
  };
  date: string; // ISO 8601 datetime string "YYYY-MM-DDTHH:mm:ssZ"
  time: string; // E.g., "02:30"
  timestamp: number;
  timezone: string;
  stage: string | null; // E.g., "Regular Season", "Playoffs"
  week: string | null;
  status: {
    long: string; // "Finished", "Scheduled"
    short: string; // "FT", "NS", "Q1", "HT"
    timer: string | null; // Current game clock if live
  };
  teams: {
    home: ApiSportsTeamMinimal & {logo?: string | null};
    away: ApiSportsTeamMinimal & {logo?: string | null};
  };
  scores: {
    home: {
      quarter_1: number | null;
      quarter_2: number | null;
      quarter_3: number | null;
      quarter_4: number | null;
      over_time: number | null;
      total: number | null;
    };
    away: {
      quarter_1: number | null;
      quarter_2: number | null;
      quarter_3: number | null;
      quarter_4: number | null;
      over_time: number | null;
      total: number | null;
    };
  };
}
export interface ApiSportsBasketballGamesApiResponse { // Used by Basketball /games
  response: ApiSportsBasketballGameResponseItem[];
}


// --- Application specific, simplified types ---
export interface SportDefinition {
  name: string;
  slug: string;
  apiBaseUrl: string;
  apiKeyHeaderName: string;
  apiKeyEnvVar: string;
  iconUrl?: string;
}

export interface TeamApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  slug?: string;
  country?: string | null;
  founded?: number | null; // Football
  venueName?: string | null; // Football
  venueCity?: string | null; // Football
  venueCapacity?: number | null; // Football
  sportSlug: string;

  // F1 specific
  base?: string | null;
  championships?: number | null;
  director?: string | null;
  technicalManager?: string | null;
  chassis?: string | null;
  engine?: string | null;
  firstTeamEntry?: number | null;
  polePositions?: number | null;
  fastestLaps?: number | null;

  // Basketball specific
  conference?: string | null;
  division?: string | null;
  national?: boolean;
}

export interface LeagueApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  country?: string | null; // Added for more context
  season?: number | string; // Can be YYYY or YYYY-YYYY
  sportSlug: string;
  type?: string; // "League" or "Cup"
}

export interface MatchApp {
  id: number;
  league: LeagueApp;
  homeTeam: TeamApp;
  awayTeam: TeamApp;
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

export interface CoachApp { // Primarily for Football
  id: number | null;
  name: string;
  photoUrl?: string | null;
  nationality?: string | null;
  age?: number | null;
  sportSlug: string; // Should be 'football' for now
}

export interface PlayerApp { // Generic player, can be extended
  id: number | null;
  name: string;
  photoUrl?: string | null;
  number?: number | null;
  position?: string | null;
  age?: number | null;
  nationality?: string | null;
  sportSlug: string;
}

// F1 Specific App Types
export interface F1DriverApp extends PlayerApp {
  abbr?: string | null;
  grandsPrixEntered?: number | null;
  worldChampionships?: number | null;
  podiums?: number | null;
  careerPoints?: string | null;
  birthDate?: string | null;
}

export interface F1RaceResultApp {
  id: number; // Race ID from API
  competitionName: string;
  circuitName: string;
  circuitImage?: string | null;
  date: string; // ISO 8601 string
  season: number;
  type: string; // E.g., "Race", "Sprint"
  status: string;
  weather?: string | null;
  driverResults: Array<{
    driverName: string;
    driverImage?: string | null;
    driverNumber?: number | null;
    position: number | null;
    grid: number | null;
    laps: number | null;
    time: string | null;
    points: number | null;
  }>;
}

// Basketball Specific App Types
export interface BasketballPlayerApp extends PlayerApp {
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  heightMeters?: string | null;
  weightKilograms?: string | null;
  college?: string | null;
  nbaStartYear?: number | null;
  yearsPro?: number | null;
}

export interface BasketballGameResultApp extends MatchApp {
  homeQuarterScores?: (number | null)[];
  awayQuarterScores?: (number | null)[];
  homeOvertimeScore?: number | null;
  awayOvertimeScore?: number | null;
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

export type EventSource = 'api' | 'custom';
export type ManagedEventStatus = 'upcoming' | 'live' | 'paused' | 'finished' | 'cancelled';

export interface Bet {
  id: number;
  userId: number;
  eventId: number; 
  eventSource: EventSource;
  teamIdBetOn: number;
  amountBet: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
  updatedAt?: string;
  sportSlug: string;
}

export interface BetWithMatchDetails extends Bet {
  homeTeamName: string;
  awayTeamName: string;
  teamBetOnName: string;
  matchTime: string; 
  leagueName: string; 
}

export interface ManagedEventDb {
  id: number;
  name: string;
  sport_slug: string;
  home_team_id: number;
  away_team_id: number;
  event_time: string; // ISO8601 string
  status: ManagedEventStatus;
  home_score?: number | null;
  away_score?: number | null;
  winning_team_id?: number | null;
  elapsed_time?: number | null; // In minutes for example
  notes?: string | null; // For sub-events, cards, etc.
  created_at: string;
  updated_at?: string;
}

export interface ManagedEventApp {
  id: number;
  name: string;
  sportSlug: string;
  homeTeam: TeamApp;
  awayTeam: TeamApp;
  eventTime: string; // ISO8601 string
  status: ManagedEventStatus;
  homeScore?: number | null;
  awayScore?: number | null;
  winningTeamId?: number | null;
  elapsedTime?: number | null;
  notes?: string | null;
}


// --- Mock Data specific types ---
export interface Team extends TeamApp { // Team for mockData, extends TeamApp
  shortName?: string;
}

export interface League extends LeagueApp {
  code?: string;
}
