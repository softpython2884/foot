
import { NextResponse, type NextRequest } from 'next/server';
import { getManagedEventsBySportFromDb } from '@/lib/db';
import type { ManagedEventApp, ManagedEventStatus } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { sportSlug: string } }
) {
  const { sportSlug } = params;
  const searchParams = request.nextUrl.searchParams;
  const teamIdParam = searchParams.get('teamId');
  const statusParams = searchParams.getAll('status');

  let teamId: number | undefined = undefined;
  if (teamIdParam) {
    teamId = parseInt(teamIdParam, 10);
    if (isNaN(teamId)) {
      return NextResponse.json({ error: 'Invalid teamId parameter' }, { status: 400 });
    }
  }

  const validStatuses: ManagedEventStatus[] = ['upcoming', 'live', 'paused', 'finished', 'cancelled'];
  const statusFilters: ManagedEventStatus[] = statusParams.filter(s => validStatuses.includes(s as ManagedEventStatus)) as ManagedEventStatus[];

  try {
    let events: ManagedEventApp[] = await getManagedEventsBySportFromDb(sportSlug, statusFilters.length > 0 ? statusFilters : undefined);

    if (teamId !== undefined) {
      events = events.filter(event => event.homeTeam.id === teamId || event.awayTeam.id === teamId);
    }

    return NextResponse.json(events);
  } catch (error) {
    // Corrected line: No backslash before the first backtick
    console.error(`Error fetching managed events for sport ${sportSlug}:`, error);
    return NextResponse.json({ error: 'Failed to fetch events for sport' }, { status: 500 });
  }
}
