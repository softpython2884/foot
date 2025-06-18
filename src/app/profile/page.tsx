
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { updateNameAction, updatePasswordAction, getLeaderboardAction } from '@/actions/user';
import { getBetHistoryAction, settleBetAction } from '@/actions/bets'; // Import bet actions
import type { AuthenticatedUser, LeaderboardUser, BetWithMatchDetails } from '@/lib/types';
import { UserCog, LockKeyhole, Trophy, ListOrdered, UserCircle, Gamepad2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { formatMatchDateTime } from '@/lib/dateUtils';


const nameFormSchema = z.object({
  newName: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
});
type NameFormValues = z.infer<typeof nameFormSchema>;

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters long.' }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match.",
  path: ['confirmPassword'],
});
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const { currentUser, login: updateAuthContextUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [betHistory, setBetHistory] = useState<BetWithMatchDetails[]>([]);
  const [betHistoryLoading, setBetHistoryLoading] = useState(true);
  const [isSettlingBet, setIsSettlingBet] = useState<number | null>(null);


  const nameForm = useForm<NameFormValues>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: { newName: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const fetchBetHistory = useCallback(async () => {
    if (!currentUser) return;
    setBetHistoryLoading(true);
    const result = await getBetHistoryAction(currentUser.id);
    if (result.bets) {
      setBetHistory(result.bets);
    } else if (result.error) {
      toast({ variant: 'destructive', title: 'Error fetching bet history', description: result.error });
    }
    setBetHistoryLoading(false);
  }, [currentUser, toast]);


  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    } else if (currentUser) {
      nameForm.reset({ newName: currentUser.name });
      fetchBetHistory(); // Fetch bet history when user is available
    }
  }, [currentUser, authLoading, router, nameForm, fetchBetHistory]);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLeaderboardLoading(true);
      const result = await getLeaderboardAction();
      if (result.users) {
        setLeaderboard(result.users);
      } else if (result.error) {
        toast({ variant: 'destructive', title: 'Error fetching leaderboard', description: result.error });
      }
      setLeaderboardLoading(false);
    }
    fetchLeaderboard();
  }, [toast]);

  const onNameSubmit = async (data: NameFormValues) => {
    if (!currentUser) return;
    const formData = new FormData();
    formData.append('userId', currentUser.id.toString());
    formData.append('newName', data.newName);

    const result = await updateNameAction(formData);
    if (result.success && result.user) {
      toast({ title: 'Success', description: result.success });
      updateAuthContextUser(result.user as AuthenticatedUser); 
      nameForm.reset({ newName: result.user.name });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update name.' });
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!currentUser) return;
    const formData = new FormData();
    formData.append('userId', currentUser.id.toString());
    formData.append('currentPassword', data.currentPassword);
    formData.append('newPassword', data.newPassword);
    formData.append('confirmPassword', data.confirmPassword);

    const result = await updatePasswordAction(formData);
    if (result.success) {
      toast({ title: 'Success', description: result.success });
      passwordForm.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update password.' });
      if (result.details) {
        Object.entries(result.details).forEach(([field, errors]) => {
          const fieldName = field as keyof PasswordFormValues;
          if (Array.isArray(errors) && errors.length > 0) {
             passwordForm.setError(fieldName, { type: 'manual', message: errors[0] });
          }
        });
      }
    }
  };

  const handleSettleBet = async (betId: number, userWon: boolean) => {
    if(!currentUser) return;
    setIsSettlingBet(betId);
    const formData = new FormData();
    formData.append('betId', betId.toString());
    formData.append('userWon', userWon.toString());
    
    const result = await settleBetAction(formData);
    if (result.success) {
      toast({ title: 'Bet Settled', description: result.success });
      // Refetch user data to update score in AuthContext and display
      const updatedUser = await getUserById(currentUser.id);
      if (updatedUser) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashedPassword, ...userToAuth } = updatedUser;
        updateAuthContextUser(userToAuth as AuthenticatedUser);
      }
      fetchBetHistory(); // Refetch bet history to update status
      // Refetch leaderboard if needed, or assume score update will eventually reflect.
      const leaderboardResult = await getLeaderboardAction();
        if (leaderboardResult.users) {
            setLeaderboard(leaderboardResult.users);
        }

    } else {
      toast({ variant: 'destructive', title: 'Error settling bet', description: result.error });
    }
    setIsSettlingBet(null);
  };


  if (authLoading || !currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold font-headline text-center mb-12 text-primary">My Profile</h1>
        
        <Card className="shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline"><UserCircle /> User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</p>
                <button
                  onClick={() => {
                    const inputElement = document.getElementById('newName');
                    const accordionTrigger = document.querySelector('[data-radix-collection-item][value="edit-name"] button[aria-expanded="false"]');
                    if (accordionTrigger instanceof HTMLElement) {
                      accordionTrigger.click(); 
                      setTimeout(() => inputElement?.focus(), 100);
                    } else if (inputElement) {
                      inputElement.focus();
                    }
                  }}
                  className="mt-1 block w-full text-left text-xl font-semibold text-primary hover:text-primary/80 transition-colors p-0 h-auto bg-transparent"
                  aria-label="Edit name"
                >
                  {currentUser.name}
                </button>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="mt-1 block text-xl font-semibold text-foreground">
                  {currentUser.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</p>
                <p className="mt-1 block text-xl font-bold text-accent">
                  {currentUser.score}
                </p>
              </div>
            </CardContent>
          </Card>

        <Accordion type="single" collapsible className="w-full space-y-6 mb-8" defaultValue="edit-name">
          <AccordionItem value="edit-name" className="border-none">
            <Card className="shadow-lg">
              <AccordionTrigger className="px-6 py-4 text-lg font-headline hover:no-underline">
                <div className="flex items-center gap-2"><UserCog /> Edit Name</div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <Form {...nameForm}>
                  <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-4 pt-2">
                    <FormField
                      control={nameForm.control}
                      name="newName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Name</FormLabel>
                          <FormControl>
                            <Input id="newName" placeholder="Enter new name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={nameForm.formState.isSubmitting}>
                      {nameForm.formState.isSubmitting ? <LoadingSpinner size="sm"/> : 'Update Name'}
                    </Button>
                  </form>
                </Form>
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="change-password" className="border-none">
             <Card className="shadow-lg">
              <AccordionTrigger className="px-6 py-4 text-lg font-headline hover:no-underline">
                <div className="flex items-center gap-2"><LockKeyhole /> Change Password</div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 pt-2">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={passwordForm.formState.isSubmitting}>
                       {passwordForm.formState.isSubmitting ? <LoadingSpinner size="sm"/> : 'Update Password'}
                    </Button>
                  </form>
                </Form>
              </AccordionContent>
            </Card>
          </AccordionItem>
        </Accordion>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-headline"><Gamepad2 /> Bet History</CardTitle>
                </CardHeader>
                <CardContent>
                    {betHistoryLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <LoadingSpinner />
                        </div>
                    ) : betHistory.length > 0 ? (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {betHistory.map((bet) => {
                                const { date, time } = formatMatchDateTime(bet.matchTime);
                                return (
                                    <Card key={bet.id} className="bg-muted/30">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-md">
                                                {bet.homeTeamName} vs {bet.awayTeamName}
                                            </CardTitle>
                                            <CardDescription>{bet.leagueName} - {date} at {time}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-1">
                                            <p>Bet on: <span className="font-semibold">{bet.teamBetOnName}</span></p>
                                            <p>Amount: <span className="font-semibold">{bet.amountBet} pts</span></p>
                                            <p>Potential Winnings: <span className="font-semibold">{bet.potentialWinnings} pts</span></p>
                                            <p>Status: 
                                                <span className={cn(
                                                    "font-semibold",
                                                    bet.status === 'won' && 'text-green-500',
                                                    bet.status === 'lost' && 'text-red-500',
                                                    bet.status === 'pending' && 'text-yellow-500'
                                                )}>
                                                    {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                                                    {bet.status === 'won' && <CheckCircle2 className="inline ml-1 h-4 w-4" />}
                                                    {bet.status === 'lost' && <XCircle className="inline ml-1 h-4 w-4" />}
                                                    {bet.status === 'pending' && <AlertTriangle className="inline ml-1 h-4 w-4" />}
                                                </span>
                                            </p>
                                        </CardContent>
                                        {bet.status === 'pending' && (
                                            <CardFooter className="flex gap-2 pt-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => handleSettleBet(bet.id, true)}
                                                    disabled={isSettlingBet === bet.id}
                                                    className="text-green-500 border-green-500 hover:bg-green-500/10 hover:text-green-600"
                                                >
                                                    {isSettlingBet === bet.id ? <LoadingSpinner size="sm"/> : "Simulate Win"}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => handleSettleBet(bet.id, false)}
                                                    disabled={isSettlingBet === bet.id}
                                                    className="text-red-500 border-red-500 hover:bg-red-500/10 hover:text-red-600"
                                                >
                                                    {isSettlingBet === bet.id ? <LoadingSpinner size="sm"/> : "Simulate Loss"}
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">You haven&apos;t placed any bets yet.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline"><Trophy /> Leaderboard (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                {leaderboardLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <LoadingSpinner />
                    </div>
                ) : leaderboard.length > 0 ? (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead className="w-[50px]">Rank</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((user, index) => (
                        <TableRow key={user.id} className={user.id === currentUser.id ? 'bg-primary/10' : ''}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell className="text-right">{user.score}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                ) : (
                    <p className="text-muted-foreground">No users on the leaderboard yet.</p>
                )}
                </CardContent>
            </Card>
        </div>
        <div className="mt-12 text-center">
            <Link href="/">
                <Button variant="outline">Back to Home</Button>
            </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
