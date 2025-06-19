

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

// --- F1 API Types ---
export interface ApiSportsF1ConstructorResponseItem {
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
export interface ApiSportsF1ConstructorApiResponse {
  response: ApiSportsF1ConstructorResponseItem[];
}

export interface ApiSportsF1DriverResponseItem {
  id: number;
  name: string;
  abbr: string | null; // Abbreviation
  image: string | null; // Photo URL
  nationality: string | null;
  country: { // Country object
    name: string | null;
    code: string | null;
  } | null;
  birthdate: string | null;
  birthplace: string | null;
  number: number | null; // Driver number
  grands_prix_entered: number | null;
  world_championships: number | null;
  podiums: number | null;
  highest_race_finish: {
    position: number | null;
    number: number | null;
  } | null;
  highest_grid_position: number | null;
  career_points: string | null; // Can be string "0"
  teams: Array<{ // Array of teams the driver has raced for in the season
    season: number;
    team: {
      id: number;
      name: string;
      logo: string | null;
    };
  }>;
}
export interface ApiSportsF1DriversApiResponse {
  response: ApiSportsF1DriverResponseItem[];
}

export interface ApiSportsF1RaceResponseItem {
  id: number;
  competition: { // League/Competition info
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
  type: string; // E.g., "Race"
  date: string; // ISO 8601 date string
  status: string; // E.g., "Finished"
  teams?: Array<{ // Results per team/constructor
    team: {
      id: number;
      name: string;
      logo: string | null;
    };
    drivers: Array<{ // Results per driver in that team for that race
      driver: {
        id: number;
        name: string;
        abbr: string | null;
        number: number | null;
        image: string | null;
      };
      position: number | null;
      grid: number | null;
      laps: number | null;
      time: string | null; // E.g., "1:23:45.678" or "DNF"
      points: number | null;
    }>
  }>;
  results?: Array<{ // Alternative results structure if not per team
    driver: {
        id: number;
        name: string;
        abbr: string | null;
        number: number | null;
        image: string | null;
      };
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
export interface ApiSportsF1RacesApiResponse {
  response: ApiSportsF1RaceResponseItem[];
}


// --- Basketball API Types ---
export interface ApiSportsBasketballTeamResponseItem { // Similar to Football's Team Response
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
  conference?: string;
  division?: string;
}
export interface ApiSportsBasketballTeamApiResponse {
  response: ApiSportsBasketballTeamResponseItem[];
}

export interface ApiSportsBasketballPlayerResponseItem {
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
  // The API-Sports `/players` endpoint does not directly provide a photo URL.
  // This might need to be sourced differently or use placeholders.
}
export interface ApiSportsBasketballPlayersApiResponse {
  response: ApiSportsBasketballPlayerResponseItem[];
}


export interface ApiSportsBasketballGameResponseItem {
  id: number; // Game ID
  date: string; // ISO 8601 datetime string "YYYY-MM-DDTHH:mm:ssZ"
  time: string; // E.g., "02:30" - redundant if date has time
  timestamp: number;
  timezone: string;
  stage: string | null; // E.g., "Regular Season", "Playoffs"
  week: string | null;
  status: {
    long: string; // "Finished", "Scheduled"
    short: string; // "FT", "NS"
    timer: string | null; // Current game clock if live
  };
  league: {
    id: number;
    name: string;
    type: string; // "League", "Cup"
    season: number; // e.g. 2023 for 2023-2024 season
    logo: string | null;
  };
  country: {
    id: number;
    name: string;
    code: string;
    flag: string | null;
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
  id: number;
  name: string;
  logoUrl?: string | null;
  slug?: string;
  country?: string | null;
  founded?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  venueCapacity?: number | null;
  sportSlug: string;

  // F1 specific
  base?: string | null;
  championships?: number | null;
  director?: string | null;
  technicalManager?: string | null;
  chassis?: string | null;
  engine?: string | null;

  // Basketball specific
  conference?: string | null;
  division?: string | null;
}

export interface LeagueApp {
  id: number;
  name: string;
  logoUrl?: string | null;
  country?: string;
  season?: number;
  sportSlug: string;
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
  nationality?: string | null; // Added for F1 drivers
  sportSlug: string;
}

// F1 Specific App Types
export interface F1DriverApp extends PlayerApp { // Extends PlayerApp for common fields
  abbr?: string | null;
  grandsPrixEntered?: number | null;
  worldChampionships?: number | null;
  podiums?: number | null;
  careerPoints?: string | null;
  birthDate?: string | null;
}

export interface F1RaceResultApp {
  id: number; // Race ID
  competitionName: string;
  circuitName: string;
  circuitImage?: string | null;
  date: string; // ISO 8601 string
  season: number;
  type: string; // E.g., "Race"
  status: string;
  // Simplified results for the team's drivers
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
export interface BasketballPlayerApp extends PlayerApp { // Extends PlayerApp
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  heightMeters?: string | null;
  weightKilograms?: string | null;
  college?: string | null;
  nbaStartYear?: number | null;
  yearsPro?: number | null;
}

export interface BasketballGameResultApp extends MatchApp { // Extends MatchApp
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
  sportSlug: string;
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
}

export interface League extends LeagueApp {
  code?: string;
}

