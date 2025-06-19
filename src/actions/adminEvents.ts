
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
  console.log('[adminEventsAction] Server: createManagedEventAction called. FormData entries:');
  for (const pair of formData.entries()) {
    console.log(`  ${pair[0]}: ${pair[1]}`);
  }

  const rawHomeScore = formData.get('homeScore');
  const homeScoreForZod = (rawHomeScore === '' || rawHomeScore === null) ? null : rawHomeScore;

  const rawAwayScore = formData.get('awayScore');
  const awayScoreForZod = (rawAwayScore === '' || rawAwayScore === null) ? null : rawAwayScore;

  const rawElapsedTime = formData.get('elapsedTime');
  const elapsedTimeForZod = (rawElapsedTime === '' || rawElapsedTime === null) ? null : rawElapsedTime;

  const dataToValidate = {
    name: formData.get('name'),
    sportSlug: formData.get('sportSlug'),
    homeTeamId: formData.get('homeTeamId'),
    awayTeamId: formData.get('awayTeamId'),
    eventTime: formData.get('eventTime'),
    status: formData.get('status') || 'upcoming',
    homeScore: homeScoreForZod,
    awayScore: awayScoreForZod,
    elapsedTime: elapsedTimeForZod,
    notes: formData.get('notes') || null,
  };
  console.log('[adminEventsAction] Server: Data prepared for Zod validation (create):', dataToValidate);

  const validatedFields = CreateEventSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error("[adminEventsAction] Server: Zod validation failed (create):", validatedFields.error.flatten());
    return { error: 'Invalid event data.', details: validatedFields.error.flatten().fieldErrors };
  }
  console.log('[adminEventsAction] Server: Zod validation successful (create). Validated data:', validatedFields.data);

  const { name, sportSlug, homeTeamId, awayTeamId, eventTime, status, homeScore, awayScore, elapsedTime, notes } = validatedFields.data;

  if (homeTeamId === awayTeamId) {
    console.warn('[adminEventsAction] Server: Home and Away teams are the same.');
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
      homeScore,
      awayScore,
      elapsedTime,
      notes
    );

    if (!eventId) {
      console.error('[adminEventsAction] Server: Failed to create event in database.');
      return { error: 'Failed to create event in database.' };
    }
    console.log(`[adminEventsAction] Server: Event created successfully with ID: ${eventId}. Revalidating paths.`);
    revalidatePath('/admin');
    revalidatePath(`/sports/${sportSlug}/teams`);
    
    const createdEventDetails = await getManagedEventFromDb(eventId);
    if (createdEventDetails) {
        if(createdEventDetails.homeTeam.slug) revalidatePath(`/sports/${sportSlug}/teams/${createdEventDetails.homeTeam.slug}`);
        if(createdEventDetails.awayTeam.slug) revalidatePath(`/sports/${sportSlug}/teams/${createdEventDetails.awayTeam.slug}`);
    }

    return { success: 'Event created successfully!', eventId };
  } catch (error) {
    console.error('[adminEventsAction] Server: Unexpected error during event creation:', error);
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
  winningTeamId: z.coerce.number().int().positive().optional().nullable(), // Accepts number or null (after coercion)
  elapsedTime: z.coerce.number().int().min(0, "Elapsed time cannot be negative.").optional().nullable(),
  notes: z.string().optional().nullable(),
});


export async function updateManagedEventAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  console.log('[adminEventsAction] Server: updateManagedEventAction called. FormData entries:');
  for (const pair of formData.entries()) {
    console.log(`  ${pair[0]}: ${pair[1]}`);
  }

  const rawHomeScore = formData.get('homeScore');
  const homeScoreForZod = (rawHomeScore === '' || rawHomeScore === null) ? null : rawHomeScore;
  
  const rawAwayScore = formData.get('awayScore');
  const awayScoreForZod = (rawAwayScore === '' || rawAwayScore === null) ? null : rawAwayScore;
  
  const rawElapsedTime = formData.get('elapsedTime');
  const elapsedTimeForZod = (rawElapsedTime === '' || rawElapsedTime === null) ? null : rawElapsedTime;

  const rawWinningTeamId = formData.get('winningTeamId');
  // If winningTeamId is an empty string (from "Draw/No Winner" select option), it should become null for Zod.
  const winningTeamIdForZod = (rawWinningTeamId === '' || rawWinningTeamId === null || rawWinningTeamId === undefined || rawWinningTeamId === 'null') ? null : rawWinningTeamId;

  const dataToValidate = {
    eventId: formData.get('eventId'),
    status: formData.get('status'),
    homeScore: homeScoreForZod,
    awayScore: awayScoreForZod,
    winningTeamId: winningTeamIdForZod,
    elapsedTime: elapsedTimeForZod,
    notes: formData.get('notes') || null,
  };
  console.log('[adminEventsAction] Server: Data prepared for Zod validation (update):', dataToValidate);

  const validatedFields = UpdateEventSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error("[adminEventsAction] Server: Zod validation failed (update):", validatedFields.error.flatten());
    return { error: 'Invalid update data.', details: validatedFields.error.flatten().fieldErrors };
  }
  console.log('[adminEventsAction] Server: Zod validation successful (update). Validated data:', validatedFields.data);

  const { eventId, status } = validatedFields.data;
  // Use validated values directly
  const homeScore = validatedFields.data.homeScore;
  const awayScore = validatedFields.data.awayScore;
  let winningTeamId = validatedFields.data.winningTeamId; // This is now number | null | undefined
  const elapsedTime = validatedFields.data.elapsedTime;
  const notes = validatedFields.data.notes;

  const existingEvent = await getManagedEventFromDb(eventId);
  if (!existingEvent) {
    console.warn(`[adminEventsAction] Server: Event with ID ${eventId} not found for update.`);
    return { error: 'Event not found.' };
  }
  console.log('[adminEventsAction] Server: Existing event details:', existingEvent);


  if (status === 'finished') {
    if (homeScore == null || awayScore == null) {
      console.warn('[adminEventsAction] Server: Scores are required to finish an event.');
      return { error: 'Home and Away scores are required to finish an event.' };
    }
    if (homeScore > awayScore) {
      winningTeamId = existingEvent.homeTeam.id;
    } else if (awayScore > homeScore) {
      winningTeamId = existingEvent.awayTeam.id;
    } else { 
      winningTeamId = null; // Draw explicitly
    }
    console.log(`[adminEventsAction] Server: Event finished. Auto-determined winningTeamId: ${winningTeamId}`);
  } else {
     // If not 'finished', winningTeamId from form (if provided and valid) is used.
     // If it wasn't provided or was invalid, validatedFields.data.winningTeamId would be null/undefined.
     // No need to explicitly set to null here unless status is not 'finished' AND it wasn't in form.
     // The Zod schema handles optionality.
     console.log(`[adminEventsAction] Server: Event not finished. Using winningTeamId from form (if any): ${winningTeamId}`);
  }

  try {
    console.log(`[adminEventsAction] Server: Updating event ${eventId} in DB with status: ${status}, homeScore: ${homeScore}, awayScore: ${awayScore}, winningTeamId: ${winningTeamId}, elapsedTime: ${elapsedTime}`);
    const success = await updateManagedEventInDb(eventId, status, homeScore, awayScore, winningTeamId, elapsedTime, notes);

    if (!success) {
      console.error(`[adminEventsAction] Server: Failed to update event ${eventId} in database.`);
      return { error: 'Failed to update event in database.' };
    }
    console.log(`[adminEventsAction] Server: Event ${eventId} updated in DB. Proceeding to settle bets if finished.`);

    let settlementMessage = '';
    if (status === 'finished') {
      console.log(`[adminEventsAction] Server: Event ${eventId} is finished. Attempting to settle bets.`);
      const settlementResult = await settleBetsForManagedEvent(eventId);
      if (settlementResult.error) {
        settlementMessage = ` Event updated, but with errors settling bets: ${settlementResult.error}`;
        console.warn(`[adminEventsAction] Server: Bet settlement for event ${eventId} had errors: ${settlementResult.error}`);
      } else if (settlementResult.success) {
        settlementMessage = ` ${settlementResult.success}`;
        console.log(`[adminEventsAction] Server: Bet settlement for event ${eventId} successful: ${settlementResult.success}`);
      }
    }
    console.log(`[adminEventsAction] Server: Update for event ${eventId} successful. Revalidating paths.`);
    revalidatePath('/admin');
    revalidatePath(`/sports/${existingEvent.sportSlug}/teams`);
    if(existingEvent.homeTeam.slug) revalidatePath(`/sports/${existingEvent.sportSlug}/teams/${existingEvent.homeTeam.slug}`);
    if(existingEvent.awayTeam.slug) revalidatePath(`/sports/${existingEvent.sportSlug}/teams/${existingEvent.awayTeam.slug}`);
    revalidatePath('/profile');
    return { success: `Event ID ${eventId} (status: ${status}) updated.${settlementMessage}` };
  } catch (error) {
    console.error(`[adminEventsAction] Server: Unexpected error during event update for ID ${eventId}:`, error);
    return { error: 'An unexpected error occurred while updating the event.' };
  }
}
