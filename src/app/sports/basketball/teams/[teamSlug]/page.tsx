
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { basketballTeams, supportedSports, mockBasketballPlayers, mockBasketballGames } from '@/lib/mockData';
import type { TeamApp, SportDefinition, BasketballPlayerApp, BasketballGameResultApp, ManagedEventApp, MatchApp } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Users, Trophy, ChevronLeft, ShieldHalf, Star, CalendarClock, BarChart3, Shirt, UserCircle, ExternalLink, X, Gamepad2, Tv, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { getBasketballTeamDetails, getBasketballRoster, getBasketballGamesForTeam } from '@/services/apiSportsService';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { BettingModal } from '@/components/BettingModal';


const CURRENT_BASKETBALL_SEASON_STRING = "2023-2024";
const MAX_GAME_RESULTS_BASKETBALL = 10;

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
  const router = useRouter();
  const { currentUser } = useAuth();

  const [mockTeamData, setMockTeamData] = useState<TeamApp | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamApp | null>(null);
  const [roster, setRoster] = useState<BasketballPlayerApp[]>([]);
  const [gameResults, setGameResults] = useState<BasketballGameResultApp[]>([]);
  const [managedEvents, setManagedEvents] = useState<ManagedEventApp[]>([]);


  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const [isLoadingManagedEvents, setIsLoadingManagedEvents] = useState(true);
  const [isRefreshingManagedEvents, setIsRefreshingManagedEvents] = useState(false);


  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [selectedPlayerForBio, setSelectedPlayerForBio] = useState<BasketballPlayerApp | null>(null);
  const [playerBioContent, setPlayerBioContent] = useState<string | null>(null);
  const [isPlayerBioLoading, setIsPlayerBioLoading] = useState<boolean>(false);
  const [playerBioError, setPlayerBioError] = useState<string | null>(null);
  
  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false);
  const [selectedEventForBetting, setSelectedEventForBetting] = useState<ManagedEventApp | MatchApp | null>(null);
  const [selectedTeamForBetting, setSelectedTeamForBetting] = useState<TeamApp | null>(null);


  const currentSport = supportedSports.find(s => s.slug === sportSlug) as SportDefinition;

  const fetchManagedEventsForTeam = useCallback(async (teamId: number) => {
    setIsLoadingManagedEvents(true);
    try {
      const response = await fetch(`/api/sport-events/${sportSlug}?teamId=${teamId}&status=upcoming&status=live&status=paused&status=finished&status=cancelled`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error from fetching managed events' }));
        throw new Error(errorData.error || 'Failed to fetch managed events for team');
      }
      const data: ManagedEventApp[] = await response.json();
      setManagedEvents(data);
    } catch (error) {
      console.error(`Error fetching managed events for team ${teamId}:`, error);
      toast({ variant: 'destructive', title: 'Error Loading Custom Events', description: (error as Error).message });
      setManagedEvents([]);
    }
    setIsLoadingManagedEvents(false);
    setIsRefreshingManagedEvents(false);
  }, [sportSlug, toast]);


  const fetchBasketballData = useCallback(async (teamId: number, teamName: string) => {
    setIsLoadingData(true);
    setIsLoadingRoster(true);
    setIsLoadingResults(true);
    setIsAiLoading(true);
    
    fetchManagedEventsForTeam(teamId);

    try {
      const [detailsResult, rosterResult, gamesResult, summaryResult] = await Promise.allSettled([
        getBasketballTeamDetails(teamId, currentSport.apiBaseUrl),
        getBasketballRoster(teamId, CURRENT_BASKETBALL_SEASON_STRING, currentSport.apiBaseUrl),
        getBasketballGamesForTeam(teamId, CURRENT_BASKETBALL_SEASON_STRING, currentSport.apiBaseUrl, MAX_GAME_RESULTS_BASKETBALL),
        getTeamInfo({ entityName: teamName, entityType: 'team', contextName: 'Basketball' }),
      ]);

      if (detailsResult.status === 'fulfilled' && detailsResult.value) {
        setTeamDetails(detailsResult.value);
      } else {
        console.warn("Could not fetch live Basketball team details, using mock. Reason:", detailsResult.status === 'rejected' ? detailsResult.reason : 'No data returned');
        setTeamDetails(basketballTeams.find(t => t.id === teamId) || null);
        toast({ variant: 'default', title: 'Info', description: 'Could not load live team details. Displaying basic info.' });
      }
      setIsLoadingData(false);

      if (rosterResult.status === 'fulfilled' && rosterResult.value && rosterResult.value.length > 0) {
          setRoster(rosterResult.value);
      } else {
        console.info(`No live basketball roster found for team ${teamId}, season ${CURRENT_BASKETBALL_SEASON_STRING}. Falling back to mock data if available. Reason: ${rosterResult.status === 'rejected' ? rosterResult.reason : 'No data returned'}`);
        const mockRosterForTeam = mockBasketballPlayers.filter(p => p.name?.toLowerCase().includes(teamName.split(' ')[0].toLowerCase() || "____"));
        setRoster(mockRosterForTeam);
        toast({ variant: 'default', title: 'Info', description: (mockRosterForTeam.length > 0 ? 'No live roster data found, showing mock data.' : 'No live or mock roster data found for this team.')});
      }
      setIsLoadingRoster(false);

      if (gamesResult.status === 'fulfilled' && gamesResult.value && gamesResult.value.length > 0) {
          setGameResults(gamesResult.value);
      } else {
        console.info(`No live basketball game results found for team ${teamId}, season ${CURRENT_BASKETBALL_SEASON_STRING}. Falling back to mock data. Reason: ${gamesResult.status === 'rejected' ? gamesResult.reason : 'No data returned'}`);
        const mockGamesForTeam = mockBasketballGames.filter(g => g.homeTeam.id === teamId || g.awayTeam.id === teamId);
        setGameResults(mockGamesForTeam);
        toast({ variant: 'default', title: 'Info', description: (mockGamesForTeam.length > 0 ? 'No live game results found, showing mock data.' : 'No live or mock game results found.') });
      }
      setIsLoadingResults(false);

      if (summaryResult.status === 'fulfilled' && summaryResult.value) {
        setAiSummary(summaryResult.value.response);
      } else {
        console.error("Error fetching AI summary for Basketball team:", summaryResult.status === 'rejected' ? summaryResult.reason : "AI summary call succeeded but returned no data.");
        setAiError("Failed to load AI summary.");
        setAiSummary(`Could not load summary for ${teamName}.`);
      }
      
    } catch (error) {
      console.error("Overall error fetching Basketball page data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load all Basketball page data.' });
       const mockRosterForTeam = mockBasketballPlayers.filter(p => p.name?.toLowerCase().includes(teamName.split(' ')[0].toLowerCase() || "____"));
       setRoster(mockRosterForTeam);
       const mockGamesForTeam = mockBasketballGames.filter(g => g.homeTeam.id === teamId || g.awayTeam.id === teamId);
       setGameResults(mockGamesForTeam);
    } finally {
      setIsAiLoading(false);
    }
  }, [currentSport.apiBaseUrl, toast, fetchManagedEventsForTeam]);


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
         setIsLoadingManagedEvents(false);
      }
    }
  }, [teamSlug, fetchBasketballData]);
  
  const handleRefreshManagedEvents = () => {
    if (mockTeamData || teamDetails) {
        setIsRefreshingManagedEvents(true);
        fetchManagedEventsForTeam((teamDetails || mockTeamData)!.id);
    }
  };

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

  const handlePlayerCardClick = async (player: BasketballPlayerApp) => {
    if (!player || !player.name) return;
    setSelectedPlayerForBio(player);
    setPlayerBioContent(null);
    setPlayerBioError(null);
    setIsPlayerBioLoading(true);

    try {
      const teamNameContext = teamDetails?.name || mockTeamData?.name || 'leur équipe actuelle';
      const input: TeamInfoInput = {
        entityName: player.name,
        entityType: 'player',
        contextName: teamNameContext,
        question: `Fournis une biographie concise pour le joueur de basketball ${player.name}, en mentionnant son équipe actuelle ${teamNameContext}, ses faits marquants (comme le collège, les années pro, les distinctions) et son style de jeu si possible.`,
      };
      const result = await getTeamInfo(input);
      setPlayerBioContent(result.response);
    } catch (error) {
      console.error("Error fetching player biography:", error);
      setPlayerBioError("Désolé, je n'ai pas pu récupérer la biographie de ce joueur pour le moment.");
      setPlayerBioContent(null);
    }
    setIsPlayerBioLoading(false);
  };
  
  const handleOpenBettingModal = (event: ManagedEventApp | MatchApp, team: TeamApp) => {
    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'You need to be logged in to place a bet.',
        action: <Button onClick={() => router.push('/login')}>Log In</Button>,
      });
      return;
    }
    setSelectedEventForBetting(event);
    setSelectedTeamForBetting(team);
    setIsBettingModalOpen(true);
  };

  const handleCloseBettingModal = () => {
    setIsBettingModalOpen(false);
    setSelectedEventForBetting(null);
    setSelectedTeamForBetting(null);
    if(mockTeamData || teamDetails) {
      fetchManagedEventsForTeam((teamDetails || mockTeamData)!.id);
    }
  };

  const getStatusColor = (statusShort: string | undefined) => {
    if (!statusShort) return 'text-muted-foreground';
    if (statusShort === 'live') return 'text-red-500';
    if (statusShort === 'finished') return 'text-gray-500';
    if (statusShort === 'upcoming') return 'text-green-500';
    if (['paused', 'cancelled'].includes(statusShort)) return 'text-yellow-600';
    if (['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'HT'].includes(statusShort)) return 'text-red-500'; 
    if (statusShort === 'FT' || statusShort === 'AOT') return 'text-gray-500'; 
    if (statusShort === 'NS') return 'text-green-500'; 
    return 'text-muted-foreground';
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
  const entityDetailsToDisplay = teamDetails || mockTeamData;

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
          <div className="relative h-56 md:h-72 w-full">
            {displayTeamLogo ? (
              <Image 
                src={displayTeamLogo} 
                alt={`${displayTeamName} Logo`} 
                fill={true} 
                style={{ objectFit: 'contain', padding: '1rem' }}
                className="bg-muted" 
                data-ai-hint={`${displayTeamName} logo large`} 
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-gray-500"> <Star size={64} /> </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg"> {displayTeamName} </h1>
               {entityDetailsToDisplay?.conference && <p className="text-lg text-white/90 drop-shadow-sm">{entityDetailsToDisplay.conference} Conference</p>}
               {entityDetailsToDisplay?.division && <p className="text-md text-white/80 drop-shadow-sm">{entityDetailsToDisplay.division} Division</p>}
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
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Users className="text-primary"/>Team Roster ({CURRENT_BASKETBALL_SEASON_STRING})
            </CardTitle>
            <CardDescription>Cliquez sur un joueur pour voir sa biographie. L'API ne fournit pas les photos réelles des joueurs de basketball pour cet endpoint. Des images placeholder sont utilisées.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRoster ? <div className="flex justify-center py-5"><LoadingSpinner/></div> :
             roster.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {roster.map((player) => (
                  <Card
                    key={player.id || player.name}
                    className="p-3 bg-card shadow-sm hover:shadow-md transition-shadow text-center cursor-pointer"
                    onClick={() => handlePlayerCardClick(player)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handlePlayerCardClick(player)}
                  >
                     <div className="relative w-24 h-24 mx-auto mb-2">
                        {player.photoUrl && player.photoUrl.startsWith('https://placehold.co') ? (
                             <Image src={player.photoUrl} alt={player.name || 'Player'} fill={true} style={{objectFit:"contain"}} className="rounded-full shadow-md" data-ai-hint="player placeholder" sizes="96px"/>
                        ) : (
                            <div className="w-full h-full bg-muted rounded-full flex items-center justify-center text-3xl font-bold text-muted-foreground" data-ai-hint="player initials">
                                {(player.firstName?.charAt(0) || '') + (player.lastName?.charAt(0) || '') || '?'}
                            </div>
                        )}
                    </div>
                    <p className="font-semibold text-md text-foreground">{player.name}</p>
                    {player.number != null && <p className="text-sm text-primary font-bold">#{player.number}</p>}
                    {player.position && <p className="text-xs text-muted-foreground">{player.position}</p>}
                    {player.heightMeters && <p className="text-xs text-muted-foreground">H: {player.heightMeters}m</p>}
                    {player.college && <p className="text-xs text-muted-foreground">College: {player.college}</p>}
                  </Card>
                ))}
              </div>
             ) : <p className="text-muted-foreground text-center py-4">Roster information for {CURRENT_BASKETBALL_SEASON_STRING} not available.</p>
            }
          </CardContent>
        </Card>

        {selectedPlayerForBio && (
          <Dialog open={!!selectedPlayerForBio} onOpenChange={(open) => !open && setSelectedPlayerForBio(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader className="flex flex-row items-start gap-4 pr-10">
                  <div className="relative w-20 h-20 shrink-0 mt-1">
                    {selectedPlayerForBio.photoUrl && selectedPlayerForBio.photoUrl.startsWith('https://placehold.co') ? (
                        <Image src={selectedPlayerForBio.photoUrl} alt={selectedPlayerForBio.name || 'Player'} fill={true} style={{objectFit:"contain"}} className="rounded-full shadow-md" data-ai-hint="selected player placeholder" sizes="80px"/>
                    ) : (
                        <div className="w-full h-full bg-muted rounded-full flex items-center justify-center text-3xl font-bold text-muted-foreground" data-ai-hint="selected player initials">
                            {(selectedPlayerForBio.firstName?.charAt(0) || '') + (selectedPlayerForBio.lastName?.charAt(0) || '') || '?'}
                        </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-headline mb-1">{selectedPlayerForBio.name || "Player Biography"}</DialogTitle>
                    {selectedPlayerForBio.position && <p className="text-sm text-muted-foreground">Position: {selectedPlayerForBio.position}</p>}
                    {selectedPlayerForBio.age != null && <p className="text-sm text-muted-foreground">Age: {selectedPlayerForBio.age}</p>}
                  </div>
                </DialogHeader>
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                {isPlayerBioLoading && <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>}
                {playerBioError && <p className="text-destructive text-center">{playerBioError}</p>}
                {playerBioContent && !isPlayerBioLoading && !playerBioError && (
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(playerBioContent) }} />
                )}
                {!isPlayerBioLoading && !playerBioContent && !playerBioError && (
                  <p className="text-muted-foreground text-center">Aucune biographie disponible pour ce joueur pour le moment.</p>
                )}
              </div>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="absolute right-4 top-4 p-1.5 h-auto">
                  <X size={18} />
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        )}

        <Card className="mb-8 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex-1">
                    <CardTitle className="font-headline flex items-center gap-2"><Gamepad2 className="text-primary"/>Custom Events for {displayTeamName}</CardTitle>
                    <CardDescription>Upcoming, live, paused, and recently finished/cancelled custom events involving this team.</CardDescription>
                </div>
                 <Button onClick={handleRefreshManagedEvents} variant="outline" size="sm" disabled={isRefreshingManagedEvents || !entityDetailsToDisplay}>
                    <RefreshCw size={14} className={cn("mr-2", isRefreshingManagedEvents && "animate-spin")} />
                    {isRefreshingManagedEvents ? 'Refreshing...' : 'Refresh'}
                </Button>
            </CardHeader>
          <CardContent>
            {isLoadingManagedEvents && !isRefreshingManagedEvents ? <div className="flex justify-center py-5"><LoadingSpinner/></div> :
              managedEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {managedEvents.map(event => {
                    const {date, time} = formatMatchDateTime(event.eventTime);
                    return (
                      <Card key={event.id} className="shadow-md">
                        <CardHeader>
                            <CardTitle className="font-headline text-lg">{event.name}</CardTitle>
                             <CardDescription className="flex items-center gap-1 text-xs">
                                <Tv size={14} className={cn(getStatusColor(event.status))} />
                                <span className={cn("font-medium", getStatusColor(event.status))}>
                                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                                {event.elapsedTime != null && (event.status === 'live') && 
                                  <span className="text-xs text-red-500">({event.elapsedTime}')</span>
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs">
                            <p><Users size={14} className="inline mr-1 text-primary"/>{event.homeTeam.name} vs {event.awayTeam.name}</p>
                            <p><CalendarClock size={14} className="inline mr-1 text-primary"/>{date} at {time}</p>
                             {event.status === 'live' && event.homeScore != null && event.awayScore != null && (
                                <p className="font-bold text-md text-center text-primary py-1">
                                    {event.homeScore} - {event.awayScore}
                                </p>
                            )}
                            {event.status === 'finished' && (
                                <p className="font-bold text-md text-center text-foreground py-1">
                                    Final: {event.homeScore} - {event.awayScore}
                                    {event.winningTeamId === event.homeTeam.id && ` (${event.homeTeam.name} won)`}
                                    {event.winningTeamId === event.awayTeam.id && ` (${event.awayTeam.name} won)`}
                                    {event.winningTeamId == null && !event.winningTeamId && " (Draw)"}
                                </p>
                            )}
                            {event.status === 'cancelled' && (
                                 <p className="font-bold text-md text-center text-destructive py-1">Event Cancelled</p>
                            )}
                        </CardContent>
                        {(event.status === 'upcoming' || event.status === 'live' || event.status === 'paused') && currentUser && (
                            <CardContent className="flex flex-col sm:flex-row gap-2 pt-0">
                                <Button size="sm" className="flex-1" variant="outline" onClick={() => handleOpenBettingModal(event, event.homeTeam)}>
                                    Bet on {event.homeTeam.name}
                                </Button>
                                <Button size="sm" className="flex-1" variant="outline" onClick={() => handleOpenBettingModal(event, event.awayTeam)}>
                                    Bet on {event.awayTeam.name}
                                </Button>
                            </CardContent>
                        )}
                        {(event.status === 'upcoming' || event.status === 'live' || event.status === 'paused') && !currentUser && (
                             <CardContent className="pt-0">
                                <Button className="w-full" size="sm" variant="outline" onClick={() => router.push('/login')}>Log in to Bet</Button>
                            </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              ) : <p className="text-muted-foreground text-center py-4">No custom events involving {displayTeamName} at the moment.</p>
            }
          </CardContent>
        </Card>


        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Recent Game Results (API)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isLoadingResults ? <div className="flex justify-center py-5"><LoadingSpinner/></div> :
             gameResults.length > 0 ? (
                gameResults.map(game => (
                    <Card key={game.id} className="p-3 bg-card shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">{formatMatchDateTime(game.matchTime).date}</span>
                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                                getStatusColor(game.statusShort)
                            )}>{game.statusLong}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image src={game.homeTeam.logoUrl || 'https://placehold.co/24x24.png?text=H'} alt={game.homeTeam.name} width={24} height={24} style={{objectFit:"contain"}} data-ai-hint={`${game.homeTeam.name} logo small`}/>
                                <span className="font-medium text-sm text-foreground">{game.homeTeam.name}</span>
                            </div>
                            <span className={`font-bold text-lg ${game.homeScore != null && game.awayScore != null && game.homeScore > game.awayScore ? 'text-primary' : 'text-foreground'}`}>{game.homeScore ?? '-'}</span>
                        </div>
                         <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-2">
                                <Image src={game.awayTeam.logoUrl || 'https://placehold.co/24x24.png?text=A'} alt={game.awayTeam.name} width={24} height={24} style={{objectFit:"contain"}} data-ai-hint={`${game.awayTeam.name} logo small`}/>
                                <span className="font-medium text-sm text-foreground">{game.awayTeam.name}</span>
                            </div>
                            <span className={`font-bold text-lg ${game.homeScore != null && game.awayScore != null && game.awayScore > game.homeScore ? 'text-primary' : 'text-foreground'}`}>{game.awayScore ?? '-'}</span>
                        </div>
                        {game.league.name && <p className="text-xs text-muted-foreground text-center mt-1">{game.league.name} - {game.league.season}</p>}
                        {(game.homeQuarterScores?.length || game.awayQuarterScores?.length) && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                <div className="flex justify-around font-semibold items-center">
                                    <span className="w-8"></span>
                                    {Array.from({ length: Math.max(game.homeQuarterScores?.length || 0, game.awayQuarterScores?.length || 0, 4) }, (_, i) => (
                                        <span key={`q${i+1}`} className="w-6 text-center">Q{i+1}</span>
                                    ))}
                                    {(game.homeOvertimeScore != null || game.awayOvertimeScore != null) && <span className="w-6 text-center">OT</span>}
                                </div>
                                <div className="flex justify-around items-center">
                                    <span className="font-semibold w-8 text-left truncate" title={game.homeTeam.name}>{game.homeTeam.name.substring(0,3).toUpperCase()}</span>
                                    {Array.from({ length: Math.max(game.homeQuarterScores?.length || 0, 4) }, (_, i) => (
                                        <span key={`hq${i+1}`} className="w-6 text-center">{game.homeQuarterScores?.[i] ?? '-'}</span>
                                    ))}
                                    {game.homeOvertimeScore != null && <span className="w-6 text-center">{game.homeOvertimeScore}</span>}
                                     {(game.homeOvertimeScore == null && game.awayOvertimeScore != null) && <span className="w-6 text-center">-</span>}

                                </div>
                                 <div className="flex justify-around items-center">
                                    <span className="font-semibold w-8 text-left truncate" title={game.awayTeam.name}>{game.awayTeam.name.substring(0,3).toUpperCase()}</span>
                                    {Array.from({ length: Math.max(game.awayQuarterScores?.length || 0, 4) }, (_, i) => (
                                        <span key={`aq${i+1}`} className="w-6 text-center">{game.awayQuarterScores?.[i] ?? '-'}</span>
                                    ))}
                                    {game.awayOvertimeScore != null && <span className="w-6 text-center">{game.awayOvertimeScore}</span>}
                                    {(game.awayOvertimeScore == null && game.homeOvertimeScore != null) && <span className="w-6 text-center">-</span>}
                                </div>
                            </div>
                        )}
                    </Card>
                ))
             ) : <p className="text-muted-foreground text-center py-4">Recent game results not available.</p>
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
       {selectedEventForBetting && selectedTeamForBetting && currentSport && (
        <BettingModal
          isOpen={isBettingModalOpen}
          onClose={handleCloseBettingModal}
          eventData={selectedEventForBetting}
          eventSource="custom" 
          teamToBetOn={selectedTeamForBetting}
          currentUser={currentUser}
          sportSlug={currentSport.slug}
        />
      )}
      <Footer />
    </div>
  );
}
