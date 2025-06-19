
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
import { Brain, Users, Trophy, ChevronLeft, Settings, CalendarClock, Rocket, Flag, BarChartHorizontalBig, Car, UserCog, Building } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { getF1ConstructorDetails, getF1DriversForSeason, getF1RaceResultsForSeason } from '@/services/apiSportsService';
import { formatMatchDateTime } from '@/lib/dateUtils';

const CURRENT_F1_SEASON = 2024; // Or adjust to the latest relevant season

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

  const currentSport = supportedSports.find(s => s.slug === sportSlug) as SportDefinition;

  const fetchF1Data = useCallback(async (entityId: number, entityName: string) => {
    setIsLoadingData(true);
    setIsLoadingDrivers(true);
    setIsLoadingResults(true);
    setIsAiLoading(true);

    try {
      const [details, fetchedDrivers, fetchedResults, summary] = await Promise.allSettled([
        getF1ConstructorDetails(entityId, currentSport.apiBaseUrl),
        getF1DriversForSeason(entityId, CURRENT_F1_SEASON, currentSport.apiBaseUrl),
        getF1RaceResultsForSeason(entityId, CURRENT_F1_SEASON, currentSport.apiBaseUrl, 5),
        getTeamInfo({ entityName: entityName, entityType: 'team', contextName: 'Formula 1' })
      ]);

      if (details.status === 'fulfilled' && details.value) {
        setConstructorDetails(details.value);
      } else {
        console.error("Failed to fetch constructor details:", details.status === 'rejected' && details.reason);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load constructor details.' });
      }

      if (fetchedDrivers.status === 'fulfilled' && fetchedDrivers.value) {
        setDrivers(fetchedDrivers.value.length > 0 ? fetchedDrivers.value : []);
      } else {
        console.error("Failed to fetch F1 drivers:", fetchedDrivers.status === 'rejected' && fetchedDrivers.reason);
        setDrivers(mockF1Drivers); // Fallback to mock
        toast({ variant: 'default', title: 'Info', description: 'Could not load live F1 drivers, showing mock data.' });
      }
      setIsLoadingDrivers(false);

      if (fetchedResults.status === 'fulfilled' && fetchedResults.value) {
        setRaceResults(fetchedResults.value.length > 0 ? fetchedResults.value : []);
      } else {
        console.error("Failed to fetch F1 race results:", fetchedResults.status === 'rejected' && fetchedResults.reason);
        setRaceResults(mockF1RaceResults); // Fallback to mock
        toast({ variant: 'default', title: 'Info', description: 'Could not load live F1 race results, showing mock data.' });
      }
      setIsLoadingResults(false);

      if (summary.status === 'fulfilled' && summary.value) {
        setAiSummary(summary.value.response);
      } else {
        console.error("Error fetching AI summary for F1 entity:", summary.status === 'rejected' && summary.reason);
        setAiError("Failed to load AI summary.");
        setAiSummary(`Could not load summary for ${entityName}.`);
      }
      setIsAiLoading(false);

    } catch (error) {
      console.error("Overall error fetching F1 page data:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load all F1 page data.' });
      setDrivers(mockF1Drivers);
      setRaceResults(mockF1RaceResults);
    } finally {
      setIsLoadingData(false);
      setIsLoadingDrivers(false);
      setIsLoadingResults(false);
      setIsAiLoading(false);
    }
  }, [currentSport.apiBaseUrl, toast]);

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
      const input: TeamInfoInput = { entityName: entityNameToUse, entityType: 'team', question: userQuestion, contextName: "Formula 1" };
      const result = await getTeamInfo(input);
      setAiAnswer(result.response);
    } catch (error) {
      console.error("Error asking AI for F1 entity:", error);
      setAiError("Failed to get answer from AI.");
      setAiAnswer("Sorry, I couldn't answer that question right now.");
    }
    setIsAiLoading(false);
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

  if (!mockEntityData && !isLoadingData) {
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
        
        {entityDetailsToDisplay && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary" /> AI Summary & Info</CardTitle>
                <CardDescription> General information and answers about {displayEntityName}. </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {(isAiLoading && !aiSummary) && <div className="py-2 flex justify-center"><LoadingSpinner size="md" /></div>}
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
        )}

        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Settings className="text-primary"/>Constructor Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {isLoadingData && !constructorDetails && <div className="md:col-span-2 flex justify-center py-5"><LoadingSpinner/></div>}
            {entityDetailsToDisplay?.director && <div><strong>Director:</strong> {entityDetailsToDisplay.director}</div>}
            {entityDetailsToDisplay?.technicalManager && <div><strong>Technical Manager:</strong> {entityDetailsToDisplay.technicalManager}</div>}
            {entityDetailsToDisplay?.chassis && <div><strong>Chassis (Current):</strong> {entityDetailsToDisplay.chassis}</div>}
            {entityDetailsToDisplay?.engine && <div><strong>Engine (Current):</strong> {entityDetailsToDisplay.engine}</div>}
            {entityDetailsToDisplay?.championships != null && <div><strong>World Championships:</strong> {entityDetailsToDisplay.championships}</div>}
            {!isLoadingData && !entityDetailsToDisplay?.director && <p className="text-muted-foreground md:col-span-2">Detailed constructor information not available.</p>}
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Users className="text-primary"/>Current Drivers ({CURRENT_F1_SEASON})</CardTitle></CardHeader>
          <CardContent>
            {isLoadingDrivers ? <div className="flex justify-center py-5"><LoadingSpinner/></div> : 
             drivers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {drivers.map(driver => (
                  <Card key={driver.id || driver.name} className="p-4 bg-muted/40">
                    <div className="flex items-center gap-4">
                      <Image src={driver.photoUrl || 'https://placehold.co/80x80.png'} alt={driver.name || 'Driver'} width={80} height={80} className="rounded-full shadow-md" data-ai-hint={`${driver.name} portrait`}/>
                      <div>
                        <h4 className="text-lg font-semibold">{driver.name} {driver.number && <span className="text-primary">#{driver.number}</span>}</h4>
                        {driver.nationality && <p className="text-xs text-muted-foreground flex items-center gap-1"><Flag size={14}/>{driver.nationality}</p>}
                        {driver.abbr && <p className="text-xs text-muted-foreground">Abbr: {driver.abbr}</p>}
                        {driver.age != null && <p className="text-xs text-muted-foreground">Age: {driver.age}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
             ) : <p className="text-muted-foreground text-center">Driver information for {CURRENT_F1_SEASON} not available or team had no drivers listed.</p>
            }
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontalBig className="text-primary"/>Recent Race Results ({CURRENT_F1_SEASON})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoadingResults ? <div className="flex justify-center py-5"><LoadingSpinner/></div> :
             raceResults.length > 0 ? (
                raceResults.map(race => (
                    <Card key={race.id} className="p-4 bg-muted/40">
                        <h4 className="text-md font-semibold mb-1">{race.circuitName} - {formatMatchDateTime(race.date).date}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{race.competitionName} ({race.type})</p>
                        {race.driverResults.length > 0 ? (
                            <ul className="space-y-1 text-xs">
                                {race.driverResults.map(dr => (
                                    <li key={dr.driverName} className="flex justify-between items-center">
                                        <span>{dr.driverName} {dr.driverNumber && `(#${dr.driverNumber})`}:</span>
                                        <span className="font-medium">P{dr.position} {dr.points != null && `(${dr.points} pts)`}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-xs text-muted-foreground">No specific results for this team in this race.</p>}
                    </Card>
                ))
             ) : <p className="text-muted-foreground text-center">Recent race results for {CURRENT_F1_SEASON} not available.</p>
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
