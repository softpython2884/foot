
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
  driver: ApiSportsF1DriverInfo;
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
export interface ApiSportsF1RankingDriversApiResponse {
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
  teams?: Array<{
    team: {
      id: number;
      name: string;
      logo: string | null;
    };
    drivers: Array<{
      driver: ApiSportsF1DriverInfo;
      position: number | null;
      grid: number | null;
      laps: number | null;
      time: string | null;
      points: number | null;
    }>
  }>;
  results?: Array<{
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
  conference?: string | null;
  division?: string | null;
}
export interface ApiSportsBasketballTeamApiResponse {
  response: ApiSportsBasketballTeamResponseItem[];
}

export interface ApiSportsBasketballPlayerResponseItem {
  id: number;
  firstname: string | null;
  lastname: string | null;
  birth: {
    date: string | null;
    country: string | null;
  } | null;
  nba: {
    start: number | null;
    pro: number | null;
  } | null;
  height: {
    feets: string | null;
    inches: string | null;
    meters: string | null;
  } | null;
  weight: {
    pounds: string | null;
    kilograms: string | null;
  } | null;
  college: string | null;
  affiliation: string | null;
  leagues: {
    [key: string]: {
      jersey: number | null;
      active: boolean;
      pos: string | null;
    }
  };
}
export interface ApiSportsBasketballPlayersApiResponse {
  response: ApiSportsBasketballPlayerResponseItem[];
}


export interface ApiSportsBasketballGameResponseItem {
  id: number;
  league: ApiSportsLeagueMinimal & {type: string};
  country: {
    id: number;
    name: string;
    code: string;
    flag: string | null;
  };
  date: string;
  time: string;
  timestamp: number;
  timezone: string;
  stage: string | null;
  week: string | null;
  status: {
    long: string;
    short: string;
    timer: string | null;
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
export interface ApiSportsBasketballGamesApiResponse {
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
  id: number; // This is the API ID
  name: string;
  logoUrl?: string | null;
  slug?: string;
  country?: string | null;
  founded?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  venueCapacity?: number | null;
  sportSlug: string;
  base?: string | null;
  championships?: number | null;
  director?: string | null;
  technicalManager?: string | null;
  chassis?: string | null;
  engine?: string | null;
  firstTeamEntry?: number | null;
  polePositions?: number | null;
  fastestLaps?: number | null;
  conference?: string | null;
  division?: string | null;
  national?: boolean;
}

export interface LeagueApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  country?: string | null;
  season?: number | string;
  sportSlug: string;
  type?: string;
}

export interface MatchApp { // Represents a match/event from the external API
  id: number; // API fixture ID
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
  id: number | null; // API Player ID
  name: string;
  photoUrl?: string | null;
  number?: number | null;
  position?: string | null;
  age?: number | null;
  nationality?: string | null;
  sportSlug: string;
}

export interface F1DriverApp extends PlayerApp {
  abbr?: string | null;
  grandsPrixEntered?: number | null;
  worldChampionships?: number | null;
  podiums?: number | null;
  careerPoints?: string | null;
  birthDate?: string | null;
}

export interface F1RaceResultApp {
  id: number;
  competitionName: string;
  circuitName: string;
  circuitImage?: string | null;
  date: string;
  season: number;
  type: string;
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

export interface Bet {
  id: number;
  userId: number;
  eventId: number; // Can be API fixture ID or managed_event_id
  eventSource: EventSource; // 'api' or 'custom'
  teamIdBetOn: number; // API team ID
  amountBet: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
  updatedAt?: string;
  sportSlug: string;
}

// For displaying bet history, includes denormalized data
export interface BetWithMatchDetails extends Bet {
  homeTeamName: string;
  awayTeamName: string;
  teamBetOnName: string;
  matchTime: string; // Renamed from eventTime for consistency with MatchApp
  leagueName: string;
}

// --- Mock Data specific types ---
export interface Team extends TeamApp {
  shortName?: string;
}

export interface League extends LeagueApp {
  code?: string;
}

// --- Custom Managed Events ---
export interface ManagedEventDb {
  id: number;
  sportSlug: string;
  homeTeamApiId: number;
  awayTeamApiId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogoUrl?: string | null;
  awayTeamLogoUrl?: string | null;
  eventTime: string; // ISO8601 string
  status: 'upcoming' | 'live' | 'paused' | 'finished' | 'cancelled';
  homeScore?: number | null;
  awayScore?: number | null;
  winnerTeamApiId?: number | null;
  leagueName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ManagedEventApp extends Omit<ManagedEventDb, 'homeTeamApiId' | 'awayTeamApiId' | 'winnerTeamApiId'> {
  homeTeam: TeamApp; // Contains API ID
  awayTeam: TeamApp; // Contains API ID
  winnerTeam?: TeamApp | null; // Contains API ID
}
