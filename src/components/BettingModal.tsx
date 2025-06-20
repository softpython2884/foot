
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label'; // Keep if used, otherwise remove
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { placeBetAction } from '@/actions/bets';
import type { MatchApp, TeamApp, AuthenticatedUser, ManagedEventApp, EventSource } from '@/lib/types';
import { LoadingSpinner } from './LoadingSpinner';
import { useAuth } from '@/context/AuthContext'; // Import useAuth to update user score
import { getUserDetailsAction } from '@/actions/user'; // To fetch fresh user data

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventData: MatchApp | ManagedEventApp; 
  eventSource: EventSource; 
  teamToBetOn: TeamApp; 
  currentUser: AuthenticatedUser | null;
  sportSlug: string;
}

const betSchema = z.object({
  amount: z.coerce.number().int().positive({ message: "Bet amount must be a positive number." }),
});

type BetFormValues = z.infer<typeof betSchema>;

export function BettingModal({ isOpen, onClose, eventData, eventSource, teamToBetOn, currentUser, sportSlug }: BettingModalProps) {
  const { toast } = useToast();
  const { login: updateAuthContextUser } = useAuth(); // Get login/update function from AuthContext
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentScore, setCurrentScore] = useState(currentUser?.score || 0);

  useEffect(() => {
    if (currentUser) {
      setCurrentScore(currentUser.score);
    }
  }, [currentUser]);

  const form = useForm<BetFormValues>({
    resolver: zodResolver(betSchema),
    defaultValues: {
      amount: 10,
    },
  });

  const onSubmit = async (data: BetFormValues) => {
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to place a bet.' });
      onClose();
      return;
    }
    if (!teamToBetOn || teamToBetOn.id == null) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not determine team to bet on or team ID is missing.' });
        onClose();
        return;
    }
    if (eventData.id == null) {
        toast({ variant: 'destructive', title: 'Error', description: 'Event ID is missing.' });
        onClose();
        return;
    }
    if (data.amount > currentScore) {
      toast({ variant: 'destructive', title: 'Insufficient Points', description: `You only have ${currentScore} points.` });
      return;
    }


    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('userId', currentUser.id.toString());
    formData.append('eventId', eventData.id.toString());
    formData.append('eventSource', eventSource);
    formData.append('teamIdBetOn', teamToBetOn.id.toString());
    formData.append('amountBet', data.amount.toString());
    formData.append('sportSlug', sportSlug);

    console.log('[BettingModal] Submitting bet. FormData:', Object.fromEntries(formData.entries()));

    const result = await placeBetAction(formData);

    if (result.success) {
      toast({ title: 'Bet Placed!', description: result.success });
      form.reset();
      
      // Fetch updated user details and update context
      const userDetailsResult = await getUserDetailsAction(currentUser.id);
      if (userDetailsResult.user) {
        updateAuthContextUser(userDetailsResult.user);
        setCurrentScore(userDetailsResult.user.score); // Update local score for immediate feedback if needed
      } else {
        console.warn('[BettingModal] Failed to refresh user details after placing bet.');
      }
      
      onClose(); // Close modal after all updates
    } else {
      toast({ variant: 'destructive', title: 'Bet Failed', description: result.error || 'Could not place bet.' });
      console.error('[BettingModal] Bet placement failed. Server response:', result);
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;
  
  const eventTitle = eventSource === 'custom' ? (eventData as ManagedEventApp).name : `${eventData.homeTeam.name} vs ${eventData.awayTeam.name}`;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Place Bet on {sportSlug === 'football' ? 'Football Event' : sportSlug === 'formula-1' ? 'F1 Event' : 'Basketball Event'}</DialogTitle>
          <DialogDescription>
            You are betting on <span className="font-semibold text-primary">{teamToBetOn.name}</span> to win the event:
            <br />
            {eventTitle}
            <br />
            Your current score: <span className="font-semibold">{currentScore} points</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bet Amount (points)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoadingSpinner size="sm" /> : 'Place Bet'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
