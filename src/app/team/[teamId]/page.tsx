
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { teams, mockMatches, leagues } from '@/lib/mockData';
import type { Team, Match } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Shield, Trophy, Clock } from 'lucide-react';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function TeamProfilePage() {
  const params = useParams();
  const teamId = params.teamId as string;

  const [team, setTeam] = useState<Team | null | undefined>(undefined); // undefined for loading, null for not found
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      setIsLoading(true);
      const foundTeam = teams.find((t) => t.id === teamId);
      
      if (foundTeam) {
        setTeam(foundTeam);
        const teamMatches = mockMatches.filter(
          (match) => match.homeTeam.id === teamId || match.awayTeam.id === teamId
        );
        setPastMatches(teamMatches.filter((m) => m.status === 'completed').sort((a,b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime()));
        setUpcomingMatches(teamMatches.filter((m) => m.status === 'upcoming').sort((a,b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()));
      } else {
        setTeam(null); // Team not found
      }
      setIsLoading(false);
    }
  }, [teamId]);

  if (isLoading) {
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

  if (team === null) { // Explicitly check for null after loading
    notFound(); // This will render the not-found.tsx page or a default Next.js 404 page
  }
  
  if (!team) return null; // Should be covered by isLoading or team === null

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-48 md:h-64 w-full bg-muted">
            <Image
              src={team.bannerImageUrl || `https://placehold.co/1200x300.png`}
              alt={`${team.name} Banner`}
              layout="fill"
              objectFit="cover"
              data-ai-hint={`${team.name} banner stadium`}
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg">
                {team.name}
              </h1>
            </div>
          </div>
          <CardContent className="p-6">
            <CardTitle className="text-2xl mb-4 font-headline">Team Information</CardTitle>
            {/* Placeholder for more team stats */}
            <p className="text-muted-foreground">Detailed statistics and information about {team.name} will be displayed here.</p>
             <div className="mt-4 flex space-x-4">
                <Link href="/login">
                    <Button variant="outline">Team Store</Button>
                </Link>
                <Link href="/login">
                    <Button>Follow Team</Button>
                </Link>
             </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Trophy className="text-primary"/>Past Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {pastMatches.length > 0 ? (
                <ul className="space-y-4">
                  {pastMatches.map((match) => {
                    const { date, time } = formatMatchDateTime(match.matchTime);
                    return (
                      <li key={match.id} className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{match.homeTeam.name} vs {match.awayTeam.name}</span>
                          <span className="font-bold text-lg">
                            {match.homeScore} - {match.awayScore}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Shield size={14}/> {match.league.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><CalendarDays size={14}/> {date} at {time}</p>
                        {match.venue && <p className="text-sm text-muted-foreground">Venue: {match.venue}</p>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">No past matches found for {team.name}.</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><Clock className="text-primary"/>Upcoming Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingMatches.length > 0 ? (
                <ul className="space-y-4">
                  {upcomingMatches.map((match) => {
                     const { date, time } = formatMatchDateTime(match.matchTime);
                    return (
                      <li key={match.id} className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <p className="font-semibold">{match.homeTeam.name} vs {match.awayTeam.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Shield size={14}/> {match.league.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><CalendarDays size={14}/> {date} at {time}</p>
                        {match.venue && <p className="text-sm text-muted-foreground">Venue: {match.venue}</p>}
                        <Button size="sm" className="mt-3 w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                          Bet on this match (Placeholder)
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-muted-foreground">No upcoming matches found for {team.name}.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="mt-8 text-center">
            <Link href="/">
                <Button variant="outline">Back to All Teams</Button>
            </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
