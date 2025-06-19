
'use client';

import { useParams, notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TeamBannerCard } from '@/components/TeamBannerCard';
import { footballTeams, supportedSports } from '@/lib/mockData'; // Using mockData for teams
import type { Team, SportDefinition } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function SportTeamsPage() {
  const params = useParams();
  const sportSlug = params.sportSlug as string;

  const sport = supportedSports.find(s => s.slug === sportSlug);

  if (!sport) {
    notFound();
  }

  // For now, only football teams are implemented
  const teamsToShow = sport.slug === 'football' ? footballTeams : [];

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
              {sport.name} Teams
            </h2>
            <div className="w-auto"></div> {/* Spacer */}
          </div>

          {teamsToShow.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {teamsToShow.map((team: Team) => (
                <TeamBannerCard key={team.id} team={team} sportSlug={sport.slug} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">
              No teams available to display for {sport.name} yet. Support for other sports is coming soon!
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
