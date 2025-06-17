'use client';

import { useEffect, useState, useMemo } from 'react';
import type { Match, League, Team } from '@/lib/types';
import { mockMatches, leagues as mockLeagues, teams as mockTeams } from '@/lib/mockData';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MatchList } from '@/components/MatchList';
import { Filters } from '@/components/Filters';
import { WatchlistAndRecommendations } from '@/components/WatchlistAndRecommendations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  const [watchlist, setWatchlist] = useState<string[]>([]); // Array of match IDs
  const { toast } = useToast();

  useEffect(() => {
    // Simulate data fetching
    setAllMatches(mockMatches);
    setLeagues(mockLeagues);
    setTeams(mockTeams);

    // Load watchlist from localStorage if available
    const storedWatchlist = localStorage.getItem('footyScheduleWatchlist');
    if (storedWatchlist) {
      setWatchlist(JSON.parse(storedWatchlist));
    }
  }, []);

  useEffect(() => {
    // Save watchlist to localStorage whenever it changes
    localStorage.setItem('footyScheduleWatchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const filteredMatches = useMemo(() => {
    return allMatches.filter(match => {
      const matchDate = new Date(match.matchTime);
      const dateFilter = selectedDate ? 
        matchDate.getFullYear() === selectedDate.getFullYear() &&
        matchDate.getMonth() === selectedDate.getMonth() &&
        matchDate.getDate() === selectedDate.getDate()
        : true;
      const leagueFilter = selectedLeague ? match.league.id === selectedLeague : true;
      const teamFilter = selectedTeam ? match.homeTeam.id === selectedTeam || match.awayTeam.id === selectedTeam : true;
      return dateFilter && leagueFilter && teamFilter;
    });
  }, [allMatches, selectedDate, selectedLeague, selectedTeam]);

  const watchlistMatches = useMemo(() => {
    return allMatches.filter(match => watchlist.includes(match.id));
  }, [allMatches, watchlist]);

  const handleToggleWatchlist = (matchId: string) => {
    setWatchlist(prev => {
      const match = allMatches.find(m => m.id === matchId);
      const matchName = match ? `${match.homeTeam.name} vs ${match.awayTeam.name}` : "Match";

      if (prev.includes(matchId)) {
        toast({ title: "Removed from Watchlist", description: `${matchName} has been removed from your watchlist.` });
        return prev.filter(id => id !== matchId);
      } else {
        toast({ title: "Added to Watchlist", description: `${matchName} has been added to your watchlist.` });
        return [...prev, matchId];
      }
    });
  };
  
  const handleClearFilters = () => {
    setSelectedDate(undefined);
    setSelectedLeague('');
    setSelectedTeam('');
    toast({ title: "Filters Cleared", description: "All match filters have been reset." });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Tabs defaultValue="all-matches" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mx-auto mb-8">
            <TabsTrigger value="all-matches" className="font-headline">All Matches</TabsTrigger>
            <TabsTrigger value="watchlist-recs" className="font-headline">My Watchlist & AI Picks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-matches">
            <Filters
              leagues={leagues}
              teams={teams}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              selectedLeague={selectedLeague}
              onLeagueChange={setSelectedLeague}
              selectedTeam={selectedTeam}
              onTeamChange={setSelectedTeam}
              onClearFilters={handleClearFilters}
            />
            <MatchList
              matches={filteredMatches}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </TabsContent>
          
          <TabsContent value="watchlist-recs">
            <WatchlistAndRecommendations
              watchlistMatches={watchlistMatches}
              watchlistIds={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              allMatches={allMatches}
              allTeams={teams}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
