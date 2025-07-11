'use client';

import type { Match } from '@/lib/types';
import { MatchCard } from './MatchCard';
import { Heart } from 'lucide-react';

interface WatchlistDisplayProps {
  watchlistMatches: Match[];
  onToggleWatchlist: (matchId: string) => void;
}

export function WatchlistDisplay({
  watchlistMatches,
  onToggleWatchlist,
}: WatchlistDisplayProps) {
  return (
    <div className="space-y-12 py-6">
      <section>
        <h2 className="text-3xl font-bold font-headline mb-6 flex items-center gap-2">
          <Heart size={28} className="text-destructive fill-destructive" />
          My Watchlist
        </h2>
        {watchlistMatches.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Your watchlist is empty. Add matches to see them here!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlistMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isWatchlisted={true} // Matches in this list are always watchlisted
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
