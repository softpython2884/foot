
import type { Match, League, Team } from './types';

export const leagues: League[] = [
  { id: 'L1', name: 'Premier League' },
  { id: 'L2', name: 'La Liga' },
  { id: 'L3', name: 'Serie A' },
  { id: 'L4', name: 'Bundesliga' },
  { id: 'L5', name: 'Ligue 1' },
];

export const teams: Team[] = [
  { id: 'T1', name: 'Manchester United', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T2', name: 'Liverpool FC', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T3', name: 'Real Madrid', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T4', name: 'FC Barcelona', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T5', name: 'Juventus', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T6', name: 'AC Milan', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T7', name: 'Bayern Munich', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T8', name: 'Borussia Dortmund', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T9', name: 'Paris Saint-Germain', bannerImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Paris_Saint-Germain_Logo.svg/200px-Paris_Saint-Germain_Logo.svg.png' }, // Using specific PSG logo
  { id: 'T10', name: 'Olympique de Marseille', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T11', name: 'Chelsea FC', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T12', name: 'Arsenal FC', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T13', name: 'Atletico Madrid', bannerImageUrl: 'https://placehold.co/300x150.png' },
  { id: 'T14', name: 'Inter Milan', bannerImageUrl: 'https://placehold.co/300x150.png' },
];

// Get specific team objects for matches
const getTeam = (id: string) => teams.find(t => t.id)!;
const getLeague = (id: string) => leagues.find(l => l.id)!;

export const mockMatches: Match[] = [
  {
    id: 'M1',
    league: getLeague('L1'),
    homeTeam: getTeam('T1'),
    awayTeam: getTeam('T2'),
    matchTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    venue: 'Old Trafford',
    status: 'completed',
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: 'M2',
    league: getLeague('L2'),
    homeTeam: getTeam('T3'),
    awayTeam: getTeam('T4'),
    matchTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    venue: 'Santiago Bernabeu',
    status: 'completed',
    homeScore: 3,
    awayScore: 3,
  },
  {
    id: 'M3',
    league: getLeague('L5'),
    homeTeam: getTeam('T9'), // PSG
    awayTeam: getTeam('T10'),
    matchTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    venue: 'Parc des Princes',
    status: 'completed',
    homeScore: 2,
    awayScore: 0,
  },
  {
    id: 'M4',
    league: getLeague('L1'),
    homeTeam: getTeam('T11'),
    awayTeam: getTeam('T1'), // Man U
    matchTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
    venue: 'Stamford Bridge',
    status: 'upcoming',
  },
  {
    id: 'M5',
    league: getLeague('L5'),
    homeTeam: getTeam('T8'),
    awayTeam: getTeam('T9'), // PSG
    matchTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // In 5 days
    venue: 'Signal Iduna Park',
    status: 'upcoming',
  },
];
