'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import type { Match, League, Team } from '@/lib/types';
import { leagues as mockLeagues, teams as mockTeams, mockMatches } from '@/lib/mockData'; // mockMatches will be empty
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MatchList } from '@/components/MatchList';
import { Filters } from '@/components/Filters';
import { WatchlistDisplay } from '@/components/WatchlistDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setAllMatches(mockMatches); // mockMatches is now an empty array
    setLeagues(mockLeagues);
    setTeams(mockTeams);

    const storedWatchlist = localStorage.getItem('footyScheduleWatchlist');
    if (storedWatchlist) {
      setWatchlist(JSON.parse(storedWatchlist));
    }
  }, []);

  useEffect(() => {
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
      const match = allMatches.find(m => m.id === matchId); // Will likely be undefined if allMatches is empty
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

  const handlePsgElementClick = () => {
    console.log('PSG element clicked');
    // You can define what happens on click here, e.g., navigate to a PSG page, show details, etc.
    toast({ title: "PSG Clicked!", description: "You clicked on the Paris Saint-Germain element." });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        
        <div 
          className="flex flex-col items-center p-6 bg-card rounded-xl shadow-xl cursor-pointer hover:bg-muted transition-all duration-300 ease-in-out mb-10 transform hover:scale-105"
          onClick={handlePsgElementClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePsgElementClick(); }}}
          aria-label="Paris Saint-Germain Club Information"
        >
          <Image
            src="https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Paris_Saint-Germain_Logo.svg/1024px-Paris_Saint-Germain_Logo.svg.png" 
            alt="PSG Logo"
            width={120}
            height={120}
            className="mb-3 object-contain"
            data-ai-hint="PSG football club logo"
          />
          <p className="font-semibold text-xl font-headline text-primary-foreground">PSG</p>
        </div>

        <Tabs defaultValue="all-matches" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-1/2 lg:w-1/3 mx-auto mb-8">
            <TabsTrigger value="all-matches" className="font-headline">All Matches</TabsTrigger>
            <TabsTrigger value="watchlist-recs" className="font-headline">My Watchlist</TabsTrigger>
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
            <WatchlistDisplay
              watchlistMatches={watchlistMatches}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
