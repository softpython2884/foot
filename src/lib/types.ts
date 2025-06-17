export interface Team {
  id: string;
  name: string;
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
}

export interface RecommendedMatch {
  matchId: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  matchTime: string; // ISO string format
  reason: string;
}
