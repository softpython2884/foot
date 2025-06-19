
'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { supportedSports } from '@/lib/mockData';
import type { SportDefinition } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold font-headline mb-4 text-primary">
            Explore Your Favorite Sports
          </h2>
          <p className="text-lg text-muted-foreground">
            Select a sport to dive into teams, schedules, and more.
          </p>
        </section>

        {supportedSports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {supportedSports.map((sport: SportDefinition) => (
              <Link key={sport.slug} href={`/sports/${sport.slug}/teams`} passHref className="group">
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out h-full flex flex-col bg-card hover:-translate-y-1">
                  <CardHeader className="p-0 relative h-48">
                    <Image
                      src={sport.iconUrl || `https://placehold.co/600x400.png`}
                      alt={`${sport.name} icon`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={`${sport.slug === 'football' ? 'soccer ball stadium' : sport.slug === 'formula-1' ? 'race car track' : sport.slug === 'basketball' ? 'basketball hoop action' : 'sport generic'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  </CardHeader>
                  <CardContent className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold font-headline text-card-foreground mb-2">
                        {sport.name}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground mb-4">
                        Discover teams, schedules, and more for {sport.name}.
                      </CardDescription>
                    </div>
                    <div className="mt-auto text-right">
                        <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
                        Explore {sport.name}
                        <ArrowRight size={16} className="ml-1 transition-transform group-hover:translate-x-1" />
                        </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No sports available to display at the moment.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}

    
