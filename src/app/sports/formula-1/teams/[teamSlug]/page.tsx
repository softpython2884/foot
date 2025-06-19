
'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { formula1Entities, supportedSports } from '@/lib/mockData';
import type { TeamApp, SportDefinition } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Users, Trophy, ChevronLeft, Settings, CalendarClock } from 'lucide-react';
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

export default function Formula1TeamProfilePage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const sportSlug = 'formula-1';
  const { toast } = useToast();

  const [entityData, setEntityData] = useState<TeamApp | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentSport = supportedSports.find(s => s.slug === sportSlug) as SportDefinition;

  useEffect(() => {
    if (teamSlug) {
      const foundEntity = formula1Entities.find((e) => e.slug === teamSlug);
      if (foundEntity) {
        setEntityData(foundEntity);
        setIsAiLoading(true);
        setAiError(null);
        setAiSummary(null);
        getTeamInfo({ entityName: foundEntity.name, entityType: 'team' })
          .then(result => setAiSummary(result.response))
          .catch(err => {
            console.error("Error fetching AI summary for F1 entity:", err);
            setAiError("Failed to load AI summary.");
            setAiSummary(\`Could not load summary for \${foundEntity.name}.\`);
          })
          .finally(() => setIsAiLoading(false));
      }
      setIsLoadingData(false);
    }
  }, [teamSlug]);

  const handleAskAi = async () => {
    if (!entityData?.name || !userQuestion.trim()) return;
    setIsAiLoading(true);
    setAiAnswer(null);
    setAiError(null);
    try {
      const input: TeamInfoInput = { entityName: entityData.name, entityType: 'team', question: userQuestion };
      const result = await getTeamInfo(input);
      setAiAnswer(result.response);
    } catch (error) {
      console.error("Error asking AI for F1 entity:", error);
      setAiError("Failed to get answer from AI. Please try again later.");
      setAiAnswer("Sorry, I couldn't answer that question right now.");
    }
    setIsAiLoading(false);
  };

  if (isLoadingData && !entityData) {
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

  if (!entityData && !isLoadingData) {
    notFound();
    return null;
  }
  
  const displayEntityName = entityData?.name || 'F1 Entity Profile';
  const displayEntityLogo = entityData?.logoUrl;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/sports/${sportSlug}/teams`}>
              <ChevronLeft size={18} className="mr-2" />
              Back to {currentSport.name} Entities
            </Link>
          </Button>
        </div>

        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-48 md:h-64 w-full bg-muted flex items-center justify-center p-4">
            {displayEntityLogo ? (
              <Image
                src={displayEntityLogo}
                alt={`${displayEntityName} Logo`}
                width={200}
                height={200}
                style={{ objectFit: 'contain' }}
                data-ai-hint={`${displayEntityName} logo large`}
                priority
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-full text-gray-500">
                <Settings size={64} /> {/* Placeholder icon for F1 team */}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg">
                {displayEntityName}
              </h1>
               {entityData?.base && <p className="text-lg text-white/80 drop-shadow-sm">{entityData.base}</p>}
            </div>
          </div>
        </Card>
        
        {entityData && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2"><Brain className="text-primary" /> AI Summary & Info</CardTitle>
                <CardDescription>
                  General information and answers to your questions about {entityData.name}, provided by AI.
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
                    placeholder={`Ask a question about ${entityData.name}...`}
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
            <CardTitle className="font-headline flex items-center gap-2"><Users className="text-primary"/>Pilotes</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Detailed driver information coming soon!</p>
          </CardContent>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Résultats Récents</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">Recent race results and standings coming soon!</p>
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
