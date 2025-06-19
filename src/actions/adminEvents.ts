
'use server';

import { z } from 'zod';
import { createManagedEventInDb, updateManagedEventInDb, getManagedEventFromDb, getPendingBetsForManagedEventDb, updateUserScoreDb } from '@/lib/db';
import type { ManagedEventDb } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { footballTeams } from '@/lib/mockData'; // Assuming we use mockData for team selection for now

const CreateManagedEventSchema = z.object({
  sportSlug: z.string().min(1, { message: 'Sport is required.' }),
  homeTeamApiId: z.coerce.number().int().positive({ message: 'Home team is required.' }),
  awayTeamApiId: z.coerce.number().int().positive({ message: 'Away team is required.' }),
  eventTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date/time format.' }),
  leagueName: z.string().optional(),
});

const UpdateManagedEventSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  status: z.enum(['upcoming', 'live', 'paused', 'finished', 'cancelled']),
  homeScore: z.coerce.number().int().min(0).optional().nullable(),
  awayScore: z.coerce.number().int().min(0).optional().nullable(),
  winnerTeamApiId: z.coerce.number().int().positive().optional().nullable(), // only used when status becomes 'finished' AND scores are equal (manual override)
});


export async function createManagedEventAction(formData: FormData): Promise<{ error?: string; success?: string; eventId?: number; details?: any }> {
  try {
    const validatedFields = CreateManagedEventSchema.safeParse({
      sportSlug: formData.get('sportSlug'),
      homeTeamApiId: formData.get('homeTeamApiId'),
      awayTeamApiId: formData.get('awayTeamApiId'),
      eventTime: formData.get('eventTime'),
      leagueName: formData.get('leagueName'),
    });

    if (!validatedFields.success) {
      return { error: 'Invalid event data.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { sportSlug, homeTeamApiId, awayTeamApiId, eventTime, leagueName } = validatedFields.data;

    if (homeTeamApiId === awayTeamApiId) {
      return { error: 'Home team and away team cannot be the same.' };
    }
    
    let homeTeam, awayTeam;
    if (sportSlug === 'football') {
        homeTeam = footballTeams.find(t => t.id === homeTeamApiId);
        awayTeam = footballTeams.find(t => t.id === awayTeamApiId);
    }

    if (!homeTeam || !awayTeam) {
        return { error: 'Could not find team details for selected teams.'};
    }

    const eventToCreate: Omit<ManagedEventDb, 'id' | 'createdAt' | 'updatedAt'> = {
      sportSlug,
      homeTeamApiId,
      awayTeamApiId,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
      homeTeamLogoUrl: homeTeam.logoUrl,
      awayTeamLogoUrl: awayTeam.logoUrl,
      eventTime: new Date(eventTime).toISOString(),
      status: 'upcoming',
      homeScore: null,
      awayScore: null,
      winnerTeamApiId: null,
      leagueName: leagueName || `${sportSlug.toUpperCase()} Custom Event`,
    };

    const eventId = await createManagedEventInDb(eventToCreate);

    if (!eventId) {
      return { error: 'Failed to create event.' };
    }
    
    revalidatePath('/admin');
    revalidatePath(`/sports/${sportSlug}/teams`); 
    return { success: 'Event created successfully!', eventId };

  } catch (error) {
    console.error('Create event error:', error);
    return { error: 'An unexpected error occurred while creating the event.' };
  }
}

export async function updateManagedEventAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  try {
    const validatedFields = UpdateManagedEventSchema.safeParse({
      eventId: formData.get('eventId'),
      status: formData.get('status'),
      homeScore: formData.get('homeScore') ? parseInt(formData.get('homeScore') as string, 10) : null,
      awayScore: formData.get('awayScore') ? parseInt(formData.get('awayScore') as string, 10) : null,
      winnerTeamApiId: formData.get('winnerTeamApiId') ? parseInt(formData.get('winnerTeamApiId') as string, 10) : null,
    });

    if (!validatedFields.success) {
      return { error: 'Invalid update data.', details: validatedFields.error.flatten().fieldErrors };
    }
    
    const { eventId, status } = validatedFields.data;
    let { homeScore, awayScore, winnerTeamApiId } = validatedFields.data;


    const existingEvent = await getManagedEventFromDb(eventId);
    if (!existingEvent) {
      return { error: 'Event not found.' };
    }

    // Prepare the update object. Scores are updated regardless of status for live/paused.
    const eventToUpdate: Partial<ManagedEventDb> & { id: number } = {
      id: eventId,
      status,
      homeScore: homeScore, // Will be null if not provided or empty string
      awayScore: awayScore, // Will be null if not provided or empty string
    };

    if (status === 'finished') {
      if (homeScore == null || awayScore == null) { // Ensure scores are set when finishing
        return { error: 'Scores must be provided to finish an event.' };
      }
      if (homeScore > awayScore) {
        winnerTeamApiId = existingEvent.homeTeamApiId;
      } else if (awayScore > homeScore) {
        winnerTeamApiId = existingEvent.awayTeamApiId;
      } else { // Draw
        winnerTeamApiId = null; // Explicitly set to null for a draw
      }
      eventToUpdate.winnerTeamApiId = winnerTeamApiId; // Add winnerTeamApiId to update for 'finished' status
    } else {
      // If not finishing, ensure winnerTeamApiId is not accidentally set (it should remain as is or null)
      // We don't explicitly set winnerTeamApiId in eventToUpdate here unless status is 'finished'.
      // If scores are updated while 'live' or 'paused', winnerTeamApiId in DB remains unchanged.
    }
    
    const updated = await updateManagedEventInDb(eventToUpdate);
    if (!updated) {
      return { error: 'Failed to update event.' };
    }

    // Settle bets only if the event is newly finished AND a winner (or draw) has been determined.
    // winnerTeamApiId will be set (or null for draw) inside the 'finished' block above.
    if (status === 'finished' && existingEvent.status !== 'finished') { 
      await settleBetsForManagedEvent(eventId, eventToUpdate.winnerTeamApiId); // Use the determined winnerTeamApiId
    }

    revalidatePath('/admin');
    revalidatePath(`/sports/${existingEvent.sportSlug}/teams`);
    return { success: `Event ${eventId} updated to ${status}.` };

  } catch (error) {
    console.error('Update event error:', error);
    return { error: 'An unexpected error occurred while updating the event.' };
  }
}


async function settleBetsForManagedEvent(managedEventId: number, winnerTeamApiId: number | null) {
  const pendingBets = await getPendingBetsForManagedEventDb(managedEventId);

  for (const bet of pendingBets) {
    let userWon = false;
    if (winnerTeamApiId === null) { // Draw scenario
      userWon = false; // For now, all bets lose on a draw unless specific "draw" bet types are introduced
    } else if (bet.teamIdBetOn === winnerTeamApiId) {
      userWon = true;
    }

    const newStatus = userWon ? 'won' : 'lost';
    await updateBetStatusDb(bet.id, newStatus);

    if (userWon) {
      await updateUserScoreDb(bet.userId, bet.potentialWinnings);
    }
  }
}
