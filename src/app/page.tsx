
'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TeamBannerCard } from '@/components/TeamBannerCard';
import { teams } from '@/lib/mockData'; // Using mockData for teams on homepage
import type { Team } from '@/lib/types';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="mb-8">
          <h2 className="text-3xl font-bold font-headline mb-6 text-center text-primary">
            Browse Teams
          </h2>
          {teams.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {teams.map((team: Team) => ( // team here is from mockData, which now includes API ID
                <TeamBannerCard key={team.id} team={team} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No teams available to display.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
