
'use client';

import type { Team } from '@/lib/types';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamBannerCardProps {
  team: Team;
}

export function TeamBannerCard({ team }: TeamBannerCardProps) {
  return (
    <Link href={`/team/${team.id}`} passHref>
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer h-full flex flex-col">
        <CardHeader className="p-0 relative aspect-[2/1]">
          <Image
            src={team.bannerImageUrl || `https://placehold.co/300x150.png`}
            alt={`${team.name} banner`}
            layout="fill"
            objectFit="cover"
            className="transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={`${team.name} banner`}
          />
        </CardHeader>
        <CardContent className="p-4 flex-grow flex flex-col justify-center items-center bg-card">
          <CardTitle className="text-lg font-semibold font-headline text-center text-card-foreground">
            {team.name}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}
