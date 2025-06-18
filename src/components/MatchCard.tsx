
'use client';

import type { Match as AppMatch, RecommendedMatch, Team } from '@/lib/types'; // Use AppMatch
import { formatMatchDateTime } from '@/lib/dateUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Heart, Info, Shield, Users, Tv } from 'lucide-react'; // Added Tv icon
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface MatchCardProps {
  match: AppMatch | RecommendedMatch; // Use AppMatch
  isWatchlisted: boolean;
  onToggleWatchlist: (matchId: string | number) => void; // ID can be string or number
  isRecommended?: boolean;
}

export function MatchCard({ match, isWatchlisted, onToggleWatchlist, isRecommended = false }: MatchCardProps) {
  const [formattedDateTime, setFormattedDateTime] = useState({ date: 'Loading...', time: 'Loading...' });

  useEffect(() => {
    // API provides utcDate, mockData provides matchTime
    const timeToFormat = 'utcDate' in match && match.utcDate ? match.utcDate : match.matchTime;
    setFormattedDateTime(formatMatchDateTime(timeToFormat));
  }, [match]);

  const leagueName = typeof match.league === 'object' ? match.league.name : match.league;
  const leagueEmblem = typeof match.league === 'object' ? match.league.emblemUrl : undefined;

  const homeTeam = typeof match.homeTeam === 'object' ? match.homeTeam : { id: 'unknownHT', name: match.homeTeam } as Team;
  const awayTeam = typeof match.awayTeam === 'object' ? match.awayTeam : { id: 'unknownAT', name: match.awayTeam } as Team;
  
  const matchId = 'id' in match ? match.id : match.matchId;
  
  let displayStatus = match.status ? match.status.toLowerCase().replace(/_/g, ' ') : 'scheduled';
  if (displayStatus === 'finished') displayStatus = 'completed'; // Align with common terminology

  let scoreDisplay = null;
  if (match.status === 'FINISHED' || match.status === 'completed') {
    const homeScore = 'score' in match && match.score?.fullTime?.home !== undefined ? match.score.fullTime.home : ('homeScore' in match ? match.homeScore : null);
    const awayScore = 'score' in match && match.score?.fullTime?.away !== undefined ? match.score.fullTime.away : ('awayScore' in match ? match.awayScore : null);
    if (homeScore !== null && awayScore !== null) {
      scoreDisplay = `${homeScore} - ${awayScore}`;
    }
  }


  return (
    <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card text-card-foreground">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline text-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {homeTeam.crestUrl || homeTeam.logoImageUrl ? (
                <Image 
                  src={homeTeam.crestUrl || homeTeam.logoImageUrl!} 
                  alt={`${homeTeam.name} logo`} 
                  width={24} 
                  height={24} 
                  className="rounded-full object-contain"
                  data-ai-hint={`${homeTeam.name} logo`} 
                />
              ) : <div className="w-6 h-6 bg-muted rounded-full" />}
              <span className="truncate" title={homeTeam.name}>{homeTeam.name}</span>
            </div>
            {scoreDisplay ? (
                <span className="text-2xl font-bold text-primary mx-2">{scoreDisplay}</span>
            ) : (
                 <span className="text-muted-foreground mx-2 text-sm">vs</span>
            )}
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="truncate text-right" title={awayTeam.name}>{awayTeam.name}</span>
              {awayTeam.crestUrl || awayTeam.logoImageUrl ? (
                 <Image 
                  src={awayTeam.crestUrl || awayTeam.logoImageUrl!} 
                  alt={`${awayTeam.name} logo`} 
                  width={24} 
                  height={24} 
                  className="rounded-full object-contain"
                  data-ai-hint={`${awayTeam.name} logo`}
                />
              ) : <div className="w-6 h-6 bg-muted rounded-full" />}
            </div>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1 text-muted-foreground">
          {leagueEmblem ? (
            <Image src={leagueEmblem} alt={`${leagueName} emblem`} width={16} height={16} className="object-contain" />
          ) : (
            <Shield size={16} />
          )}
          {leagueName}
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
         <div className="flex items-center gap-2 text-sm text-muted-foreground capitalize">
          <Tv size={16} />
          <span>Status: {displayStatus}</span>
        </div>
        {'venue' in match && match.venue && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            <span>Venue: {match.venue}</span>
          </div>
        )}
        {isRecommended && 'reason' in match && (
          <div className="flex items-start gap-2 text-sm text-accent-foreground bg-accent/20 p-2 rounded-md border border-accent">
            <Info size={20} className="text-accent flex-shrink-0 mt-0.5" />
            <p><span className="font-semibold">Recommendation Reason:</span> {match.reason}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant={isWatchlisted ? 'destructive' : 'default'}
          onClick={() => onToggleWatchlist(matchId)}
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
