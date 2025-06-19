
import type { League, Team, SportDefinition, MatchApp, F1DriverApp, F1RaceResultApp, BasketballPlayerApp, BasketballGameResultApp, ManagedEventApp, ManagedEventDb } from './types';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const supportedSports: SportDefinition[] = [
  {
    name: 'Football',
    slug: 'football',
    apiBaseUrl: 'https://v3.football.api-sports.io',
    apiKeyHeaderName: 'x-apisports-key',
    apiKeyEnvVar: 'API_SPORTS_KEY',
    iconUrl: 'https://img.freepik.com/vecteurs-premium/conception-modele-football-banniere-football-conception-mise-page-sportive-vecteur-theme-vert_42237-1120.jpg',
  },
  {
    name: 'Formule 1',
    slug: 'formula-1',
    apiBaseUrl: 'https://v1.formula-1.api-sports.io',
    apiKeyHeaderName: 'x-apisports-key',
    apiKeyEnvVar: 'API_SPORTS_KEY',
    iconUrl: 'https://global-img.gamergen.com/f1-2021-bannire-vignette-test_0903D4000000985248.jpg',
  },
  {
    name: 'Basketball',
    slug: 'basketball',
    apiBaseUrl: 'https://v1.basketball.api-sports.io',
    apiKeyHeaderName: 'x-apisports-key',
    apiKeyEnvVar: 'API_SPORTS_KEY',
    iconUrl: 'https://as2.ftcdn.net/jpg/02/43/86/13/1000_F_243861393_ZAkjU7BW8ja9cbpEOO7KhomyxNSqF4Ef.jpg',
  },
];


// Football Teams - using 'logoUrl' now
export const footballTeams: Team[] = [
  { id: 33, name: 'Manchester United', logoUrl: 'https://media.api-sports.io/football/teams/33.png', sportSlug: 'football' },
  { id: 40, name: 'Liverpool FC', logoUrl: 'https://media.api-sports.io/football/teams/40.png', sportSlug: 'football' },
  { id: 541, name: 'Real Madrid', logoUrl: 'https://media.api-sports.io/football/teams/541.png', sportSlug: 'football' },
  { id: 529, name: 'FC Barcelona', logoUrl: 'https://media.api-sports.io/football/teams/529.png', sportSlug: 'football' },
  { id: 496, name: 'Juventus', logoUrl: 'https://media.api-sports.io/football/teams/496.png', sportSlug: 'football' },
  { id: 489, name: 'AC Milan', logoUrl: 'https://media.api-sports.io/football/teams/489.png', sportSlug: 'football' },
  { id: 157, name: 'Bayern Munich', logoUrl: 'https://media.api-sports.io/football/teams/157.png', sportSlug: 'football' },
  { id: 165, name: 'Borussia Dortmund', logoUrl: 'https://media.api-sports.io/football/teams/165.png', sportSlug: 'football' },
  { id: 85, name: 'Paris Saint-Germain', logoUrl: 'https://media.api-sports.io/football/teams/85.png', sportSlug: 'football' },
  { id: 81, name: 'Olympique de Marseille', logoUrl: 'https://media.api-sports.io/football/teams/81.png', sportSlug: 'football' },
  { id: 49, name: 'Chelsea FC', logoUrl: 'https://media.api-sports.io/football/teams/49.png', sportSlug: 'football' },
  { id: 42, name: 'Arsenal FC', logoUrl: 'https://media.api-sports.io/football/teams/42.png', sportSlug: 'football' },
  { id: 530, name: 'Atlético Madrid', logoUrl: 'https://media.api-sports.io/football/teams/530.png', sportSlug: 'football' },
  { id: 505, name: 'Inter Milan', logoUrl: 'https://media.api-sports.io/football/teams/505.png', sportSlug: 'football' },
  { id: 50, name: 'Manchester City', logoUrl: 'https://media.api-sports.io/football/teams/50.png', sportSlug: 'football' },
  { id: 47, name: 'Tottenham Hotspur', logoUrl: 'https://media.api-sports.io/football/teams/47.png', sportSlug: 'football' },
  { id: 536, name: 'Sevilla FC', logoUrl: 'https://media.api-sports.io/football/teams/536.png', sportSlug: 'football' },
  { id: 492, name: 'Napoli', logoUrl: 'https://media.api-sports.io/football/teams/492.png', sportSlug: 'football' },
  { id: 497, name: 'AS Roma', logoUrl: 'https://media.api-sports.io/football/teams/497.png', sportSlug: 'football' },
  { id: 173, name: 'RB Leipzig', logoUrl: 'https://media.api-sports.io/football/teams/173.png', sportSlug: 'football' },
  { id: 91, name: 'AS Monaco', logoUrl: 'https://media.api-sports.io/football/teams/91.png', sportSlug: 'football' },
  { id: 79, name: 'Lille OSC', logoUrl: 'https://media.api-sports.io/football/teams/79.png', sportSlug: 'football' },
].map(team => ({ ...team, slug: team.slug || slugify(team.name) }));


// Formula 1 Entities (Constructors)
export const formula1Entities: Team[] = [
  { id: 5, name: 'Mercedes-AMG Petronas', logoUrl: 'https://media.api-sports.io/formula-1/teams/5.png', sportSlug: 'formula-1', base: 'Brackley, UK', championships: 8, director: 'Toto Wolff', technicalManager: 'James Allison', chassis: 'W15', engine: 'Mercedes' },
  { id: 3, name: 'Scuderia Ferrari', logoUrl: 'https://media.api-sports.io/formula-1/teams/3.png', sportSlug: 'formula-1', base: 'Maranello, Italy', championships: 16, director: 'Frédéric Vasseur', technicalManager: 'Enrico Cardile', chassis: 'SF-24', engine: 'Ferrari' },
  { id: 1, name: 'Red Bull Racing', logoUrl: 'https://media.api-sports.io/formula-1/teams/1.png', sportSlug: 'formula-1', base: 'Milton Keynes, UK', championships: 6, director: 'Christian Horner', technicalManager: 'Adrian Newey', chassis: 'RB20', engine: 'Honda RBPT' },
  { id: 2, name: 'McLaren F1 Team', logoUrl: 'https://media.api-sports.io/formula-1/teams/2.png', sportSlug: 'formula-1', base: 'Woking, UK', championships: 8, director: 'Andrea Stella', technicalManager: 'James Key (prior), Peter Prodromou/David Sanchez (current)', chassis: 'MCL38', engine: 'Mercedes' },
  { id: 10, name: 'Alpine F1 Team', logoUrl: 'https://media.api-sports.io/formula-1/teams/10.png', sportSlug: 'formula-1', base: 'Enstone, UK', championships: 2, director: 'Bruno Famin', technicalManager: 'Matt Harman', chassis: 'A524', engine: 'Renault' },
  { id: 8, name: 'Aston Martin Cognizant', logoUrl: 'https://media.api-sports.io/formula-1/teams/8.png', sportSlug: 'formula-1', base: 'Silverstone, UK', director: 'Mike Krack', technicalManager: 'Dan Fallows', chassis: 'AMR24', engine: 'Mercedes' },
].map(entity => ({ ...entity, slug: entity.slug || slugify(entity.name) }));

// Basketball Teams (NBA Examples)
export const basketballTeams: Team[] = [
  { id: 133, name: 'Los Angeles Lakers', logoUrl: 'https://media.api-sports.io/basketball/teams/133.png', sportSlug: 'basketball', conference: 'Western', division: 'Pacific' },
  { id: 129, name: 'Golden State Warriors', logoUrl: 'https://media.api-sports.io/basketball/teams/129.png', sportSlug: 'basketball', conference: 'Western', division: 'Pacific' },
  { id: 120, name: 'Boston Celtics', logoUrl: 'https://media.api-sports.io/basketball/teams/120.png', sportSlug: 'basketball', conference: 'Eastern', division: 'Atlantic' },
  { id: 123, name: 'Chicago Bulls', logoUrl: 'https://media.api-sports.io/basketball/teams/123.png', sportSlug: 'basketball', conference: 'Eastern', division: 'Central' },
  { id: 136, name: 'Miami Heat', logoUrl: 'https://media.api-sports.io/basketball/teams/136.png', sportSlug: 'basketball', conference: 'Eastern', division: 'Southeast' },
  { id: 138, name: 'Milwaukee Bucks', logoUrl: 'https://media.api-sports.io/basketball/teams/138.png', sportSlug: 'basketball', conference: 'Eastern', division: 'Central' },
].map(team => ({ ...team, slug: team.slug || slugify(team.name) }));


export const footballLeagues: League[] = [
  { id: 39, name: 'Premier League', logoUrl: 'https://media.api-sports.io/football/leagues/39.png', country: 'England', season: 2023, sportSlug: 'football' },
  { id: 140, name: 'La Liga', logoUrl: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain', season: 2023, sportSlug: 'football' },
  { id: 135, name: 'Serie A', logoUrl: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy', season: 2023, sportSlug: 'football' },
  { id: 78, name: 'Bundesliga', logoUrl: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany', season: 2023, sportSlug: 'football' },
  { id: 61, name: 'Ligue 1', logoUrl: 'https://media.api-sports.io/football/leagues/61.png', country: 'France', season: 2023, sportSlug: 'football' },
  { id: 2, name: 'Champions League', logoUrl: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe', season: 2023, sportSlug: 'football' },
];

export const teams = footballTeams;
export const leagues = footballLeagues;


const psgTeamMock = footballTeams.find(t => t.id === 85);
const interTeamMock = footballTeams.find(t => t.id === 505);
const uclLeagueMock = footballLeagues.find(l => l.id === 2);

const mockMatchPsgVsInter: MatchApp = {
  id: 999901,
  league: uclLeagueMock ? {
    id: uclLeagueMock.id,
    name: uclLeagueMock.name,
    logoUrl: uclLeagueMock.logoUrl,
    country: uclLeagueMock.country,
    season: 2025, // Example future season
    sportSlug: 'football',
  } : {
    id: 2, name: 'Champions League', logoUrl: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe', season: 2025, sportSlug: 'football',
  },
  homeTeam: psgTeamMock ? { ...psgTeamMock } : { id: 85, name: 'Paris Saint-Germain', logoUrl: 'https://media.api-sports.io/football/teams/85.png', sportSlug: 'football' },
  awayTeam: interTeamMock ? { ...interTeamMock } : { id: 505, name: 'Inter Milan', logoUrl: 'https://media.api-sports.io/football/teams/505.png', sportSlug: 'football' },
  matchTime: '2025-03-15T20:00:00Z',
  statusShort: 'FT',
  statusLong: 'Match Finished',
  homeScore: 5,
  awayScore: 0,
  sportSlug: 'football',
  elapsedTime: 90,
  venueName: 'Parc des Princes',
  venueCity: 'Paris',
};
export const mockFootballMatches: MatchApp[] = [ mockMatchPsgVsInter ];


// --- Mock F1 Data ---
export const mockF1Drivers: F1DriverApp[] = [
    { id: 25, name: 'Lewis Hamilton', sportSlug: 'formula-1', number: 44, nationality: 'British', photoUrl: 'https://media.api-sports.io/formula-1/drivers/25.png', abbr:'HAM', worldChampionships: 7 },
    { id: 20, name: 'Max Verstappen', sportSlug: 'formula-1', number: 1, nationality: 'Dutch', photoUrl: 'https://media.api-sports.io/formula-1/drivers/20.png', abbr:'VER', worldChampionships: 3 },
    { id: 10, name: 'Charles Leclerc', sportSlug: 'formula-1', number: 16, nationality: 'Monegasque', photoUrl: 'https://media.api-sports.io/formula-1/drivers/10.png', abbr:'LEC' },
];

export const mockF1RaceResults: F1RaceResultApp[] = [
    { id: 101, competitionName: 'Formula 1 Gulf Air Bahrain Grand Prix', circuitName: 'Bahrain International Circuit', date: '2024-03-02T15:00:00Z', season: 2024, type: 'Race', status: 'Finished', driverResults: [
        { driverName: 'Max Verstappen', position: 1, points: 26, time: '1:31:44.742', grid:1, laps:57, driverNumber:1, driverImage: 'https://media.api-sports.io/formula-1/drivers/20.png' },
        { driverName: 'Sergio Perez', position: 2, points: 18, time: '+22.457s', grid:5, laps:57, driverNumber:11, driverImage: 'https://media.api-sports.io/formula-1/drivers/24.png' }, // Assuming Perez is driver 24
    ]},
];

// --- Mock Basketball Data ---
export const mockBasketballPlayers: BasketballPlayerApp[] = [
    { id: 265, name: 'LeBron James', sportSlug: 'basketball', number: 23, position: 'F', photoUrl: 'https://media.api-sports.io/basketball/players/265.png', teamId: 133, heightMeters: "2.06", college: "St. Vincent-St. Mary HS (OH)" },
    { id: 466, name: 'Stephen Curry', sportSlug: 'basketball', number: 30, position: 'G', photoUrl: 'https://media.api-sports.io/basketball/players/466.png', teamId: 129, heightMeters: "1.88", college: "Davidson" },
    { id: 246, name: 'Jayson Tatum', sportSlug: 'basketball', number: 0, position: 'F', photoUrl: 'https://media.api-sports.io/basketball/players/246.png', teamId: 120, heightMeters: "2.03", college: "Duke" },
];

export const mockBasketballGames: BasketballGameResultApp[] = [
    {
        id: 20001,
        league: { id: 12, name: 'NBA', logoUrl: 'https://media.api-sports.io/basketball/leagues/12.png', season: 2023, sportSlug: 'basketball', type: 'League' },
        homeTeam: { id: 133, name: 'Los Angeles Lakers', logoUrl: 'https://media.api-sports.io/basketball/teams/133.png', sportSlug: 'basketball' },
        awayTeam: { id: 120, name: 'Boston Celtics', logoUrl: 'https://media.api-sports.io/basketball/teams/120.png', sportSlug: 'basketball' },
        matchTime: '2023-12-25T22:00:00Z',
        statusShort: 'FT',
        statusLong: 'Finished',
        homeScore: 115,
        awayScore: 126,
        sportSlug: 'basketball',
        homeQuarterScores: [28,30,27,30], awayQuarterScores: [32,28,38,28],
    },
];

// Helper type for mockBasketballPlayers
type BasketballPlayerAppWithTeamId = BasketballPlayerApp & { teamId?: number };
(mockBasketballPlayers as BasketballPlayerAppWithTeamId[]).forEach(p => {
    if (p.teamId) {
        const team = basketballTeams.find(t => t.id === p.teamId);
        if (team) {
            // p.name = `${p.name} (${team.name})`; // Add team name to player name for display if needed
        }
    }
});

