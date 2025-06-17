'use client';

import type { Match, RecommendedMatch } from '@/lib/types';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Heart, Info, Shield, Users } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface MatchCardProps {
  match: Match | RecommendedMatch;
  isWatchlisted: boolean;
  onToggleWatchlist: (matchId: string) => void;
  isRecommended?: boolean;
}

export function MatchCard({ match, isWatchlisted, onToggleWatchlist, isRecommended = false }: MatchCardProps) {
  const [formattedDateTime, setFormattedDateTime] = useState({ date: 'Loading...', time: 'Loading...' });

  useEffect(() => {
    setFormattedDateTime(formatMatchDateTime(match.matchTime));
  }, [match.matchTime]);

  const leagueName = 'league' in match && typeof match.league === 'object' ? match.league.name : match.league;
  const homeTeamName = 'homeTeam' in match && typeof match.homeTeam === 'object' ? match.homeTeam.name : match.homeTeam;
  const awayTeamName = 'awayTeam' in match && typeof match.awayTeam === 'object' ? match.awayTeam.name : match.awayTeam;
  const matchId = 'id' in match ? match.id : match.matchId;
  
  const homeTeamObj = 'homeTeam' in match && typeof match.homeTeam === 'object' ? match.homeTeam : { name: homeTeamName };
  const awayTeamObj = 'awayTeam' in match && typeof match.awayTeam === 'object' ? match.awayTeam : { name: awayTeamName };


  return (
    <Card className="w-full max-w-md shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-card text-card-foreground">
      <CardHeader className="pb-3">
        <CardTitle className="font-headline text-xl">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Image 
                src={`https://placehold.co/32x32.png`} 
                alt={`${homeTeamObj.name} logo`} 
                width={24} 
                height={24} 
                className="rounded-full"
                data-ai-hint={`${homeTeamObj.name} logo`} 
              />
              <span>{homeTeamObj.name}</span>
            </div>
            <span className="text-muted-foreground">vs</span>
            <div className="flex items-center gap-2">
              <span>{awayTeamObj.name}</span>
               <Image 
                src={`https://placehold.co/32x32.png`} 
                alt={`${awayTeamObj.name} logo`} 
                width={24} 
                height={24} 
                className="rounded-full"
                data-ai-hint={`${awayTeamObj.name} logo`}
              />
            </div>
          </div>
        </CardTitle>
        <CardDescription className="flex items-center gap-2 pt-1 text-muted-foreground">
          <Shield size={16} />
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
          aria-label={isWatchlisted ? `Remove ${homeTeamObj.name} vs ${awayTeamObj.name} from watchlist` : `Add ${homeTeamObj.name} vs ${awayTeamObj.name} to watchlist`}
        >
          <Heart size={18} className={`mr-2 ${isWatchlisted ? 'fill-current' : ''}`} />
          {isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
        </Button>
      </CardFooter>
    </Card>
  );
}
