
'use client';

import type { MatchApp } from '@/lib/types';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Heart, Info, Shield, Users, Tv, Dot } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: MatchApp;
  isWatchlisted: boolean;
  onToggleWatchlist: (matchId: number) => void; // ID is now number from API
  // isRecommended?: boolean; // Removed for now as recommendation logic is not yet integrated with new API
}

export function MatchCard({ match, isWatchlisted, onToggleWatchlist }: MatchCardProps) {
  const [formattedDateTime, setFormattedDateTime] = useState({ date: 'Loading...', time: 'Loading...' });

  useEffect(() => {
    setFormattedDateTime(formatMatchDateTime(match.matchTime));
  }, [match.matchTime]);

  const getStatusColor = (statusShort: string) => {
    if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(statusShort)) return 'text-red-500'; // Live/Ongoing
    if (statusShort === 'FT' || statusShort === 'AET' || statusShort === 'PEN') return 'text-gray-500'; // Finished
    if (statusShort === 'NS') return 'text-green-500'; // Not Started
    if (['PST', 'SUSP', 'INT', 'CANC', 'ABD', 'AWD', 'WO'].includes(statusShort)) return 'text-yellow-600'; // Postponed/Cancelled
    return 'text-muted-foreground';
  };

  return (
    <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card text-card-foreground">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.homeTeam.logoUrl ? (
              <Image
                src={match.homeTeam.logoUrl}
                alt={`${match.homeTeam.name} logo`}
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
                className="rounded-full"
                data-ai-hint={`${match.homeTeam.name} logo`}
              />
            ) : <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs">?</div>}
            <CardTitle className="font-headline text-lg truncate" title={match.homeTeam.name}>
              {match.homeTeam.name}
            </CardTitle>
          </div>

          {match.statusShort === 'NS' ? (
            <span className="text-muted-foreground mx-2 text-lg font-semibold">vs</span>
          ) : (
            <span className="text-2xl font-bold text-primary mx-2">
              {match.homeScore ?? '-'} : {match.awayScore ?? '-'}
            </span>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <CardTitle className="font-headline text-lg truncate text-right" title={match.awayTeam.name}>
              {match.awayTeam.name}
            </CardTitle>
            {match.awayTeam.logoUrl ? (
              <Image
                src={match.awayTeam.logoUrl}
                alt={`${match.awayTeam.name} logo`}
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
                className="rounded-full"
                data-ai-hint={`${match.awayTeam.name} logo`}
              />
            ) : <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center text-xs">?</div>}
          </div>
        </div>
        <CardDescription className="flex items-center gap-2 pt-1 text-muted-foreground">
          {match.league.logoUrl ? (
            <Image src={match.league.logoUrl} alt={`${match.league.name} emblem`} width={16} height={16} style={{ objectFit: 'contain' }} />
          ) : (
            <Shield size={16} />
          )}
          {match.league.name} {match.league.country && `(${match.league.country})`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays size={16} className="text-primary" />
          <span>{formattedDateTime.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock size={16} className="text-primary" />
          <span>{formattedDateTime.time} (Your Local Time)</span>
        </div>
        <div className="flex items-center gap-1 text-sm capitalize">
          <Tv size={16} className={cn(getStatusColor(match.statusShort))} />
          <span className={cn("font-medium", getStatusColor(match.statusShort))}>
            {match.statusLong}
          </span>
          {match.elapsedTime && ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(match.statusShort) && (
            <span className="text-xs text-red-500">({match.elapsedTime}')</span>
          )}
        </div>
        {match.venueName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            <span>{match.venueName}{match.venueCity && `, ${match.venueCity}`}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant={isWatchlisted ? 'destructive' : 'default'}
          onClick={() => onToggleWatchlist(match.id)}
          className="w-full transition-colors duration-300"
          aria-label={isWatchlisted ? `Remove from watchlist` : `Add to watchlist`}
        >
          <Heart size={18} className={`mr-2 ${isWatchlisted ? 'fill-current' : ''}`} />
          {isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Button>
      </CardFooter>
    </Card>
  );
}
