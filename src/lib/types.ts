
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
  rank: number; // This field is present but not actively managed for ranking calculations by these changes.
  createdAt: string;
}

export type AuthenticatedUser = Omit<User, 'hashedPassword'>;
export type LeaderboardUser = Omit<User, 'hashedPassword'>;

export interface Bet {
  id: number;
  userId: number;
  matchId: string;
  teamIdBetOn: string;
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
