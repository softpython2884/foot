
'use server';

import { z } from 'zod';
import {
  createBetDb,
  getBetByIdDb,
  updateBetStatusDb,
  updateUserScoreDb,
  getUserBetsWithDetailsDb,
  getManagedEventFromDb,
  getPendingBetsForManagedEventDb,
  getUserById, // Added to fetch user score
} from '@/lib/db';
import type { Bet, BetWithMatchDetails, EventSource, ManagedEventApp, User } from '@/lib/types';
import { footballTeams, supportedSports, formula1Entities, basketballTeams } from '@/lib/mockData';
import { getFootballFixtureById } from '@/services/apiSportsService';
import { revalidatePath } from 'next/cache';


const FIXED_ODDS = 2.0;

const PlaceBetSchema = z.object({
  userId: z.number().int().positive(),
  eventId: z.coerce.number().int().positive(),
  eventSource: z.custom<EventSource>((val) => ['api', 'custom'].includes(val as string)),
  teamIdBetOn: z.coerce.number().int().positive(),
  amountBet: z.number().int().positive({ message: "Bet amount must be positive." }),
  sportSlug: z.string().min(1, {message: "Sport slug is required."}),
});

export async function placeBetAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  try {
    const validatedFields = PlaceBetSchema.safeParse({
      userId: parseInt(formData.get('userId') as string, 10),
      eventId: parseInt(formData.get('eventId') as string, 10),
      eventSource: formData.get('eventSource') as EventSource,
      teamIdBetOn: parseInt(formData.get('teamIdBetOn') as string, 10),
      amountBet: parseInt(formData.get('amountBet') as string, 10),
      sportSlug: formData.get('sportSlug') as string,
    });

    if (!validatedFields.success) {
      return { error: 'Invalid bet data.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { userId, eventId, eventSource, teamIdBetOn, amountBet, sportSlug } = validatedFields.data;

    const currentUser = await getUserById(userId);
    if (!currentUser) {
      return { error: 'User not found.' };
    }
    if (currentUser.score < amountBet) {
      return { error: `Insufficient points. Your current score is ${currentUser.score}.` };
    }

    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) {
        return { error: 'Invalid sport specified for the bet.'};
    }

    let teamBetOnName = 'Selected Team';
    let allTeamsForSport: typeof footballTeams | typeof formula1Entities | typeof basketballTeams = [];
    if (sportSlug === 'football') allTeamsForSport = footballTeams;
    else if (sportSlug === 'formula-1') allTeamsForSport = formula1Entities;
    else if (sportSlug === 'basketball') allTeamsForSport = basketballTeams;


    if (eventSource === 'api') {
      if (sportSlug !== 'football') { // Example: only football API events for now
          return { error: 'Betting on API events is currently only supported for Football.'};
      }
      const match = await getFootballFixtureById(eventId, sport.apiBaseUrl);
      if (!match) {
        return { error: 'Match not found for API event.' };
      }
      if (match.statusShort !== 'NS') {
        return { error: 'Betting is only allowed on upcoming API matches.' };
      }
      const teamDetails = allTeamsForSport.find(t => t.id === teamIdBetOn);
      teamBetOnName = teamDetails ? teamDetails.name : 'Selected Team';
      if (match.homeTeam.id !== teamIdBetOn && match.awayTeam.id !== teamIdBetOn) {
          return { error: `Team ${teamBetOnName} is not participating in this API match.` };
      }
    } else if (eventSource === 'custom') {
        const managedEvent = await getManagedEventFromDb(eventId);
        if (!managedEvent) {
            return { error: 'Managed event not found.' };
        }
        if (managedEvent.status !== 'upcoming') {
             return { error: 'Betting is only allowed on upcoming managed events.' };
        }
        const teamDetails = [managedEvent.homeTeam, managedEvent.awayTeam].find(t => t.id === teamIdBetOn);
        teamBetOnName = teamDetails ? teamDetails.name : 'Selected Team';

        if (managedEvent.homeTeam.id !== teamIdBetOn && managedEvent.awayTeam.id !== teamIdBetOn) {
          return { error: `Team ${teamBetOnName} is not participating in this managed event.` };
      }
    } else {
        return { error: 'Invalid event source specified for the bet.' };
    }

    const potentialWinnings = amountBet * FIXED_ODDS;
    const betId = await createBetDb(userId, eventId, eventSource, teamIdBetOn, amountBet, potentialWinnings, sportSlug);

    if (!betId) {
      return { error: 'Failed to place bet.' };
    }

    // Deduct bet amount from user's score
    await updateUserScoreDb(userId, -amountBet);


    revalidatePath('/profile');
    if(eventSource === 'custom') {
        revalidatePath(`/sports/${sportSlug}/teams`);
        // Also revalidate individual team pages if they show custom events related to them
        const teamSlugBetOn = allTeamsForSport.find(t => t.id === teamIdBetOn)?.slug;
        if (teamSlugBetOn) revalidatePath(`/sports/${sportSlug}/teams/${teamSlugBetOn}`);

        const customEvent = await getManagedEventFromDb(eventId);
        if (customEvent) {
            if(customEvent.homeTeam.slug) revalidatePath(`/sports/${sportSlug}/teams/${customEvent.homeTeam.slug}`);
            if(customEvent.awayTeam.slug) revalidatePath(`/sports/${sportSlug}/teams/${customEvent.awayTeam.slug}`);
        }

    }

    return { success: `Bet placed successfully on ${teamBetOnName}! Potential winnings: ${potentialWinnings} points.` };

  } catch (error) {
    console.error('Place bet error:', error);
    return { error: 'An unexpected error occurred while placing the bet.' };
  }
}

export async function getBetHistoryAction(userId: number): Promise<{ error?: string; bets?: BetWithMatchDetails[] }> {
  if (!userId) {
    return { error: 'User ID is required.' };
  }
  try {
    const bets = await getUserBetsWithDetailsDb(userId);
    return { bets };
  } catch (error) {
    console.error('Get bet history error:', error);
    return { error: 'Failed to fetch bet history.' };
  }
}

const SettleApiBetSchema = z.object({
  betId: z.number().int().positive(),
  userWon: z.boolean(),
});

export async function settleApiBetAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  try {
    const validatedFields = SettleApiBetSchema.safeParse({
      betId: parseInt(formData.get('betId') as string, 10),
      userWon: formData.get('userWon') === 'true',
    });

    if (!validatedFields.success) {
      return { error: 'Invalid settlement data.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { betId, userWon } = validatedFields.data;

    const bet = await getBetByIdDb(betId);
    if (!bet) {
      return { error: 'Bet not found.' };
    }
    if (bet.status !== 'pending') {
      return { error: 'This bet has already been settled.' };
    }
    if (bet.eventSource !== 'api') {
        return { error: 'This action is for settling API bets only. Custom event bets are settled automatically.'}
    }

    let scoreChange = 0;
    let newStatus: 'won' | 'lost';

    if (userWon) {
      newStatus = 'won';
      scoreChange = bet.potentialWinnings; // User gets potential winnings, bet amount was already deducted
    } else {
      newStatus = 'lost';
      // No score change here, as the bet amount was already deducted when placing the bet.
      // If the logic was different (e.g., deduct only on loss), this would change.
    }

    const statusUpdated = await updateBetStatusDb(betId, newStatus);
    if (!statusUpdated) {
      return { error: 'Failed to update bet status.' };
    }

    if (newStatus === 'won' && scoreChange > 0) { // Only update score if won and there's a positive change
      const scoreUpdated = await updateUserScoreDb(bet.userId, scoreChange);
      if (!scoreUpdated) {
        return { error: 'Bet status updated to won, but failed to update user score. Please contact support.' };
      }
    }

    revalidatePath('/profile');

    return { success: `Bet ID ${betId} (API Event) settled as ${newStatus}. Score updated accordingly.` };

  } catch (error) {
    console.error('Settle API bet error:', error);
    return { error: 'An unexpected error occurred while settling the API bet.' };
  }
}

export async function settleBetsForManagedEvent(managedEventId: number): Promise<{ success?: string; error?: string; details?: { successCount: number; errorCount: number } }> {
  const managedEvent = await getManagedEventFromDb(managedEventId);
  if (!managedEvent) {
    return { error: `Managed event with ID ${managedEventId} not found.` };
  }

  if (managedEvent.status !== 'finished') {
    return { error: `Managed event ${managedEventId} is not finished. Bets cannot be settled yet.` };
  }

  const winningTeamId = managedEvent.winningTeamId; // Can be null for a draw

  const pendingBets = await getPendingBetsForManagedEventDb(managedEventId);

  if (pendingBets.length === 0) {
    return { success: 'No pending bets found for this event to settle.' };
  }

  let successCount = 0;
  let errorCount = 0;

  for (const bet of pendingBets) {
    try {
      let userWon: boolean;
      if (winningTeamId === null) { // Draw
        userWon = false; 
      } else {
        userWon = bet.teamIdBetOn === winningTeamId;
      }

      let scoreChange = 0;
      const newStatus: 'won' | 'lost' = userWon ? 'won' : 'lost';

      if (userWon) {
        scoreChange = bet.potentialWinnings; // User gets potential winnings
      }
      // No score change for lost custom event bets as amount was already deducted.

      const statusUpdated = await updateBetStatusDb(bet.id, newStatus);
      if (!statusUpdated) {
        throw new Error(`Failed to update status for bet ID ${bet.id}`);
      }

      if (newStatus === 'won' && scoreChange > 0) {
        const scoreUpdated = await updateUserScoreDb(bet.userId, scoreChange);
        if (!scoreUpdated) {
          throw new Error(`Failed to update score for user ID ${bet.userId} for bet ID ${bet.id}`);
        }
      }
      successCount++;
    } catch (e) {
      console.error(`Error settling bet ID ${bet.id} for managed event ${managedEventId}:`, e);
      errorCount++;
    }
  }

  revalidatePath('/profile');
  revalidatePath(`/sports/${managedEvent.sportSlug}/teams`);
  if(managedEvent.homeTeam.slug) revalidatePath(`/sports/${managedEvent.sportSlug}/teams/${managedEvent.homeTeam.slug}`);
  if(managedEvent.awayTeam.slug) revalidatePath(`/sports/${managedEvent.sportSlug}/teams/${managedEvent.awayTeam.slug}`);
  // Consider revalidating the admin page too if it shows bet settlement status
  // revalidatePath('/admin');

  if (errorCount > 0) {
    return {
      error: `Settled ${successCount} bets, but ${errorCount} bets failed to settle for event ${managedEventId}.`,
      details: { successCount, errorCount }
    };
  }

  return {
    success: `Successfully settled ${successCount} bets for event ${managedEventId}.`,
    details: { successCount, errorCount }
  };
}

