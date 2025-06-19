
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import type { User, Bet, BetWithMatchDetails, MatchApp } from './types';
import { footballTeams, supportedSports } from './mockData'; // Import supportedSports
import { getFootballFixtureById } from '@/services/apiSportsService'; // Specific to football

const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'app.db');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (dbInstance) {
    return dbInstance;
  }
  dbInstance = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
  await initializeDb(dbInstance);
  return dbInstance;
}

async function initializeDb(db: Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      hashedPassword TEXT NOT NULL,
      score INTEGER DEFAULT 0 NOT NULL,
      rank INTEGER DEFAULT 0 NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      matchId INTEGER NOT NULL,      -- This will be the API fixture ID
      teamIdBetOn INTEGER NOT NULL,  -- This will be the API team ID
      amountBet INTEGER NOT NULL,
      potentialWinnings INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'won', 'lost'
      sportSlug TEXT, -- To identify the sport this bet belongs to
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  return db.get<User>('SELECT id, name, email, hashedPassword, score, rank, createdAt FROM users WHERE email = ?', email);
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  return db.get<User>('SELECT id, name, email, hashedPassword, score, rank, createdAt FROM users WHERE id = ?', id);
}

export async function createUser(name: string, email: string, hashedPassword: string):Promise<number | undefined> {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO users (name, email, hashedPassword) VALUES (?, ?, ?)',
    name,
    email,
    hashedPassword
  );
  return result.lastID;
}

export async function updateUserNameDb(userId: number, newName: string): Promise<{ success: boolean }> {
  const db = await getDb();
  const result = await db.run('UPDATE users SET name = ? WHERE id = ?', newName, userId);
  return { success: (result.changes ?? 0) > 0 };
}

export async function updateUserPasswordDb(userId: number, newHashedPassword: string): Promise<{ success: boolean }> {
  const db = await getDb();
  const result = await db.run('UPDATE users SET hashedPassword = ? WHERE id = ?', newHashedPassword, userId);
  return { success: (result.changes ?? 0) > 0 };
}

export async function getTopUsersDb(limit: number = 10): Promise<Omit<User, 'hashedPassword'>[]> {
  const db = await getDb();
  return db.all<Omit<User, 'hashedPassword'>[]>(
    'SELECT id, name, email, score, rank, createdAt FROM users ORDER BY score DESC, name ASC LIMIT ?',
    limit
  );
}

export async function createBetDb(userId: number, matchId: number, teamIdBetOn: number, amountBet: number, potentialWinnings: number, sportSlug: string): Promise<number | undefined> {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO bets (userId, matchId, teamIdBetOn, amountBet, potentialWinnings, status, sportSlug) VALUES (?, ?, ?, ?, ?, ?, ?)',
    userId,
    matchId,
    teamIdBetOn,
    amountBet,
    potentialWinnings,
    'pending',
    sportSlug
  );
  return result.lastID;
}

export async function getUserBetsWithDetailsDb(userId: number): Promise<BetWithMatchDetails[]> {
  const db = await getDb();
  const betsFromDb = await db.all<Bet[]>('SELECT * FROM bets WHERE userId = ? ORDER BY createdAt DESC', userId);

  const detailedBets: BetWithMatchDetails[] = [];

  for (const bet of betsFromDb) {
    let match: MatchApp | null = null;
    let teamBetOnName = 'Unknown Team';

    if (bet.sportSlug === 'football') {
      const footballSport = supportedSports.find(s => s.slug === 'football');
      if (footballSport) {
        match = await getFootballFixtureById(bet.matchId, footballSport.apiBaseUrl);
        if (match) {
            if (match.homeTeam.id === bet.teamIdBetOn) {
                teamBetOnName = match.homeTeam.name;
            } else if (match.awayTeam.id === bet.teamIdBetOn) {
                teamBetOnName = match.awayTeam.name;
            }
        } else { // Fallback to mockData if API fails or match not found
            const teamFromMock = footballTeams.find(t => t.id === bet.teamIdBetOn);
            if (teamFromMock) teamBetOnName = teamFromMock.name;
        }
      }
    } else {
      // TODO: Implement logic for other sports if betting is enabled for them
      // For now, if sportSlug is not football, we might not have a way to get match details
      // or team names unless they are stored or fetched differently.
      console.warn(`Betting details for sport ${bet.sportSlug} not fully implemented yet.`);
      const teamFromMock = footballTeams.find(t => t.id === bet.teamIdBetOn); // Temporary fallback
      if (teamFromMock) teamBetOnName = teamFromMock.name;
    }
    
    detailedBets.push({
      ...bet,
      homeTeamName: match?.homeTeam.name || 'Unknown Team',
      awayTeamName: match?.awayTeam.name || 'Unknown Team',
      teamBetOnName: teamBetOnName,
      matchTime: match?.matchTime || 'Unknown Date',
      leagueName: match?.league?.name || 'Unknown League',
      sportSlug: bet.sportSlug || 'unknown',
    });
  }
  return detailedBets;
}

export async function getBetByIdDb(betId: number): Promise<Bet | undefined> {
  const db = await getDb();
  return db.get<Bet>('SELECT * FROM bets WHERE id = ?', betId);
}

export async function updateUserScoreDb(userId: number, scoreChange: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.run('UPDATE users SET score = score + ? WHERE id = ?', scoreChange, userId);
  return (result.changes ?? 0) > 0;
}

export async function updateBetStatusDb(betId: number, status: 'won' | 'lost'): Promise<boolean> {
  const db = await getDb();
  const result = await db.run('UPDATE bets SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', status, betId);
  return (result.changes ?? 0) > 0;
}
