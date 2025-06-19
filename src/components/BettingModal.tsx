
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { placeBetAction } from '@/actions/bets';
import type { MatchApp, TeamApp, AuthenticatedUser } from '@/lib/types'; // Use MatchApp, TeamApp
import { LoadingSpinner } from './LoadingSpinner';

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchApp; // Use MatchApp
  teamToBetOn: TeamApp; // Use TeamApp (which includes id as number)
  currentUser: AuthenticatedUser | null;
  sportSlug: string;
}

const betSchema = z.object({
  amount: z.coerce.number().int().positive({ message: "Bet amount must be a positive number." }),
});

type BetFormValues = z.infer<typeof betSchema>;

export function BettingModal({ isOpen, onClose, match, teamToBetOn, currentUser, sportSlug }: BettingModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!teamToBetOn || teamToBetOn.id == null) { // Check for null or undefined id
        toast({ variant: 'destructive', title: 'Error', description: 'Could not determine team to bet on or team ID is missing.' });
        onClose();
        return;
    }
    if (match.id == null) { // Check for null or undefined match id
        toast({ variant: 'destructive', title: 'Error', description: 'Match ID is missing.' });
        onClose();
        return;
    }


    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('userId', currentUser.id.toString());
    formData.append('matchId', match.id.toString()); // match.id is now a number
    formData.append('teamIdBetOn', teamToBetOn.id.toString()); // teamToBetOn.id is now a number
    formData.append('amountBet', data.amount.toString());
    formData.append('sportSlug', sportSlug);


    const result = await placeBetAction(formData);

    if (result.success) {
      toast({ title: 'Bet Placed!', description: result.success });
      form.reset();
      onClose();
    } else {
      toast({ variant: 'destructive', title: 'Bet Failed', description: result.error || 'Could not place bet.' });
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Place Bet on {match.sportSlug === 'football' ? 'Football Match' : match.sportSlug}</DialogTitle>
          <DialogDescription>
            You are betting on <span className="font-semibold text-primary">{teamToBetOn.name}</span> to win the match:
            <br />
            {match.homeTeam.name} vs {match.awayTeam.name}
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
