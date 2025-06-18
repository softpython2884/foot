
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MatchList } from '@/components/MatchList';
import { WatchlistDisplay } from '@/components/WatchlistDisplay'; 
import { getApiCompetitions, getApiMatchesForCompetition } from '@/services/footballDataApi';
import { getDateNDaysFromNowString, getTodayDateString } from '@/lib/dateUtils'; // Updated import
import type { ApiCompetition, ApiMatch, Match as AppMatch } from '@/lib/types'; 
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from 'next/image'; // Import Image for emblems

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
    status: apiMatch.status, 
    homeScore: apiMatch.score?.fullTime?.home,
    awayScore: apiMatch.score?.fullTime?.away,
    score: apiMatch.score,
    venue: apiMatch.venue,
  };
}


export default function HomePage() {
  const [competitions, setCompetitions] = useState<ApiCompetition[]>([]);
  const [selectedCompetitionCode, setSelectedCompetitionCode] = useState<string>('');
  const [matches, setMatches] = useState<AppMatch[]>([]); 
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matchDateFilter, setMatchDateFilter] = useState<'upcoming' | 'finished' | 'live'>('upcoming');

  const [localWatchlist, setLocalWatchlist] = useState<number[]>([]);

  const popularCompetitionCodes = ['PL', 'CL', 'BL1', 'SA', 'PD', 'FL1']; 

  useEffect(() => {
    async function fetchCompetitions() {
      setIsLoadingCompetitions(true);
      try {
        const comps = await getApiCompetitions(popularCompetitionCodes);
        setCompetitions(comps);
        if (comps.length > 0 && !selectedCompetitionCode) {
          // Optionally auto-select the first competition or a default one
          // setSelectedCompetitionCode(comps[0].code); 
        }
      } catch (error) {
        console.error("Failed to fetch competitions", error);
      }
      setIsLoadingCompetitions(false);
    }
    fetchCompetitions();
  }, [selectedCompetitionCode]); // Added selectedCompetitionCode to avoid re-fetching if already set

  const fetchMatches = useCallback(async (compCode: string, filter: 'upcoming' | 'finished' | 'live') => {
    if (!compCode) {
      setMatches([]);
      return;
    }
    setIsLoadingMatches(true);
    try {
      let apiParams: { dateFrom?: string; dateTo?: string; status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' } = {};
      if (filter === 'upcoming') {
        apiParams = { status: 'SCHEDULED', dateFrom: getTodayDateString(), dateTo: getDateNDaysFromNowString(14) }; 
      } else if (filter === 'finished') {
        apiParams = { status: 'FINISHED', dateFrom: getDateNDaysFromNowString(-14), dateTo: getTodayDateString() }; 
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
      setMatches([]); 
    }
  }, [selectedCompetitionCode, matchDateFilter, fetchMatches]);

  const handleToggleWatchlist = (matchId: string | number) => {
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
                      {comp.emblem && (
                        <Image 
                            src={comp.emblem} 
                            alt={`${comp.name} emblem`} 
                            width={20} 
                            height={20} 
                            style={{ objectFit: 'contain' }}
                        />
                      )}
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
              watchlist={localWatchlist.map(String)} 
              onToggleWatchlist={handleToggleWatchlist}
            />
            <WatchlistDisplay
              watchlistMatches={watchlistedApiMatches}
              onToggleWatchlist={handleToggleWatchlist}
            />
          </>
        ) : selectedCompetitionCode ? (
          // This case is when a competition is selected, but fetchMatches hasn't run yet or returned empty, and not loading.
          // This might briefly show before matches load or if initial fetch is empty.
           <p className="text-center text-muted-foreground py-8">Loading matches or no matches available for the selected competition.</p>
        ) : (
           // Default state before any competition is selected
           <p className="text-center text-muted-foreground py-8">Select a competition to see matches.</p>
        )
      }

      </main>
      <Footer />
    </div>
  );
}
