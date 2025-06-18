
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MatchList } from '@/components/MatchList'; // Will use MatchApp
import { WatchlistDisplay } from '@/components/WatchlistDisplay'; // Will use MatchApp
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getAppLeagues, getFixtures } from '@/services/apiSportsService';
import type { LeagueApp, MatchApp } from '@/lib/types'; // Use app-specific types
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const DEFAULT_COMPETITION_ID = '39'; // Premier League as default

export default function HomePage() {
  const [leagues, setLeagues] = useState<LeagueApp[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>(DEFAULT_COMPETITION_ID);
  const [matches, setMatches] = useState<MatchApp[]>([]);
  const [watchlist, setWatchlist] = useState<number[]>([]); // Store match IDs (numbers from API)
  const [isLoadingLeagues, setIsLoadingLeagues] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'live' | 'finished'>('upcoming');
  const { toast } = useToast();

  const loadLeagues = useCallback(async () => {
    setIsLoadingLeagues(true);
    try {
      const fetchedLeagues = await getAppLeagues();
      setLeagues(fetchedLeagues);
      if (fetchedLeagues.length > 0 && !selectedLeagueId && fetchedLeagues.find(l => l.id.toString() === DEFAULT_COMPETITION_ID)) {
        setSelectedLeagueId(DEFAULT_COMPETITION_ID);
      } else if (fetchedLeagues.length > 0 && !selectedLeagueId) {
        setSelectedLeagueId(fetchedLeagues[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to fetch leagues:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load leagues.' });
    } finally {
      setIsLoadingLeagues(false);
    }
  }, [toast, selectedLeagueId]);

  useEffect(() => {
    loadLeagues();
  }, [loadLeagues]);

  const loadMatches = useCallback(async (leagueId: string, tab: 'upcoming' | 'live' | 'finished') => {
    if (!leagueId) return;
    setIsLoadingMatches(true);
    setMatches([]); // Clear previous matches
    try {
      const leagueNumId = parseInt(leagueId, 10);
      const fetchedMatches = await getFixtures(leagueNumId, tab);
      setMatches(fetchedMatches);
      if (fetchedMatches.length === 0) {
        toast({ title: 'No Matches', description: `No ${tab} matches found for the selected league.`, duration: 3000});
      }
    } catch (error) {
      console.error(`Failed to fetch ${tab} matches:`, error);
      toast({ variant: 'destructive', title: 'Error', description: `Could not load ${tab} matches.` });
    } finally {
      setIsLoadingMatches(false);
    }
  }, [toast]);

  useEffect(() => {
    if (selectedLeagueId) {
      loadMatches(selectedLeagueId, activeTab);
    }
  }, [selectedLeagueId, activeTab, loadMatches]);

  const handleToggleWatchlist = (matchId: number) => {
    setWatchlist((prev) =>
      prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]
    );
  };

  const watchlistMatches = matches.filter((match) => watchlist.includes(match.id));
  const selectedLeagueDetails = leagues.find(l => l.id.toString() === selectedLeagueId);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-8 p-6 rounded-lg shadow-md bg-card">
          <h2 className="text-3xl font-bold font-headline mb-6 text-center text-primary">
            Match Schedules
          </h2>
          {isLoadingLeagues ? (
            <div className="flex justify-center"><LoadingSpinner /></div>
          ) : leagues.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
              <Select
                value={selectedLeagueId}
                onValueChange={(value) => setSelectedLeagueId(value)}
              >
                <SelectTrigger className="w-full sm:w-72 text-base py-3">
                  <SelectValue placeholder="Select a league" />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map((league) => (
                    <SelectItem key={league.id} value={league.id.toString()} className="text-base py-2">
                      <div className="flex items-center gap-2">
                        {league.logoUrl && (
                           <Image src={league.logoUrl} alt={league.name} width={20} height={20} style={{ objectFit: 'contain' }} />
                        )}
                        <span>{league.name} {league.country && `(${league.country})`}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLeagueDetails && selectedLeagueDetails.logoUrl && (
                <div className="hidden sm:block">
                    <Image src={selectedLeagueDetails.logoUrl} alt={`${selectedLeagueDetails.name} logo`} width={40} height={40} style={{objectFit: 'contain'}}/>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No leagues available to display.</p>
          )}

          {selectedLeagueId && (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upcoming' | 'live' | 'finished')} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="live">Live</TabsTrigger>
                <TabsTrigger value="finished">Finished</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming">
                {isLoadingMatches ? <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div> : <MatchList matches={matches} watchlist={watchlist.map(String)} onToggleWatchlist={handleToggleWatchlist} />}
              </TabsContent>
              <TabsContent value="live">
                {isLoadingMatches ? <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div> : <MatchList matches={matches} watchlist={watchlist.map(String)} onToggleWatchlist={handleToggleWatchlist} />}
              </TabsContent>
              <TabsContent value="finished">
                {isLoadingMatches ? <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div> : <MatchList matches={matches} watchlist={watchlist.map(String)} onToggleWatchlist={handleToggleWatchlist} />}
              </TabsContent>
            </Tabs>
          )}
        </section>

        {watchlistMatches.length > 0 && (
          <WatchlistDisplay watchlistMatches={watchlistMatches} onToggleWatchlist={handleToggleWatchlist} />
        )}
      </main>
      <Footer />
    </div>
  );
}
