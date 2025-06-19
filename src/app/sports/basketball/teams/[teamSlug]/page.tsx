
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { basketballTeams, supportedSports, mockBasketballPlayers, mockBasketballGames } from '@/lib/mockData';
import type { TeamApp, SportDefinition, BasketballPlayerApp, BasketballGameResultApp } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Users, Trophy, ChevronLeft, ShieldHalf, Star, CalendarClock, BarChart3, Shirt } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { getBasketballTeamDetails, getBasketballRoster, getBasketballGamesForTeam } from '@/services/apiSportsService';
import { formatMatchDateTime } from '@/lib/dateUtils';

const CURRENT_BASKETBALL_SEASON = 2023; // For NBA 2023-2024 season

function simpleMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  let html = markdown;
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>');
  html = html.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '').join('');
  html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
  return html;
}


export default function BasketballTeamProfilePage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const sportSlug = 'basketball';
  const { toast } = useToast();

  const [mockTeamData, setMockTeamData] = useState<TeamApp | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamApp | null>(null);
  const [roster, setRoster] = useState<BasketballPlayerApp[]>([]);
  const [gameResults, setGameResults] = useState<BasketballGameResultApp[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentSport = supportedSports.find(s => s.slug === sportSlug) as SportDefinition;

  const fetchBasketballData = useCallback(async (teamId: number, teamName: string) => {
    setIsLoadingData(true);
    setIsLoadingRoster(true);
    setIsLoadingResults(true);
    setIsAiLoading(true); // Start AI loading for summary

    try {
      const [detailsResult, rosterResult, gamesResult, summaryResult] = await Promise.allSettled([
        getBasketballTeamDetails(teamId, currentSport.apiBaseUrl),
        getBasketballRoster(teamId, CURRENT_BASKETBALL_SEASON, currentSport.apiBaseUrl),
        getBasketballGamesForTeam(teamId, CURRENT_BASKETBALL_SEASON, currentSport.apiBaseUrl, 10),
        getTeamInfo({ entityName: teamName, entityType: 'team', contextName: 'Basketball' })
      ]);

      if (detailsResult.status === 'fulfilled' && detailsResult.value) {
        setTeamDetails(detailsResult.value);
      } else {
        console.error("Failed to fetch Basketball team details:", detailsResult.status === 'rejected' && detailsResult.reason);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load team details.' });
        // Keep mockTeamData if API fails
      }

      if (rosterResult.status === 'fulfilled' && rosterResult.value.length > 0) {
        setRoster(rosterResult.value);
      } else {
        console.error("Failed to fetch Basketball roster:", rosterResult.status === 'rejected' ? rosterResult.reason : 'No roster data');
        setRoster(mockBasketballPlayers.filter(p => p.id && basketballTeams.find(bt => bt.id === teamId)?.name.includes(p.name.split(' (')[0]))); // Improved mock filtering
        toast({ variant: 'default', title: 'Info', description: 'Could not load live roster, showing mock data if available.' });
      }
      setIsLoadingRoster(false);

      if (gamesResult.status === 'fulfilled' && gamesResult.value.length > 0) {
        setGameResults(gamesResult.value);
      } else {
        console.error("Failed to fetch Basketball game results:", gamesResult.status === 'rejected' ? gamesResult.reason : 'No game data');
        const mockGamesForTeam = mockBasketballGames.filter(g => g.homeTeam.id === teamId || g.awayTeam.id === teamId);
        setGameResults(mockGamesForTeam);
        toast({ variant: 'default', title: 'Info', description: 'Could not load live game results, showing mock data if available.' });
      }
      setIsLoadingResults(false);

      if (summaryResult.status === 'fulfilled' && summaryResult.value) {
        setAiSummary(summaryResult.value.response);
      } else {
        console.error("Error fetching AI summary for Basketball team:", summaryResult.status === 'rejected' && summaryResult.reason);
        setAiError("Failed to load AI summary.");
        setAiSummary(`Could not load summary for ${teamName}.`);
      }
      

    } catch (error) {
      console.error("Overall error fetching Basketball page data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load all Basketball page data.' });
       // Fallback to mocks in case of complete failure
       setRoster(mockBasketballPlayers.filter(p => p.id && basketballTeams.find(bt => bt.id === teamId)?.name.includes(p.name.split(' (')[0])));
       const mockGamesForTeam = mockBasketballGames.filter(g => g.homeTeam.id === teamId || g.awayTeam.id === teamId);
       setGameResults(mockGamesForTeam);
    } finally {
      setIsLoadingData(false); // General data loading done (details)
      setIsAiLoading(false); // AI summary loading finished
    }
  }, [currentSport.apiBaseUrl, toast]);


  useEffect(() => {
    if (teamSlug) {
      const foundTeam = basketballTeams.find((t) => t.slug === teamSlug);
      setMockTeamData(foundTeam || null);
      if (foundTeam) {
        fetchBasketballData(foundTeam.id, foundTeam.name);
      } else {
         setIsLoadingData(false);
         setIsLoadingRoster(false);
         setIsLoadingResults(false);
         setIsAiLoading(false);
      }
    }
  }, [teamSlug, fetchBasketballData]);

  const handleAskAi = async () => {
    const teamNameToUse = teamDetails?.name || mockTeamData?.name;
    if (!teamNameToUse || !userQuestion.trim()) return;
    setIsAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    try {
      const input: TeamInfoInput = { entityName: teamNameToUse, entityType: 'team', question: userQuestion, contextName: "Basketball" };
      const result = await getTeamInfo(input);
      setAiAnswer(result.response);
    } catch (error) {
      console.error("Error asking AI for Basketball team:", error);
      setAiError("Failed to get answer from AI. Please try again later.");
      setAiAnswer("Sorry, I couldn't answer that question right now.");
    }
    setIsAiLoading(false);
  };

  if (isLoadingData && !mockTeamData) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center"> <LoadingSpinner size="lg" /> </main>
        <Footer />
      </div>
    );
  }

  if (!mockTeamData && !teamDetails && !isLoadingData) {
    notFound(); return null;
  }

  const displayTeamName = teamDetails?.name || mockTeamData?.name || 'Basketball Team Profile';
  const displayTeamLogo = teamDetails?.logoUrl || mockTeamData?.logoUrl;
  const teamDetailsToDisplay = teamDetails || mockTeamData;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/sports/${sportSlug}/teams`}> <ChevronLeft size={18} className="mr-2" /> Back to {currentSport.name} Teams </Link>
          </Button>
        </div>

        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-56 md:h-72 w-full bg-muted flex items-center justify-center p-4">
            {displayTeamLogo ? (
              <Image src={displayTeamLogo} alt={`${displayTeamName} Logo`} width={200} height={200} style={{ objectFit: 'contain' }} data-ai-hint={`${displayTeamName} logo large`} priority />
            ) : (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-full text-gray-500"> <Star size={64} /> </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg"> {displayTeamName} </h1>
               {teamDetailsToDisplay?.conference && <p className="text-lg text-white/90 drop-shadow-sm">{teamDetailsToDisplay.conference} Conference</p>}
               {teamDetailsToDisplay?.division && <p className="text-md text-white/80 drop-shadow-sm">{teamDetailsToDisplay.division} Division</p>}
            </div>
          </div>
        </Card>

        
        <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary" /> AI Summary & Info</CardTitle>
                <CardDescription> General information and answers about {displayTeamName}. </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {(isAiLoading && !aiSummary && !aiAnswer) && <div className="py-2 flex justify-center"><LoadingSpinner size="md" /></div>}
                {aiSummary && (
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-md mb-6">
                    <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(aiSummary) }} />
                  </div>
                )}
                {aiError && !aiSummary && <p className="text-destructive">{aiError}</p>}
                
                <div className="space-y-2">
                  <Textarea placeholder={`Ask a question about ${displayTeamName}...`} value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} className="resize-none" />
                  <Button onClick={handleAskAi} disabled={isAiLoading || !userQuestion.trim()}> {isAiLoading && userQuestion ? <LoadingSpinner size="sm" /> : "Ask AI"} </Button>
                </div>
                {aiAnswer && (
                  <div>
                    <h3 className="text-lg font-semibold mt-4 mb-2">AI's Answer:</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-3 rounded-md">
                      <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(aiAnswer) }} />
                    </div>
                  </div>
                )}
                {(isAiLoading && userQuestion) && <div className="flex justify-center mt-2"><LoadingSpinner size="md" /></div>}
                {aiError && userQuestion && <p className="text-destructive mt-2">{aiError}</p>}
              </CardContent>
          </Card>
        

        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users className="text-primary"/>Team Roster ({CURRENT_BASKETBALL_SEASON}-{CURRENT_BASKETBALL_SEASON+1})</CardTitle></CardHeader>
          <CardContent>
            {isLoadingRoster ? <div className="flex justify-center py-5"><LoadingSpinner/></div> : 
             roster.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {roster.map((player) => (
                  <Card key={player.id || player.name} className="p-3 bg-card shadow-sm hover:shadow-md transition-shadow text-center">
                     <div className="relative w-20 h-20 mx-auto mb-2">
                        {player.photoUrl && !player.photoUrl.includes('placehold.co') ? (
                            <Image src={player.photoUrl} alt={player.name || 'Player'} layout="fill" objectFit="cover" className="rounded-full shadow-md" data-ai-hint={`${player.name} portrait`}/>
                        ) : (
                            <div className="w-full h-full bg-muted rounded-full flex items-center justify-center text-2xl font-bold text-muted-foreground" data-ai-hint={`${player.name} placeholder`}>
                                {player.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                        )}
                    </div>
                    <p className="font-semibold text-sm text-foreground">{player.name}</p>
                    {player.number != null && <p className="text-xs text-muted-foreground">#{player.number}</p>}
                    {player.position && <p className="text-xs text-muted-foreground">{player.position}</p>}
                    {player.heightMeters && <p className="text-xs text-muted-foreground">H: {player.heightMeters}m</p>}
                    {player.college && <p className="text-xs text-muted-foreground">College: {player.college}</p>}
                  </Card>
                ))}
              </div>
             ) : <p className="text-muted-foreground text-center">Roster information for {CURRENT_BASKETBALL_SEASON}-{CURRENT_BASKETBALL_SEASON+1} not available.</p>
            }
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Recent Game Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoadingResults ? <div className="flex justify-center py-5"><LoadingSpinner/></div> :
             gameResults.length > 0 ? (
                gameResults.map(game => (
                    <Card key={game.id} className="p-3 bg-card shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">{formatMatchDateTime(game.matchTime).date}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${game.statusShort === 'FT' ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' : 'bg-green-200 text-green-700 dark:bg-green-700 dark:text-green-200'}`}>{game.statusLong}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image src={game.homeTeam.logoUrl || 'https://placehold.co/24x24.png'} alt={game.homeTeam.name} width={24} height={24} className="object-contain" data-ai-hint={`${game.homeTeam.name} logo small`}/>
                                <span className="font-medium text-sm text-foreground">{game.homeTeam.name}</span>
                            </div>
                            <span className={`font-bold text-lg ${game.homeScore != null && game.awayScore != null && game.homeScore > game.awayScore ? 'text-primary' : 'text-foreground'}`}>{game.homeScore ?? '-'}</span>
                        </div>
                         <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2">
                                <Image src={game.awayTeam.logoUrl || 'https://placehold.co/24x24.png'} alt={game.awayTeam.name} width={24} height={24} className="object-contain" data-ai-hint={`${game.awayTeam.name} logo small`}/>
                                <span className="font-medium text-sm text-foreground">{game.awayTeam.name}</span>
                            </div>
                            <span className={`font-bold text-lg ${game.homeScore != null && game.awayScore != null && game.awayScore > game.homeScore ? 'text-primary' : 'text-foreground'}`}>{game.awayScore ?? '-'}</span>
                        </div>
                        {game.league.name && <p className="text-xs text-muted-foreground text-center mt-1">{game.league.name} - {game.league.season}</p>}
                         {/* Display Quarter Scores */}
                        {(game.homeQuarterScores || game.awayQuarterScores) && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                <div className="flex justify-around">
                                    <span>Qtrs</span>
                                    <span>H</span>
                                    <span>A</span>
                                </div>
                                {([1, 2, 3, 4]).map((q, index) => (
                                <div key={`q-${index}`} className="flex justify-around items-center">
                                    <span>Q{q}</span>
                                    <span>{game.homeQuarterScores?.[index] ?? '-'}</span>
                                    <span>{game.awayQuarterScores?.[index] ?? '-'}</span>
                                </div>
                                ))}
                                {game.homeOvertimeScore != null || game.awayOvertimeScore != null ? (
                                <div className="flex justify-around items-center font-semibold">
                                    <span>OT</span>
                                    <span>{game.homeOvertimeScore ?? '-'}</span>
                                    <span>{game.awayOvertimeScore ?? '-'}</span>
                                </div>
                                ) : null}
                            </div>
                        )}
                    </Card>
                ))
             ) : <p className="text-muted-foreground text-center">Recent game results not available.</p>
            }
          </CardContent>
        </Card>
        
        <Card className="mb-8 shadow-lg">
            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChart3 className="text-primary"/>Team Statistics</CardTitle></CardHeader>
            <CardContent className="text-center py-10">
                <p className="text-muted-foreground">Detailed team statistics for the season coming soon!</p>
            </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <Link href="/"> <Button variant="outline">Back to Home</Button> </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

