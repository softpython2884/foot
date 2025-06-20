
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { updateManagedEventAction } from '@/actions/adminEvents';
import type { ManagedEventApp, ManagedEventStatus, TeamApp } from '@/lib/types';
import { formatMatchDateTime } from '@/lib/dateUtils';
import { footballTeams, formula1Entities, basketballTeams } from '@/lib/mockData';
import { CheckCircle, Edit3, Save, XCircle } from 'lucide-react';

interface ManagedEventEditorCardProps {
  event: ManagedEventApp;
  onEventUpdated: () => void;
}

const safeNumericStringSchema = () =>
  z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return ''; 
      return String(val); 
    },
    z.string() 
      .refine(
        (val) => val === '' || /^\d+$/.test(val), 
        { message: "Must be a non-negative integer or empty." }
      )
      .optional() 
  );


const updateEventStatusFormSchema = z.object({
  status: z.custom<ManagedEventStatus>((val) => ['upcoming', 'live', 'paused', 'finished', 'cancelled'].includes(val as string)),
  homeScore: safeNumericStringSchema(),
  awayScore: safeNumericStringSchema(),
  winningTeamId: z.string().optional(), 
  elapsedTime: safeNumericStringSchema(),
  notes: z.string().optional(),
});

type UpdateEventStatusFormValues = z.infer<typeof updateEventStatusFormSchema>;

const NULL_WINNER_OPTION_VALUE = "null_winner_option";

export function ManagedEventEditorCard({ event, onEventUpdated }: ManagedEventEditorCardProps) {
  const { toast } = useToast();
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  const form = useForm<UpdateEventStatusFormValues>({
    resolver: zodResolver(updateEventStatusFormSchema),
    defaultValues: {
      status: event.status,
      homeScore: event.homeScore?.toString() ?? '',
      awayScore: event.awayScore?.toString() ?? '',
      winningTeamId: event.winningTeamId?.toString() ?? NULL_WINNER_OPTION_VALUE, 
      elapsedTime: event.elapsedTime?.toString() ?? '',
      notes: event.notes ?? '',
    },
  });

  const onSubmitUpdate = async (data: UpdateEventStatusFormValues) => {
    console.log('[ManagedEventEditorCard] Client: Attempting to submit update with data:', data);
    setIsSubmittingUpdate(true);
    const formData = new FormData();
    formData.append('eventId', event.id.toString());
    formData.append('status', data.status);
    
    if (data.homeScore !== undefined && data.homeScore !== '') formData.append('homeScore', data.homeScore);
    if (data.awayScore !== undefined && data.awayScore !== '') formData.append('awayScore', data.awayScore);
    
    // Send the special value if "Draw/No Winner" is selected, otherwise the team ID or nothing if not applicable
    if (data.winningTeamId === NULL_WINNER_OPTION_VALUE) {
      formData.append('winningTeamId', NULL_WINNER_OPTION_VALUE); 
    } else if (data.winningTeamId !== undefined && data.winningTeamId !== '') {
      formData.append('winningTeamId', data.winningTeamId);
    }
    
    if (data.elapsedTime !== undefined && data.elapsedTime !== '') formData.append('elapsedTime', data.elapsedTime);
    if (data.notes !== undefined && data.notes !== null) formData.append('notes', data.notes);


    console.log('[ManagedEventEditorCard] Client: FormData to be sent:');
    for (const pair of formData.entries()) {
      console.log(`  ${pair[0]}: ${pair[1]}`);
    }

    const result = await updateManagedEventAction(formData);
    if (result.success) {
      toast({ title: 'Success', description: result.success });
      onEventUpdated(); 
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update event.' });
       if (result.details) {
        console.error("[ManagedEventEditorCard] Client: Zod validation errors from server action:", result.details);
        Object.entries(result.details).forEach(([field, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
             form.setError(field as keyof UpdateEventStatusFormValues, { type: 'manual', message: errors[0] });
          }
        });
      }
    }
    setIsSubmittingUpdate(false);
  };

  const { date, time } = formatMatchDateTime(event.eventTime);

  return (
    <Card className="bg-muted/30 shadow-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitUpdate)}>
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span>{event.name} <span className="text-sm font-normal text-muted-foreground">({event.sportSlug}) - ID: {event.id}</span></span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                event.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                event.status === 'live' ? 'bg-red-100 text-red-700' :
                event.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                event.status === 'finished' ? 'bg-green-100 text-green-700' :
                event.status === 'cancelled' ? 'bg-gray-100 text-gray-700' : ''
              }`}>
                {event.status.toUpperCase()}
              </span>
            </CardTitle>
            <CardDescription>
              {event.homeTeam.name} vs {event.awayTeam.name} - {date} at {time}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(['upcoming', 'live', 'paused', 'finished', 'cancelled'] as ManagedEventStatus[]).map(s => (
                          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="elapsedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Elapsed Time (minutes)</FormLabel>
                    <FormControl><Input type="text" inputMode="numeric" placeholder="e.g., 45" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="homeScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Score ({event.homeTeam.name})</FormLabel>
                    <FormControl><Input type="text" inputMode="numeric" placeholder="0" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="awayScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Away Score ({event.awayTeam.name})</FormLabel>
                    <FormControl><Input type="text" inputMode="numeric" placeholder="0" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {form.watch('status') === 'finished' && (
                 <FormField
                    control={form.control}
                    name="winningTeamId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Winning Team (auto-set by scores if different, or select for draws/manual override)</FormLabel>
                        <Select 
                            onValueChange={field.onChange} 
                            value={field.value ?? NULL_WINNER_OPTION_VALUE} 
                            disabled={
                                (form.getValues('homeScore') !== '' && form.getValues('awayScore') !== '' && 
                                 !isNaN(Number(form.getValues('homeScore'))) && !isNaN(Number(form.getValues('awayScore'))) &&
                                 Number(form.getValues('homeScore')) !== Number(form.getValues('awayScore')))
                            }
                        >
                            <FormControl><SelectTrigger><SelectValue placeholder="Select winning team (or Draw)" /></SelectTrigger></FormControl>
                            <SelectContent>
                            <SelectItem value={NULL_WINNER_OPTION_VALUE}>Draw / No Winner</SelectItem>
                            <SelectItem value={event.homeTeam.id.toString()}>{event.homeTeam.name} (Home)</SelectItem>
                            <SelectItem value={event.awayTeam.id.toString()}>{event.awayTeam.name} (Away)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
            )}
            <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Notes / Key Events</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Mi-temps: 1-0, Carton rouge pour Joueur Z..." {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmittingUpdate}>
              {isSubmittingUpdate ? <LoadingSpinner size="sm" /> : <><Save size={16} className="mr-2"/> Update Event</>}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
