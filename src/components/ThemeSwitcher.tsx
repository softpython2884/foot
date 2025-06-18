
'use client';

import { useTheme, type Theme, type Mode } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Palette, Sun, Moon, Laptop, Check } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, mode, setMode } = useTheme();

  const themeDisplayNames: Record<Theme, string> = {
    default: 'Défaut',
    blue: 'Bleu',
    pink: 'Rose',
    orange: 'Orange',
  };

  const modeDisplayNames: Record<Mode, string> = {
    light: 'Clair',
    dark: 'Sombre',
    system: 'Système',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Changer de thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Choisir un thème</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(['default', 'blue', 'pink', 'orange'] as Theme[]).map((t) => (
          <DropdownMenuItem key={t} onClick={() => setTheme(t)} className="cursor-pointer">
            {theme === t && <Check className="mr-2 h-4 w-4" />}
            <span>{themeDisplayNames[t]}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Mode d'affichage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(['light', 'dark', 'system'] as Mode[]).map((m) => (
          <DropdownMenuItem key={m} onClick={() => setMode(m)} className="cursor-pointer">
            {mode === m && <Check className="mr-2 h-4 w-4" />}
            {m === 'light' && <Sun className="mr-2 h-4 w-4" />}
            {m === 'dark' && <Moon className="mr-2 h-4 w-4" />}
            {m === 'system' && <Laptop className="mr-2 h-4 w-4" />}
            <span>{modeDisplayNames[m]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// This component can be used if you prefer a separate button for theme switching
// instead of integrating it into the user dropdown.
// For now, it's integrated into Header.tsx's user dropdown.
