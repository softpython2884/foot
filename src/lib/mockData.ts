
import type { Match, League, Team } from './types';

export const leagues: League[] = [
  { id: 'L1', name: 'Premier League' },
  { id: 'L2', name: 'La Liga' },
  { id: 'L3', name: 'Serie A' },
  { id: 'L4', name: 'Bundesliga' },
  { id: 'L5', name: 'Ligue 1' },
];

export const teams: Team[] = [
  { id: 'T1', name: 'Manchester United', logoImageUrl: 'https://images.icon-icons.com/103/PNG/256/manchester_united_17973.png' },
  { id: 'T2', name: 'Liverpool FC', logoImageUrl: 'https://www.icons101.com/icon_ico/id_37554/Liverpool_FC_80s.ico' },
  { id: 'T3', name: 'Real Madrid', logoImageUrl: 'https://logo-marque.com/wp-content/uploads/2020/11/Real-Madrid-Logo.png' },
  { id: 'T4', name: 'FC Barcelona', logoImageUrl: 'https://logo-marque.com/wp-content/uploads/2020/04/Barcelona-Logo.png' },
  { id: 'T5', name: 'Juventus', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/9/9f/Logo_Juventus.svg/2088px-Logo_Juventus.svg.png' },
  { id: 'T6', name: 'AC Milan', logoImageUrl: 'https://brandlogos.net/wp-content/uploads/2013/07/ac-milan-club-vector-logo.png' },
  { id: 'T7', name: 'Bayern Munich', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/768px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png' },
  { id: 'T8', name: 'Borussia Dortmund', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/1024px-Borussia_Dortmund_logo.svg.png' },
  { id: 'T9', name: 'Paris Saint-Germain', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Paris_Saint-Germain_Logo.svg/1024px-Paris_Saint-Germain_Logo.svg.png' },
  { id: 'T10', name: 'Olympique de Marseille', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/43/Logo_Olympique_de_Marseille.svg/1612px-Logo_Olympique_de_Marseille.svg.png' },
  { id: 'T11', name: 'Chelsea FC', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/51/Logo_Chelsea.svg/1024px-Logo_Chelsea.svg.png' },
  { id: 'T12', name: 'Arsenal FC', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/3/34/Logo_Arsenal_FC_2002.svg/langfr-250px-Logo_Arsenal_FC_2002.svg.png' },
  { id: 'T13', name: 'Atletico Madrid', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/f/fc/Logo_ATM_2024.svg/langfr-250px-Logo_ATM_2024.svg.png' },
  { id: 'T14', name: 'Inter Milan', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/1024px-FC_Internazionale_Milano_2021.svg.png' },
  { id: 'T15', name: 'Manchester City', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/640px-Manchester_City_FC_badge.svg.png' },
  { id: 'T16', name: 'Tottenham Hotspur', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5c/Logo_Tottenham_Hotspur.svg/1024px-Logo_Tottenham_Hotspur.svg.png' },
  { id: 'T17', name: 'Sevilla FC', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/8d/Logo_S%C3%A9ville_FC.svg/langfr-250px-Logo_S%C3%A9ville_FC.svg.png' },
  { id: 'T18', name: 'Napoli', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/SSC_Napoli.svg/2048px-SSC_Napoli.svg.png' },
  { id: 'T19', name: 'AS Roma', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/0/0e/AS_Roma_Logo_2017.svg/1200px-AS_Roma_Logo_2017.svg.png' },
  { id: 'T20', name: 'RB Leipzig', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/9/94/Logo_RB_Leipzig_2020.svg/1200px-Logo_RB_Leipzig_2020.svg.png' },
  { id: 'T21', name: 'AS Monaco', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/1/1d/Logo_AS_Monaco_FC_2021.svg/langfr-250px-Logo_AS_Monaco_FC_2021.svg.png' },
  { id: 'T22', name: 'Lille OSC', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/6/62/Logo_LOSC_Lille_2018.svg/langfr-250px-Logo_LOSC_Lille_2018.svg.png' },
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
    league: getLeague('L5'), // Should be Bundesliga or a league for Dortmund vs PSG
    homeTeam: getTeam('T8'), // Dortmund
    awayTeam: getTeam('T9'), // PSG
    matchTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // In 5 days
    venue: 'Signal Iduna Park', // Or Parc des Princes if PSG is home
    status: 'upcoming',
  },
   {
    id: 'M6',
    league: getLeague('L1'),
    homeTeam: getTeam('T15'), // Manchester City
    awayTeam: getTeam('T12'), // Arsenal FC
    matchTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'Etihad Stadium',
    status: 'upcoming',
  },
  {
    id: 'M7',
    league: getLeague('L3'),
    homeTeam: getTeam('T5'), // Juventus
    awayTeam: getTeam('T18'), // Napoli
    matchTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'Allianz Stadium',
    status: 'upcoming',
  },
  {
    id: 'M8',
    league: getLeague('L2'),
    homeTeam: getTeam('T17'), // Sevilla FC
    awayTeam: getTeam('T13'), // Atletico Madrid
    matchTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'Ramón Sánchez Pizjuán',
    status: 'completed',
    homeScore: 1,
    awayScore: 1
  },
  // Adding some matches for newer teams
  {
    id: 'M9',
    league: getLeague('L4'), // Bundesliga
    homeTeam: getTeam('T7'), // Bayern Munich
    awayTeam: getTeam('T20'), // RB Leipzig
    matchTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'Allianz Arena',
    status: 'upcoming',
  },
  {
    id: 'M10',
    league: getLeague('L3'), // Serie A
    homeTeam: getTeam('T19'), // AS Roma
    awayTeam: getTeam('T6'), // AC Milan
    matchTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'Stadio Olimpico',
    status: 'upcoming',
  },
   {
    id: 'M11',
    league: getLeague('L5'), // Ligue 1
    homeTeam: getTeam('T21'), // AS Monaco
    awayTeam: getTeam('T22'), // Lille OSC
    matchTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), 
    venue: 'Stade Louis II',
    status: 'upcoming',
  },
  {
    id: 'M12',
    league: getLeague('L1'),
    homeTeam: getTeam('T16'), // Tottenham
    awayTeam: getTeam('T2'), // Liverpool
    matchTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    venue: 'Tottenham Hotspur Stadium',
    status: 'completed',
    homeScore: 2,
    awayScore: 2,
  },
];


