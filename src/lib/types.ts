
export interface Team {
  id: string;
  name: string;
  logoImageUrl?: string; // Changed from bannerImageUrl
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
  homeScore?: number; // Added for past matches
  awayScore?: number; // Added for past matches
  status?: 'completed' | 'upcoming' | 'live'; // Added to differentiate matches
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
  hashedPassword?: string; // Optional on client, required on server
  score: number;
  rank: number;
  createdAt: string;
}
