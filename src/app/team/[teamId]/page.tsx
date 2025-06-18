
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, notFound, useRouter } from 'next/navigation';
import { teams, mockMatches } from '@/lib/mockData';
import type { Team, Match } from '@/lib/types';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Shield, Trophy, Clock } from 'lucide-react';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import { placeBetAction } from '@/actions/bets'; // Import placeBetAction

export default function TeamProfilePage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const { toast } = useToast(); // Initialize useToast

  const [team, setTeam] = useState<Team | null | undefined>(undefined);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPlacingBet, setIsPlacingBet] = useState<string | null>(null); // To track which match bet is being placed for

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

  const handlePlaceBet = async (match: Match) => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    if (match.status !== 'upcoming') {
      toast({ variant: 'destructive', title: 'Betting Closed', description: 'You can only bet on upcoming matches.' });
      return;
    }

    setIsPlacingBet(match.id);
    const amountString = window.prompt(`Enter amount to bet on ${match.homeTeam.id === teamId ? match.homeTeam.name : match.awayTeam.name} to win:`);
    if (amountString === null) { // User cancelled prompt
      setIsPlacingBet(null);
      return;
    }

    const amountBet = parseInt(amountString, 10);
    if (isNaN(amountBet) || amountBet <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid positive number for your bet.' });
      setIsPlacingBet(null);
      return;
    }

    const formData = new FormData();
    formData.append('userId', currentUser.id.toString());
    formData.append('matchId', match.id);
    // For simplicity, if on team A's page, and match is A vs B, bet is on A.
    // If match is B vs A, bet is still on A.
    // This assumes user always bets on the team whose page they are viewing.
    // A more complex UI would allow choosing which team to bet on in any match.
    const teamToBetOn = (match.homeTeam.id === teamId || match.awayTeam.id === teamId) ? teamId : ''; 
    
    if (!teamToBetOn) {
        toast({variant: 'destructive', title: 'Error', description: 'Could not determine team to bet on.'});
        setIsPlacingBet(null);
        return;
    }

    formData.append('teamIdBetOn', teamToBetOn);
    formData.append('amountBet', amountBet.toString());

    const result = await placeBetAction(formData);

    if (result.success) {
      toast({ title: 'Bet Placed!', description: result.success });
    } else {
      toast({ variant: 'destructive', title: 'Bet Failed', description: result.error || 'Could not place bet.' });
    }
    setIsPlacingBet(null);
  };

  const handleProtectedAction = (actionUrl: string) => {
    if (!currentUser && !authIsLoading) {
      router.push('/login');
    } else if (currentUser) {
      console.log(`Action for ${actionUrl} triggered by ${currentUser.name}`);
      // For now, redirect to login for non-bet actions as placeholder
      // For bet actions, it's handled by handlePlaceBet directly.
      if (!actionUrl.includes('/bet')) {
        router.push('/login'); // Placeholder redirect for store/follow
      }
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
                          onClick={() => handlePlaceBet(match)}
                          disabled={isPlacingBet === match.id || !currentUser}
                        >
                          {isPlacingBet === match.id ? <LoadingSpinner size="sm" /> : 'Bet on this match'}
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
        <div className="mt-12 text-center">
            <Link href="/">
                <Button variant="outline">Back to All Teams</Button>
            </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
