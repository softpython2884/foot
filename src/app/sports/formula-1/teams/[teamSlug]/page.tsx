
'use client';

import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formula1Entities, supportedSports } from '@/lib/mockData';
import type { TeamApp, SportDefinition } from '@/lib/types';
import { ChevronLeft, Users } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function Formula1TeamProfilePage() {
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const sportSlug = 'formula-1';

  const sport = supportedSports.find(s => s.slug === sportSlug) as SportDefinition;
  const entity = formula1Entities.find(e => e.slug === teamSlug);

  if (!sport) {
    notFound(); // Should not happen if route is correct
  }

  if (!entity) {
    // Basic loading state or notFound if data is expected to be fetched
    // For mock data, if not found, it's a 404 for this slug
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href={`/sports/${sportSlug}/teams`}>
              <ChevronLeft size={18} className="mr-2" />
              Back to {sport.name} Entities
            </Link>
          </Button>
        </div>

        <Card className="mb-8 shadow-xl overflow-hidden">
          <div className="relative h-48 md:h-64 w-full bg-muted flex items-center justify-center p-4">
            {entity.logoUrl ? (
              <Image
                src={entity.logoUrl}
                alt={`${entity.name} Logo`}
                width={200}
                height={200}
                style={{ objectFit: 'contain' }}
                data-ai-hint={`${entity.name} logo large`}
                priority
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center rounded-full text-gray-500">
                <Users size={64} /> {/* Placeholder icon */}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end p-6">
              <h1 className="text-4xl md:text-6xl font-bold font-headline text-white text-center drop-shadow-lg">
                {entity.name}
              </h1>
              {entity.base && <p className="text-lg text-white/80 drop-shadow-sm">{entity.base}</p>}
            </div>
          </div>
        </Card>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Entity Details</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-10">
            <p className="text-xl text-muted-foreground">
              Detailed information and specific features for {sport.name} ({entity.name}) are coming soon!
            </p>
            <p className="mt-2 text-muted-foreground">
                Currently, only Football team details are fully implemented.
            </p>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
