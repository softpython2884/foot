
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
  getUserById,
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
  console.log('[betsAction] Server: placeBetAction called. FormData entries:');
  for (const pair of formData.entries()) {
    console.log(`  ${pair[0]}: ${pair[1]}`);
  }

  const dataToValidate = {
    userId: parseInt(formData.get('userId') as string, 10),
    eventId: parseInt(formData.get('eventId') as string, 10),
    eventSource: formData.get('eventSource') as EventSource,
    teamIdBetOn: parseInt(formData.get('teamIdBetOn') as string, 10),
    amountBet: parseInt(formData.get('amountBet') as string, 10),
    sportSlug: formData.get('sportSlug') as string,
  };
  console.log('[betsAction] Server: Data prepared for Zod validation (placeBet):', dataToValidate);

  try {
    const validatedFields = PlaceBetSchema.safeParse(dataToValidate);

    if (!validatedFields.success) {
      console.error("[betsAction] Server: Zod validation failed (placeBet):", validatedFields.error.flatten());
      return { error: 'Invalid bet data.', details: validatedFields.error.flatten().fieldErrors };
    }
    console.log('[betsAction] Server: Zod validation successful (placeBet). Validated data:', validatedFields.data);

    const { userId, eventId, eventSource, teamIdBetOn, amountBet, sportSlug } = validatedFields.data;

    const currentUser = await getUserById(userId);
    if (!currentUser) {
      console.warn(`[betsAction] Server: User not found for ID: ${userId}`);
      return { error: 'User not found.' };
    }
    console.log(`[betsAction] Server: Current user score: ${currentUser.score}, Amount to bet: ${amountBet}`);
    if (currentUser.score < amountBet) {
      console.warn(`[betsAction] Server: User ${userId} has insufficient points. Score: ${currentUser.score}, Bet: ${amountBet}`);
      return { error: `Insufficient points. Your current score is ${currentUser.score}.` };
    }

    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) {
        console.warn(`[betsAction] Server: Invalid sport slug: ${sportSlug}`);
        return { error: 'Invalid sport specified for the bet.'};
    }

    let teamBetOnName = 'Selected Team';
    let allTeamsForSport: typeof footballTeams | typeof formula1Entities | typeof basketballTeams = [];
    if (sportSlug === 'football') allTeamsForSport = footballTeams;
    else if (sportSlug === 'formula-1') allTeamsForSport = formula1Entities;
    else if (sportSlug === 'basketball') allTeamsForSport = basketballTeams;


    if (eventSource === 'api') {
      if (sportSlug !== 'football') { 
          console.warn(`[betsAction] Server: Betting on API events for ${sportSlug} is not supported yet.`);
          return { error: 'Betting on API events is currently only supported for Football.'};
      }
      const match = await getFootballFixtureById(eventId, sport.apiBaseUrl);
      if (!match) {
        console.warn(`[betsAction] Server: API Match not found for event ID: ${eventId}`);
        return { error: 'Match not found for API event.' };
      }
      if (match.statusShort !== 'NS') {
        console.warn(`[betsAction] Server: API Match ${eventId} is not 'NS' (Not Started). Status: ${match.statusShort}`);
        return { error: 'Betting is only allowed on upcoming API matches.' };
      }
      const teamDetails = allTeamsForSport.find(t => t.id === teamIdBetOn);
      teamBetOnName = teamDetails ? teamDetails.name : 'Selected Team';
      if (match.homeTeam.id !== teamIdBetOn && match.awayTeam.id !== teamIdBetOn) {
          console.warn(`[betsAction] Server: Team ${teamIdBetOn} (${teamBetOnName}) is not in API match ${eventId}.`);
          return { error: `Team ${teamBetOnName} is not participating in this API match.` };
      }
      console.log(`[betsAction] Server: Validated API event for betting. Match ID: ${eventId}, Team Bet On: ${teamBetOnName}`);
    } else if (eventSource === 'custom') {
        const managedEvent = await getManagedEventFromDb(eventId);
        if (!managedEvent) {
            console.warn(`[betsAction] Server: Managed event not found for ID: ${eventId}`);
            return { error: 'Managed event not found.' };
        }
        if (managedEvent.status !== 'upcoming') {
             console.warn(`[betsAction] Server: Managed event ${eventId} is not 'upcoming'. Status: ${managedEvent.status}`);
             return { error: 'Betting is only allowed on upcoming managed events.' };
        }
        const teamDetails = [managedEvent.homeTeam, managedEvent.awayTeam].find(t => t.id === teamIdBetOn);
        teamBetOnName = teamDetails ? teamDetails.name : 'Selected Team';

        if (managedEvent.homeTeam.id !== teamIdBetOn && managedEvent.awayTeam.id !== teamIdBetOn) {
          console.warn(`[betsAction] Server: Team ${teamIdBetOn} (${teamBetOnName}) is not in managed event ${eventId}.`);
          return { error: `Team ${teamBetOnName} is not participating in this managed event.` };
      }
      console.log(`[betsAction] Server: Validated custom event for betting. Event ID: ${eventId}, Team Bet On: ${teamBetOnName}`);
    } else {
        console.error(`[betsAction] Server: Invalid event source: ${eventSource}`);
        return { error: 'Invalid event source specified for the bet.' };
    }

    const potentialWinnings = amountBet * FIXED_ODDS;
    const betId = await createBetDb(userId, eventId, eventSource, teamIdBetOn, amountBet, potentialWinnings, sportSlug);

    if (!betId) {
      console.error(`[betsAction] Server: Failed to create bet in DB for user ${userId}, event ${eventId}.`);
      return { error: 'Failed to place bet.' };
    }
    console.log(`[betsAction] Server: Bet created successfully with ID: ${betId}.`);

    // Deduct bet amount from user's score
    await updateUserScoreDb(userId, -amountBet);
    console.log(`[betsAction] Server: Deducted ${amountBet} points from user ${userId}. New score potentially: ${currentUser.score - amountBet}.`);

    revalidatePath('/profile');
    if(eventSource === 'custom') {
        revalidatePath(`/sports/${sportSlug}/teams`);
        const teamSlugBetOn = allTeamsForSport.find(t => t.id === teamIdBetOn)?.slug;
        if (teamSlugBetOn) revalidatePath(`/sports/${sportSlug}/teams/${teamSlugBetOn}`);

        const customEvent = await getManagedEventFromDb(eventId);
        if (customEvent) {
            if(customEvent.homeTeam.slug) revalidatePath(`/sports/${sportSlug}/teams/${customEvent.homeTeam.slug}`);
            if(customEvent.awayTeam.slug) revalidatePath(`/sports/${sportSlug}/teams/${customEvent.awayTeam.slug}`);
        }
    }
    console.log(`[betsAction] Server: Bet placed successfully for user ${userId} on team ${teamIdBetOn} for event ${eventId}. Revalidated paths.`);
    return { success: `Bet placed successfully on ${teamBetOnName}! Potential winnings: ${potentialWinnings} points.` };

  } catch (error) {
    console.error('[betsAction] Server: Unexpected error during placeBetAction:', error);
    return { error: 'An unexpected error occurred while placing the bet.' };
  }
}

export async function getBetHistoryAction(userId: number): Promise<{ error?: string; bets?: BetWithMatchDetails[] }> {
  console.log(`[betsAction] Server: getBetHistoryAction called for user ID: ${userId}`);
  if (!userId) {
    console.warn('[betsAction] Server: User ID is required for getBetHistoryAction.');
    return { error: 'User ID is required.' };
  }
  try {
    const bets = await getUserBetsWithDetailsDb(userId);
    console.log(`[betsAction] Server: Fetched ${bets.length} bets for user ID: ${userId}`);
    return { bets };
  } catch (error) {
    console.error(`[betsAction] Server: Error fetching bet history for user ${userId}:`, error);
    return { error: 'Failed to fetch bet history.' };
  }
}

const SettleApiBetSchema = z.object({
  betId: z.number().int().positive(),
  userWon: z.boolean(),
});

export async function settleApiBetAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  console.log('[betsAction] Server: settleApiBetAction called. FormData entries:');
   for (const pair of formData.entries()) {
    console.log(`  ${pair[0]}: ${pair[1]}`);
  }
  
  const dataToValidate = {
    betId: parseInt(formData.get('betId') as string, 10),
    userWon: formData.get('userWon') === 'true',
  };
  console.log('[betsAction] Server: Data prepared for Zod validation (settleApiBet):', dataToValidate);
  
  try {
    const validatedFields = SettleApiBetSchema.safeParse(dataToValidate);

    if (!validatedFields.success) {
      console.error("[betsAction] Server: Zod validation failed (settleApiBet):", validatedFields.error.flatten());
      return { error: 'Invalid settlement data.', details: validatedFields.error.flatten().fieldErrors };
    }
    console.log('[betsAction] Server: Zod validation successful (settleApiBet). Validated data:', validatedFields.data);

    const { betId, userWon } = validatedFields.data;

    const bet = await getBetByIdDb(betId);
    if (!bet) {
      console.warn(`[betsAction] Server: Bet not found for ID: ${betId} (settleApiBet).`);
      return { error: 'Bet not found.' };
    }
    if (bet.status !== 'pending') {
      console.warn(`[betsAction] Server: Bet ID ${betId} already settled. Status: ${bet.status} (settleApiBet).`);
      return { error: 'This bet has already been settled.' };
    }
    if (bet.eventSource !== 'api') {
        console.warn(`[betsAction] Server: Bet ID ${betId} is not an API bet. Event source: ${bet.eventSource} (settleApiBet).`);
        return { error: 'This action is for settling API bets only. Custom event bets are settled automatically.'}
    }
    console.log(`[betsAction] Server: Found pending API bet ID ${betId} for user ${bet.userId}. User won: ${userWon}`);

    let scoreChange = 0;
    let newStatus: 'won' | 'lost';

    if (userWon) {
      newStatus = 'won';
      scoreChange = bet.potentialWinnings; 
      console.log(`[betsAction] Server: Bet ID ${betId} won. Score change: +${scoreChange}.`);
    } else {
      newStatus = 'lost';
      console.log(`[betsAction] Server: Bet ID ${betId} lost. No score change (amount already deducted).`);
    }

    const statusUpdated = await updateBetStatusDb(betId, newStatus);
    if (!statusUpdated) {
      console.error(`[betsAction] Server: Failed to update status for bet ID ${betId} to ${newStatus}.`);
      return { error: 'Failed to update bet status.' };
    }
    console.log(`[betsAction] Server: Bet ID ${betId} status updated to ${newStatus}.`);

    if (newStatus === 'won' && scoreChange > 0) {
      const scoreUpdated = await updateUserScoreDb(bet.userId, scoreChange);
      if (!scoreUpdated) {
        console.error(`[betsAction] Server: Failed to update score for user ${bet.userId} after winning bet ${betId}.`);
        return { error: 'Bet status updated to won, but failed to update user score. Please contact support.' };
      }
      console.log(`[betsAction] Server: User ${bet.userId} score updated by +${scoreChange}.`);
    }

    revalidatePath('/profile');
    console.log(`[betsAction] Server: API Bet ID ${betId} settled as ${newStatus}. Revalidated /profile.`);
    return { success: `Bet ID ${betId} (API Event) settled as ${newStatus}. Score updated accordingly.` };

  } catch (error) {
    console.error('[betsAction] Server: Unexpected error during settleApiBetAction:', error);
    return { error: 'An unexpected error occurred while settling the API bet.' };
  }
}

export async function settleBetsForManagedEvent(managedEventId: number): Promise<{ success?: string; error?: string; details?: { successCount: number; errorCount: number } }> {
  console.log(`[betsAction] Server: settleBetsForManagedEvent called for managedEventId: ${managedEventId}`);
  const managedEvent = await getManagedEventFromDb(managedEventId);
  if (!managedEvent) {
    console.warn(`[betsAction] Server: Managed event with ID ${managedEventId} not found for settling bets.`);
    return { error: `Managed event with ID ${managedEventId} not found.` };
  }
  console.log(`[betsAction] Server: Fetched managed event ${managedEventId}. Status: ${managedEvent.status}, Winning Team ID: ${managedEvent.winningTeamId}`);

  if (managedEvent.status !== 'finished') {
    console.warn(`[betsAction] Server: Managed event ${managedEventId} is not finished. Status: ${managedEvent.status}. Bets cannot be settled.`);
    return { error: `Managed event ${managedEventId} is not finished. Bets cannot be settled yet.` };
  }

  const winningTeamId = managedEvent.winningTeamId;

  const pendingBets = await getPendingBetsForManagedEventDb(managedEventId);
  console.log(`[betsAction] Server: Found ${pendingBets.length} pending bets for managed event ${managedEventId}.`);

  if (pendingBets.length === 0) {
    return { success: 'No pending bets found for this event to settle.' };
  }

  let successCount = 0;
  let errorCount = 0;

  for (const bet of pendingBets) {
    console.log(`[betsAction] Server: Processing bet ID ${bet.id} for managed event ${managedEventId}. User: ${bet.userId}, Team Bet On: ${bet.teamIdBetOn}`);
    try {
      let userWon: boolean;
      if (winningTeamId === null) { 
        userWon = false; 
        console.log(`  Bet ID ${bet.id}: Event was a draw. Bet lost.`);
      } else {
        userWon = bet.teamIdBetOn === winningTeamId;
        console.log(`  Bet ID ${bet.id}: User bet on ${bet.teamIdBetOn}, winning team was ${winningTeamId}. User won: ${userWon}`);
      }

      let scoreChange = 0;
      const newStatus: 'won' | 'lost' = userWon ? 'won' : 'lost';

      if (userWon) {
        scoreChange = bet.potentialWinnings;
        console.log(`  Bet ID ${bet.id}: Bet won. Score change: +${scoreChange}.`);
      } else {
        console.log(`  Bet ID ${bet.id}: Bet lost. No score change.`);
      }

      const statusUpdated = await updateBetStatusDb(bet.id, newStatus);
      if (!statusUpdated) {
        errorCount++;
        console.error(`  Bet ID ${bet.id}: Failed to update status to ${newStatus}.`);
        continue; 
      }
      console.log(`  Bet ID ${bet.id}: Status updated to ${newStatus}.`);

      if (newStatus === 'won' && scoreChange > 0) {
        const scoreUpdated = await updateUserScoreDb(bet.userId, scoreChange);
        if (!scoreUpdated) {
          errorCount++;
          console.error(`  Bet ID ${bet.id}: Failed to update score for user ${bet.userId} after winning.`);
          // Potentially revert bet status update or mark for manual review
          continue;
        }
        console.log(`  Bet ID ${bet.id}: User ${bet.userId} score updated by +${scoreChange}.`);
      }
      successCount++;
    } catch (e) {
      console.error(`[betsAction] Server: Error settling bet ID ${bet.id} for managed event ${managedEventId}:`, e);
      errorCount++;
    }
  }

  console.log(`[betsAction] Server: Finished settling bets for managed event ${managedEventId}. Success: ${successCount}, Errors: ${errorCount}. Revalidating paths.`);
  revalidatePath('/profile');
  revalidatePath(`/sports/${managedEvent.sportSlug}/teams`);
  if(managedEvent.homeTeam.slug) revalidatePath(`/sports/${managedEvent.sportSlug}/teams/${managedEvent.homeTeam.slug}`);
  if(managedEvent.awayTeam.slug) revalidatePath(`/sports/${managedEvent.sportSlug}/teams/${managedEvent.awayTeam.slug}`);

  if (errorCount > 0) {
    return {
      error: `Settled ${successCount} bets, but ${errorCount} bets failed to settle for event ${managedEventId}. Check server logs.`,
      details: { successCount, errorCount }
    };
  }

  return {
    success: `Successfully settled ${successCount} bets for event ${managedEventId}.`,
    details: { successCount, errorCount }
  };
}
