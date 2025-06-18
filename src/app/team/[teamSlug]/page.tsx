
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { teams as mockTeams } from '@/lib/mockData'; 
import type { Team, TeamApp, MatchApp } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Shield, Trophy, Clock, Brain, Users, Building, Landmark, Flag, Info } from 'lucide-react'; 
import { formatMatchDateTime } from '@/lib/dateUtils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { BettingModal } from '@/components/BettingModal';
import { getApiSportsTeamDetails, getApiSportsMatchesForTeam } from '@/services/apiSportsService';
import { MatchCard } from '@/components/MatchCard';

const SEASON_FOR_MATCHES = 2023; 

export default function TeamProfilePage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const router = useRouter();
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast();

  const [teamDetails, setTeamDetails] = useState<TeamApp | null>(null);
  const [mockTeamData, setMockTeamData] = useState<Team | null>(null);
  const [pastMatches, setPastMatches] = useState<MatchApp[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false);
  const [selectedMatchForBet, setSelectedMatchForBet] = useState<MatchApp | null>(null);


  const fetchTeamPageData = useCallback(async (apiTeamId: number, teamNameFromMock: string) => {
    setIsLoadingData(true);
    setIsLoadingMatches(true);
    setTeamDetails(null); 
    setPastMatches([]);

    try {
      const details = await getApiSportsTeamDetails(apiTeamId);
      setTeamDetails(details); 

      const past = await getApiSportsMatchesForTeam(apiTeamId, { season: SEASON_FOR_MATCHES, status: 'FT', last: 10 });
      setPastMatches(past.sort((a,b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime()));
      
      const nameForAISummary = details?.name || teamNameFromMock;
       if (nameForAISummary) {
        setIsAiLoading(true);
        setAiError(null);
        setAiSummary(null);
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
      console.error("Error fetching team page data from API-Sports:", error);
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
        fetchTeamPageData(foundMockTeam.id, foundMockTeam.name);
      } else {
        setIsLoadingData(false); 
      }
    }
  }, [teamSlug, fetchTeamPageData]);

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
    if (match.statusShort !== 'NS') { // This check is now less relevant as upcoming matches are removed
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


  if (isLoadingData && !mockTeamData) { 
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

  if (!mockTeamData && !isLoadingData) { 
    notFound();
  }
  
   let teamToBetOnForModal: TeamApp | undefined = undefined;
   if (selectedMatchForBet) {
     if (selectedMatchForBet.homeTeam.id === (teamDetails?.id || mockTeamData?.id)) {
       teamToBetOnForModal = selectedMatchForBet.homeTeam;
     } else if (selectedMatchForBet.awayTeam.id === (teamDetails?.id || mockTeamData?.id)) {
       teamToBetOnForModal = selectedMatchForBet.awayTeam;
     } else {
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
                alt={`${displayTeamName || 'Team'} Logo`}
                width={200}
                height={200}
                style={{ objectFit: 'contain' }}
                data-ai-hint={`${displayTeamName || 'Team'} logo large`}
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
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary"/>AI Team Assistant</CardTitle>
            <CardDescription>
              Utilisez l'assistant IA pour obtenir un résumé de l'équipe ou poser des questions spécifiques sur son histoire, son stade, son pays, etc.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Résumé par l'IA</h3>
              {(isAiLoading && !aiSummary) && <div className="py-2"><LoadingSpinner size="sm" /></div>}
              {aiError && !aiSummary && <p className="text-destructive">{aiError}</p>}
              {aiSummary && <CardDescription className="whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{aiSummary}</CardDescription>}
              {!aiSummary && !isAiLoading && !aiError && <p className="text-muted-foreground">Le résumé de l'IA est en cours de chargement ou non disponible.</p>}
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Poser une question sur {displayTeamName || 'cette équipe'}</h3>
              <Textarea
                placeholder={`Ex: Quelle est la capacité du stade de ${displayTeamName || 'cette équipe'} ?`}
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="resize-none"
              />
              <Button onClick={handleAskAi} disabled={isAiLoading || !userQuestion.trim() || !displayTeamName}>
                {isAiLoading && userQuestion ? <LoadingSpinner size="sm"/> : "Demander à l'IA"}
              </Button>
            </div>
            {aiAnswer && (
              <div>
                <h3 className="text-lg font-semibold mt-4 mb-2">Réponse de l'IA :</h3>
                <CardDescription className="whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{aiAnswer}</CardDescription>
              </div>
            )}
             {(isAiLoading && userQuestion) && <div className="flex justify-center mt-2"><LoadingSpinner size="md" /></div>}
             {aiError && userQuestion && <p className="text-destructive mt-2">{aiError}</p>}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8"> {/* Removed md:grid-cols-2 as upcoming matches are removed */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Matchs Passés ({pastMatches.length > 0 ? `${pastMatches.length} derniers` : 'Saison ' + SEASON_FOR_MATCHES})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMatches && pastMatches.length === 0 && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
              {!isLoadingMatches && pastMatches.length === 0 && <p className="text-muted-foreground text-center py-4">Aucun match passé trouvé pour {displayTeamName || 'cette équipe'} (Saison {SEASON_FOR_MATCHES}).</p>}
              {pastMatches.length > 0 && (
                <ul className="space-y-4">
                  {pastMatches.map((match) => (
                     <MatchCard key={match.id} match={match} isWatchlisted={false} onToggleWatchlist={() => { /* TODO */}} />
                  ))}
                </ul>
              )}
              {/* Future: "Load More" button could go here */}
            </CardContent>
          </Card>

          {/* Upcoming matches section removed */}
        </div>

        {selectedMatchForBet && teamToBetOnForModal && currentUser && (
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
                <Button variant="outline">Retour à l'accueil</Button>
            </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
