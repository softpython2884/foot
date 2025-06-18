
import type { MatchApp } from '@/lib/types'; // Use MatchApp
import { MatchCard } from './MatchCard';

interface MatchListProps {
  matches: MatchApp[]; // Expect MatchApp
  watchlist: string[]; // Watchlist IDs from page.tsx are strings after map
  onToggleWatchlist: (matchId: number) => void; // Match ID is number
}

export function MatchList({ matches, watchlist, onToggleWatchlist }: MatchListProps) {
  if (matches.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No matches found for the current filters.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-6">
      {matches.map((match) => (
        <MatchCard
          key={match.id} // API ID is number
          match={match}
          isWatchlisted={watchlist.includes(match.id.toString())}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}
    </div>
  );
}
