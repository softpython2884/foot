
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { createManagedEventAction, updateManagedEventAction } from '@/actions/adminEvents';
import { getAllManagedEventsFromDb } from '@/lib/db'; // We need a client-callable action for this or fetch via API route
import type { ManagedEventDb, TeamApp } from '@/lib/types';
import { footballTeams, supportedSports } from '@/lib/mockData';
import { AlertCircle, CheckCircle, Edit3, ListChecks, PlusCircle, Trash2, Play, Pause, Flag, Settings } from 'lucide-react';


const createEventSchema = z.object({
  sportSlug: z.string().min(1),
  homeTeamApiId: z.string().min(1, "Home team is required"),
  awayTeamApiId: z.string().min(1, "Away team is required"),
  eventTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date/time required (YYYY-MM-DDTHH:mm)' }),
  leagueName: z.string().optional(),
});
type CreateEventFormValues = z.infer<typeof createEventSchema>;

const updateEventStatusSchema = z.object({
    status: z.enum(['upcoming', 'live', 'paused', 'finished', 'cancelled']),
    homeScore: z.string().optional(),
    awayScore: z.string().optional(),
    // winnerTeamApiId is determined by scores if finished, unless it's a draw or manual override needed
});
type UpdateEventStatusFormValues = z.infer<typeof updateEventStatusSchema>;


// Client-side action to fetch events (alternative to API route for simplicity here)
// In a real app, this might be an API route or a Server Action if it doesn't expose sensitive info.
async function fetchAdminEvents(): Promise<ManagedEventDb[]> {
    // This is a placeholder. Direct DB access from client is not good.
    // This should be replaced by an API call or a server action.
    // For now, we'll make it return empty to avoid breaking client component rules.
    // To actually get data, you'd need to:
    // 1. Create an API route (e.g., /api/admin/events) that calls getAllManagedEventsFromDb()
    // 2. Fetch from that API route here.
    // OR a Server Action.
    // For this prototype iteration, we will call the DB directly in a server component wrapper or a server action later.
    // For now, the list will be empty on initial load and re-fetched after creation.
    console.warn("fetchAdminEvents is a placeholder and needs proper API/Server Action implementation.");
    return [];
}


export default function AdminPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<ManagedEventDb[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedSportTeams, setSelectedSportTeams] = useState<TeamApp[]>(footballTeams); // Default to football

  const createForm = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: { sportSlug: 'football', leagueName: 'Custom League', eventTime: new Date().toISOString().substring(0, 16) },
  });

  const updateForms = new Map<number, ReturnType<typeof useForm<UpdateEventStatusFormValues>>>();
  events.forEach(event => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const form = useForm<UpdateEventStatusFormValues>({
        resolver: zodResolver(updateEventStatusSchema),
        defaultValues: { 
            status: event.status,
            homeScore: event.homeScore?.toString() || '',
            awayScore: event.awayScore?.toString() || '',
        },
    });
    updateForms.set(event.id, form);
  });


  const loadEvents = async () => {
    setIsLoadingEvents(true);
    try {
      // const fetchedEvents = await fetchAdminEvents(); // Placeholder
      // For now, we can't directly call getAllManagedEventsFromDb here.
      // This part needs a server action or API endpoint.
      // Let's simulate an empty list and revalidate after creation.
      const response = await fetch('/api/admin/events'); // Assuming an API route exists
        if (!response.ok) {
            throw new Error('Failed to fetch events');
        }
        const fetchedEvents = await response.json();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not load events.' });
    }
    setIsLoadingEvents(false);
  };
  
  useEffect(() => {
    loadEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSportChange = (sportSlug: string) => {
    createForm.setValue('sportSlug', sportSlug);
    if (sportSlug === 'football') {
      setSelectedSportTeams(footballTeams);
    } 
    // Add more sports here if needed
    // else if (sportSlug === 'formula-1') { setSelectedSportTeams(formula1Entities); }
    else {
      setSelectedSportTeams([]);
    }
    createForm.resetField('homeTeamApiId');
    createForm.resetField('awayTeamApiId');
  };

  const onCreateSubmit = async (data: CreateEventFormValues) => {
    const formData = new FormData();
    formData.append('sportSlug', data.sportSlug);
    formData.append('homeTeamApiId', data.homeTeamApiId);
    formData.append('awayTeamApiId', data.awayTeamApiId);
    formData.append('eventTime', data.eventTime);
    if (data.leagueName) formData.append('leagueName', data.leagueName);

    const result = await createManagedEventAction(formData);
    if (result.success) {
      toast({ title: 'Success', description: result.success });
      createForm.reset();
      loadEvents(); // Refresh the list
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to create event.' });
    }
  };

  const onUpdateStatusSubmit = async (eventId: number, data: UpdateEventStatusFormValues) => {
    const formData = new FormData();
    formData.append('eventId', eventId.toString());
    formData.append('status', data.status);
    if (data.homeScore !== undefined && data.homeScore !== '') formData.append('homeScore', data.homeScore);
    if (data.awayScore !== undefined && data.awayScore !== '') formData.append('awayScore', data.awayScore);
    // winnerTeamApiId is handled by the action based on scores for 'finished' status

    const result = await updateManagedEventAction(formData);
     if (result.success) {
      toast({ title: 'Success', description: result.success });
      loadEvents(); // Refresh the list
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update event.' });
    }
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold font-headline text-center mb-12 text-primary">Admin Panel - Event Management</h1>

        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlusCircle /> Create New Event</CardTitle>
            <CardDescription>Manually create a new sporting event.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                <FormField
                  control={createForm.control}
                  name="sportSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport</FormLabel>
                      <Select onValueChange={(value) => handleSportChange(value)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                        </FormControl>
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
                <FormField
                  control={createForm.control}
                  name="homeTeamApiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home Team</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select home team" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedSportTeams.map(team => (
                            <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={createForm.control}
                  name="awayTeamApiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Away Team</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select away team" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedSportTeams.map(team => (
                            <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="eventTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="leagueName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>League/Event Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., Friendly Cup" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createForm.formState.isSubmitting}>
                  {createForm.formState.isSubmitting ? <LoadingSpinner size="sm" /> : 'Create Event'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListChecks /> Managed Events</CardTitle>
                <CardDescription>View and update existing custom events.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingEvents && <div className="flex justify-center py-5"><LoadingSpinner /></div>}
                {!isLoadingEvents && events.length === 0 && <p className="text-muted-foreground text-center py-4">No custom events found.</p>}
                {!isLoadingEvents && events.length > 0 && (
                    <div className="space-y-6">
                        {events.map(event => {
                            const updateFormInstance = updateForms.get(event.id) || useForm<UpdateEventStatusFormValues>({ resolver: zodResolver(updateEventStatusSchema), defaultValues: { status: event.status, homeScore: event.homeScore?.toString() || '', awayScore: event.awayScore?.toString() || '' }});
                            if(!updateForms.has(event.id) && updateFormInstance) updateForms.set(event.id, updateFormInstance);
                            
                            return (
                            <Card key={event.id} className="bg-muted/30 p-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
                                    <h3 className="text-lg font-semibold">{event.homeTeamName} vs {event.awayTeamName}</h3>
                                    <p className="text-sm text-muted-foreground">{new Date(event.eventTime).toLocaleString()}</p>
                                </div>
                                <p className="text-sm">League: {event.leagueName || 'N/A'}</p>
                                <p className="text-sm">Sport: {event.sportSlug}</p>
                                <p className="text-sm">Status: <span className="font-medium">{event.status}</span></p>
                                {event.status === 'finished' && (
                                    <p className="text-sm">Score: {event.homeScore} - {event.awayScore}
                                    {event.winnerTeamApiId && (
                                        <span> (Winner: {event.winnerTeamApiId === event.homeTeamApiId ? event.homeTeamName : event.awayTeamName})</span>
                                    )}
                                    </p>
                                )}
                                {event.status !== 'finished' && event.status !== 'cancelled' && (
                                <Form {...updateFormInstance}>
                                <form onSubmit={updateFormInstance.handleSubmit(data => onUpdateStatusSubmit(event.id, data))} className="mt-4 space-y-3 sm:space-y-0 sm:flex sm:items-end sm:gap-3">
                                    <FormField
                                        control={updateFormInstance.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem className="flex-grow">
                                            <FormLabel className="text-xs">New Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Set status" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="upcoming">Upcoming</SelectItem>
                                                    <SelectItem value="live">Live</SelectItem>
                                                    <SelectItem value="paused">Paused</SelectItem>
                                                    <SelectItem value="finished">Finished</SelectItem>
                                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            </FormItem>
                                        )}
                                        />
                                    {updateFormInstance.watch('status') === 'finished' && (
                                        <>
                                        <FormField
                                            control={updateFormInstance.control}
                                            name="homeScore"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel className="text-xs">Home Score</FormLabel>
                                                <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                            />
                                        <FormField
                                            control={updateFormInstance.control}
                                            name="awayScore"
                                            render={({ field }) => (
                                                <FormItem>
                                                <FormLabel className="text-xs">Away Score</FormLabel>
                                                <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
                                                </FormItem>
                                            )}
                                            />
                                        </>
                                    )}
                                    <Button type="submit" size="sm" disabled={updateFormInstance.formState.isSubmitting}>
                                        {updateFormInstance.formState.isSubmitting ? <LoadingSpinner size="sm"/> : <><Edit3 size={16} className="mr-1"/>Update</>}
                                    </Button>
                                </form>
                                </Form>
                                )}
                            </Card>
                        )})}
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
