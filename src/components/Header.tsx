
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { UserCircle, LogOut, LayoutDashboard, Palette, Sun, Moon, Laptop, Check, ShieldQuestion } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export function Header() {
  const { currentUser, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, setTheme, mode, setMode } = useTheme();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const themeDisplayNames: Record<string, string> = {
    default: 'Défaut',
    blue: 'Bleu',
    pink: 'Rose',
    orange: 'Orange',
  };

  const modeDisplayNames: Record<string, string> = {
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
  };

  return (
    <header className="bg-primary text-primary-foreground py-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SportSphere Logo">
            <title>SportSphere Logo</title>
            <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="12"/>
            {/* Football */}
            <circle cx="70" cy="70" r="15" fill="hsl(var(--accent))" />
            {/* Basketball */}
            <path d="M130 70 L145 85 L130 100 L115 85 Z" fill="hsl(var(--destructive))" />
            {/* Generic Sport Icon (e.g. a simple star or a different shape) */}
            <path d="M100 120 L112 155 L145 155 L118 175 L125 200 L100 180 L75 200 L82 175 L55 155 L88 155 Z" transform="translate(0, -45)" fill="hsl(var(--secondary-foreground))" opacity="0.7"/>
             {/* F1 like element - a simple tyre shape */}
            <circle cx="130" cy="130" r="20" stroke="currentColor" strokeWidth="6" fill="none" />
            <circle cx="130" cy="130" r="8" fill="currentColor" />
          </svg>
          <h1 className="text-3xl font-bold font-headline">SportSphere</h1>
        </Link>
        <nav className="flex items-center gap-2">
          {authLoading ? (
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
                <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Thème</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuLabel>Choisir un thème</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {['default', 'blue', 'pink', 'orange'].map((t) => (
                        <DropdownMenuItem key={t} onClick={() => setTheme(t)} className="cursor-pointer">
                          {theme === t && <Check className="mr-2 h-4 w-4" />}
                          <span>{themeDisplayNames[t]}</span>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                       <DropdownMenuLabel>Mode d'affichage</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                      {['light', 'dark', 'system'].map((m) => (
                         <DropdownMenuItem key={m} onClick={() => setMode(m as 'light' | 'dark' | 'system')} className="cursor-pointer">
                           {mode === m && <Check className="mr-2 h-4 w-4" />}
                           {m === 'light' && <Sun className="mr-2 h-4 w-4" />}
                           {m === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                           {m === 'system' && <Laptop className="mr-2 h-4 w-4" />}
                           <span>{modeDisplayNames[m]}</span>
                         </DropdownMenuItem>
                       ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                    <Palette className="h-5 w-5" />
                    <span className="sr-only">Changer de thème</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>Choisir un thème</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {['default', 'blue', 'pink', 'orange'].map((t) => (
                      <DropdownMenuItem key={t} onClick={() => setTheme(t)} className="cursor-pointer">
                        {theme === t && <Check className="mr-2 h-4 w-4" />}
                        <span>{themeDisplayNames[t]}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Mode d'affichage</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {['light', 'dark', 'system'].map((m) => (
                        <DropdownMenuItem key={m} onClick={() => setMode(m as 'light' | 'dark' | 'system')} className="cursor-pointer">
                        {mode === m && <Check className="mr-2 h-4 w-4" />}
                        {m === 'light' && <Sun className="mr-2 h-4 w-4" />}
                        {m === 'dark' && <Moon className="mr-2 h-4 w-4" />}
                        {m === 'system' && <Laptop className="mr-2 h-4 w-4" />}
                        <span>{modeDisplayNames[m]}</span>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
