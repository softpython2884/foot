
import { NextResponse } from 'next/server';
import { footballTeams, formula1Entities, basketballTeams, supportedSports } from '@/lib/mockData';
import type { TeamApp } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { sportSlug: string } }
) {
  const { sportSlug } = params;
  console.log(`[API /api/sports/${sportSlug}/teams] GET request received.`);

  try {
    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) {
      console.warn(`[API /api/sports/${sportSlug}/teams] Sport not found.`);
      return NextResponse.json({ error: 'Sport not found' }, { 
        status: 404,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }
    console.log(`[API /api/sports/${sportSlug}/teams] Sport found: ${sport.name}`);

    let teams: TeamApp[] = [];

    if (sportSlug === 'football') {
      teams = footballTeams as TeamApp[];
    } else if (sportSlug === 'formula-1') {
      teams = formula1Entities as TeamApp[];
    } else if (sportSlug === 'basketball') {
      teams = basketballTeams as TeamApp[];
    } else {
      console.log(`[API /api/sports/${sportSlug}/teams] No specific team data for this sport via API. Sending message.`);
      return NextResponse.json({ message: `Team data for ${sport.name} is not yet available via API.` }, { 
        status: 200, // Or 404 if you prefer to indicate no data found for this specific sport's teams
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }
    console.log(`[API /api/sports/${sportSlug}/teams] Returning ${teams.length} teams.`);
    return NextResponse.json(teams, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error(`[API /api/sports/${sportSlug}/teams] Error fetching teams:`, error);
    return NextResponse.json({ error: `Failed to fetch teams for ${sportSlug}` }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}
