
'use server';

import { z } from 'zod';
import { createBetDb, getBetByIdDb, updateBetStatusDb, updateUserScoreDb, getUserBetsWithDetailsDb } from '@/lib/db';
import type { BetWithMatchDetails } from '@/lib/types';
import { teams as allTeams } from '@/lib/mockData'; 
import { getApiSportsFixtureById } from '@/services/apiSportsService'; // Import new service function

const FIXED_ODDS = 2.0; // Example: all bets have 2x payout

const PlaceBetSchema = z.object({
  userId: z.number().int().positive(),
  matchId: z.coerce.number().int().positive(), // matchId will be fixture ID from API (number)
  teamIdBetOn: z.coerce.number().int().positive(), // teamId will be API team ID (number)
  amountBet: z.number().int().positive({ message: "Bet amount must be positive." }),
});

export async function placeBetAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  try {
    const validatedFields = PlaceBetSchema.safeParse({
      userId: parseInt(formData.get('userId') as string, 10),
      matchId: parseInt(formData.get('matchId') as string, 10), // Parse to number
      teamIdBetOn: parseInt(formData.get('teamIdBetOn') as string, 10), // Parse to number
      amountBet: parseInt(formData.get('amountBet') as string, 10),
    });

    if (!validatedFields.success) {
      return { error: 'Invalid bet data.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { userId, matchId, teamIdBetOn, amountBet } = validatedFields.data;

    const match = await getApiSportsFixtureById(matchId); // Fetch match details from API
    if (!match) {
      return { error: 'Match not found.' };
    }
    // API-Sports status "NS" means "Not Started"
    if (match.statusShort !== 'NS') { 
      return { error: 'Betting is only allowed on upcoming matches.' };
    }

    const teamBetOn = allTeams.find(t => t.id === teamIdBetOn); // Still use mockData for basic team info like name
    if (!teamBetOn) {
        return { error: 'Team to bet on not found in local data.' }; // Or fetch team details if needed
    }
    
    if (match.homeTeam.id !== teamIdBetOn && match.awayTeam.id !== teamIdBetOn) {
        return { error: `Team ${teamBetOn.name} is not participating in this match.` };
    }

    const potentialWinnings = amountBet * FIXED_ODDS;

    // Pass matchId (number) and teamIdBetOn (number) to db function
    const betId = await createBetDb(userId, matchId, teamIdBetOn, amountBet, potentialWinnings);

    if (!betId) {
      return { error: 'Failed to place bet.' };
    }

    return { success: `Bet placed successfully on ${teamBetOn.name}! Potential winnings: ${potentialWinnings} points.` };

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
    // If getUserBetsWithDetailsDb needs to fetch live match details for bets, that logic would be there
    // For now, it uses its existing logic which might rely on mockData or basic info stored with the bet.
    return { bets };
  } catch (error) {
    console.error('Get bet history error:', error);
    return { error: 'Failed to fetch bet history.' };
  }
}

const SettleBetSchema = z.object({
  betId: z.number().int().positive(),
  userWon: z.boolean(),
});

export async function settleBetAction(formData: FormData): Promise<{ error?: string; success?: string }> {
  try {
    const validatedFields = SettleBetSchema.safeParse({
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

    let scoreChange = 0;
    let newStatus: 'won' | 'lost';

    if (userWon) {
      newStatus = 'won';
      scoreChange = bet.potentialWinnings;
    } else {
      newStatus = 'lost';
    }

    const statusUpdated = await updateBetStatusDb(betId, newStatus);
    if (!statusUpdated) {
      return { error: 'Failed to update bet status.' };
    }

    if (scoreChange !== 0) {
      const scoreUpdated = await updateUserScoreDb(bet.userId, scoreChange);
      if (!scoreUpdated && newStatus === 'won') { 
        return { error: 'Bet status updated, but failed to update user score.' };
      }
    }
    
    return { success: `Bet ID ${betId} settled as ${newStatus}. Score updated accordingly.` };

  } catch (error) {
    console.error('Settle bet error:', error);
    return { error: 'An unexpected error occurred while settling the bet.' };
  }
}
