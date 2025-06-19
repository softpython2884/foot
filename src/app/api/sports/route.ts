
import { NextResponse } from 'next/server';
import { supportedSports } from '@/lib/mockData';
import type { SportDefinition } from '@/lib/types';

export async function GET() {
  console.log('[API /api/sports] GET request received for supported sports.');
  try {
    const sports: SportDefinition[] = supportedSports;
    console.log(`[API /api/sports] Returning ${sports.length} supported sports.`);
    return NextResponse.json(sports, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error)
    {
        console.error('[API /api/sports] Error fetching supported sports:', error);
        return NextResponse.json({ error: 'Failed to fetch supported sports' }, { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        });
    }
}
