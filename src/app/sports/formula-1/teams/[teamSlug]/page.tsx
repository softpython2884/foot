
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { formula1Entities, supportedSports, mockF1Drivers, mockF1RaceResults } from '@/lib/mockData';
import type { TeamApp, SportDefinition, F1DriverApp, F1RaceResultApp, ManagedEventApp, MatchApp } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Users, Trophy, ChevronLeft, Settings, CalendarClock, Rocket, Flag, BarChartHorizontalBig, Car, Building, Info, UserCircle, ExternalLink, X, Gamepad2, Tv, Clock, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { getF1ConstructorDetails, getF1DriversForSeason, getF1RaceResultsForSeason } from '@/services/apiSportsService';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { BettingModal } from '@/components/BettingModal';

const CURRENT_F1_SEASON = 2024;
const MAX_RACE_RESULTS_F1 = 5;

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

export default function Formula1TeamProfilePage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const sportSlug = 'formula-1';
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();

  const [mockEntityData, setMockEntityData] = useState<TeamApp | null>(null);
  const [constructorDetails, setConstructorDetails] = useState<TeamApp | null>(null);
  const [drivers, setDrivers] = useState<F1DriverApp[]>([]);
  const [raceResults, setRaceResults] = useState<F1RaceResultApp[]>([]);
  const [managedEvents, setManagedEvents] = useState<ManagedEventApp[]>([]);


  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const [isLoadingManagedEvents, setIsLoadingManagedEvents] = useState(true);
  const [isRefreshingManagedEvents, setIsRefreshingManagedEvents] = useState(false);


  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [selectedDriverForBio, setSelectedDriverForBio] = useState<F1DriverApp | null>(null);
  const [driverBioContent, setDriverBioContent] = useState<string | null>(null);
  const [isDriverBioLoading, setIsDriverBioLoading] = useState<boolean>(false);
  const [driverBioError, setDriverBioError] = useState<string | null>(null);
  
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

  const fetchF1Data = useCallback(async (entityId: number, entityName: string) => {
    setIsLoadingData(true);
    setIsLoadingDrivers(true);
    setIsLoadingResults(true);
    setIsAiLoading(true);
    
    fetchManagedEventsForTeam(entityId);

    try {
      const [detailsResult, driversResult, racesResult, summaryResult] = await Promise.allSettled([
        getF1ConstructorDetails(entityId, currentSport.apiBaseUrl),
        getF1DriversForSeason(entityId, CURRENT_F1_SEASON, currentSport.apiBaseUrl),
        getF1RaceResultsForSeason(entityId, CURRENT_F1_SEASON, currentSport.apiBaseUrl, MAX_RACE_RESULTS_F1),
        getTeamInfo({ entityName: entityName, entityType: 'team', contextName: 'Formule 1' }),
      ]);

      if (detailsResult.status === 'fulfilled' && detailsResult.value) {
        setConstructorDetails(detailsResult.value);
      } else {
        console.warn("Could not fetch live F1 constructor details, using mock. Reason:", detailsResult.status === 'rejected' ? detailsResult.reason : 'No data returned');
        setConstructorDetails(formula1Entities.find(e => e.id === entityId) || null);
        toast({ variant: 'default', title: 'Info', description: 'Could not load live constructor details. Displaying basic info.' });
      }
      setIsLoadingData(false);

      if (driversResult.status === 'fulfilled' && driversResult.value && driversResult.value.length > 0) {
          setDrivers(driversResult.value);
      } else {
        console.info(`No live F1 drivers found for constructor ${entityId}, season ${CURRENT_F1_SEASON}. Falling back to mock data if available. Reason: ${driversResult.status === 'rejected' ? driversResult.reason : 'No data returned'}`);
        const mockDriversForTeam = mockF1Drivers.filter(d => d.name?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase()));
        setDrivers(mockDriversForTeam);
        toast({ variant: 'default', title: 'Info', description: (mockDriversForTeam.length > 0 ? 'No live driver data found, showing mock data.' : 'No live or mock driver data found for this team.')});
      }
      setIsLoadingDrivers(false);

      if (racesResult.status === 'fulfilled' && racesResult.value && racesResult.value.length > 0) {
          setRaceResults(racesResult.value);
      } else {
        console.info(`No live F1 race results found for constructor ${entityId}, season ${CURRENT_F1_SEASON}. Falling back to mock data. Reason: ${racesResult.status === 'rejected' ? racesResult.reason : 'No data returned'}`);
        const mockResultsForTeam = mockF1RaceResults.filter(r =>
            (drivers.length > 0 ? r.driverResults.some(dr => drivers.some(d => d.name === dr.driverName)) : false) || 
            r.driverResults.some(dr => mockF1Drivers.find(md => md.name === dr.driverName && md.name?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase())))
        );
        setRaceResults(mockResultsForTeam);
        toast({ variant: 'default', title: 'Info', description: (mockResultsForTeam.length > 0 ? 'No live race results found, showing mock data.' : 'No live or mock race results found.') });
      }
      setIsLoadingResults(false);

      if (summaryResult.status === 'fulfilled' && summaryResult.value) {
        setAiSummary(summaryResult.value.response);
      } else {
        console.error("Error fetching AI summary for F1 entity:", summaryResult.status === 'rejected' ? summaryResult.reason : "AI summary call succeeded but returned no data.");
        setAiError("Failed to load AI summary.");
        setAiSummary(`Could not load summary for ${entityName}.`);
      }
      
    } catch (error) {
      console.error("Overall error fetching F1 page data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load all F1 page data.' });
       const mockDriversForTeam = mockF1Drivers.filter(d => d.name?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase()));
       setDrivers(mockDriversForTeam);
       const mockResultsForTeam = mockF1RaceResults.filter(r => r.driverResults.some(dr => dr.driverName?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase())));
       setRaceResults(mockResultsForTeam);
    } finally {
      setIsAiLoading(false);
    }
  }, [currentSport.apiBaseUrl, toast, drivers, fetchManagedEventsForTeam]);


  useEffect(() => {
    if (teamSlug) {
      const foundEntity = formula1Entities.find((e) => e.slug === teamSlug);
      setMockEntityData(foundEntity || null);
      if (foundEntity) {
        fetchF1Data(foundEntity.id, foundEntity.name);
      } else {
         setIsLoadingData(false);
         setIsLoadingDrivers(false);
         setIsLoadingResults(false);
         setIsAiLoading(false);
         setIsLoadingManagedEvents(false);
      }
    }
  }, [teamSlug, fetchF1Data]);

  const handleRefreshManagedEvents = () => {
    if (mockEntityData || constructorDetails) {
        setIsRefreshingManagedEvents(true);
        fetchManagedEventsForTeam((constructorDetails || mockEntityData)!.id);
    }
  };

  const handleAskAi = async () => {
    const entityNameToUse = constructorDetails?.name || mockEntityData?.name;
    if (!entityNameToUse || !userQuestion.trim()) return;
    setIsAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    try {
      const input: TeamInfoInput = { entityName: entityNameToUse, entityType: 'team', question: userQuestion, contextName: "Formule 1" };
      const result = await getTeamInfo(input);
      setAiAnswer(result.response);
    } catch (error) {
      console.error("Error asking AI for F1 entity:", error);
      setAiError("Failed to get answer from AI. Please try again later.");
      setAiAnswer("Sorry, I couldn't answer that question right now.");
    }
    setIsAiLoading(false);
  };

  const handleDriverCardClick = async (driver: F1DriverApp) => {
    if (!driver || !driver.name) return;
    setSelectedDriverForBio(driver);
    setDriverBioContent(null);
    setDriverBioError(null);
    setIsDriverBioLoading(true);

    try {
      const teamNameContext = constructorDetails?.name || mockEntityData?.name || 'leur écurie actuelle';
      const input: TeamInfoInput = {
        entityName: driver.name,
        entityType: 'player',
        contextName: teamNameContext,
        question: `Fournis une biographie concise pour le pilote de Formule 1 ${driver.name}, en mentionnant son écurie actuelle ${teamNameContext}, ses faits marquants (comme son numéro ${driver.number || 'N/A'}, sa nationalité ${driver.nationality || 'N/A'}) et son style de pilotage si possible.`,
      };
      const result = await getTeamInfo(input);
      setDriverBioContent(result.response);
    } catch (error) {
      console.error("Error fetching driver biography:", error);
      setDriverBioError("Désolé, je n'ai pas pu récupérer la biographie de ce pilote pour le moment.");
      setDriverBioContent(null);
    }
    setIsDriverBioLoading(false);
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
     if(mockEntityData || constructorDetails) {
      fetchManagedEventsForTeam((constructorDetails || mockEntityData)!.id);
    }
  };
  
  const getStatusColor = (statusShort: string | undefined) => {
    if (!statusShort) return 'text-muted-foreground';
    if (statusShort === 'Live' || statusShort === 'live') return 'text-red-500';
    if (statusShort === 'Finished' || statusShort === 'finished') return 'text-gray-500';
    if (statusShort === 'Scheduled' || statusShort === 'upcoming') return 'text-green-500';
    if (['Postponed', 'Cancelled', 'paused', 'cancelled'].includes(statusShort)) return 'text-yellow-600';
    return 'text-muted-foreground';
  };


  if (isLoadingData && !mockEntityData) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center"> <LoadingSpinner size="lg" /> </main>
        <Footer />
      </div>
    );
  }

  if (!mockEntityData && !constructorDetails && !isLoadingData) {
    notFound(); return null;
  }

  const displayEntityName = constructorDetails?.name || mockEntityData?.name || 'F1 Entity Profile';
  const displayEntityLogo = constructorDetails?.logoUrl || mockEntityData?.logoUrl;
  const entityDetailsToDisplay = constructorDetails || mockEntityData;


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/sports/${sportSlug}/teams`}> <ChevronLeft size={18} className="mr-2" /> Back to {currentSport.name} Entities </Link>
          </Button>
        </div>

        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-56 md:h-72 w-full">
            {displayEntityLogo ? (
              <Image 
                src={displayEntityLogo} 
                alt={`${displayEntityName} Logo`} 
                fill={true} 
                style={{ objectFit: 'contain', padding: '1rem' }}
                className="bg-muted"
                data-ai-hint={`${displayEntityName} logo large`} 
                priority 
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-gray-500"> <Rocket size={64} /> </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg"> {displayEntityName} </h1>
               {entityDetailsToDisplay?.base && <p className="text-lg text-white/90 drop-shadow-sm flex items-center gap-2"><Building size={18}/> {entityDetailsToDisplay.base}</p>}
            </div>
          </div>
        </Card>


        <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary" /> AI Summary & Info</CardTitle>
                <CardDescription> General information and answers about {displayEntityName}. </CardDescription>
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
                  <Textarea placeholder={`Ask a question about ${displayEntityName}...`} value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} className="resize-none" />
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
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Info className="text-primary"/>Constructor Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {isLoadingData && !constructorDetails ? <div className="md:col-span-2 flex justify-center py-5"><LoadingSpinner/></div> :
            <>
              {entityDetailsToDisplay?.director && <div className="flex items-center gap-2"><UserCircle size={16} className="text-muted-foreground"/><strong>Director:</strong> {entityDetailsToDisplay.director}</div>}
              {entityDetailsToDisplay?.technicalManager && <div className="flex items-center gap-2"><UserCog size={16} className="text-muted-foreground"/><strong>Technical Manager:</strong> {entityDetailsToDisplay.technicalManager}</div>}
              {entityDetailsToDisplay?.chassis && <div className="flex items-center gap-2"><Car size={16} className="text-muted-foreground"/><strong>Chassis ({CURRENT_F1_SEASON}):</strong> {entityDetailsToDisplay.chassis}</div>}
              {entityDetailsToDisplay?.engine && <div className="flex items-center gap-2"><Settings size={16} className="text-muted-foreground"/><strong>Engine ({CURRENT_F1_SEASON}):</strong> {entityDetailsToDisplay.engine}</div>}
              {entityDetailsToDisplay?.championships != null && <div className="flex items-center gap-2"><Trophy size={16} className="text-muted-foreground"/><strong>World Championships:</strong> {entityDetailsToDisplay.championships}</div>}
              {entityDetailsToDisplay?.firstTeamEntry != null && <div className="flex items-center gap-2"><CalendarClock size={16} className="text-muted-foreground"/><strong>First Entry:</strong> {entityDetailsToDisplay.firstTeamEntry}</div>}
              {entityDetailsToDisplay?.polePositions != null && <div className="flex items-center gap-2"><BarChartHorizontalBig size={16} className="text-muted-foreground"/><strong>Pole Positions:</strong> {entityDetailsToDisplay.polePositions}</div>}
              {entityDetailsToDisplay?.fastestLaps != null && <div className="flex items-center gap-2"><Clock size={16} className="text-muted-foreground"/><strong>Fastest Laps:</strong> {entityDetailsToDisplay.fastestLaps}</div>}
              {!isLoadingData && (!entityDetailsToDisplay?.director && !entityDetailsToDisplay?.base && !constructorDetails) && <p className="text-muted-foreground md:col-span-2 text-center py-2">Detailed constructor information not available.</p>}
            </>
            }
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Users className="text-primary"/>Current Drivers ({CURRENT_F1_SEASON})</CardTitle>
            <CardDescription>Cliquez sur un pilote pour voir sa biographie.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDrivers ? <div className="flex justify-center py-5"><LoadingSpinner/></div> :
             drivers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {drivers.map(driver => (
                  <Card
                    key={driver.id || driver.name}
                    className="p-4 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleDriverCardClick(driver)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleDriverCardClick(driver)}
                  >
                    <div className="flex items-center gap-4">
                      <Image src={driver.photoUrl || 'https://placehold.co/80x80.png?text=F1'} alt={driver.name || 'Driver'} width={80} height={80} className="rounded-full shadow-md" style={{objectFit: 'cover'}} data-ai-hint={`${driver.name} portrait`} sizes="80px"/>
                      <div>
                        <h4 className="text-lg font-semibold">{driver.name} {driver.number && <span className="text-primary font-bold">#{driver.number}</span>}</h4>
                        {driver.nationality && <p className="text-xs text-muted-foreground flex items-center gap-1"><Flag size={14}/>{driver.nationality}</p>}
                        {driver.abbr && <p className="text-xs text-muted-foreground">Abbr: {driver.abbr}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
             ) : <p className="text-muted-foreground text-center py-4">Driver information for {CURRENT_F1_SEASON} not available or team had no drivers listed in rankings for this season.</p>
            }
          </CardContent>
        </Card>

        {selectedDriverForBio && (
          <Dialog open={!!selectedDriverForBio} onOpenChange={(open) => !open && setSelectedDriverForBio(null)}>
            <DialogContent className="sm:max-w-lg">
               <DialogHeader className="flex flex-row items-start gap-4 pr-10">
                  {selectedDriverForBio.photoUrl ? (
                    <Image
                      src={selectedDriverForBio.photoUrl}
                      alt={selectedDriverForBio.name || 'Driver'}
                      width={80}
                      height={80}
                      className="rounded-lg shadow-md"
                      style={{objectFit: 'cover'}}
                      data-ai-hint="selected driver portrait"
                       sizes="80px"
                    />
                  ) : (
                    <UserCircle size={80} className="text-muted-foreground mt-1" />
                  )}
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-headline mb-1">{selectedDriverForBio.name || "Driver Biography"}</DialogTitle>
                    {selectedDriverForBio.nationality && <p className="text-sm text-muted-foreground">Nationality: {selectedDriverForBio.nationality}</p>}
                  </div>
                </DialogHeader>
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                {isDriverBioLoading && <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>}
                {driverBioError && <p className="text-destructive text-center">{driverBioError}</p>}
                {driverBioContent && !isDriverBioLoading && !driverBioError && (
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(driverBioContent) }} />
                )}
                {!isDriverBioLoading && !driverBioContent && !driverBioError && (
                  <p className="text-muted-foreground text-center">Aucune biographie disponible pour ce pilote pour le moment.</p>
                )}
              </div>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="absolute right-4 top-4 p-1.5 h-auto">
                   <X size={18}/>
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        )}

        <Card className="mb-8 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex-1">
                    <CardTitle className="font-headline flex items-center gap-2"><Gamepad2 className="text-primary"/>Custom Events for {displayEntityName}</CardTitle>
                    <CardDescription>Upcoming, live, paused, and recently finished/cancelled custom events involving this entity.</CardDescription>
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
              ) : <p className="text-muted-foreground text-center py-4">No custom events involving {displayEntityName} at the moment.</p>
            }
          </CardContent>
        </Card>


        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontalBig className="text-primary"/>Recent Race Results ({CURRENT_F1_SEASON}) (API)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoadingResults ? <div className="flex justify-center py-5"><LoadingSpinner/></div> :
             raceResults.length > 0 ? (
                raceResults.map(race => (
                    <Card key={race.id} className="p-4 bg-card shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="text-md font-semibold">{race.competitionName}</h4>
                                <p className="text-xs text-muted-foreground">{race.circuitName} - {formatMatchDateTime(race.date).date}</p>
                            </div>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                getStatusColor(race.status)
                            }`}>{race.status}</span>
                        </div>
                        {race.driverResults.length > 0 ? (
                            <ul className="space-y-1 text-xs">
                                {race.driverResults.map(dr => (
                                    <li key={`${race.id}-${dr.driverName}`} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            {dr.driverImage && <Image src={dr.driverImage} alt={dr.driverName} width={20} height={20} className="rounded-full" style={{objectFit:'cover'}} data-ai-hint={`${dr.driverName} small portrait`} sizes="20px"/>}
                                            <span>{dr.driverName} {dr.driverNumber && <span className="text-muted-foreground text-xs">#{dr.driverNumber}</span>}</span>
                                        </div>
                                        <span className="font-medium">P{dr.position || 'N/A'} {dr.points != null && `(${dr.points} pts)`}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-xs text-muted-foreground italic">No results for this constructor in this race.</p>}
                        {race.weather && <p className="text-xs text-muted-foreground mt-2">Weather: {race.weather}</p>}
                    </Card>
                ))
             ) : <p className="text-muted-foreground text-center py-4">Recent race results for {CURRENT_F1_SEASON} not available.</p>
            }
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Rocket className="text-primary"/>Car & Partners</CardTitle></CardHeader>
            <CardContent className="text-center py-10">
                <p className="text-muted-foreground">Detailed car specifications and partner information coming soon!</p>
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
