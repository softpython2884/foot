
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserCircle, LogOut, LayoutDashboard } from 'lucide-react'; // Added icons

export function Header() {
  const { currentUser, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/'); 
  };

  return (
    <header className="bg-primary text-primary-foreground py-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <svg width="36" height="36" viewBox="0 0 60 60" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="FootySchedule Logo">
            <title>FootySchedule Logo</title>
            <path d="M45,15 C45,5 30,5 30,15 C30,25 45,25 45,30 C45,35 30,35 30,45 C30,55 15,55 15,45"
                  stroke="currentColor" strokeWidth="5" fill="none"
                  strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="42" cy="8" r="5" fill="currentColor"/>
          </svg>
          <h1 className="text-3xl font-bold font-headline">FootySchedule</h1>
        </Link>
        <nav className="flex items-center gap-2">
          {isLoading ? (
             <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80" disabled>
                <UserCircle className="mr-2 h-5 w-5 animate-pulse" /> Loading...
            </Button>
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 px-3">
                  <UserCircle className="mr-0 sm:mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">{currentUser.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/80">
                <Link href="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
