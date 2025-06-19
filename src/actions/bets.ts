
'use server';

import { z } from 'zod';
import { createBetDb, getBetByIdDb, updateBetStatusDb, updateUserScoreDb, getUserBetsWithDetailsDb } from '@/lib/db';
import type { BetWithMatchDetails } from '@/lib/types';
import { footballTeams, supportedSports } from '@/lib/mockData';
import { getFootballFixtureById } from '@/services/apiSportsService';

const FIXED_ODDS = 2.0;

const PlaceBetSchema = z.object({
  userId: z.number().int().positive(),
  matchId: z.coerce.number().int().positive(),
  teamIdBetOn: z.coerce.number().int().positive(),
  amountBet: z.number().int().positive({ message: "Bet amount must be positive." }),
  sportSlug: z.string().min(1, {message: "Sport slug is required."}),
});

export async function placeBetAction(formData: FormData): Promise<{ error?: string; success?: string; details?: any }> {
  try {
    const validatedFields = PlaceBetSchema.safeParse({
      userId: parseInt(formData.get('userId') as string, 10),
      matchId: parseInt(formData.get('matchId') as string, 10),
      teamIdBetOn: parseInt(formData.get('teamIdBetOn') as string, 10),
      amountBet: parseInt(formData.get('amountBet') as string, 10),
      sportSlug: formData.get('sportSlug') as string,
    });

    if (!validatedFields.success) {
      return { error: 'Invalid bet data.', details: validatedFields.error.flatten().fieldErrors };
    }

    const { userId, matchId, teamIdBetOn, amountBet, sportSlug } = validatedFields.data;

    const sport = supportedSports.find(s => s.slug === sportSlug);
    if (!sport) {
        return { error: 'Invalid sport specified for the bet.'};
    }

    // For now, betting is only implemented for football
    if (sportSlug !== 'football') {
        return { error: 'Betting is currently only supported for Football.'};
    }

    const match = await getFootballFixtureById(matchId, sport.apiBaseUrl);
    if (!match) {
      return { error: 'Match not found.' };
    }
    if (match.statusShort !== 'NS') {
      return { error: 'Betting is only allowed on upcoming matches.' };
    }

    // Use footballTeams for team name lookup as it's a football bet
    const teamBetOnDetails = footballTeams.find(t => t.id === teamIdBetOn);
    const teamBetOnName = teamBetOnDetails ? teamBetOnDetails.name : 'Selected Team';

    if (match.homeTeam.id !== teamIdBetOn && match.awayTeam.id !== teamIdBetOn) {
        return { error: `Team ${teamBetOnName} is not participating in this match.` };
    }

    const potentialWinnings = amountBet * FIXED_ODDS;

    const betId = await createBetDb(userId, matchId, teamIdBetOn, amountBet, potentialWinnings, sportSlug);

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
    // Assuming getUserBetsWithDetailsDb will handle fetching details based on sportSlug if needed in future
    const bets = await getUserBetsWithDetailsDb(userId);
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
