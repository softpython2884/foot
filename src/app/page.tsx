
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MatchList } from '@/components/MatchList';
import { WatchlistDisplay } from '@/components/WatchlistDisplay'; // Renamed for clarity
import { getApiCompetitions, getApiMatchesForCompetition, getDateNDaysFromNowString, getTodayDateString } from '@/services/footballDataApi';
import type { ApiCompetition, ApiMatch, Match as AppMatch } from '@/lib/types'; // Using ApiMatch for fetched data
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';

// Helper to transform API Match to AppMatch for UI components if needed, or use API types directly
function transformApiMatchToAppMatch(apiMatch: ApiMatch): AppMatch {
  return {
    id: apiMatch.id,
    league: { 
      id: apiMatch.competition.id, 
      name: apiMatch.competition.name, 
      code: apiMatch.competition.code,
      emblemUrl: apiMatch.competition.emblem 
    },
    homeTeam: { 
      id: apiMatch.homeTeam.id, 
      name: apiMatch.homeTeam.name, 
      shortName: apiMatch.homeTeam.shortName, 
      crestUrl: apiMatch.homeTeam.crest 
    },
    awayTeam: { 
      id: apiMatch.awayTeam.id, 
      name: apiMatch.awayTeam.name, 
      shortName: apiMatch.awayTeam.shortName, 
      crestUrl: apiMatch.awayTeam.crest
    },
    matchTime: apiMatch.utcDate,
    utcDate: apiMatch.utcDate,
    status: apiMatch.status, // This needs mapping if MatchCard expects different values
    homeScore: apiMatch.score?.fullTime?.home,
    awayScore: apiMatch.score?.fullTime?.away,
    score: apiMatch.score,
    venue: apiMatch.venue,
  };
}


export default function HomePage() {
  const [competitions, setCompetitions] = useState<ApiCompetition[]>([]);
  const [selectedCompetitionCode, setSelectedCompetitionCode] = useState<string>('');
  const [matches, setMatches] = useState<AppMatch[]>([]); // Use AppMatch for consistency with MatchCard
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matchDateFilter, setMatchDateFilter] = useState<'upcoming' | 'finished' | 'live'>('upcoming');

  // Local watchlist for API matches on this page (stores numeric API match IDs)
  const [localWatchlist, setLocalWatchlist] = useState<number[]>([]);

  const popularCompetitionCodes = ['PL', 'CL', 'BL1', 'SA', 'PD', 'FL1']; // Premier League, Champions League, Bundesliga, Serie A, La Liga, Ligue 1

  useEffect(() => {
    async function fetchCompetitions() {
      setIsLoadingCompetitions(true);
      try {
        const comps = await getApiCompetitions(popularCompetitionCodes);
        setCompetitions(comps);
        if (comps.length > 0) {
          // setSelectedCompetitionCode(comps[0].code); // Auto-select first competition
        }
      } catch (error) {
        console.error("Failed to fetch competitions", error);
        // Handle error display to user if necessary
      }
      setIsLoadingCompetitions(false);
    }
    fetchCompetitions();
  }, []);

  const fetchMatches = useCallback(async (compCode: string, filter: 'upcoming' | 'finished' | 'live') => {
    if (!compCode) {
      setMatches([]);
      return;
    }
    setIsLoadingMatches(true);
    try {
      let apiParams: { dateFrom?: string; dateTo?: string; status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' } = {};
      if (filter === 'upcoming') {
        apiParams = { status: 'SCHEDULED', dateFrom: getTodayDateString(), dateTo: getDateNDaysFromNowString(14) }; // Next 14 days
      } else if (filter === 'finished') {
        apiParams = { status: 'FINISHED', dateFrom: getDateNDaysFromNowString(-14), dateTo: getTodayDateString() }; // Last 14 days
      } else if (filter === 'live') {
        apiParams = { status: 'LIVE' };
      }
      
      const apiMatches = await getApiMatchesForCompetition(compCode, apiParams);
      setMatches(apiMatches.map(transformApiMatchToAppMatch));
    } catch (error) {
      console.error(`Failed to fetch matches for ${compCode}`, error);
      setMatches([]);
    }
    setIsLoadingMatches(false);
  }, []);


  useEffect(() => {
    if (selectedCompetitionCode) {
      fetchMatches(selectedCompetitionCode, matchDateFilter);
    } else {
      setMatches([]); // Clear matches if no competition is selected
    }
  }, [selectedCompetitionCode, matchDateFilter, fetchMatches]);

  const handleToggleWatchlist = (matchId: string | number) => {
    // Ensure matchId is a number for API matches
    const numericMatchId = typeof matchId === 'string' ? parseInt(matchId, 10) : matchId;
    if (isNaN(numericMatchId)) return;

    setLocalWatchlist((prev) =>
      prev.includes(numericMatchId) ? prev.filter((id) => id !== numericMatchId) : [...prev, numericMatchId]
    );
  };

  const watchlistedApiMatches = matches.filter(match => localWatchlist.includes(match.id as number));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold font-headline text-center mb-6 text-primary">
          Match Schedules & Results
        </h2>

        {isLoadingCompetitions ? (
          <div className="flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : competitions.length > 0 ? (
          <div className="mb-6 p-6 rounded-lg shadow-md bg-card">
            <label htmlFor="competition-select" className="block mb-2 font-medium text-card-foreground">Select Competition:</label>
            <Select
              value={selectedCompetitionCode}
              onValueChange={(value) => setSelectedCompetitionCode(value)}
            >
              <SelectTrigger id="competition-select" className="w-full md:w-1/2 lg:w-1/3 mx-auto">
                <SelectValue placeholder="Choose a competition..." />
              </SelectTrigger>
              <SelectContent>
                {competitions.map((comp) => (
                  <SelectItem key={comp.id} value={comp.code}>
                    <div className="flex items-center gap-2">
                      {comp.emblem && <img src={comp.emblem} alt="" className="h-5 w-5 object-contain" />}
                      {comp.name} ({comp.area.name})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No competitions available or failed to load.</p>
        )}
        
        {selectedCompetitionCode && (
            <Tabs value={matchDateFilter} onValueChange={(value) => setMatchDateFilter(value as 'upcoming' | 'finished' | 'live')} className="mb-6">
                <TabsList className="grid w-full grid-cols-3 md:w-auto md:inline-flex">
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="live">Live</TabsTrigger>
                    <TabsTrigger value="finished">Finished</TabsTrigger>
                </TabsList>
            </Tabs>
        )}


        {isLoadingMatches ? (
          <div className="flex justify-center mt-8"><LoadingSpinner size="lg" /></div>
        ) : selectedCompetitionCode && matches.length === 0 && !isLoadingMatches ? (
           <p className="text-center text-muted-foreground py-8">No {matchDateFilter} matches found for {competitions.find(c=>c.code === selectedCompetitionCode)?.name}.</p>
        ) : matches.length > 0 ? (
          <>
            <MatchList
              matches={matches}
              watchlist={localWatchlist.map(String)} // MatchList might expect string IDs
              onToggleWatchlist={handleToggleWatchlist}
            />
            <WatchlistDisplay
              watchlistMatches={watchlistedApiMatches}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </>
        ) : selectedCompetitionCode ? (
           <p className="text-center text-muted-foreground py-8">Select a competition to see matches.</p>
        ) : null}


      </main>
      <Footer />
    </div>
  );
}
