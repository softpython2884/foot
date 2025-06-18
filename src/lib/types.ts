
export interface Team {
  id: string;
  name: string;
  logoImageUrl?: string;
}

export interface League {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  matchTime: string; // ISO string format
  venue?: string;
  homeScore?: number;
  awayScore?: number;
  status?: 'completed' | 'upcoming' | 'live';
}

export interface RecommendedMatch {
  matchId: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: string; // ISO string format
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

// Type for user data stored in AuthContext and localStorage (without password)
export type AuthenticatedUser = Omit<User, 'hashedPassword'>;
