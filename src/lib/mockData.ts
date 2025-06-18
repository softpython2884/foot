
import type { Match, League, Team } from './types';

export const leagues: League[] = [
  { id: 'L1', name: 'Premier League' },
  { id: 'L2', name: 'La Liga' },
  { id: 'L3', name: 'Serie A' },
  { id: 'L4', name: 'Bundesliga' },
  { id: 'L5', name: 'Ligue 1' },
];

export const teams: Team[] = [
  { id: 'T1', name: 'Manchester United', logoImageUrl: 'https://toppng.com/uploads/preview/manchester-united-logo-png-free-11660341645zdrkcrqzmk.png' },
  { id: 'T2', name: 'Liverpool FC', logoImageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZWmkUo08wH9DVmeaB9rp4YerDQ-eOEqRtIg&s' },
  { id: 'T3', name: 'Real Madrid', logoImageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcThncOgOseI0qfhv5ANM_u4HzXaxA6GELfKxQ&s' },
  { id: 'T4', name: 'FC Barcelona', logoImageUrl: 'https://e1.pngegg.com/pngimages/757/917/png-clipart-logo-de-la-ligue-des-champions-fc-barcelone-ligue-des-champions-uefa-la-liga-coupe-du-monde-des-clubs-de-la-fifa-ecusson-equipe-de-football-espagne.png' },
  { id: 'T5', name: 'Juventus', logoImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'T6', name: 'AC Milan', logoImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'T7', name: 'Bayern Munich', logoImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'T8', name: 'Borussia Dortmund', logoImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'T9', name: 'Paris Saint-Germain', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Paris_Saint-Germain_Logo.svg/1024px-Paris_Saint-Germain_Logo.svg.png' },
  { id: 'T10', name: 'Olympique de Marseille', logoImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'T11', name: 'Chelsea FC', logoImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'T12', name: 'Arsenal FC', logoImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'T13', name: 'Atletico Madrid', logoImageUrl: 'https://placehold.co/100x100.png' },
  { id: 'T14', name: 'Inter Milan', logoImageUrl: 'https://placehold.co/100x100.png' },
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
