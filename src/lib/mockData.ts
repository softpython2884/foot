
import type { Match, League, Team } from './types';

export const leagues: League[] = [
  { id: 'L1', name: 'Premier League' },
  { id: 'L2', name: 'La Liga' },
  { id: 'L3', name: 'Serie A' },
  { id: 'L4', name: 'Bundesliga' },
  { id: 'L5', name: 'Ligue 1' },
];

export const teams: Team[] = [
  { id: 'T1', name: 'Manchester United', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/5/5b/Logo_Manchester_United_FC.svg/langfr-250px-Logo_Manchester_United_FC.svg.png' },
  { id: 'T2', name: 'Liverpool FC', logoImageUrl: 'https://stylfoot.fr/3835-thickbox_01icon/logo-liverpool.jpg' },
  { id: 'T3', name: 'Real Madrid', logoImageUrl: 'https://logo-marque.com/wp-content/uploads/2020/11/Real-Madrid-Logo.png' },
  { id: 'T4', name: 'FC Barcelona', logoImageUrl: 'https://logo-marque.com/wp-content/uploads/2020/04/Barcelona-Logo.png' },
  { id: 'T5', name: 'Juventus', logoImageUrl: 'https://www.goodstickers.fr/22995/autocollant-bouclier-de-juventus.jpg' },
  { id: 'T6', name: 'AC Milan', logoImageUrl: 'https://brandlogos.net/wp-content/uploads/2013/07/ac-milan-club-vector-logo.png' },
  { id: 'T7', name: 'Bayern Munich', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/768px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png' },
  { id: 'T8', name: 'Borussia Dortmund', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/1200px-Borussia_Dortmund_logo.svg.png' },
  { id: 'T9', name: 'Paris Saint-Germain', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/8/86/Paris_Saint-Germain_Logo.svg/1024px-Paris_Saint-Germain_Logo.svg.png' },
  { id: 'T10', name: 'Olympique de Marseille', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/43/Logo_Olympique_de_Marseille.svg/1612px-Logo_Olympique_de_Marseille.svg.png' },
  { id: 'T11', name: 'Chelsea FC', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/1200px-Chelsea_FC.svg.png' },
  { id: 'T12', name: 'Arsenal FC', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png' },
  { id: 'T13', name: 'Atletico Madrid', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_Madrid_2017_logo.svg/1200px-Atletico_Madrid_2017_logo.svg.png' },
  { id: 'T14', name: 'Inter Milan', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/1200px-FC_Internazionale_Milano_2021.svg.png' },
  { id: 'T15', name: 'Manchester City', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png' },
  { id: 'T16', name: 'Tottenham Hotspur', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/1200px-Tottenham_Hotspur.svg.png' },
  { id: 'T17', name: 'Sevilla FC', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/1200px-Sevilla_FC_logo.svg.png' },
  { id: 'T18', name: 'Napoli', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/S.S.C._Napoli_logo.svg/1200px-S.S.C._Napoli_logo.svg.png' },
  { id: 'T19', name: 'AS Roma', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/AS_Roma_logo_%282017%29.svg/1200px-AS_Roma_logo_%282017%29.svg.png' },
  { id: 'T20', name: 'RB Leipzig', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/1200px-RB_Leipzig_2014_logo.svg.png' },
  { id: 'T21', name: 'AS Monaco', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/AS_Monaco_FC.svg/1200px-AS_Monaco_FC.svg.png' },
  { id: 'T22', name: 'Lille OSC', logoImageUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/15/Lille_OSC_logo.svg/1200px-Lille_OSC_logo.svg.png' },
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
];

