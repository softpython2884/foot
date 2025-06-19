
'use server';

import { z } from 'zod';
import { createManagedEventInDb, updateManagedEventInDb, getManagedEventFromDb, getPendingBetsForManagedEventDb, updateBetStatusDb, updateUserScoreDb } from '@/lib/db';
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
  winnerTeamApiId: z.coerce.number().int().positive().optional().nullable(),
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
    
    // For now, lookup names and logos from footballTeams mock data
    // This should be expanded or made more generic if other sports are added for custom events
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
    revalidatePath(`/sports/${sportSlug}/teams`); // Revalidate the sport's team page
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
      homeScore: formData.get('homeScore') ? parseInt(formData.get('homeScore') as string) : null,
      awayScore: formData.get('awayScore') ? parseInt(formData.get('awayScore') as string) : null,
      winnerTeamApiId: formData.get('winnerTeamApiId') ? parseInt(formData.get('winnerTeamApiId') as string) : null,
    });

    if (!validatedFields.success) {
      return { error: 'Invalid update data.', details: validatedFields.error.flatten().fieldErrors };
    }
    
    const { eventId, status, homeScore, awayScore } = validatedFields.data;
    let { winnerTeamApiId } = validatedFields.data;


    const existingEvent = await getManagedEventFromDb(eventId);
    if (!existingEvent) {
      return { error: 'Event not found.' };
    }

    if (status === 'finished') {
      if (homeScore == null || awayScore == null) {
        return { error: 'Scores must be provided to finish an event.' };
      }
      if (homeScore === awayScore && winnerTeamApiId == null) {
        // For sports where draws are possible and not handled by winnerTeamApiId (e.g. no penalty shootout simulated)
        // This part might need adjustment based on specific sport rules if draws are not allowed / need a tie-breaker.
        // For now, if scores are equal, winnerTeamApiId remains null unless explicitly set.
      } else if (homeScore > awayScore) {
        winnerTeamApiId = existingEvent.homeTeamApiId;
      } else if (awayScore > homeScore) {
        winnerTeamApiId = existingEvent.awayTeamApiId;
      }
      // If scores are equal and winnerTeamApiId was provided (e.g. from a penalty shootout selector), it will be used.
    }


    const eventToUpdate: Partial<ManagedEventDb> & { id: number } = {
      id: eventId,
      status,
      homeScore,
      awayScore,
      winnerTeamApiId,
    };
    
    const updated = await updateManagedEventInDb(eventToUpdate);
    if (!updated) {
      return { error: 'Failed to update event status.' };
    }

    if (status === 'finished' && winnerTeamApiId !== undefined) { // winnerTeamApiId can be null for a draw
      await settleBetsForManagedEvent(eventId, winnerTeamApiId);
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
      // Depending on rules, bets might be voided or lost. Here, let's assume lost unless specific "draw" bet type.
      userWon = false; 
    } else if (bet.teamIdBetOn === winnerTeamApiId) {
      userWon = true;
    }

    const newStatus = userWon ? 'won' : 'lost';
    await updateBetStatusDb(bet.id, newStatus);

    if (userWon) {
      await updateUserScoreDb(bet.userId, bet.potentialWinnings);
    }
    // No score change for lost bets in this model, but could deduct amountBet if desired.
  }
}

