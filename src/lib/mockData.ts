import type { Match, League, Team } from './types';

export const leagues: League[] = [
  { id: 'L1', name: 'Premier League' },
  { id: 'L2', name: 'La Liga' },
  { id: 'L3', name: 'Serie A' },
  { id: 'L4', name: 'Bundesliga' },
  { id: 'L5', name: 'Ligue 1' },
];

export const teams: Team[] = [
  { id: 'T1', name: 'Manchester United' },
  { id: 'T2', name: 'Liverpool FC' },
  { id: 'T3', name: 'Real Madrid' },
  { id: 'T4', name: 'FC Barcelona' },
  { id: 'T5', name: 'Juventus' },
  { id: 'T6', name: 'AC Milan' },
  { id: 'T7', name: 'Bayern Munich' },
  { id: 'T8', name: 'Borussia Dortmund' },
  { id: 'T9', name: 'Paris Saint-Germain' },
  { id: 'T10', name: 'Olympique de Marseille' },
  { id: 'T11', name: 'Chelsea FC' },
  { id: 'T12', name: 'Arsenal FC' },
  { id: 'T13', name: 'Atletico Madrid' },
  { id: 'T14', name: 'Inter Milan' },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date(today);
dayAfterTomorrow.setDate(today.getDate() + 2);

export const mockMatches: Match[] = [
  {
    id: 'M1',
    league: leagues[0], // Premier League
    homeTeam: teams[0], // Manchester United
    awayTeam: teams[1], // Liverpool FC
    matchTime: new Date(new Date(today).setHours(15, 0, 0, 0)).toISOString(),
    venue: 'Old Trafford',
  },
  {
    id: 'M2',
    league: leagues[1], // La Liga
    homeTeam: teams[2], // Real Madrid
    awayTeam: teams[3], // FC Barcelona
    matchTime: new Date(new Date(today).setHours(20, 0, 0, 0)).toISOString(),
    venue: 'Santiago Bernabéu',
  },
  {
    id: 'M3',
    league: leagues[2], // Serie A
    homeTeam: teams[4], // Juventus
    awayTeam: teams[5], // AC Milan
    matchTime: new Date(new Date(tomorrow).setHours(18, 45, 0, 0)).toISOString(),
    venue: 'Allianz Stadium',
  },
  {
    id: 'M4',
    league: leagues[3], // Bundesliga
    homeTeam: teams[6], // Bayern Munich
    awayTeam: teams[7], // Borussia Dortmund
    matchTime: new Date(new Date(tomorrow).setHours(16, 30, 0, 0)).toISOString(),
    venue: 'Allianz Arena',
  },
  {
    id: 'M5',
    league: leagues[4], // Ligue 1
    homeTeam: teams[8], // Paris Saint-Germain
    awayTeam: teams[9], // Olympique de Marseille
    matchTime: new Date(new Date(dayAfterTomorrow).setHours(21, 0, 0, 0)).toISOString(),
    venue: 'Parc des Princes',
  },
  {
    id: 'M6',
    league: leagues[0], // Premier League
    homeTeam: teams[10], // Chelsea FC
    awayTeam: teams[11], // Arsenal FC
    matchTime: new Date(new Date(dayAfterTomorrow).setHours(14, 0, 0, 0)).toISOString(),
    venue: 'Stamford Bridge',
  },
   {
    id: 'M7',
    league: leagues[1], // La Liga
    homeTeam: teams[12], // Atletico Madrid
    awayTeam: teams[2], // Real Madrid
    matchTime: new Date(new Date(dayAfterTomorrow).setHours(19, 0, 0, 0)).toISOString(),
    venue: 'Wanda Metropolitano',
  },
  {
    id: 'M8',
    league: leagues[2], // Serie A
    homeTeam: teams[13], // Inter Milan
    awayTeam: teams[4], // Juventus
    matchTime: new Date(new Date(new Date().setDate(today.getDate() + 3)).setHours(20, 45, 0, 0)).toISOString(),
    venue: 'San Siro',
  }
];
