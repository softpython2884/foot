import type { Match } from '@/lib/types';
import { MatchCard } from './MatchCard';

interface MatchListProps {
  matches: Match[];
  watchlist: string[];
  onToggleWatchlist: (matchId: string) => void;
}

export function MatchList({ matches, watchlist, onToggleWatchlist }: MatchListProps) {
  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No matches found for the current filters.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          isWatchlisted={watchlist.includes(match.id)}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}
    </div>
  );
}
