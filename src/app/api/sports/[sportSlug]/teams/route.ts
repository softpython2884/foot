
import { NextResponse } from 'next/server';
import { footballTeams, supportedSports } from '@/lib/mockData';
import type { TeamApp } from '@/lib/types';

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
      // Ensure mock footballTeams match TeamApp structure if needed, or cast
      teams = footballTeams as TeamApp[];
    } else {
      // Placeholder for other sports - return empty array or specific message
      // teams = await getTeamsForOtherSport(sportSlug);
      return NextResponse.json({ message: `Team data for ${sport.name} is not yet available via API.` }, { status: 200 });
    }

    return NextResponse.json(teams);
  } catch (error) {
    console.error(`Error fetching teams for sport ${sportSlug}:`, error);
    return NextResponse.json({ error: `Failed to fetch teams for ${sportSlug}` }, { status: 500 });
  }
}
