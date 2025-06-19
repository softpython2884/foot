
import { NextResponse } from 'next/server';
import { getAllManagedEventsFromDb } from '@/lib/db';
import type { ManagedEventApp } from '@/lib/types';

export async function GET() {
  console.log('[API /api/admin/events] GET request received.');
  try {
    const events: ManagedEventApp[] = await getAllManagedEventsFromDb();
    console.log(`[API /api/admin/events] Fetched ${events.length} managed events from DB.`);
    
    const eventsApp = events.map(event => ({
        ...event,
        homeTeam: event.homeTeam || { id: -1, name: 'Unknown Home Team', sportSlug: event.sportSlug, logoUrl: undefined },
        awayTeam: event.awayTeam || { id: -1, name: 'Unknown Away Team', sportSlug: event.sportSlug, logoUrl: undefined },
    }));
    // console.log('[API /api/admin/events] Processed events for response:', eventsApp);
    return NextResponse.json(eventsApp, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[API /api/admin/events] Error fetching all managed events:', error);
    return NextResponse.json({ error: 'Failed to fetch managed events from database.' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}
