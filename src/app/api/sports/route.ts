
import { NextResponse } from 'next/server';
import { supportedSports } from '@/lib/mockData';
import type { SportDefinition } from '@/lib/types';

export async function GET() {
  try {
    const sports: SportDefinition[] = supportedSports;
    return NextResponse.json(sports);
  } catch (error)
    {
        console.error('Error fetching supported sports:', error);
        return NextResponse.json({ error: 'Failed to fetch supported sports' }, { status: 500 });
    }
}
