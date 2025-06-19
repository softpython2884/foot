
'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { createManagedEventAction } from '@/actions/adminEvents';
import { supportedSports, footballTeams, formula1Entities, basketballTeams } from '@/lib/mockData';
import type { TeamApp, ManagedEventApp, ManagedEventStatus } from '@/lib/types';
import { ManagedEventEditorCard } from './components/ManagedEventEditorCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle } from 'lucide-react';


const createEventFormSchema = z.object({
  name: z.string().min(3, "Event name must be at least 3 characters."),
  sportSlug: z.string().min(1, "Sport must be selected."),
  homeTeamId: z.string().min(1, "Home team must be selected."),
  awayTeamId: z.string().min(1, "Away team must be selected."),
  eventTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date/time format." }),
  status: z.custom<ManagedEventStatus>((val) => ['upcoming', 'live', 'paused', 'finished', 'cancelled'].includes(val as string), {
    message: "Invalid event status",
  }).optional().default('upcoming'),
  homeScore: z.string().optional().refine(val => val === '' || val == null || /^\d+$/.test(val), { message: "Score must be a positive number or empty." }),
  awayScore: z.string().optional().refine(val => val === '' || val == null || /^\d+$/.test(val), { message: "Score must be a positive number or empty." }),
  elapsedTime: z.string().optional().refine(val => val === '' || val == null || /^\d+$/.test(val), { message: "Elapsed time must be a positive number or empty." }),
  notes: z.string().optional(),
});

type CreateEventFormValues = z.infer<typeof createEventFormSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<ManagedEventApp[]>([]);
  const [selectedSportForCreation, setSelectedSportForCreation] = useState<string>('');
  const [availableTeamsForCreation, setAvailableTeamsForCreation] = useState<TeamApp[]>([]);

  const createEventForm = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      name: '',
      sportSlug: '',
      homeTeamId: '',
      awayTeamId: '',
      eventTime: new Date().toISOString().slice(0, 16),
      status: 'upcoming',
      homeScore: '',
      awayScore: '',
      elapsedTime: '',
      notes: '',
    },
  });

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/events');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch events and parse error response' }));
        throw new Error(errorData.error || `Failed to fetch events. Status: ${response.status}`);
      }
      const data: ManagedEventApp[] = await response.json();
      setEvents(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error Loading Events', description: (error as Error).message });
      setEvents([]); // Clear events on error to avoid displaying stale data
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, [toast]);

  useEffect(() => {
    if (selectedSportForCreation === 'football') {
      setAvailableTeamsForCreation(footballTeams);
    } else if (selectedSportForCreation === 'formula-1') {
      setAvailableTeamsForCreation(formula1Entities);
    } else if (selectedSportForCreation === 'basketball') {
      setAvailableTeamsForCreation(basketballTeams);
    } else {
      setAvailableTeamsForCreation([]);
    }
    createEventForm.resetField("homeTeamId");
    createEventForm.resetField("awayTeamId");
  }, [selectedSportForCreation, createEventForm]);


  const onCreateEventSubmit = async (data: CreateEventFormValues) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('sportSlug', data.sportSlug);
    formData.append('homeTeamId', data.homeTeamId);
    formData.append('awayTeamId', data.awayTeamId);
    formData.append('eventTime', new Date(data.eventTime).toISOString());
    formData.append('status', data.status || 'upcoming');
    if (data.homeScore) formData.append('homeScore', data.homeScore);
    if (data.awayScore) formData.append('awayScore', data.awayScore);
    if (data.elapsedTime) formData.append('elapsedTime', data.elapsedTime);
    if (data.notes) formData.append('notes', data.notes);

    const result = await createManagedEventAction(formData);
    if (result.success) {
      toast({ title: 'Success', description: result.success });
      createEventForm.reset();
      setSelectedSportForCreation(''); 
      loadEvents(); 
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to create event.' });
      if (result.details) {
        Object.entries(result.details).forEach(([field, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
             createEventForm.setError(field as keyof CreateEventFormValues, { type: 'manual', message: errors[0] });
          }
        });
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold font-headline text-center mb-10 text-primary">Admin Panel - Manage Events</h1>

        <Accordion type="single" collapsible className="w-full mb-10" defaultValue="create-event">
          <AccordionItem value="create-event" className="border-none">
            <Card className="shadow-xl">
              <AccordionTrigger className="px-6 py-4 text-xl font-headline hover:no-underline">
                <div className="flex items-center gap-2"><PlusCircle /> Create New Event</div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <Form {...createEventForm}>
                  <form onSubmit={createEventForm.handleSubmit(onCreateEventSubmit)} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={createEventForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Champions League Final" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createEventForm.control}
                        name="sportSlug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sport</FormLabel>
                            <Select onValueChange={(value) => { field.onChange(value); setSelectedSportForCreation(value); }} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {supportedSports.map(sport => (
                                  <SelectItem key={sport.slug} value={sport.slug}>{sport.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {selectedSportForCreation && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={createEventForm.control}
                          name="homeTeamId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Home Team</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={availableTeamsForCreation.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select home team" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {availableTeamsForCreation.map(team => (
                                    <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createEventForm.control}
                          name="awayTeamId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Away Team</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} disabled={availableTeamsForCreation.length === 0}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select away team" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {availableTeamsForCreation.map(team => (
                                    <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={createEventForm.control}
                          name="eventTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Event Date & Time</FormLabel>
                              <FormControl><Input type="datetime-local" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                            control={createEventForm.control}
                            name="elapsedTime"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Elapsed Time (minutes)</FormLabel>
                                <FormControl><Input type="number" placeholder="e.g., 45" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={createEventForm.control}
                            name="homeScore"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Home Score</FormLabel>
                                <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={createEventForm.control}
                            name="awayScore"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Away Score</FormLabel>
                                <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={createEventForm.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Notes / Key Events</FormLabel>
                            <FormControl><Textarea placeholder="e.g., Mi-temps, But de X à la Yème minute..." {...field} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <LoadingSpinner size="sm" /> : 'Create Event'}
                    </Button>
                  </form>
                </Form>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>


        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline">Existing Managed Events</CardTitle>
            <CardDescription>Update status, scores, and winner for ongoing or finished events.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && events.length === 0 ? (
              <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
            ) : events.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No managed events found. Create one above!</p>
            ) : (
              <div className="space-y-6">
                {events.map((event) => (
                  <ManagedEventEditorCard key={event.id} event={event} onEventUpdated={loadEvents} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
