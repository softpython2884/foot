'use client';

import type { Match, RecommendedMatch, Team } from '@/lib/types';
import { MatchCard } from './MatchCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { getMatchRecommendations, MatchRecommendationsInput } from '@/ai/flows/match-recommendations';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from './LoadingSpinner';
import { Heart, Sparkles } from 'lucide-react';

interface WatchlistAndRecommendationsProps {
  watchlistMatches: Match[];
  allMatches: Match[]; // Needed to resolve full match details if AI only returns IDs
  watchlistIds: string[];
  onToggleWatchlist: (matchId: string) => void;
  allTeams: Team[];
}

export function WatchlistAndRecommendations({
  watchlistMatches,
  watchlistIds,
  onToggleWatchlist,
  allMatches,
  allTeams
}: WatchlistAndRecommendationsProps) {
  const [favoriteTeamsInput, setFavoriteTeamsInput] = useState('');
  const [recommendations, setRecommendations] = useState<RecommendedMatch[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const { toast } = useToast();

  const handleGetRecommendations = async () => {
    setIsLoadingRecommendations(true);
    setRecommendations([]);

    const favoriteTeamNames = favoriteTeamsInput
      .split(',')
      .map(team => team.trim())
      .filter(team => team.length > 0);

    if (watchlistIds.length === 0 && favoriteTeamNames.length === 0) {
        toast({
            title: "Please provide preferences",
            description: "Add matches to your watchlist or specify favorite teams to get recommendations.",
            variant: "default",
        });
        setIsLoadingRecommendations(false);
        return;
    }
    
    const input: MatchRecommendationsInput = {
      viewingHistory: watchlistIds,
      favoriteTeams: favoriteTeamNames,
    };

    try {
      const result = await getMatchRecommendations(input);
      if (result.recommendedMatches && result.recommendedMatches.length > 0) {
        setRecommendations(result.recommendedMatches);
         toast({
          title: "Recommendations Ready!",
          description: `Found ${result.recommendedMatches.length} new matches you might like.`,
        });
      } else {
        toast({
          title: "No new recommendations",
          description: "We couldn't find any new recommendations based on your current preferences. Try updating them!",
        });
      }
    } catch (error) {
      console.error("Error getting recommendations:", error);
      toast({
        title: "Error",
        description: "Failed to get recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };
  
  const getFullMatchDetails = (matchId: string): Match | undefined => {
    return allMatches.find(m => m.id === matchId);
  }

  return (
    <div className="space-y-12 py-6">
      {/* Watchlist Section */}
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
                isWatchlisted={true}
                onToggleWatchlist={onToggleWatchlist}
              />
            ))}
          </div>
        )}
      </section>

      {/* AI Recommendations Section */}
      <section>
        <h2 className="text-3xl font-bold font-headline mb-6 flex items-center gap-2">
            <Sparkles size={28} className="text-primary" />
            AI Match Recommendations
        </h2>
        <div className="bg-card p-6 rounded-lg shadow-md mb-6 space-y-4">
          <div>
            <Label htmlFor="favorite-teams" className="block mb-2 font-medium">
              Favorite Teams (comma-separated)
            </Label>
            <Input
              id="favorite-teams"
              type="text"
              value={favoriteTeamsInput}
              onChange={(e) => setFavoriteTeamsInput(e.target.value)}
              placeholder="e.g., Real Madrid, Liverpool FC"
              className="max-w-md"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Help us tailor recommendations by telling us your favorite teams.
            </p>
          </div>
          <Button onClick={handleGetRecommendations} disabled={isLoadingRecommendations}>
            {isLoadingRecommendations ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Getting Recommendations...
              </>
            ) : (
              'Get AI Recommendations'
            )}
          </Button>
        </div>

        {recommendations.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold font-headline mb-4">Recommended For You:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recMatch) => (
                 <MatchCard
                    key={recMatch.matchId}
                    match={recMatch}
                    isWatchlisted={watchlistIds.includes(recMatch.matchId)}
                    onToggleWatchlist={onToggleWatchlist}
                    isRecommended={true}
                  />
              ))}
            </div>
          </div>
        )}
         {!isLoadingRecommendations && recommendations.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              {favoriteTeamsInput || watchlistIds.length > 0 ? 'No recommendations available right now. Try adjusting your preferences or check back later!' : 'Enter your favorite teams or add matches to your watchlist to get personalized recommendations.'}
            </p>
        )}
      </section>
    </div>
  );
}
