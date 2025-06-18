
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { teams as mockTeams } from '@/lib/mockData'; // Using mockData to find team API ID
import type { Team, TeamApp, MatchApp } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Shield, Trophy, Clock, Brain, Users, Building } from 'lucide-react';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { BettingModal } from '@/components/BettingModal';
import { getApiSportsTeamDetails, getApiSportsMatchesForTeam } from '@/services/apiSportsService';
import { MatchCard } from '@/components/MatchCard'; // Import MatchCard

const CURRENT_SEASON = 2024; // API-Sports uses start year of season

export default function TeamProfilePage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const router = useRouter();
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();

  const [teamDetails, setTeamDetails] = useState<TeamApp | null>(null); // For API fetched details
  const [mockTeamData, setMockTeamData] = useState<Team | null>(null); // For initial banner from mock
  const [pastMatches, setPastMatches] = useState<MatchApp[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchApp[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false);
  const [selectedMatchForBet, setSelectedMatchForBet] = useState<MatchApp | null>(null);


  const fetchTeamData = useCallback(async (apiTeamId: number, teamName: string) => {
    setIsLoadingData(true);
    setIsLoadingMatches(true);
    try {
      const details = await getApiSportsTeamDetails(apiTeamId);
      setTeamDetails(details);

      const past = await getApiSportsMatchesForTeam(apiTeamId, { season: CURRENT_SEASON, status: 'FT', last: 5 });
      setPastMatches(past.sort((a,b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime()));
      
      const upcoming = await getApiSportsMatchesForTeam(apiTeamId, { season: CURRENT_SEASON, status: 'NS', next: 5 });
      setUpcomingMatches(upcoming.sort((a,b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()));

      // Fetch AI summary after getting team name (could be from details or mock)
      const nameForAISummary = details?.name || teamName;
       if (nameForAISummary) {
        setIsAiLoading(true);
        setAiError(null);
        try {
          const input: TeamInfoInput = { teamName: nameForAISummary };
          const result = await getTeamInfo(input);
          setAiSummary(result.response);
        } catch (err) {
          console.error("Error fetching AI summary:", err);
          setAiError("Failed to load AI summary.");
          setAiSummary(`Could not load summary for ${nameForAISummary}.`);
        } finally {
          setIsAiLoading(false);
        }
      }

    } catch (error) {
      console.error("Error fetching team data from API-Sports:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load team data from API.' });
    } finally {
      setIsLoadingData(false);
      setIsLoadingMatches(false);
    }
  }, [toast]);


  useEffect(() => {
    if (teamSlug) {
      const foundMockTeam = mockTeams.find((t) => t.slug === teamSlug);
      setMockTeamData(foundMockTeam || null);

      if (foundMockTeam) {
        fetchTeamData(foundMockTeam.id, foundMockTeam.name);
      } else {
        setIsLoadingData(false); // No mock team found, stop loading
      }
    }
  }, [teamSlug, fetchTeamData]);

  const handleOpenBetModal = (match: MatchApp) => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to place a bet.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }
    if (match.statusShort !== 'NS') { // NS for "Not Started"
      toast({ variant: 'destructive', title: 'Betting Closed', description: 'You can only bet on upcoming matches.' });
      return;
    }
    
    setSelectedMatchForBet(match);
    setIsBettingModalOpen(true);
  };

  const handleAskAi = async () => {
    const teamNameToUse = teamDetails?.name || mockTeamData?.name;
    if (!teamNameToUse || !userQuestion.trim()) return;
    setIsAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    try {
      const input: TeamInfoInput = { teamName: teamNameToUse, question: userQuestion };
      const result = await getTeamInfo(input);
      setAiAnswer(result.response);
    } catch (error) {
      console.error("Error asking AI:", error);
      setAiError("Failed to get answer from AI. Please try again later.");
      setAiAnswer("Sorry, I couldn't answer that question right now.");
    }
    setIsAiLoading(false);
  };
  
  const displayTeamName = teamDetails?.name || mockTeamData?.name;
  const displayTeamLogo = teamDetails?.logoUrl || mockTeamData?.logoImageUrl;


  if (isLoadingData && !mockTeamData) { // Initial loading before mock team is found
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!mockTeamData && !isLoadingData) { // Mock team not found, and not loading anymore
    notFound();
  }
  
  // Team to bet on for modal needs to be one of the teams in the match.
  // We can pass the whole match and let the modal decide, or determine here.
  // For simplicity, let BettingModal handle which team to default if needed,
  // or it can present choices if teamToBetOn isn't specific enough.
  // For now, `teamToBetOn` prop in BettingModal expects a specific TeamApp object.
  // This logic assumes we're betting on the `displayTeamName` if they are in the match.
   let teamToBetOnForModal: TeamApp | undefined = undefined;
   if (selectedMatchForBet) {
     if (selectedMatchForBet.homeTeam.id === (teamDetails?.id || mockTeamData?.id)) {
       teamToBetOnForModal = selectedMatchForBet.homeTeam;
     } else if (selectedMatchForBet.awayTeam.id === (teamDetails?.id || mockTeamData?.id)) {
       teamToBetOnForModal = selectedMatchForBet.awayTeam;
     } else {
        // Fallback or error: current team (teamDetails/mockTeamData) is not in selectedMatchForBet.
        // This case should ideally not happen if "Bet on this match" is only shown for matches of the current team.
        // For now, we can pass one of the teams from the match or handle in modal.
        // Let's ensure teamToBetOnForModal is always one of the participants.
        // The modal will primarily use the `teamToBetOn` prop to indicate which team the user *intended* to bet on
        // (i.e., the team whose page they are on).
        teamToBetOnForModal = teamDetails ? teamDetails : mockTeamData ? {
            id: mockTeamData.id,
            name: mockTeamData.name,
            logoUrl: mockTeamData.logoImageUrl
        } : undefined;

     }
   }


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-48 md:h-64 w-full bg-muted flex items-center justify-center p-4">
            {displayTeamLogo ? (
              <Image
                src={displayTeamLogo}
                alt={`${displayTeamName} Logo`}
                width={200}
                height={200}
                style={{ objectFit: 'contain' }}
                data-ai-hint={`${displayTeamName} logo large`}
                priority
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-full text-gray-500">
                <Users size={64}/>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg">
                {displayTeamName || 'Team Profile'}
              </h1>
            </div>
          </div>
          <CardContent className="p-6">
            <CardTitle className="text-2xl mb-1 font-headline">Team Information</CardTitle>
            {isLoadingData && !teamDetails && <LoadingSpinner size="sm" />}
            {teamDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                <p><span className="font-semibold">Pays:</span> {teamDetails.country || 'N/A'}</p>
                <p><span className="font-semibold">Fondé:</span> {teamDetails.founded || 'N/A'}</p>
                <p><span className="font-semibold">Stade:</span> {teamDetails.venueName || 'N/A'}</p>
                <p><span className="font-semibold">Ville du Stade:</span> {teamDetails.venueCity || 'N/A'}</p>
                <p><span className="font-semibold">Capacité Stade:</span> {teamDetails.venueCapacity?.toLocaleString() || 'N/A'}</p>
              </div>
            )}
            {!teamDetails && !isLoadingData && <p className="text-muted-foreground mt-2">Detailed information not available.</p>}
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary"/>AI Team Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Team Summary</h3>
              {(isAiLoading && !aiSummary) && <LoadingSpinner size="sm" />}
              {aiError && !aiSummary && <p className="text-destructive">{aiError}</p>}
              {aiSummary && <CardDescription className="whitespace-pre-wrap">{aiSummary}</CardDescription>}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Ask a question about {displayTeamName}</h3>
              <Textarea
                placeholder={`e.g., Who is their current manager?`}
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="resize-none"
              />
              <Button onClick={handleAskAi} disabled={isAiLoading || !userQuestion.trim() || !displayTeamName}>
                {isAiLoading && userQuestion ? <LoadingSpinner size="sm"/> : "Ask AI"}
              </Button>
            </div>
            {aiAnswer && (
              <div>
                <h3 className="text-lg font-semibold mt-4 mb-2">AI Answer:</h3>
                <CardDescription className="whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{aiAnswer}</CardDescription>
              </div>
            )}
             {(isAiLoading && userQuestion) && <div className="flex justify-center mt-2"><LoadingSpinner size="md" /></div>}
             {aiError && userQuestion && <p className="text-destructive mt-2">{aiError}</p>}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Past Matches (Last 5)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMatches && pastMatches.length === 0 && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
              {!isLoadingMatches && pastMatches.length === 0 && <p className="text-muted-foreground text-center py-4">No past matches found for {displayTeamName}.</p>}
              {pastMatches.length > 0 && (
                <ul className="space-y-4">
                  {pastMatches.map((match) => (
                     <MatchCard key={match.id} match={match} isWatchlisted={false} onToggleWatchlist={() => { /* TODO */}} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Clock className="text-primary"/>Upcoming Matches (Next 5)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMatches && upcomingMatches.length === 0 && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
              {!isLoadingMatches && upcomingMatches.length === 0 && <p className="text-muted-foreground text-center py-4">No upcoming matches found for {displayTeamName}.</p>}
              {upcomingMatches.length > 0 && (
                <ul className="space-y-4">
                  {upcomingMatches.map((match) => (
                    <li key={match.id} className="p-0 border-none rounded-lg bg-transparent"> {/* MatchCard now handles its own card structure */}
                       <MatchCard match={match} isWatchlisted={false} onToggleWatchlist={() => { /* TODO */}} />
                        <Button
                            size="sm"
                            className="mt-2 w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                            onClick={() => handleOpenBetModal(match)}
                            disabled={!currentUser || match.statusShort !== 'NS'}
                          >
                            Bet on this match
                        </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedMatchForBet && teamToBetOnForModal && currentUser && (
          <BettingModal
            isOpen={isBettingModalOpen}
            onClose={() => setIsBettingModalOpen(false)}
            match={selectedMatchForBet}
            teamToBetOn={teamToBetOnForModal} // This is the team whose page we are on
            currentUser={currentUser}
          />
        )}

        <div className="mt-12 text-center">
            <Link href="/">
                <Button variant="outline">Back to Home</Button>
            </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
