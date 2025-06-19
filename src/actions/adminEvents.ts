
'use server';

import { z } from 'zod';
import { createManagedEventInDb, updateManagedEventInDb, getManagedEventFromDb } from '@/lib/db';
import { settleBetsForManagedEvent } from './bets';
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
  homeScore: z.coerce.number().int().min(0, "Score cannot be negative.").optional().nullable(),
  awayScore: z.coerce.number().int().min(0, "Score cannot be negative.").optional().nullable(),
  elapsedTime: z.coerce.number().int().min(0, "Elapsed time cannot be negative.").optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createManagedEventAction(formData: FormData): Promise<{ error?: string; success?: string; eventId?: number; details?: any }> {
  const rawHomeScore = formData.get('homeScore');
  const homeScoreForZod = (rawHomeScore === '' || rawHomeScore === null) ? null : rawHomeScore;

  const rawAwayScore = formData.get('awayScore');
  const awayScoreForZod = (rawAwayScore === '' || rawAwayScore === null) ? null : rawAwayScore;

  const rawElapsedTime = formData.get('elapsedTime');
  const elapsedTimeForZod = (rawElapsedTime === '' || rawElapsedTime === null) ? null : rawElapsedTime;

  const validatedFields = CreateEventSchema.safeParse({
    name: formData.get('name'),
    sportSlug: formData.get('sportSlug'),
    homeTeamId: formData.get('homeTeamId'), // z.coerce.number will handle string from FormData
    awayTeamId: formData.get('awayTeamId'), // z.coerce.number will handle string from FormData
    eventTime: formData.get('eventTime'),
    status: formData.get('status') || 'upcoming',
    homeScore: homeScoreForZod,
    awayScore: awayScoreForZod,
    elapsedTime: elapsedTimeForZod,
    notes: formData.get('notes') || null,
  });

  if (!validatedFields.success) {
    console.log("Zod errors (create):", validatedFields.error.flatten());
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
      new Date(eventTime).toISOString(),
      status,
      homeScore, // Already number or null due to Zod coerce
      awayScore, // Already number or null
      elapsedTime, // Already number or null
      notes
    );

    if (!eventId) {
      return { error: 'Failed to create event in database.' };
    }
    revalidatePath('/admin');
    revalidatePath(`/sports/${sportSlug}/teams`);
    
    const createdEventDetails = await getManagedEventFromDb(eventId);
    if (createdEventDetails) {
        if(createdEventDetails.homeTeam.slug) revalidatePath(`/sports/${sportSlug}/teams/${createdEventDetails.homeTeam.slug}`);
        if(createdEventDetails.awayTeam.slug) revalidatePath(`/sports/${sportSlug}/teams/${createdEventDetails.awayTeam.slug}`);
    }


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
  homeScore: z.coerce.number().int().min(0, "Score cannot be negative.").optional().nullable(),
  awayScore: z.coerce.number().int().min(0, "Score cannot be negative.").optional().nullable(),
  winningTeamId: z.coerce.number().int().positive().optional().nullable(),
  elapsedTime: z.coerce.number().int().min(0, "Elapsed time cannot be negative.").optional().nullable(),
  notes: z.string().optional().nullable(),
});


export async function updateManagedEventAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  const rawHomeScore = formData.get('homeScore');
  const homeScoreForZod = (rawHomeScore === '' || rawHomeScore === null) ? null : rawHomeScore;

  const rawAwayScore = formData.get('awayScore');
  const awayScoreForZod = (rawAwayScore === '' || rawAwayScore === null) ? null : rawAwayScore;
  
  const rawElapsedTime = formData.get('elapsedTime');
  const elapsedTimeForZod = (rawElapsedTime === '' || rawElapsedTime === null) ? null : rawElapsedTime;

  const rawWinningTeamId = formData.get('winningTeamId');
  const winningTeamIdForZod = (rawWinningTeamId === '' || rawWinningTeamId === null || rawWinningTeamId === 'null' || rawWinningTeamId === undefined) ? null : rawWinningTeamId;


  const validatedFields = UpdateEventSchema.safeParse({
    eventId: formData.get('eventId'), // z.coerce.number will handle
    status: formData.get('status'),
    homeScore: homeScoreForZod,
    awayScore: awayScoreForZod,
    winningTeamId: winningTeamIdForZod, // z.coerce.number for string id, or null
    elapsedTime: elapsedTimeForZod,
    notes: formData.get('notes') || null,
  });

  if (!validatedFields.success) {
    console.log("Zod errors (update):", validatedFields.error.flatten());
    return { error: 'Invalid update data.', details: validatedFields.error.flatten().fieldErrors };
  }

  const { eventId, status, homeScore, awayScore, elapsedTime, notes } = validatedFields.data;
  let { winningTeamId } = validatedFields.data; // winningTeamId from Zod can be number or null


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
    } else { 
      winningTeamId = null; // Draw explicitly
    }
  } else {
     // If not finished, winningTeamId should remain null unless explicitly set by admin (though UI might restrict this)
     // If the form sends a specific winningTeamId (e.g. for a paused game where admin notes a clear leader),
     // it will be used if it passes Zod validation (i.e., it's a number or null).
     // However, bets are only settled on 'finished'.
     // Let's ensure winningTeamId is explicitly null if not finished and not otherwise set by validated data.
     if (validatedFields.data.winningTeamId === undefined && status !== 'finished') {
        winningTeamId = null;
     }
  }

  try {
    const success = await updateManagedEventInDb(eventId, status, homeScore, awayScore, winningTeamId, elapsedTime, notes);

    if (!success) {
      return { error: 'Failed to update event in database.' };
    }

    let settlementMessage = '';
    if (status === 'finished') {
      const settlementResult = await settleBetsForManagedEvent(eventId);
      if (settlementResult.error) {
        settlementMessage = ` Event updated, but with errors settling bets: ${settlementResult.error}`;
      } else if (settlementResult.success) {
        settlementMessage = ` ${settlementResult.success}`;
      }
    }
    revalidatePath('/admin');
    revalidatePath(`/sports/${existingEvent.sportSlug}/teams`);
    if(existingEvent.homeTeam.slug) revalidatePath(`/sports/${existingEvent.sportSlug}/teams/${existingEvent.homeTeam.slug}`);
    if(existingEvent.awayTeam.slug) revalidatePath(`/sports/${existingEvent.sportSlug}/teams/${existingEvent.awayTeam.slug}`);
    revalidatePath('/profile');
    return { success: `Event ${eventId} updated. Status: ${status}.${settlementMessage}` };
  } catch (error) {
    console.error('Update event error:', error);
    return { error: 'An unexpected error occurred while updating the event.' };
  }
}
