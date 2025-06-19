
import { NextResponse } from 'next/server';
import { footballTeams, formula1Entities, basketballTeams, supportedSports } from '@/lib/mockData';
import type { TeamApp } from '@/lib/types'; // Using TeamApp as the consistent return type

export async function GET(
  request: Request,
  { params }: { params: { sportSlug: string } }
) {
  const { sportSlug } = params;

  try {
    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) {
      return NextResponse.json({ error: 'Sport not found' }, { status: 404 });
    }

    let teams: TeamApp[] = [];

    if (sportSlug === 'football') {
      teams = footballTeams as TeamApp[]; // footballTeams are already compatible with TeamApp
    } else if (sportSlug === 'formula-1') {
      teams = formula1Entities as TeamApp[]; // formula1Entities are compatible
    } else if (sportSlug === 'basketball') {
      teams = basketballTeams as TeamApp[]; // basketballTeams are compatible
    } else {
      // Placeholder for other sports - return empty array or specific message
      return NextResponse.json({ message: `Team data for ${sport.name} is not yet available via API.` }, { status: 200 });
    }

    return NextResponse.json(teams);
  } catch (error) {
    console.error(`Error fetching teams for sport ${sportSlug}:`, error);
    return NextResponse.json({ error: `Failed to fetch teams for ${sportSlug}` }, { status: 500 });
  }
}

    