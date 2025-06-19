
'use client';

import { useParams, notFound, useRouter } from 'next/navigation'; // Added useRouter
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TeamBannerCard } from '@/components/TeamBannerCard';
import { footballTeams, formula1Entities, basketballTeams, supportedSports } from '@/lib/mockData';
import type { Team, SportDefinition, ManagedEventApp, TeamApp } from '@/lib/types'; // Added ManagedEventApp, TeamApp
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, CalendarPlus, Gamepad2 } from 'lucide-react';
import { useEffect, useState } from 'react'; // Added useEffect, useState
import { useAuth } from '@/context/AuthContext'; // Added useAuth
import { BettingModal } from '@/components/BettingModal'; // Added BettingModal
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Added Card components
import { LoadingSpinner } from '@/components/LoadingSpinner'; // Added LoadingSpinner
import Image from 'next/image';
import { formatMatchDateTime } from '@/lib/dateUtils';

// Client-side action to fetch events (alternative to API route for simplicity here)
async function fetchManagedEventsForSport(sportSlug: string): Promise<ManagedEventApp[]> {
    // This should be replaced by an API call or a server action.
    // For now, it will make a call to a new API endpoint.
    try {
        const response = await fetch(`/api/sport-events/${sportSlug}`);
        if (!response.ok) {
            console.error('Failed to fetch managed events:', response.statusText);
            return [];
        }
        const data = await response.json();
        return data as ManagedEventApp[];
    } catch (error) {
        console.error('Error fetching managed events client-side:', error);
        return [];
    }
}


export default function SportTeamsPage() {
  const params = useParams();
  const sportSlug = params.sportSlug as string;
  const { currentUser } = useAuth(); // Get current user
  const router = useRouter(); // For navigation

  const [managedEvents, setManagedEvents] = useState<ManagedEventApp[]>([]);
  const [isLoadingManagedEvents, setIsLoadingManagedEvents] = useState(true);
  const [isBettingModalOpen, setIsBettingModalOpen] = useState(false);
  const [selectedEventForBetting, setSelectedEventForBetting] = useState<ManagedEventApp | null>(null);
  const [selectedTeamToBetOn, setSelectedTeamToBetOn] = useState<TeamApp | null>(null);


  const sport = supportedSports.find(s => s.slug === sportSlug);

  useEffect(() => {
    if (sportSlug) {
      setIsLoadingManagedEvents(true);
      fetchManagedEventsForSport(sportSlug)
        .then(data => {
          setManagedEvents(data.filter(event => event.status === 'upcoming' || event.status === 'live'));
        })
        .catch(error => console.error("Failed to load managed events on page", error))
        .finally(() => setIsLoadingManagedEvents(false));
    }
  }, [sportSlug]);


  if (!sportSlug) { // Added this check in case sportSlug is not immediately available
    notFound();
    return null;
  }

  if (!sport) {
    notFound();
    return null; 
  }

  let teamsToShow: Team[] = [];
  let pageTitleSuffix = "Entities";

  if (sport.slug === 'football') {
    teamsToShow = footballTeams || [];
    pageTitleSuffix = "Teams";
  } else if (sport.slug === 'formula-1') {
    teamsToShow = formula1Entities || [];
    pageTitleSuffix = "Écuries";
  } else if (sport.slug === 'basketball') {
    teamsToShow = basketballTeams || [];
    pageTitleSuffix = "Teams";
  }

  const handleOpenBettingModal = (event: ManagedEventApp, teamToBetOn: TeamApp) => {
    if (!currentUser) {
      router.push('/login?redirect=/sports/' + sportSlug + '/teams'); // Redirect to login
      return;
    }
    setSelectedEventForBetting(event);
    setSelectedTeamToBetOn(teamToBetOn);
    setIsBettingModalOpen(true);
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
            <div className="w-auto"></div> {/* Spacer */}
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

        {/* Section for Managed Events */}
        {sportSlug === 'football' && ( // Initially only show for football
            <section className="mt-12">
                <h3 className="text-2xl font-bold font-headline mb-6 text-secondary-foreground flex items-center gap-2">
                    <Gamepad2 className="text-accent" /> Custom Football Events
                </h3>
                {isLoadingManagedEvents && <div className="flex justify-center py-5"><LoadingSpinner /></div>}
                {!isLoadingManagedEvents && managedEvents.length === 0 && (
                    <p className="text-center text-muted-foreground">No custom events currently upcoming or live for {sport.name}.</p>
                )}
                {!isLoadingManagedEvents && managedEvents.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {managedEvents.map(event => (
                            <Card key={event.id} className="shadow-lg flex flex-col">
                                <CardHeader>
                                    <CardTitle className="text-lg">{event.homeTeamName} vs {event.awayTeamName}</CardTitle>
                                    <CardDescription>
                                        {event.leagueName || 'Custom Event'} - {formatMatchDateTime(event.eventTime).date} at {formatMatchDateTime(event.eventTime).time}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2">
                                   <div className="flex justify-around items-center">
                                        <div className="flex flex-col items-center text-center w-2/5">
                                            {event.homeTeamLogoUrl && <Image src={event.homeTeamLogoUrl} alt={event.homeTeamName} width={48} height={48} className="object-contain mb-1" data-ai-hint={`${event.homeTeamName} logo small`}/>}
                                            <span className="text-sm font-medium truncate w-full">{event.homeTeamName}</span>
                                            {event.status === 'live' && event.homeScore !== null && <span className="text-xl font-bold text-primary">{event.homeScore}</span>}
                                        </div>
                                        <span className="text-xl font-bold text-muted-foreground">{event.status === 'live' ? ':' : 'vs'}</span>
                                        <div className="flex flex-col items-center text-center w-2/5">
                                            {event.awayTeamLogoUrl && <Image src={event.awayTeamLogoUrl} alt={event.awayTeamName} width={48} height={48} className="object-contain mb-1" data-ai-hint={`${event.awayTeamName} logo small`}/>}
                                            <span className="text-sm font-medium truncate w-full">{event.awayTeamName}</span>
                                             {event.status === 'live' && event.awayScore !== null && <span className="text-xl font-bold text-primary">{event.awayScore}</span>}
                                        </div>
                                   </div>
                                   <p className="text-xs text-center text-muted-foreground pt-2">Status: <span className="font-semibold capitalize">{event.status}</span></p>
                                </CardContent>
                                {event.status === 'upcoming' && (
                                    <CardFooter className="flex flex-col sm:flex-row gap-2 pt-3">
                                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenBettingModal(event, event.homeTeam)}>
                                            Bet on {event.homeTeamName}
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenBettingModal(event, event.awayTeam)}>
                                            Bet on {event.awayTeamName}
                                        </Button>
                                    </CardFooter>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        )}
      </main>
      <Footer />
      {selectedEventForBetting && selectedTeamToBetOn && currentUser && (
        <BettingModal
          isOpen={isBettingModalOpen}
          onClose={() => setIsBettingModalOpen(false)}
          eventData={selectedEventForBetting}
          eventSource="custom" // Bets on managed events are 'custom'
          teamToBetOn={selectedTeamToBetOn}
          currentUser={currentUser}
          sportSlug={sportSlug}
        />
      )}
    </div>
  );
}
