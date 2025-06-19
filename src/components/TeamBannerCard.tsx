
'use client';

import type { Team } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamBannerCardProps {
  team: Team;
  sportSlug: string; // Add sportSlug to construct the correct link
}

export function TeamBannerCard({ team, sportSlug }: TeamBannerCardProps) {
  // Construct the link based on whether it's a football team or a generic entity for other sports
  // For now, we assume all teams in mockData are football teams
  const teamDetailPath = `/sports/${sportSlug}/teams/${team.slug || team.id}`;

  return (
    <Link href={teamDetailPath} passHref className="group">
      <Card className="overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer h-full flex flex-col items-center justify-center bg-card group-hover:-translate-y-1">
        <CardHeader className="p-4 flex items-center justify-center">
          <Image
            src={team.logoImageUrl || `https://placehold.co/100x100.png`}
            alt={`${team.name} logo`}
            width={80}
            height={80}
            style={{ objectFit: 'contain' }}
            className="transition-transform duration-300 ease-in-out group-hover:scale-110"
            data-ai-hint={`${team.name} logo`}
          />
        </CardHeader>
        <CardContent className="p-2 pt-0 flex-grow flex flex-col justify-center items-center">
          <CardTitle className="text-md font-semibold font-headline text-center text-card-foreground">
            {team.name}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}
