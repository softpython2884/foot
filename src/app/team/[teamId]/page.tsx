
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation'; // Added useRouter
import { teams, mockMatches } from '@/lib/mockData';
import type { Team, Match } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Separator } from '@/components/ui/separator'; // Not used
import { CalendarDays, Shield, Trophy, Clock } from 'lucide-react';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

export default function TeamProfilePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter(); // Initialize useRouter
  const { currentUser, isLoading: authIsLoading } = useAuth(); // Get auth state

  const [team, setTeam] = useState<Team | null | undefined>(undefined);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (teamId) {
      setIsLoadingData(true);
      const foundTeam = teams.find((t) => t.id === teamId);
      
      if (foundTeam) {
        setTeam(foundTeam);
        const teamMatches = mockMatches.filter(
          (match) => match.homeTeam.id === teamId || match.awayTeam.id === teamId
        );
        setPastMatches(teamMatches.filter((m) => m.status === 'completed').sort((a,b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime()));
        setUpcomingMatches(teamMatches.filter((m) => m.status === 'upcoming').sort((a,b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime()));
      } else {
        setTeam(null);
      }
      setIsLoadingData(false);
    }
  }, [teamId]);

  const handleProtectedAction = (actionUrl: string) => {
    if (!currentUser && !authIsLoading) {
      router.push('/login');
    } else if (currentUser) {
      // For now, placeholder. Later, navigate to actual store/follow logic.
      console.log(`Action for ${actionUrl} triggered by ${currentUser.name}`);
      router.push('/login'); // Placeholder redirect
    }
  };


  if (isLoadingData || authIsLoading) {
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

  if (team === null) { 
    notFound(); 
  }
  
  if (!team) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-48 md:h-64 w-full bg-muted flex items-center justify-center p-4">
            {team.logoImageUrl ? (
              <Image
                src={team.logoImageUrl}
                alt={`${team.name} Logo`}
                width={200} 
                height={200}
                style={{objectFit: 'contain'}}
                data-ai-hint={`${team.name} logo large`}
              />
            ) : (
              <Image
                src={`https://placehold.co/200x200.png`}
                alt={`${team.name} Placeholder Logo`}
                width={200}
                height={200}
                style={{objectFit: 'contain'}}
                data-ai-hint={`${team.name} logo large`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg">
                {team.name}
              </h1>
            </div>
          </div>
          <CardContent className="p-6">
            <CardTitle className="text-2xl mb-4 font-headline">Team Information</CardTitle>
            <p className="text-muted-foreground">Detailed statistics and information about {team.name} will be displayed here.</p>
             <div className="mt-4 flex space-x-4">
                <Button variant="outline" onClick={() => handleProtectedAction(`/team/${teamId}/store`)}>Team Store</Button>
                <Button onClick={() => handleProtectedAction(`/team/${teamId}/follow`)}>Follow Team</Button>
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
                        <Button 
                          size="sm" 
                          className="mt-3 w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                          onClick={() => handleProtectedAction(`/match/${match.id}/bet`)}
                        >
                          Bet on this match
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
