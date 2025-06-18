
'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TeamBannerCard } from '@/components/TeamBannerCard';
import { teams } from '@/lib/mockData';
import type { Team } from '@/lib/types';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold font-headline text-center mb-10 text-primary">
          Explore Football Clubs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {teams.map((team: Team) => (
            <TeamBannerCard key={team.id} team={team} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
