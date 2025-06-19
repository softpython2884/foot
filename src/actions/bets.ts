
'use server';

import { z } from 'zod';
import { createBetDb, getBetByIdDb, updateBetStatusDb, updateUserScoreDb, getUserBetsWithDetailsDb, getManagedEventFromDb, getPendingBetsForManagedEventDb } from '@/lib/db';
import type { BetWithMatchDetails, EventSource } from '@/lib/types';
import { footballTeams, supportedSports } from '@/lib/mockData';
import { getFootballFixtureById } from '@/services/apiSportsService';

const FIXED_ODDS = 2.0; // Example fixed odds

const PlaceBetSchema = z.object({
  userId: z.coerce.number().int().positive(),
  eventId: z.coerce.number().int().positive(),
  eventSource: z.enum(['api', 'custom']),
  teamIdBetOn: z.coerce.number().int().positive(),
  amountBet: z.coerce.number().int().positive({ message: "Bet amount must be positive." }),
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

    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) {
        return { error: 'Invalid sport specified for the bet.'};
    }

    let teamBetOnName = 'Selected Team';
    let eventIsUpcoming = false;

    if (eventSource === 'api') {
        // For now, betting is only implemented for football API events
        if (sportSlug !== 'football') {
            return { error: 'Betting on API events is currently only supported for Football.'};
        }
        const match = await getFootballFixtureById(eventId, sport.apiBaseUrl);
        if (!match) return { error: 'API Match not found.' };
        if (match.statusShort !== 'NS') return { error: 'Betting is only allowed on upcoming API matches.' };
        eventIsUpcoming = true;
        
        if (match.homeTeam.id === teamIdBetOn) teamBetOnName = match.homeTeam.name;
        else if (match.awayTeam.id === teamIdBetOn) teamBetOnName = match.awayTeam.name;
        else return { error: `Team ID ${teamIdBetOn} is not participating in this API match.` };

    } else if (eventSource === 'custom') {
        const managedEvent = await getManagedEventFromDb(eventId);
        if (!managedEvent) return { error: 'Custom event not found.' };
        if (managedEvent.status !== 'upcoming') return { error: 'Betting is only allowed on upcoming custom events.' };
        eventIsUpcoming = true;

        if (managedEvent.homeTeamApiId === teamIdBetOn) teamBetOnName = managedEvent.homeTeamName;
        else if (managedEvent.awayTeamApiId === teamIdBetOn) teamBetOnName = managedEvent.awayTeamName;
        else return { error: `Team ID ${teamIdBetOn} is not participating in this custom event.` };
    }

    if (!eventIsUpcoming) {
        return { error: 'Betting is not allowed on this event at this time.'};
    }

    const potentialWinnings = amountBet * FIXED_ODDS;

    const betId = await createBetDb(userId, eventId, eventSource, teamIdBetOn, amountBet, potentialWinnings, sportSlug);

    if (!betId) {
      return { error: 'Failed to place bet.' };
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

// This schema is now primarily for manual settlement of API bets,
// as custom bets are settled automatically.
const SettleApiBetSchema = z.object({
  betId: z.coerce.number().int().positive(),
  userWon: z.boolean(),
});

// This action is now for settling API bets from the profile page, if needed.
// Custom bets are settled via admin action.
export async function settleApiBetAction(formData: FormData): Promise<{ error?: string; success?: string }> {
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
    if (!bet) return { error: 'Bet not found.' };
    if (bet.eventSource !== 'api') return { error: 'This action is only for API-sourced bets.' };
    if (bet.status !== 'pending') return { error: 'This bet has already been settled.' };

    let scoreChange = 0;
    let newStatus: 'won' | 'lost';

    if (userWon) {
      newStatus = 'won';
      scoreChange = bet.potentialWinnings;
    } else {
      newStatus = 'lost';
    }

    const statusUpdated = await updateBetStatusDb(bet.id, newStatus);
    if (!statusUpdated) return { error: 'Failed to update bet status.' };

    if (scoreChange !== 0) {
      const scoreUpdated = await updateUserScoreDb(bet.userId, scoreChange);
      if (!scoreUpdated && newStatus === 'won') {
        // Rollback status update or log inconsistency if score update fails.
        // For simplicity, we'll just return an error message.
        return { error: 'Bet status updated, but failed to update user score.' };
      }
    }
    return { success: `API Bet ID ${betId} settled as ${newStatus}. Score updated.` };

  } catch (error) {
    console.error('Settle API bet error:', error);
    return { error: 'An unexpected error occurred while settling the API bet.' };
  }
}

// Function to be called by admin actions when a custom event is finished
export async function settleBetsForManagedEvent(managedEventId: number, winnerTeamApiId: number | null): Promise<{ successCount: number, errorCount: number }> {
  const pendingBets = await getPendingBetsForManagedEventDb(managedEventId);
  let successCount = 0;
  let errorCount = 0;

  for (const bet of pendingBets) {
    try {
      let userWon = false;
      if (winnerTeamApiId === null) { // Draw
        userWon = false; // Or handle draw bets specifically if that's a bet type
      } else if (bet.teamIdBetOn === winnerTeamApiId) {
        userWon = true;
      }

      const newStatus = userWon ? 'won' : 'lost';
      await updateBetStatusDb(bet.id, newStatus);

      if (userWon) {
        await updateUserScoreDb(bet.userId, bet.potentialWinnings);
      }
      successCount++;
    } catch (e) {
      console.error(\`Error settling bet ID \${bet.id} for managed event \${managedEventId}:\`, e);
      errorCount++;
    }
  }
  return { successCount, errorCount };
}

