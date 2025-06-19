
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
  president: string | null; // Often null or not highly relevant for modern teams
  director: string | null; // Team Principal
  technical_manager: string | null;
  chassis: string | null;
  engine: string | null;
  tyres: string | null;
}
export interface ApiSportsF1ConstructorApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  response: ApiSportsF1ConstructorResponseItem[];
}

export interface ApiSportsF1DriverInfo { // Sub-object for driver details, used in rankings/races etc.
  id: number;
  name: string;
  abbr: string | null;
  number: number | null;
  image: string | null; // Photo URL for driver
}

export interface ApiSportsF1DriverDetailResponseItem { // For full driver details from /drivers
  id: number;
  name: string;
  abbr: string | null;
  image: string | null; // Photo URL
  nationality: string | null;
  country: { // Driver's country of birth/nationality
    name: string | null;
    code: string | null;
  } | null;
  birthdate: string | null;
  birthplace: string | null;
  number: number | null; // Current car number
  grands_prix_entered: number | null;
  world_championships: number | null;
  podiums: number | null;
  highest_race_finish: {
    position: number | null;
    number: number | null; // Number of times achieved
  } | null;
  highest_grid_position: number | null;
  career_points: string | null; // Often string in API
  teams: Array<{ // History of teams
    season: number;
    team: { // Minimal team info
      id: number;
      name: string;
      logo: string | null;
    };
  }>;
}
export interface ApiSportsF1DriversApiResponse { // For /drivers endpoint
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  response: ApiSportsF1DriverDetailResponseItem[];
}

export interface ApiSportsF1RankingDriverResponseItem { // For /rankings/drivers endpoint
  position: number;
  driver: ApiSportsF1DriverInfo; // Basic driver info
  team: { // Team driver is currently ranked with
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
  id: number; // Race ID
  competition: { // Grand Prix info
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
    image: string | null; // Image of the circuit
  };
  season: number;
  type: string; // E.g., "Race", "1st Qualifying", "Sprint"
  date: string; // ISO 8601 date string for the main event (e.g. Race start)
  status: string; // E.g., "Finished", "Scheduled", "Cancelled"
  weather?: string | null;
  // The /races endpoint itself usually doesn't return detailed results directly in its main object.
  // Detailed results for a race are typically fetched from /rankings/races?race={race_id}
  // OR the response for /races might contain a 'results' or 'teams' array depending on API version or specific query.
  // For mapping, we'll assume that if we fetch a race, we'll need to make another call or use a combined endpoint
  // for its detailed results. For now, let's add a flexible structure.
  // This structure is more aligned with what /rankings/races would return FOR A SPECIFIC RACE.
  results?: Array<{ // This is a typical structure for race results per driver
    driver: ApiSportsF1DriverInfo;
    team: { id: number; name: string; logo: string | null; };
    position: number | null;
    grid: number | null; // Starting grid position
    laps: number | null;
    time: string | null; // Finishing time or status (e.g., DNF)
    points: number | null;
  }>;
  // Alternative structure if /races returns results grouped by team:
  teams?: Array<{
    team: { id: number; name: string; logo: string | null; };
    drivers: Array<{
      driver: ApiSportsF1DriverInfo;
      position: number | null;
      grid: number | null;
      laps: number | null;
      time: string | null;
      points: number | null;
    }>
  }>;
}
export interface ApiSportsF1RacesApiResponse { // Used by F1 /races
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
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
  conference?: string | null; // e.g., "Western" or "Eastern"
  division?: string | null; // e.g., "Pacific", "Central"
}
export interface ApiSportsBasketballTeamApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  response: ApiSportsBasketballTeamResponseItem[];
}

export interface ApiSportsBasketballPlayerResponseItem { // Used by Basketball /players
  id: number;
  firstname: string | null;
  lastname: string | null;
  birth: {
    date: string | null; // YYYY-MM-DD
    country: string | null;
  } | null;
  nba: {
    start: number | null; // Year started in NBA
    pro: number | null;   // Years pro
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
  affiliation: string | null; // High School or College
  leagues: { // Contains league-specific data like jersey and position
    [leagueKey: string]: { // e.g., "standard", "vegas" (for summer league)
      jersey: number | null;
      active: boolean;
      pos: string | null; // Position (e.g., "G", "F", "C")
    } | undefined; // Making individual league keys optional
    standard?: { // NBA regular season often under "standard"
        jersey: number | null;
        active: boolean;
        pos: string | null;
    };
     // Add other potential league keys if known, e.g. "africa", "sacramento", "utah", "vegas"
  };
}
export interface ApiSportsBasketballPlayersApiResponse {
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
  response: ApiSportsBasketballPlayerResponseItem[];
}


export interface ApiSportsBasketballGameResponseItem { // Used by Basketball /games
  id: number; // Game ID
  league: ApiSportsLeagueMinimal & {type: string; season: string | number}; // Includes type (League/Cup) and season
  country: {
    id: number;
    name: string;
    code: string;
    flag: string | null;
  };
  date: string; // Full ISO datetime string of the game
  time: string; // HH:MM (often part of date)
  timestamp: number; // Unix timestamp
  timezone: string;
  stage: string | null; // e.g., "Regular Season", "Playoffs"
  week: string | null;
  status: {
    long: string; // e.g., "Finished", "Scheduled"
    short: string; // e.g., "FT", "NS"
    timer: string | null; // Current game time if live
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
  get: string;
  parameters: Record<string, any>;
  errors: any[] | Record<string, string>;
  results: number;
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
  founded?: number | null; // Football specific
  venueName?: string | null; // Football specific
  venueCity?: string | null; // Football specific
  venueCapacity?: number | null; // Football specific
  sportSlug: string;
  // F1 Constructor specific
  base?: string | null;
  championships?: number | null;
  director?: string | null; // Team Principal / Head
  technicalManager?: string | null;
  chassis?: string | null; // Current season chassis
  engine?: string | null; // Current season engine
  firstTeamEntry?: number | null; // Year
  polePositions?: number | null;
  fastestLaps?: number | null;
  // Basketball Team specific
  conference?: string | null;
  division?: string | null;
  national?: boolean; // If it's a national team
}

export interface LeagueApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  country?: string | null;
  season?: number | string; // YYYY or YYYY-YYYY
  sportSlug: string;
  type?: string; // "League" or "Cup"
}

export interface MatchApp { // Represents a match/event from the external API
  id: number; // API fixture ID
  league: LeagueApp;
  homeTeam: TeamApp;
  awayTeam: TeamApp;
  matchTime: string; // ISO8601 datetime string
  statusShort: string;
  statusLong: string;
  elapsedTime?: number | null; // Football specific
  venueName?: string | null; // Football specific
  venueCity?: string | null; // Football specific
  homeScore?: number | null;
  awayScore?: number | null;
  isWatchlisted?: boolean;
  sportSlug: string;
}

export interface CoachApp { // Football specific for now
  id: number | null;
  name: string;
  photoUrl?: string | null;
  nationality?: string | null;
  age?: number | null;
  sportSlug: string;
}

export interface PlayerApp { // Base player type
  id: number | null; // API Player ID
  name: string;
  photoUrl?: string | null;
  number?: number | null;
  position?: string | null;
  age?: number | null;
  nationality?: string | null;
  sportSlug: string;
}

export interface F1DriverApp extends PlayerApp { // Extends PlayerApp for F1 specific details
  abbr?: string | null; // Abbreviation (e.g., HAM)
  // Extended details if fetched from /drivers/{id} for bio
  birthDate?: string | null;
  birthPlace?: string | null;
  countryName?: string | null; // Nationality as full name
  grandsPrixEntered?: number | null;
  worldChampionships?: number | null; // Driver's world championships
  podiums?: number | null;
  careerPoints?: string | null; // Often a string
  // Details from team context if available
  teamName?: string | null; // Current team name, if known from context
}

export interface F1RaceResultApp { // Represents a single F1 race result for a constructor
  id: number; // Race ID from API
  competitionName: string; // e.g., "Formula 1 Gulf Air Bahrain Grand Prix"
  circuitName: string;
  circuitImage?: string | null;
  date: string; // ISO 8601
  season: number;
  type: string; // "Race", "Sprint" etc.
  status: string; // "Finished", "Scheduled"
  weather?: string | null;
  driverResults: Array<{ // Results of THIS constructor's drivers in THIS race
    driverName: string;
    driverImage?: string | null;
    driverNumber?: number | null;
    position: number | null;
    grid: number | null; // Starting grid
    laps: number | null;
    time: string | null; // Finishing time or DNF status
    points: number | null;
  }>;
}

export interface BasketballPlayerApp extends PlayerApp { // Extends PlayerApp for Basketball
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  heightMeters?: string | null;
  weightKilograms?: string | null;
  college?: string | null;
  nbaStartYear?: number | null; // Year started in NBA
  yearsPro?: number | null;   // Years pro
}

export interface BasketballGameResultApp extends MatchApp { // Extends MatchApp for Basketball
  // Scores by period
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
  eventId: number; // Can be API fixture ID (football/basketball game ID, F1 race ID) or managed_event_id
  eventSource: EventSource; // 'api' or 'custom'
  teamIdBetOn: number; // API team ID (football team, F1 constructor, basketball team)
  amountBet: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost';
  createdAt: string;
  updatedAt?: string;
  sportSlug: string;
}

// For displaying bet history, includes denormalized data
export interface BetWithMatchDetails extends Bet {
  homeTeamName: string; // Or home entity name (e.g., Constructor 1 for F1 race)
  awayTeamName: string; // Or away entity name / vs field for F1 (e.g. "Race")
  teamBetOnName: string;
  matchTime: string; // Renamed from eventTime for consistency with MatchApp (actual event date)
  leagueName: string; // Or competition name for F1/Basketball
}

// --- Mock Data specific types ---
export interface Team extends TeamApp { // TeamApp is now comprehensive
  shortName?: string; // Still useful for mock data if available
}

export interface League extends LeagueApp { // LeagueApp is comprehensive
  code?: string; // Football-Data.org specific, less relevant now
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
  winnerTeamApiId?: number | null; // For team vs team sports
  leagueName?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ManagedEventApp extends Omit<ManagedEventDb, 'homeTeamApiId' | 'awayTeamApiId' | 'winnerTeamApiId'> {
  homeTeam: TeamApp; // Contains API ID
  awayTeam: TeamApp; // Contains API ID
  winnerTeam?: TeamApp | null; // Contains API ID
}

    