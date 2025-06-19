
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
  console.log(`[API /api/sport-events/${sportSlug}] GET request received. teamId: ${teamIdParam}, status: ${statusParams.join(',')}`);


  let teamId: number | undefined = undefined;
  if (teamIdParam) {
    teamId = parseInt(teamIdParam, 10);
    if (isNaN(teamId)) {
      console.warn(`[API /api/sport-events/${sportSlug}] Invalid teamId parameter: ${teamIdParam}`);
      return NextResponse.json({ error: 'Invalid teamId parameter' }, { 
        status: 400,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }
  }

  const validStatuses: ManagedEventStatus[] = ['upcoming', 'live', 'paused', 'finished', 'cancelled'];
  const statusFilters: ManagedEventStatus[] = statusParams.filter(s => validStatuses.includes(s as ManagedEventStatus)) as ManagedEventStatus[];
  console.log(`[API /api/sport-events/${sportSlug}] Applied status filters: ${statusFilters.join(',') || 'None'}`);

  try {
    let eventsDb: ManagedEventApp[] = await getManagedEventsBySportFromDb(sportSlug, statusFilters.length > 0 ? statusFilters : undefined);
    console.log(`[API /api/sport-events/${sportSlug}] Fetched ${eventsDb.length} events from DB before team filtering.`);

    if (teamId !== undefined) {
      eventsDb = eventsDb.filter(event => event.homeTeam.id === teamId || event.awayTeam.id === teamId);
      console.log(`[API /api/sport-events/${sportSlug}] Filtered to ${eventsDb.length} events for teamId: ${teamId}.`);
    }
    
    const eventsApp = eventsDb.map(event => ({
        ...event,
        homeTeam: event.homeTeam || { id: -1, name: 'Unknown Home Team', sportSlug: event.sportSlug, logoUrl: undefined },
        awayTeam: event.awayTeam || { id: -1, name: 'Unknown Away Team', sportSlug: event.sportSlug, logoUrl: undefined },
    }));
    // console.log(`[API /api/sport-events/${sportSlug}] Processed events for response:`, eventsApp);

    return NextResponse.json(eventsApp, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error(`[API /api/sport-events/${sportSlug}] Error fetching managed events:`, error);
    return NextResponse.json({ error: 'Failed to fetch events for sport' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}
