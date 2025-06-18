
import type { Match as AppMatch } from '@/lib/types'; // Use AppMatch
import { MatchCard } from './MatchCard';

interface MatchListProps {
  matches: AppMatch[]; // Expect AppMatch
  watchlist: string[]; // Keep as string[] for now, MatchCard handles numeric ID internally for its key
  onToggleWatchlist: (matchId: string | number) => void; // ID can be string or number
}

export function MatchList({ matches, watchlist, onToggleWatchlist }: MatchListProps) {
  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No matches found for the current filters.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
      {matches.map((match) => (
        <MatchCard
          key={match.id.toString()} // Ensure key is string
          match={match}
          isWatchlisted={watchlist.includes(match.id.toString())}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}
    </div>
  );
}
