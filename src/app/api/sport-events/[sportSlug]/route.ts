
// File: src/app/api/sport-events/[sportSlug]/route.ts
import { NextResponse } from 'next/server';
import { getManagedEventsBySportFromDb } from '@/lib/db';
import type { ManagedEventDb, ManagedEventApp, TeamApp } from '@/lib/types';
import { footballTeams, formula1Entities, basketballTeams } from '@/lib/mockData'; // For team details

function mapManagedEventDbToApp(eventDb: ManagedEventDb): ManagedEventApp {
  // Helper to find team details (API ID is stored)
  const findTeamDetails = (apiId: number, sportSlug: string): TeamApp => {
    let teamPool: TeamApp[] = [];
    if (sportSlug === 'football') teamPool = footballTeams;
    else if (sportSlug === 'formula-1') teamPool = formula1Entities;
    else if (sportSlug === 'basketball') teamPool = basketballTeams;
    
    const foundTeam = teamPool.find(t => t.id === apiId);
    return foundTeam || { id: apiId, name: 'Unknown Team', sportSlug: sportSlug, logoUrl: `https://placehold.co/40x40.png?text=T` };
  };

  return {
    id: eventDb.id,
    sportSlug: eventDb.sportSlug,
    homeTeam: findTeamDetails(eventDb.homeTeamApiId, eventDb.sportSlug),
    awayTeam: findTeamDetails(eventDb.awayTeamApiId, eventDb.sportSlug),
    homeTeamName: eventDb.homeTeamName, // Keep original names too for display consistency if needed
    awayTeamName: eventDb.awayTeamName,
    homeTeamLogoUrl: eventDb.homeTeamLogoUrl,
    awayTeamLogoUrl: eventDb.awayTeamLogoUrl,
    eventTime: eventDb.eventTime,
    status: eventDb.status,
    homeScore: eventDb.homeScore,
    awayScore: eventDb.awayScore,
    winnerTeam: eventDb.winnerTeamApiId ? findTeamDetails(eventDb.winnerTeamApiId, eventDb.sportSlug) : null,
    leagueName: eventDb.leagueName,
    createdAt: eventDb.createdAt,
    updatedAt: eventDb.updatedAt,
  };
}


export async function GET(
  request: Request,
  { params }: { params: { sportSlug: string } }
) {
  const { sportSlug } = params;

  if (!sportSlug) {
    return NextResponse.json({ error: 'Sport slug is required' }, { status: 400 });
  }

  try {
    const eventsDb = await getManagedEventsBySportFromDb(sportSlug);
    const eventsApp = eventsDb.map(mapManagedEventDbToApp);
    return NextResponse.json(eventsApp);
  } catch (error) {
    console.error(\`Error fetching managed events for sport \${sportSlug}:\`, error);
    return NextResponse.json({ error: 'Failed to fetch events for sport' }, { status: 500 });
  }
}
