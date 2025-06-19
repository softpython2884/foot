
'use server';

import { z } from 'zod';
import { createManagedEventInDb, updateManagedEventInDb, getManagedEventFromDb } from '@/lib/db';
import { settleBetsForManagedEvent } from './bets'; // Assuming this function exists and is correctly implemented
import type { ManagedEventStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const CreateEventSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters."),
  sportSlug: z.string().min(1, "Sport must be selected."),
  homeTeamId: z.coerce.number().int().positive("Home team must be selected."),
  awayTeamId: z.coerce.number().int().positive("Away team must be selected."),
  eventTime: z.string().datetime({ message: "Invalid event date/time format." }),
  status: z.custom<ManagedEventStatus>((val) => ['upcoming', 'live', 'paused', 'finished', 'cancelled'].includes(val as string), {
    message: "Invalid event status",
  }).optional().default('upcoming'),
  homeScore: z.coerce.number().int().min(0).optional().nullable(),
  awayScore: z.coerce.number().int().min(0).optional().nullable(),
  elapsedTime: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createManagedEventAction(formData: FormData): Promise<{ error?: string; success?: string; eventId?: number; details?: any }> {
  const validatedFields = CreateEventSchema.safeParse({
    name: formData.get('name'),
    sportSlug: formData.get('sportSlug'),
    homeTeamId: formData.get('homeTeamId'),
    awayTeamId: formData.get('awayTeamId'),
    eventTime: formData.get('eventTime'),
    status: formData.get('status') || 'upcoming',
    homeScore: formData.get('homeScore') ? parseInt(formData.get('homeScore') as string, 10) : null,
    awayScore: formData.get('awayScore') ? parseInt(formData.get('awayScore') as string, 10) : null,
    elapsedTime: formData.get('elapsedTime') ? parseInt(formData.get('elapsedTime') as string, 10) : null,
    notes: formData.get('notes') || null,
  });

  if (!validatedFields.success) {
    return { error: 'Invalid event data.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { name, sportSlug, homeTeamId, awayTeamId, eventTime, status, homeScore, awayScore, elapsedTime, notes } = validatedFields.data;

  if (homeTeamId === awayTeamId) {
    return { error: 'Home team and Away team cannot be the same.' };
  }

  try {
    const eventId = await createManagedEventInDb(
      name,
      sportSlug,
      homeTeamId,
      awayTeamId,
      new Date(eventTime).toISOString(), // Ensure ISO format
      status,
      homeScore,
      awayScore,
      elapsedTime,
      notes
    );

    if (!eventId) {
      return { error: 'Failed to create event in database.' };
    }
    revalidatePath('/admin');
    revalidatePath(`/sports/${sportSlug}/teams`);
    return { success: 'Event created successfully!', eventId };
  } catch (error) {
    console.error('Create event error:', error);
    return { error: 'An unexpected error occurred while creating the event.' };
  }
}

const UpdateEventSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  status: z.custom<ManagedEventStatus>((val) => ['upcoming', 'live', 'paused', 'finished', 'cancelled'].includes(val as string), {
    message: "Invalid event status",
  }),
  homeScore: z.coerce.number().int().min(0).optional().nullable(),
  awayScore: z.coerce.number().int().min(0).optional().nullable(),
  winningTeamId: z.coerce.number().int().positive().optional().nullable(),
  elapsedTime: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
});


export async function updateManagedEventAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  const validatedFields = UpdateEventSchema.safeParse({
    eventId: formData.get('eventId'),
    status: formData.get('status'),
    homeScore: formData.get('homeScore') ? parseInt(formData.get('homeScore') as string, 10) : null,
    awayScore: formData.get('awayScore') ? parseInt(formData.get('awayScore') as string, 10) : null,
    winningTeamId: formData.get('winningTeamId') ? parseInt(formData.get('winningTeamId') as string, 10) : null,
    elapsedTime: formData.get('elapsedTime') ? parseInt(formData.get('elapsedTime') as string, 10) : null,
    notes: formData.get('notes') || null,
  });

  if (!validatedFields.success) {
    return { error: 'Invalid update data.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { eventId, status, homeScore, awayScore, elapsedTime, notes } = validatedFields.data;
  let { winningTeamId } = validatedFields.data;


  const existingEvent = await getManagedEventFromDb(eventId);
  if (!existingEvent) {
    return { error: 'Event not found.' };
  }
  
  if (status === 'finished') {
    if (homeScore == null || awayScore == null) {
      return { error: 'Home and Away scores are required to finish an event.' };
    }
    if (homeScore > awayScore) {
      winningTeamId = existingEvent.homeTeam.id;
    } else if (awayScore > homeScore) {
      winningTeamId = existingEvent.awayTeam.id;
    } else { // Draw
      winningTeamId = null; // Or a special ID for draw if your system uses one
    }
  } else {
    // If not finished, winningTeamId should be null unless explicitly set (which is unlikely for non-finished)
     if (status !== 'finished' && winningTeamId !== undefined) {
        winningTeamId = null;
     }
  }

  try {
    const success = await updateManagedEventInDb(eventId, status, homeScore, awayScore, winningTeamId, elapsedTime, notes);

    if (!success) {
      return { error: 'Failed to update event in database.' };
    }

    if (status === 'finished') {
      // Settle bets for this event
      const settlementResult = await settleBetsForManagedEvent(eventId);
      if (settlementResult.error) {
        return { success: 'Event updated, but with errors settling bets.', error: settlementResult.error };
      }
    }
    revalidatePath('/admin');
    revalidatePath(`/sports/${existingEvent.sportSlug}/teams`);
    revalidatePath('/profile'); // Revalidate profile in case user score changes
    return { success: `Event ${eventId} updated successfully. Status: ${status}.` };
  } catch (error) {
    console.error('Update event error:', error);
    return { error: 'An unexpected error occurred while updating the event.' };
  }
}
