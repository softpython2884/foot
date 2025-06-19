
import { NextResponse } from 'next/server';
import { getAllManagedEventsFromDb } from '@/lib/db';
import type { ManagedEventApp } from '@/lib/types';

export async function GET() {
  try {
    const events: ManagedEventApp[] = await getAllManagedEventsFromDb();
    // Ensure all team data is at least minimally present
    const eventsApp = events.map(event => ({
        ...event,
        homeTeam: event.homeTeam || { id: -1, name: 'Unknown Home Team', sportSlug: event.sportSlug },
        awayTeam: event.awayTeam || { id: -1, name: 'Unknown Away Team', sportSlug: event.sportSlug },
    }));
    return NextResponse.json(eventsApp);
  } catch (error) {
    console.error('Error fetching all managed events:', error);
    return NextResponse.json({ error: 'Failed to fetch managed events from database.' }, { status: 500 });
  }
}
