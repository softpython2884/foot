
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { formula1Entities, supportedSports, mockF1Drivers, mockF1RaceResults } from '@/lib/mockData';
import type { TeamApp, SportDefinition, F1DriverApp, F1RaceResultApp } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Users, Trophy, ChevronLeft, Settings, CalendarClock, Rocket, Flag, BarChartHorizontalBig, Car, Building, Info, UserCircle, ExternalLink, UserCog, Clock } from 'lucide-react'; // Added UserCog and Clock
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { getF1ConstructorDetails, getF1DriversForSeason, getF1RaceResultsForSeason } from '@/services/apiSportsService';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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

  const [mockEntityData, setMockEntityData] = useState<TeamApp | null>(null);
  const [constructorDetails, setConstructorDetails] = useState<TeamApp | null>(null);
  const [drivers, setDrivers] = useState<F1DriverApp[]>([]);
  const [raceResults, setRaceResults] = useState<F1RaceResultApp[]>([]);
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [selectedDriverForBio, setSelectedDriverForBio] = useState<F1DriverApp | null>(null);
  const [driverBioContent, setDriverBioContent] = useState<string | null>(null);
  const [isDriverBioLoading, setIsDriverBioLoading] = useState<boolean>(false);
  const [driverBioError, setDriverBioError] = useState<string | null>(null);


  const currentSport = supportedSports.find(s => s.slug === sportSlug) as SportDefinition;

  const fetchF1Data = useCallback(async (entityId: number, entityName: string) => {
    setIsLoadingData(true);
    setIsLoadingDrivers(true);
    setIsLoadingResults(true);
    setIsAiLoading(true); 

    try {
      const [detailsResult, driversResult, racesResult, summaryResult] = await Promise.allSettled([
        getF1ConstructorDetails(entityId, currentSport.apiBaseUrl),
        getF1DriversForSeason(entityId, CURRENT_F1_SEASON, currentSport.apiBaseUrl),
        getF1RaceResultsForSeason(entityId, CURRENT_F1_SEASON, currentSport.apiBaseUrl, MAX_RACE_RESULTS_F1),
        getTeamInfo({ entityName: entityName, entityType: 'team', contextName: 'Formule 1' })
      ]);

      if (detailsResult.status === 'fulfilled' && detailsResult.value) {
        setConstructorDetails(detailsResult.value);
      } else {
        console.error("Failed to fetch F1 constructor details:", detailsResult.status === 'rejected' ? detailsResult.reason : 'Constructor details API call succeeded but returned no data.');
        setConstructorDetails(formula1Entities.find(e => e.id === entityId) || null);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load live constructor details. Displaying basic info.' });
      }
      setIsLoadingData(false);

      if (driversResult.status === 'fulfilled') {
         if (driversResult.value && driversResult.value.length > 0) {
            setDrivers(driversResult.value);
         } else {
            console.info(`No live F1 drivers found for constructor ${entityId}, season ${CURRENT_F1_SEASON}. Falling back to mock data if available.`);
            const mockDriversForTeam = mockF1Drivers.filter(d => d.name?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase())); // Simple filter
            setDrivers(mockDriversForTeam);
            toast({ variant: 'default', title: 'Info', description: (mockDriversForTeam.length > 0 ? 'No live driver data found, showing mock data.' : 'No live or mock driver data found for this team.')});
         }
      } else { 
        console.error("Failed to fetch F1 drivers due to API error:", driversResult.reason);
        const mockDriversForTeam = mockF1Drivers.filter(d => d.name?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase()));
        setDrivers(mockDriversForTeam);
        toast({ variant: 'destructive', title: 'API Error', description: 'Could not load live F1 drivers due to an API error, showing mock data.' });
      }
      setIsLoadingDrivers(false);

      if (racesResult.status === 'fulfilled') {
        if (racesResult.value && racesResult.value.length > 0) {
            setRaceResults(racesResult.value);
        } else {
            console.info(`No live F1 race results found for constructor ${entityId}, season ${CURRENT_F1_SEASON}. Falling back to mock data.`);
            const mockResultsForTeam = mockF1RaceResults.filter(r => 
                r.driverResults.some(dr => 
                    drivers.some(d => d.name === dr.driverName) || // Check against fetched/mock drivers
                    mockF1Drivers.find(md => md.name === dr.driverName && md.name?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase())) // Fallback to check against general mock drivers for this team
                )
            );
            setRaceResults(mockResultsForTeam); 
            toast({ variant: 'default', title: 'Info', description: (mockResultsForTeam.length > 0 ? 'No live race results found, showing mock data.' : 'No live or mock race results found.') });
        }
      } else { 
        console.error("Failed to fetch F1 race results:", racesResult.status === 'rejected' ? racesResult.reason : 'No race data');
        setRaceResults(mockF1RaceResults.filter(r => r.driverResults.some(dr => dr.driverName?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase()))));
        toast({ variant: 'destructive', title: 'API Error', description: 'Could not load live F1 race results due to an API error, showing mock data.' });
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
  }, [currentSport.apiBaseUrl, toast, drivers]);


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
      }
    }
  }, [teamSlug, fetchF1Data]);

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
        question: `Fournis une biographie concise pour le pilote de Formule 1 ${driver.name}, en mentionnant son écurie actuelle ${teamNameContext}, ses faits marquants et son style de pilotage si possible.`,
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
          <div className="relative h-56 md:h-72 w-full bg-muted flex items-center justify-center p-4">
            {displayEntityLogo ? (
              <Image src={displayEntityLogo} alt={`${displayEntityName} Logo`} width={250} height={250} style={{ objectFit: 'contain' }} data-ai-hint={`${displayEntityName} logo large`} priority />
            ) : (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-full text-gray-500"> <Rocket size={64} /> </div>
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
              {entityDetailsToDisplay?.director && <div className="flex items-center gap-2"><UserCog size={16} className="text-muted-foreground"/><strong>Director:</strong> {entityDetailsToDisplay.director}</div>}
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
                      <Image src={driver.photoUrl || 'https://placehold.co/80x80.png?text=F1'} alt={driver.name || 'Driver'} width={80} height={80} className="rounded-full shadow-md object-cover" data-ai-hint={`${driver.name} portrait`}/>
                      <div>
                        <h4 className="text-lg font-semibold">{driver.name} {driver.number && <span className="text-primary font-bold">#{driver.number}</span>}</h4>
                        {driver.nationality && <p className="text-xs text-muted-foreground flex items-center gap-1"><Flag size={14}/>{driver.nationality}</p>}
                        {driver.abbr && <p className="text-xs text-muted-foreground">Abbr: {driver.abbr}</p>}
                        {driver.age != null && <p className="text-xs text-muted-foreground">Age: {driver.age}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
             ) : <p className="text-muted-foreground text-center py-4">Driver information for {CURRENT_F1_SEASON} not available or team had no drivers listed.</p>
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
                      className="rounded-lg shadow-md object-cover mt-1"
                      data-ai-hint="selected driver portrait"
                    />
                  ) : (
                    <UserCircle size={80} className="text-muted-foreground mt-1" />
                  )}
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-headline mb-1">{selectedDriverForBio.name || "Driver Biography"}</DialogTitle>
                    {selectedDriverForBio.nationality && <p className="text-sm text-muted-foreground">Nationality: {selectedDriverForBio.nationality}</p>}
                     {selectedDriverForBio.age != null && <p className="text-sm text-muted-foreground">Age: {selectedDriverForBio.age}</p>}
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
                   <X size={18}/> {/* Using X from lucide for close */}
                  <span className="sr-only">Close</span>
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        )}


        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontalBig className="text-primary"/>Recent Race Results ({CURRENT_F1_SEASON})</CardTitle></CardHeader>
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
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${race.status === 'Finished' ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' : 'bg-yellow-200 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200'}`}>{race.status}</span>
                        </div>
                        {race.driverResults.length > 0 ? (
                            <ul className="space-y-1 text-xs">
                                {race.driverResults.map(dr => (
                                    <li key={`${race.id}-${dr.driverName}`} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            {dr.driverImage && <Image src={dr.driverImage} alt={dr.driverName} width={20} height={20} className="rounded-full object-cover" data-ai-hint={`${dr.driverName} small portrait`} />}
                                            <span>{dr.driverName} {dr.driverNumber && <span className="text-muted-foreground text-xs">#{dr.driverNumber}</span>}</span>
                                        </div>
                                        <span className="font-medium">P{dr.position || 'N/A'} {dr.points != null && `(${dr.points} pts)`}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-xs text-muted-foreground italic">No specific results for this constructor in this race.</p>}
                        {race.weather && <p className="text-xs text-muted-foreground mt-2">Weather: {race.weather}</p>}
                    </Card>
                ))
             ) : <p className="text-muted-foreground text-center py-4">Recent race results for {CURRENT_F1_SEASON} not available.</p>
            }
          </CardContent>
        </Card>
        
        <Card className="mb-8 shadow-lg">
            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Car className="text-primary"/>Car Details & Partners</CardTitle></CardHeader>
            <CardContent className="text-center py-10">
                <p className="text-muted-foreground">Detailed car specifications and partner information coming soon!</p>
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

    
