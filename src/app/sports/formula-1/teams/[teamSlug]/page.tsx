
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
import { Brain, Users, Trophy, ChevronLeft, Settings, CalendarClock, Rocket, Flag, BarChartHorizontalBig, Car, Building, Info, UserCircle, ExternalLink, UserCog, Clock, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { getF1ConstructorDetails, getF1DriversForSeason, getF1RaceResultsForSeason } from '@/services/apiSportsService';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const CURRENT_F1_SEASON = 2024; // Ensure this matches the data you expect from API
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

  const [isLoadingData, setIsLoadingData] = useState(true); // For constructor details
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false); // For both summary and Q&A
  const [aiError, setAiError] = useState<string | null>(null);

  const [selectedDriverForBio, setSelectedDriverForBio] = useState<F1DriverApp | null>(null);
  const [driverBioContent, setPlayerBioContent] = useState<string | null>(null);
  const [isPlayerBioLoading, setIsPlayerBioLoading] = useState<boolean>(false);
  const [playerBioError, setPlayerBioError] = useState<string | null>(null);


  const currentSport = supportedSports.find(s => s.slug === sportSlug);

  const fetchF1Data = useCallback(async (entityId: number, entityName: string) => {
    if (!currentSport) {
        toast({ variant: 'destructive', title: 'Erreur de configuration', description: 'Définition du sport F1 non trouvée.' });
        setIsLoadingData(false); setIsLoadingDrivers(false); setIsLoadingResults(false);
        return;
    }
    setIsLoadingData(true);
    setIsLoadingDrivers(true);
    setIsLoadingResults(true);
    setIsAiLoading(true); // For initial summary

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
        console.warn("Could not fetch live F1 constructor details, using mock. Reason:", detailsResult.status === 'rejected' ? detailsResult.reason : 'No data returned');
        setConstructorDetails(formula1Entities.find(e => e.id === entityId) || null); // Fallback to mock team data
        toast({ variant: 'default', title: 'Info', description: 'Détails de l\'écurie en direct non chargés. Affichage des infos de base.' });
      }
      setIsLoadingData(false);

      if (driversResult.status === 'fulfilled' && driversResult.value && driversResult.value.length > 0) {
          setDrivers(driversResult.value);
      } else {
        console.info(`No live F1 drivers found for constructor ${entityId}, season ${CURRENT_F1_SEASON}. Using mock: ${driversResult.status === 'rejected' ? driversResult.reason : 'No data'}`);
        setDrivers(mockF1Drivers.filter(d => d.teamName?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase() || ''))); // Basic mock filter
        toast({ variant: 'default', title: 'Info', description: 'Données des pilotes en direct non trouvées, affichage de données fictives.'});
      }
      setIsLoadingDrivers(false);

      if (racesResult.status === 'fulfilled' && racesResult.value && racesResult.value.length > 0) {
          setRaceResults(racesResult.value);
      } else {
        console.info(`No live F1 race results for constructor ${entityId}, season ${CURRENT_F1_SEASON}. Using mock: ${racesResult.status === 'rejected' ? racesResult.reason : 'No data'}`);
        // A more robust mock filter would be needed here if mockF1RaceResults has team context
        setRaceResults(mockF1RaceResults.slice(0, MAX_RACE_RESULTS_F1));
        toast({ variant: 'default', title: 'Info', description: 'Résultats de course en direct non trouvés, affichage de données fictives.' });
      }
      setIsLoadingResults(false);

      if (summaryResult.status === 'fulfilled' && summaryResult.value) {
        setAiSummary(summaryResult.value.response);
      } else {
        console.error("Error fetching AI summary for F1 entity:", summaryResult.status === 'rejected' ? summaryResult.reason : "AI summary call succeeded but returned no data.");
        setAiError("Impossible de charger le résumé IA.");
        setAiSummary(`Résumé pour ${entityName} indisponible.`);
      }

    } catch (error) {
      console.error("Overall error fetching F1 page data:", error);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger toutes les données de la page F1.' });
      // Fallback to all mocks if general error
      setConstructorDetails(formula1Entities.find(e => e.id === entityId) || null);
      setDrivers(mockF1Drivers.filter(d => d.teamName?.toLowerCase().includes(entityName.split(' ')[0].toLowerCase() || '')));
      setRaceResults(mockF1RaceResults.slice(0, MAX_RACE_RESULTS_F1));
      setIsLoadingData(false); setIsLoadingDrivers(false); setIsLoadingResults(false);
    } finally {
      setIsAiLoading(false); // For initial summary
    }
  }, [currentSport, toast]);


  useEffect(() => {
    if (teamSlug && currentSport) {
      const foundEntity = formula1Entities.find((e) => e.slug === teamSlug);
      setMockEntityData(foundEntity || null); // Set mock data for immediate display if needed
      if (foundEntity) {
        fetchF1Data(foundEntity.id, foundEntity.name);
      } else {
         setIsLoadingData(false);
         setIsLoadingDrivers(false);
         setIsLoadingResults(false);
         setIsAiLoading(false); // For summary
      }
    } else if (!currentSport) {
        notFound();
    }
  }, [teamSlug, currentSport, fetchF1Data]);

  const handleAskAi = async () => {
    const entityNameToUse = constructorDetails?.name || mockEntityData?.name;
    if (!entityNameToUse || !userQuestion.trim()) return;
    setIsAiLoading(true); // For Q&A
    setAiAnswer(null);
    setAiError(null);
    try {
      const input: TeamInfoInput = { entityName: entityNameToUse, entityType: 'team', question: userQuestion, contextName: "Formule 1" };
      const result = await getTeamInfo(input);
      setAiAnswer(result.response);
    } catch (error) {
      console.error("Error asking AI for F1 entity:", error);
      setAiError("Impossible d'obtenir une réponse de l'IA. Veuillez réessayer plus tard.");
      setAiAnswer("Désolé, je ne peux pas répondre à cette question pour le moment.");
    }
    setIsAiLoading(false); // For Q&A
  };

  const handleDriverCardClick = async (driver: F1DriverApp) => {
    if (!driver || !driver.name) return;
    setSelectedDriverForBio(driver);
    setPlayerBioContent(null); // Clear previous bio
    setPlayerBioError(null);
    setIsPlayerBioLoading(true);

    try {
      const teamNameContext = constructorDetails?.name || mockEntityData?.name || 'son écurie actuelle';
      const input: TeamInfoInput = {
        entityName: driver.name,
        entityType: 'player', // Specify entityType as player
        contextName: teamNameContext, // Provide team as context
        // Optional: provide a more specific question if the default player bio prompt isn't sufficient
        // question: `Fournis une biographie concise pour le pilote de Formule 1 ${driver.name} de l'écurie ${teamNameContext}, incluant son numéro ${driver.number || 'N/A'}, sa nationalité, et ses faits marquants.`,
      };
      const result = await getTeamInfo(input);
      setPlayerBioContent(result.response);
    } catch (error) {
      console.error("Error fetching F1 driver biography:", error);
      setPlayerBioError("Désolé, je n'ai pas pu récupérer la biographie de ce pilote pour le moment.");
      setPlayerBioContent(null);
    }
    setIsPlayerBioLoading(false);
  };


  if (isLoadingData && !mockEntityData && !currentSport) { // Initial loading before mock data or sport is set
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center"> <LoadingSpinner size="lg" /> </main>
        <Footer />
      </div>
    );
  }

  if (!mockEntityData && !constructorDetails && !isLoadingData) { // If no mock and loading finished with no details
    notFound(); return null;
  }
  
  if (!currentSport) { // Should be caught by useEffect, but as a safeguard
      notFound(); return null;
  }

  const displayEntityName = constructorDetails?.name || mockEntityData?.name || 'Écurie F1';
  const displayEntityLogo = constructorDetails?.logoUrl || mockEntityData?.logoUrl;
  const entityDetailsToDisplay = constructorDetails || mockEntityData;


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/sports/${sportSlug}/teams`}> <ChevronLeft size={18} className="mr-2" /> Retour aux Écuries {currentSport.name} </Link>
          </Button>
        </div>

        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-56 md:h-72 w-full bg-muted flex items-center justify-center p-4">
            {displayEntityLogo ? (
              <Image src={displayEntityLogo} alt={`${displayEntityName} Logo`} width={250} height={250} style={{ objectFit: 'contain' }} data-ai-hint={`${displayEntityName} logo grand`} priority />
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
                <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary" /> Résumé IA & Infos</CardTitle>
                <CardDescription> Informations générales et réponses à vos questions sur {displayEntityName}. </CardDescription>
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
                  <Textarea placeholder={`Posez une question sur ${displayEntityName}...`} value={userQuestion} onChange={(e) => setUserQuestion(e.target.value)} className="resize-none" />
                  <Button onClick={handleAskAi} disabled={isAiLoading || !userQuestion.trim()}> {isAiLoading && userQuestion ? <LoadingSpinner size="sm" /> : "Demander à l'IA"} </Button>
                </div>
                {aiAnswer && (
                  <div>
                    <h3 className="text-lg font-semibold mt-4 mb-2">Réponse de l'IA :</h3>
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
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Info className="text-primary"/>Détails de l'Écurie</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {isLoadingData && !constructorDetails ? <div className="md:col-span-2 flex justify-center py-5"><LoadingSpinner/></div> :
            entityDetailsToDisplay ? (
            <>
              {entityDetailsToDisplay.base && <div className="flex items-center gap-2"><Building size={16} className="text-muted-foreground"/><strong>Base :</strong> {entityDetailsToDisplay.base}</div>}
              {entityDetailsToDisplay.director && <div className="flex items-center gap-2"><UserCog size={16} className="text-muted-foreground"/><strong>Directeur d'équipe :</strong> {entityDetailsToDisplay.director}</div>}
              {entityDetailsToDisplay.technicalManager && <div className="flex items-center gap-2"><UserCog size={16} className="text-muted-foreground"/><strong>Directeur Technique :</strong> {entityDetailsToDisplay.technicalManager}</div>}
              {entityDetailsToDisplay.chassis && <div className="flex items-center gap-2"><Car size={16} className="text-muted-foreground"/><strong>Châssis ({CURRENT_F1_SEASON}) :</strong> {entityDetailsToDisplay.chassis}</div>}
              {entityDetailsToDisplay.engine && <div className="flex items-center gap-2"><Settings size={16} className="text-muted-foreground"/><strong>Moteur ({CURRENT_F1_SEASON}) :</strong> {entityDetailsToDisplay.engine}</div>}
              {entityDetailsToDisplay.championships != null && <div className="flex items-center gap-2"><Trophy size={16} className="text-muted-foreground"/><strong>Championnats du Monde :</strong> {entityDetailsToDisplay.championships}</div>}
              {entityDetailsToDisplay.firstTeamEntry != null && <div className="flex items-center gap-2"><CalendarClock size={16} className="text-muted-foreground"/><strong>Première Entrée :</strong> {entityDetailsToDisplay.firstTeamEntry}</div>}
              {entityDetailsToDisplay.polePositions != null && <div className="flex items-center gap-2"><BarChartHorizontalBig size={16} className="text-muted-foreground"/><strong>Pole Positions :</strong> {entityDetailsToDisplay.polePositions}</div>}
              {entityDetailsToDisplay.fastestLaps != null && <div className="flex items-center gap-2"><Clock size={16} className="text-muted-foreground"/><strong>Meilleurs Tours :</strong> {entityDetailsToDisplay.fastestLaps}</div>}
              {Object.values(entityDetailsToDisplay).every(val => val === null || val === undefined) && !isLoadingData && <p className="text-muted-foreground md:col-span-2 text-center py-2">Informations détaillées sur l'écurie non disponibles.</p>}
            </>
            ) : <p className="text-muted-foreground md:col-span-2 text-center py-2">Informations détaillées sur l'écurie non disponibles.</p>
            }
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Users className="text-primary"/>Pilotes Actuels ({CURRENT_F1_SEASON})</CardTitle>
            <CardDescription>Cliquez sur un pilote pour voir sa biographie générée par l'IA.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDrivers ? <div className="flex justify-center py-5"><LoadingSpinner/></div> :
             drivers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {drivers.map(driver => (
                  <Card
                    key={driver.id || driver.name} // driver.id from ranking might be different from driver's main ID
                    className="p-4 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleDriverCardClick(driver)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleDriverCardClick(driver)}
                  >
                    <div className="flex items-center gap-4">
                      <Image src={driver.photoUrl || 'https://placehold.co/80x80.png?text=F1'} alt={driver.name || 'Driver'} width={80} height={80} className="rounded-lg shadow-md object-cover" data-ai-hint={`${driver.name} portrait`} />
                      <div>
                        <h4 className="text-lg font-semibold">{driver.name} {driver.number && <span className="text-primary font-bold">#{driver.number}</span>}</h4>
                        {driver.abbr && <p className="text-xs text-muted-foreground">Abbr: {driver.abbr.toUpperCase()}</p>}
                        {driver.nationality && <p className="text-xs text-muted-foreground flex items-center gap-1"><Flag size={14}/>{driver.nationality}</p>}
                        {driver.teamName && <p className="text-xs text-muted-foreground">Écurie: {driver.teamName}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
             ) : <p className="text-muted-foreground text-center py-4">Informations sur les pilotes pour la saison {CURRENT_F1_SEASON} non disponibles ou l'écurie n'a pas de pilotes classés cette saison.</p>
            }
          </CardContent>
        </Card>

        {selectedDriverForBio && (
          <Dialog open={!!selectedDriverForBio} onOpenChange={(open) => !open && setSelectedDriverForBio(null)}>
            <DialogContent className="sm:max-w-lg">
               <DialogHeader className="flex flex-row items-start gap-4 pr-10"> {/* pr-10 to avoid overlap with close button */}
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
                    <DialogTitle className="text-2xl font-headline mb-1">{selectedDriverForBio.name || "Biographie du Pilote"}</DialogTitle>
                    {selectedDriverForBio.number && <p className="text-sm text-muted-foreground">Numéro: {selectedDriverForBio.number}</p>}
                    {selectedDriverForBio.nationality && <p className="text-sm text-muted-foreground">Nationalité: {selectedDriverForBio.nationality}</p>}
                  </div>
                </DialogHeader>
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                {isPlayerBioLoading && <div className="flex justify-center items-center py-10"><LoadingSpinner size="lg" /></div>}
                {playerBioError && <p className="text-destructive text-center">{playerBioError}</p>}
                {driverBioContent && !isPlayerBioLoading && !playerBioError && (
                  <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(driverBioContent) }} />
                )}
                {!isPlayerBioLoading && !driverBioContent && !playerBioError && (
                  <p className="text-muted-foreground text-center">Aucune biographie disponible pour ce pilote pour le moment.</p>
                )}
              </div>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="absolute right-4 top-4 p-1.5 h-auto">
                   <X size={18}/>
                  <span className="sr-only">Fermer</span>
                </Button>
              </DialogClose>
            </DialogContent>
          </Dialog>
        )}


        <Card className="mb-8 shadow-lg">
          <CardHeader><CardTitle className="font-headline flex items-center gap-2"><BarChartHorizontalBig className="text-primary"/>Résultats Récents ({CURRENT_F1_SEASON})</CardTitle></CardHeader>
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
                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                                race.status === 'Finished' ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200' :
                                race.status === 'Scheduled' ? 'bg-blue-200 text-blue-700 dark:bg-blue-700 dark:text-blue-200' :
                                'bg-yellow-200 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-200'
                            )}>{race.status}</span>
                        </div>
                        {race.driverResults.length > 0 ? (
                            <ul className="space-y-1 text-xs">
                                {race.driverResults.map(dr => (
                                    <li key={`${race.id}-${dr.driverName}`} className="flex justify-between items-center py-1 border-b border-border last:border-b-0">
                                        <div className="flex items-center gap-2">
                                            {dr.driverImage && <Image src={dr.driverImage} alt={dr.driverName} width={20} height={20} className="rounded-full object-cover" data-ai-hint={`${dr.driverName} petit portrait`} />}
                                            <span>{dr.driverName} {dr.driverNumber && <span className="text-muted-foreground text-xs">#{dr.driverNumber}</span>}</span>
                                        </div>
                                        <span className="font-medium">P{dr.position || 'N/A'} {dr.points != null && `(${dr.points} pts)`}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-xs text-muted-foreground italic">Aucun résultat pour cette écurie dans cette course ou données non disponibles.</p>}
                        {race.weather && <p className="text-xs text-muted-foreground mt-2">Météo: {race.weather}</p>}
                    </Card>
                ))
             ) : <p className="text-muted-foreground text-center py-4">Résultats de course récents pour la saison {CURRENT_F1_SEASON} non disponibles.</p>
            }
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
            <CardHeader><CardTitle className="font-headline flex items-center gap-2"><Rocket className="text-primary"/>Voiture & Partenaires</CardTitle></CardHeader>
            <CardContent className="text-center py-10">
                <p className="text-muted-foreground">Informations détaillées sur la voiture et les partenaires à venir !</p>
                 {entityDetailsToDisplay?.chassis && <p>Châssis actuel ({CURRENT_F1_SEASON}): {entityDetailsToDisplay.chassis}</p>}
                 {entityDetailsToDisplay?.engine && <p>Moteur actuel ({CURRENT_F1_SEASON}): {entityDetailsToDisplay.engine}</p>}
            </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <Link href="/"> <Button variant="outline">Retour à l'Accueil</Button> </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

    