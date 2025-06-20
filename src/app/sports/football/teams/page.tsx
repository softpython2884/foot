
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, notFound } from 'next/navigation'; 
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TeamBannerCard } from '@/components/TeamBannerCard';
import { footballTeams, supportedSports } from '@/lib/mockData';
import type { Team, SportDefinition, ManagedEventApp, TeamApp, MatchApp } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CalendarClock, Users, Tv, Gamepad2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BettingModal } from '@/components/BettingModal';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';

export default function FootballTeamsPage() { 
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const sportSlug = 'football'; 
  const sport = supportedSports.find(s => s.slug === sportSlug);

  
  const [pageTitleSuffix, setPageTitleSuffix] = useState("Teams"); 
  const [managedEvents, setManagedEvents] = useState<ManagedEventApp[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isRefreshingEvents, setIsRefreshingEvents] = useState(false);

  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false);
  const [selectedEventForBetting, setSelectedEventForBetting] = useState<ManagedEventApp | MatchApp | null>(null);
  const [selectedTeamForBetting, setSelectedTeamForBetting] = useState<TeamApp | null>(null);

  if (!sport) {
    notFound();
  }
  const teamsToShow: Team[] = footballTeams || [];

  const fetchManagedEvents = useCallback(async () => {
    if (!sport) return;
    setIsLoadingEvents(true);
    try {
      const response = await fetch(`/api/sport-events/${sport.slug}?status=upcoming&status=live&status=paused&status=finished&status=cancelled`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({error: `Failed to fetch ${sport.name} events and parse error response`}));
        throw new Error(errorData.error || `Failed to fetch ${sport.name} events. Status: ${response.status}`);
      }
      const data: ManagedEventApp[] = await response.json();
      setManagedEvents(data);
    } catch (error) {
      console.error(`Error fetching managed ${sport.name} events:`, error);
      toast({ variant: 'destructive', title: 'Error Loading Events', description: (error as Error).message });
      setManagedEvents([]);
    }
    setIsLoadingEvents(false);
    setIsRefreshingEvents(false);
  }, [sport, toast]);

  useEffect(() => {
    setPageTitleSuffix("Teams");
    fetchManagedEvents();
  }, [fetchManagedEvents]); 

  const handleRefreshEvents = () => {
    setIsRefreshingEvents(true);
    fetchManagedEvents();
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
    fetchManagedEvents(); // Refresh events after betting modal closes
  };
  
  const getStatusColor = (statusShort: string | undefined) => {
    if (!statusShort) return 'text-muted-foreground';
    if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(statusShort) || statusShort === 'live') return 'text-red-500';
    if (statusShort === 'FT' || statusShort === 'finished') return 'text-gray-500';
    if (statusShort === 'NS' || statusShort === 'upcoming') return 'text-green-500';
    if (['PST', 'SUSP', 'INT', 'CANC', 'ABD', 'AWD', 'WO', 'paused', 'cancelled'].includes(statusShort)) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" asChild>
                <Link href="/">
                    <ChevronLeft size={18} className="mr-2" />
                    Back to Sports
                </Link>
            </Button>
            <h2 className="text-3xl font-bold font-headline text-center text-primary">
              {sport.name} {pageTitleSuffix}
            </h2>
            <div style={{ width: '150px' }} /> 
          </div>

          {teamsToShow.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {teamsToShow.map((item: Team) => (
                <TeamBannerCard key={item.id} team={item} sportSlug={sport.slug} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No {pageTitleSuffix.toLowerCase()} available to display for {sport.name} yet.
            </p>
          )}
        </section>

        <section className="my-12">
           <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-3xl font-bold font-headline text-center sm:text-left text-secondary-foreground">
              <Gamepad2 className="inline-block mr-3 text-accent" size={32}/>
              Custom Events & Betting ({sport.name})
            </h2>
            <Button onClick={handleRefreshEvents} variant="outline" disabled={isRefreshingEvents}>
              <RefreshCw size={16} className={cn("mr-2", isRefreshingEvents && "animate-spin")} />
              {isRefreshingEvents ? 'Refreshing...' : 'Refresh Events'}
            </Button>
          </div>
          {isLoadingEvents && !isRefreshingEvents ? <div className="flex justify-center"><LoadingSpinner/></div> :
            managedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {managedEvents.map(event => {
                  const {date, time} = formatMatchDateTime(event.eventTime);
                  return (
                    <Card key={event.id} className="shadow-lg hover:shadow-xl transition-shadow">
                        <CardHeader>
                            <CardTitle className="font-headline text-xl">{event.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 text-sm">
                                <Tv size={16} className={cn(getStatusColor(event.status))} />
                                <span className={cn("font-medium", getStatusColor(event.status))}>
                                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                                {event.elapsedTime != null && (event.status === 'live') && 
                                  <span className="text-xs text-red-500">({event.elapsedTime}')</span>
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-primary"/>
                                <span>{event.homeTeam.name} vs {event.awayTeam.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarClock size={16} className="text-primary"/>
                                <span>{date} at {time}</span>
                            </div>
                             {event.status === 'live' && event.homeScore != null && event.awayScore != null && (
                                <p className="font-bold text-lg text-center text-primary">
                                    {event.homeScore} - {event.awayScore}
                                </p>
                            )}
                            {event.notes && <p className="text-xs text-muted-foreground pt-2">Notes: {event.notes}</p>}
                        </CardContent>
                         {(event.status === 'upcoming' || event.status === 'live' || event.status === 'paused') && currentUser && (
                            <CardContent className="flex flex-col sm:flex-row gap-2 pt-0">
                                <Button className="flex-1" variant="outline" onClick={() => handleOpenBettingModal(event, event.homeTeam)}>
                                    Bet on {event.homeTeam.name}
                                </Button>
                                <Button className="flex-1" variant="outline" onClick={() => handleOpenBettingModal(event, event.awayTeam)}>
                                    Bet on {event.awayTeam.name}
                                </Button>
                            </CardContent>
                        )}
                        {(event.status === 'upcoming' || event.status === 'live' || event.status === 'paused') && !currentUser && (
                             <CardContent className="pt-0">
                                <Button className="w-full" variant="outline" onClick={() => router.push('/login')}>Log in to Bet</Button>
                            </CardContent>
                        )}
                         {event.status === 'finished' && (
                            <CardContent className="pt-0 text-center">
                                <p className="text-sm font-semibold">
                                    Final Score: {event.homeScore} - {event.awayScore}
                                    {event.winningTeamId === event.homeTeam.id && ` (${event.homeTeam.name} won)`}
                                    {event.winningTeamId === event.awayTeam.id && ` (${event.awayTeam.name} won)`}
                                    {event.winningTeamId == null && " (Draw)"}
                                </p>
                            </CardContent>
                        )}
                         {event.status === 'cancelled' && (
                            <CardContent className="pt-0 text-center">
                                <p className="text-sm font-semibold text-destructive">Event Cancelled</p>
                            </CardContent>
                         )}
                    </Card>
                  )
              })}
            </div>
            ) : <p className="text-center text-muted-foreground">No custom events for {sport.name} at the moment. Check back later or create one in the admin panel!</p>
          }
        </section>

      </main>
      {selectedEventForBetting && selectedTeamForBetting && sport && (
        <BettingModal
          isOpen={isBettingModalOpen}
          onClose={handleCloseBettingModal}
          eventData={selectedEventForBetting}
          eventSource="custom" 
          teamToBetOn={selectedTeamForBetting}
          currentUser={currentUser}
          sportSlug={sport.slug}
        />
      )}
      <Footer />
    </div>
  );
}
