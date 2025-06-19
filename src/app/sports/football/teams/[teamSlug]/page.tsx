
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { footballTeams, supportedSports } from '@/lib/mockData';
import type { TeamApp, MatchApp, CoachApp, PlayerApp, SportDefinition } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Users, Trophy, UserSquare, Shirt, CalendarClock, BarChart3, ChevronLeft } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';
import { getFootballTeamDetails, getFootballMatchesForTeam, getFootballCoachForTeam, getFootballSquadForTeam } from '@/services/apiSportsService';
import { MatchCard } from '@/components/MatchCard';

const INITIAL_PAST_MATCHES_COUNT = 10;
const LOAD_MORE_INCREMENT = 10;
const SEASON_FOR_FOOTBALL_MATCHES = 2023;

function simpleMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  let html = markdown;
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  // Unordered lists
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\s*)+/g, '<ul>$&</ul>'); // Wrap LIs in UL
  // Ensure paragraphs for line breaks (basic version)
  html = html.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '').join('');
  // Correct UL wrapping if P tags are introduced within list structures
  html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
  return html;
}


export default function FootballTeamProfilePage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const sportSlug = 'football'; // This page is specific to football
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [teamDetails, setTeamDetails] = useState<TeamApp | null>(null);
  const [mockTeamData, setMockTeamData] = useState<TeamApp | null>(null);

  const [allPastMatches, setAllPastMatches] = useState<MatchApp[]>([]);
  const [visiblePastMatchesCount, setVisiblePastMatchesCount] = useState(INITIAL_PAST_MATCHES_COUNT);

  const [coach, setCoach] = useState<CoachApp | null>(null);
  const [players, setPlayers] = useState<PlayerApp[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentSport = supportedSports.find(s => s.slug === sportSlug) as SportDefinition; // Should always be found

  const fetchTeamPageData = useCallback(async (apiTeamId: number, teamNameFromMock: string) => {
    setIsLoadingData(true);
    setIsLoadingMatches(true);
    setIsLoadingCoach(true);
    setIsLoadingPlayers(true);

    setTeamDetails(null);
    setAllPastMatches([]);
    setVisiblePastMatchesCount(INITIAL_PAST_MATCHES_COUNT);
    setCoach(null);
    setPlayers([]);

    try {
      const detailsPromise = getFootballTeamDetails(apiTeamId, currentSport.apiBaseUrl);
      // Fetch all finished matches for the season, then sort and slice client-side
      const pastMatchesPromise = getFootballMatchesForTeam(apiTeamId, SEASON_FOR_FOOTBALL_MATCHES, { status: 'FT' }, currentSport.apiBaseUrl);
      const coachPromise = getFootballCoachForTeam(apiTeamId, currentSport.apiBaseUrl);
      const squadPromise = getFootballSquadForTeam(apiTeamId, currentSport.apiBaseUrl);

      const [details, fetchedPastMatches, fetchedCoach, fetchedPlayers] = await Promise.all([
        detailsPromise,
        pastMatchesPromise,
        coachPromise,
        squadPromise
      ]);

      setTeamDetails(details);
      if (fetchedPastMatches.length > 0) {
        const sortedFinishedMatches = fetchedPastMatches
          .sort((a, b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime());
        setAllPastMatches(sortedFinishedMatches);
      } else {
        setAllPastMatches([]);
      }
      setIsLoadingMatches(false);

      setCoach(fetchedCoach);
      setIsLoadingCoach(false);

      setPlayers(fetchedPlayers);
      setIsLoadingPlayers(false);

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
      setIsLoadingMatches(false);
      setIsLoadingCoach(false);
      setIsLoadingPlayers(false);
    } finally {
      setIsLoadingData(false);
    }
  }, [toast, currentSport.apiBaseUrl]);

  useEffect(() => {
    if (teamSlug) {
      const foundMockTeam = footballTeams.find((t) => t.slug === teamSlug);
      setMockTeamData(foundMockTeam || null);

      if (foundMockTeam) {
        fetchTeamPageData(foundMockTeam.id, foundMockTeam.name);
      } else {
        setIsLoadingData(false);
      }
    }
  }, [teamSlug, fetchTeamPageData]);

  const handleLoadMorePastMatches = () => {
    setVisiblePastMatchesCount(prevCount => prevCount + LOAD_MORE_INCREMENT);
  };

  const displayedPastMatches = allPastMatches.slice(0, visiblePastMatchesCount);

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
  const displayTeamLogo = teamDetails?.logoUrl || mockTeamData?.logoUrl;

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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
            <Button variant="outline" asChild>
                <Link href={`/sports/${sportSlug}/teams`}>
                    <ChevronLeft size={18} className="mr-2" />
                    Back to {currentSport.name} Teams
                </Link>
            </Button>
        </div>
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
                <Users size={64} />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg">
                {displayTeamName || 'Team Profile'}
              </h1>
               {teamDetails?.country && <p className="text-lg text-white/80 drop-shadow-sm">{teamDetails.country}</p>}
            </div>
          </div>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardContent className="space-y-4 pt-6">
             {(isAiLoading && !aiSummary) && <div className="py-2 flex justify-center"><LoadingSpinner size="md" /></div>}
            {aiError && !aiSummary && <p className="text-destructive">{aiError}</p>}
            {aiSummary && (
              <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-md mb-6">
                <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(aiSummary) }} />
              </div>
            )}
            {!aiSummary && !isAiLoading && !aiError && !isLoadingData && <p className="text-muted-foreground text-center">AI summary is loading or not available. Ask a question below for more details including stadium, country, founded year etc.</p>}


            <CardHeader className="px-0 pt-0 pb-2">
              <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary" />AI Team Assistant</CardTitle>
              <CardDescription>
                Ask the AI for detailed information about the team: history, stadium, key players, current form, etc. The AI will use Markdown for emphasis.
              </CardDescription>
            </CardHeader>
            <div className="space-y-2">
              <Textarea
                placeholder={`Ask a question about ${displayTeamName || 'this team'}...`}
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="resize-none"
              />
              <Button onClick={handleAskAi} disabled={isAiLoading || !userQuestion.trim() || !displayTeamName}>
                {isAiLoading && userQuestion ? <LoadingSpinner size="sm" /> : "Ask AI"}
              </Button>
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
            <CardTitle className="font-headline flex items-center gap-2"><UserSquare className="text-primary" />Current Coach</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCoach ? (
              <div className="flex justify-center py-4"><LoadingSpinner /></div>
            ) : coach ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Image
                  src={coach.photoUrl || `https://placehold.co/100x100.png`}
                  alt={coach.name || 'Coach Photo'}
                  width={100}
                  height={100}
                  className="rounded-lg shadow-md"
                  data-ai-hint="coach portrait"
                />
                <div>
                  <h3 className="text-xl font-semibold">{coach.name}</h3>
                  {coach.nationality && <p className="text-muted-foreground">Nationality: {coach.nationality}</p>}
                  {coach.age != null && <p className="text-muted-foreground">Age: {coach.age} years</p>}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Coach information not available.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Users className="text-primary" />Current Squad</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPlayers ? (
              <div className="flex justify-center py-4"><LoadingSpinner /></div>
            ) : players.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {players.map((player) => (
                  <Card key={player.id || player.name} className="flex flex-col items-center p-4 text-center bg-muted/30">
                    <Image
                      src={player.photoUrl || `https://placehold.co/80x80.png`}
                      alt={player.name || 'Player Photo'}
                      width={80}
                      height={80}
                      className="rounded-full mb-2 shadow-md"
                      data-ai-hint="player portrait"
                    />
                    <p className="font-semibold text-sm">{player.name}</p>
                    {player.number != null && <p className="text-xs text-muted-foreground">Number: {player.number}</p>}
                    {player.position && <p className="text-xs text-muted-foreground">Position: {player.position}</p>}
                    {player.age != null && <p className="text-xs text-muted-foreground">Age: {player.age}</p>}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">Squad information not available.</p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary" />Past Matches (Season {SEASON_FOR_FOOTBALL_MATCHES})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingMatches && displayedPastMatches.length === 0 && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
              {!isLoadingMatches && allPastMatches.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No past matches found for {displayTeamName || 'this team'} (Season {SEASON_FOR_FOOTBALL_MATCHES}).
                  This may be due to API plan limitations or no available data for this period.
                </p>
              )}
              {displayedPastMatches.length > 0 && (
                <ul className="space-y-4">
                  {displayedPastMatches.map((match) => (
                    <MatchCard key={match.id} match={match} isWatchlisted={false} onToggleWatchlist={() => { /* TODO */ }} />
                  ))}
                </ul>
              )}
              {!isLoadingMatches && allPastMatches.length > visiblePastMatchesCount && (
                <div className="mt-6 text-center">
                  <Button onClick={handleLoadMorePastMatches} variant="outline">
                    Load More Past Matches
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <Link href={`/sports/${sportSlug}/teams`}>
            <Button variant="outline">Back to {currentSport.name} Teams</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

    
