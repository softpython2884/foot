
'use client';

import { useParams, notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TeamBannerCard } from '@/components/TeamBannerCard';
import { footballTeams, formula1Entities, basketballTeams, supportedSports } from '@/lib/mockData';
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
    return null; // Stop rendering if sport not found
  }

  let teamsToShow: Team[] = []; // Initialize as an empty array
  let pageTitleSuffix = "Entities"; // Default suffix

  // Assign teamsToShow based on sportSlug, with a fallback to [] if the source array is undefined
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
  // If a sport is in supportedSports but not handled above, teamsToShow remains []

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
      </main>
      <Footer />
    </div>
  );
}
