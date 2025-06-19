
import { NextResponse } from 'next/server';
import { footballTeams, formula1Entities, basketballTeams, supportedSports } from '@/lib/mockData';
import type { TeamApp } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { sportSlug: string } }
) {
  const { sportSlug } = params;

  try {
    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) {
      return NextResponse.json({ error: 'Sport not found' }, { 
        status: 404,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    let teams: TeamApp[] = [];

    if (sportSlug === 'football') {
      teams = footballTeams as TeamApp[];
    } else if (sportSlug === 'formula-1') {
      teams = formula1Entities as TeamApp[];
    } else if (sportSlug === 'basketball') {
      teams = basketballTeams as TeamApp[];
    } else {
      return NextResponse.json({ message: `Team data for ${sport.name} is not yet available via API.` }, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

    return NextResponse.json(teams, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error(`Error fetching teams for sport ${sportSlug}:`, error);
    return NextResponse.json({ error: `Failed to fetch teams for ${sportSlug}` }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}

    
