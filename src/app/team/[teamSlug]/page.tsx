
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { teams, mockMatches } from '@/lib/mockData';
import type { Team, Match } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Shield, Trophy, Clock, Brain } from 'lucide-react';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { BettingModal } from '@/components/BettingModal'; // Import BettingModal

export default function TeamProfilePage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string; // Changed from teamId to teamSlug
  const router = useRouter();
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();

  const [team, setTeam] = useState<Team | null | undefined>(undefined);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // AI State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Betting Modal State
  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false);
  const [selectedMatchForBet, setSelectedMatchForBet] = useState<Match | null>(null);
  const [teamToBetOnForModal, setTeamToBetOnForModal] = useState<Team | null>(null);


  useEffect(() => {
    if (teamSlug) {
      setIsLoadingData(true);
      // Find team by slug instead of ID
      const foundTeam = teams.find((t) => t.slug === teamSlug);
      
      if (foundTeam) {
        setTeam(foundTeam);
        const teamMatches = mockMatches.filter(
          (match) => match.homeTeam.id === foundTeam.id || match.awayTeam.id === foundTeam.id
        );
        setPastMatches(teamMatches.filter((m) => m.status === 'completed').sort((a,b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime()));
        setUpcomingMatches(teamMatches.filter((m) => m.status === 'upcoming').sort((a,b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()));

        const fetchAiSummary = async () => {
          setIsAiLoading(true);
          setAiError(null);
          try {
            const input: TeamInfoInput = { teamName: foundTeam.name };
            const result = await getTeamInfo(input);
            setAiSummary(result.response);
          } catch (error) {
            console.error("Error fetching AI summary:", error);
            setAiError("Failed to load AI summary. Please try again later.");
            setAiSummary("Could not load team summary.");
          }
          setIsAiLoading(false);
        };
        fetchAiSummary();

      } else {
        setTeam(null); // Team not found by slug
      }
      setIsLoadingData(false);
    }
  }, [teamSlug]);

  const handleOpenBetModal = (match: Match) => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to place a bet.',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }
    if (match.status !== 'upcoming') {
      toast({ variant: 'destructive', title: 'Betting Closed', description: 'You can only bet on upcoming matches.' });
      return;
    }
    if (!team) return; // Should not happen if button is rendered

    // Determine which team the user is implicitly betting on (the team whose page this is)
    let bettingOnThisTeam: Team | null = null;
    if (match.homeTeam.id === team.id) {
        bettingOnThisTeam = match.homeTeam;
    } else if (match.awayTeam.id === team.id) {
        bettingOnThisTeam = match.awayTeam;
    }

    if (!bettingOnThisTeam) {
        toast({variant: 'destructive', title: 'Error', description: 'This team is not playing in the selected match.'});
        return;
    }
    
    setSelectedMatchForBet(match);
    setTeamToBetOnForModal(bettingOnThisTeam);
    setIsBettingModalOpen(true);
  };


  const handleProtectedAction = (actionUrl: string) => {
    if (!currentUser && !authIsLoading) {
      router.push('/login');
    } else if (currentUser) {
      // Placeholder for actual follow/store logic
      console.log(`Action for ${actionUrl} triggered by ${currentUser.name}`);
      toast({title: 'Feature Coming Soon!', description: `The "${actionUrl.split('/').pop()}" feature is under development.`});
    }
  };

  const handleAskAi = async () => {
    if (!team || !userQuestion.trim()) return;
    setIsAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    try {
      const input: TeamInfoInput = { teamName: team.name, question: userQuestion };
      const result = await getTeamInfo(input);
      setAiAnswer(result.response);
    } catch (error) {
      console.error("Error asking AI:", error);
      setAiError("Failed to get answer from AI. Please try again later.");
      setAiAnswer("Sorry, I couldn't answer that question right now.");
    }
    setIsAiLoading(false);
  };

  if (isLoadingData || authIsLoading) {
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

  if (team === null) { 
    notFound(); 
  }
  
  if (!team) return null; // Should be caught by notFound() but good for TS

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-48 md:h-64 w-full bg-muted flex items-center justify-center p-4">
            {team.logoImageUrl ? (
              <Image
                src={team.logoImageUrl}
                alt={`${team.name} Logo`}
                width={200} 
                height={200}
                style={{objectFit: 'contain'}}
                data-ai-hint={`${team.name} logo large`}
              />
            ) : (
              <Image
                src={`https://placehold.co/200x200.png`}
                alt={`${team.name} Placeholder Logo`}
                width={200}
                height={200}
                style={{objectFit: 'contain'}}
                data-ai-hint={`${team.name} logo large`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg">
                {team.name}
              </h1>
            </div>
          </div>
          <CardContent className="p-6">
            <CardTitle className="text-2xl mb-4 font-headline">Team Information</CardTitle>
            <p className="text-muted-foreground">Detailed statistics and information about {team.name} will be displayed here.</p>
             <div className="mt-4 flex space-x-4">
                <Button variant="outline" onClick={() => handleProtectedAction(`/team/${team.slug}/store`)}>Team Store</Button>
                <Button onClick={() => handleProtectedAction(`/team/${team.slug}/follow`)}>Follow Team</Button>
             </div>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary"/>AI Team Assistant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Team Summary</h3>
              {isAiLoading && !aiSummary && <LoadingSpinner size="sm" />}
              {aiError && !aiSummary && <p className="text-destructive">{aiError}</p>}
              {aiSummary && <CardDescription className="whitespace-pre-wrap">{aiSummary}</CardDescription>}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Ask a question about {team.name}</h3>
              <Textarea 
                placeholder={`e.g., Who is their current manager?`}
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="resize-none"
              />
              <Button onClick={handleAskAi} disabled={isAiLoading || !userQuestion.trim()}>
                {isAiLoading && userQuestion ? <LoadingSpinner size="sm"/> : "Ask AI"}
              </Button>
            </div>
            {aiAnswer && (
              <div>
                <h3 className="text-lg font-semibold mt-4 mb-2">AI Answer:</h3>
                <CardDescription className="whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{aiAnswer}</CardDescription>
              </div>
            )}
             {isAiLoading && userQuestion && <div className="flex justify-center mt-2"><LoadingSpinner size="md" /></div>}
             {aiError && userQuestion && <p className="text-destructive mt-2">{aiError}</p>}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Past Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {pastMatches.length > 0 ? (
                <ul className="space-y-4">
                  {pastMatches.map((match) => {
                    const { date, time } = formatMatchDateTime(match.matchTime);
                    return (
                      <li key={match.id} className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{match.homeTeam.name} vs {match.awayTeam.name}</span>
                          <span className="font-bold text-lg">
                            {match.homeScore} - {match.awayScore}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Shield size={14}/> {match.league.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><CalendarDays size={14}/> {date} at {time}</p>
                        {match.venue && <p className="text-sm text-muted-foreground">Venue: {match.venue}</p>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">No past matches found for {team.name}.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Clock className="text-primary"/>Upcoming Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length > 0 ? (
                <ul className="space-y-4">
                  {upcomingMatches.map((match) => {
                     const { date, time } = formatMatchDateTime(match.matchTime);
                     const isTeamInMatch = match.homeTeam.id === team.id || match.awayTeam.id === team.id;
                    return (
                      <li key={match.id} className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <p className="font-semibold">{match.homeTeam.name} vs {match.awayTeam.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Shield size={14}/> {match.league.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><CalendarDays size={14}/> {date} at {time}</p>
                        {match.venue && <p className="text-sm text-muted-foreground">Venue: {match.venue}</p>}
                        {isTeamInMatch && (
                          <Button 
                            size="sm" 
                            className="mt-3 w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                            onClick={() => handleOpenBetModal(match)}
                            disabled={!currentUser || match.status !== 'upcoming'}
                          >
                            Bet on this match
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">No upcoming matches found for {team.name}.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedMatchForBet && teamToBetOnForModal && (
          <BettingModal
            isOpen={isBettingModalOpen}
            onClose={() => setIsBettingModalOpen(false)}
            match={selectedMatchForBet}
            teamToBetOn={teamToBetOnForModal}
            currentUser={currentUser}
          />
        )}

        <div className="mt-12 text-center">
            <Link href="/">
                <Button variant="outline">Back to All Teams</Button>
            </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
