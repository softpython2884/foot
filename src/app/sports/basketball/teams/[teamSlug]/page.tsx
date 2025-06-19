
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { basketballTeams, supportedSports } from '@/lib/mockData';
import type { TeamApp, SportDefinition } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Users, Trophy, ChevronLeft, ShieldHalf, Star } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { getTeamInfo, type TeamInfoInput } from '@/ai/flows/team-info-flow';

// Helper function for basic Markdown to HTML conversion
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

  const [teamData, setTeamData] = useState<TeamApp | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentSport = supportedSports.find(s => s.slug === sportSlug) as SportDefinition;

  useEffect(() => {
    if (teamSlug) {
      const foundTeam = basketballTeams.find((t) => t.slug === teamSlug);
      if (foundTeam) {
        setTeamData(foundTeam);
        setIsAiLoading(true);
        setAiError(null);
        setAiSummary(null);
        getTeamInfo({ entityName: foundTeam.name, entityType: 'team' })
          .then(result => setAiSummary(result.response))
          .catch(err => {
            console.error("Error fetching AI summary for Basketball team:", err);
            setAiError("Failed to load AI summary.");
            setAiSummary(`Could not load summary for ${foundTeam.name}.`);
          })
          .finally(() => setIsAiLoading(false));
      }
      setIsLoadingData(false);
    }
  }, [teamSlug]);

  const handleAskAi = async () => {
    if (!teamData?.name || !userQuestion.trim()) return;
    setIsAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    try {
      const input: TeamInfoInput = { entityName: teamData.name, entityType: 'team', question: userQuestion };
      const result = await getTeamInfo(input);
      setAiAnswer(result.response);
    } catch (error) {
      console.error("Error asking AI for Basketball team:", error);
      setAiError("Failed to get answer from AI. Please try again later.");
      setAiAnswer("Sorry, I couldn't answer that question right now.");
    }
    setIsAiLoading(false);
  };

  if (isLoadingData && !teamData) {
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

  if (!teamData && !isLoadingData) {
    notFound();
    return null;
  }

  const displayTeamName = teamData?.name || 'Basketball Team Profile';
  const displayTeamLogo = teamData?.logoUrl;

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
                alt={`${displayTeamName} Logo`}
                width={200}
                height={200}
                style={{ objectFit: 'contain' }}
                data-ai-hint={`${displayTeamName} logo large`}
                priority
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-full text-gray-500">
                <Star size={64} /> {/* Placeholder icon for Basketball team */}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg">
                {displayTeamName}
              </h1>
               {teamData?.conference && <p className="text-lg text-white/80 drop-shadow-sm">{teamData.conference} Conference</p>}
               {teamData?.division && <p className="text-md text-white/70 drop-shadow-sm">{teamData.division} Division</p>}
            </div>
          </div>
        </Card>

        {teamData && (
           <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary" /> AI Summary & Info</CardTitle>
                <CardDescription>
                  General information and answers to your questions about {teamData.name}, provided by AI.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {(isAiLoading && !aiSummary) && <div className="py-2 flex justify-center"><LoadingSpinner size="md" /></div>}
                {aiSummary && (
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 p-4 rounded-md mb-6">
                    <div dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(aiSummary) }} />
                  </div>
                )}
                {aiError && !aiSummary && <p className="text-destructive">{aiError}</p>}
                {!aiSummary && !isAiLoading && !aiError && <p className="text-muted-foreground text-center">AI summary is loading or not available. Ask a question below for more details.</p>}

                <div className="space-y-2">
                  <Textarea
                    placeholder={`Ask a question about ${teamData.name}...`}
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    className="resize-none"
                  />
                  <Button onClick={handleAskAi} disabled={isAiLoading || !userQuestion.trim()}>
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
        )}

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Users className="text-primary"/>Effectif (Squad)</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Detailed squad information coming soon!</p>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Matchs Récents</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Recent game results and schedule coming soon!</p>
          </CardContent>
        </Card>

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
