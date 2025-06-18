
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import type { User, Bet, BetWithMatchDetails, MatchApp } from './types'; // Added MatchApp
import { teams, leagues } from './mockData'; 
import { getApiSportsFixtureById } from '@/services/apiSportsService'; // Import service

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
  await db.exec(\`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      hashedPassword TEXT NOT NULL,
      score INTEGER DEFAULT 0 NOT NULL,
      rank INTEGER DEFAULT 0 NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  \`);

  await db.exec(\`
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      matchId INTEGER NOT NULL,      -- Changed from TEXT to INTEGER for API fixture ID
      teamIdBetOn INTEGER NOT NULL,  -- Changed from TEXT to INTEGER for API team ID
      amountBet INTEGER NOT NULL,
      potentialWinnings INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'won', 'lost'
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  \`);
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

// Bet related functions
export async function createBetDb(userId: number, matchId: number, teamIdBetOn: number, amountBet: number, potentialWinnings: number): Promise<number | undefined> {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO bets (userId, matchId, teamIdBetOn, amountBet, potentialWinnings, status) VALUES (?, ?, ?, ?, ?, ?)',
    userId,
    matchId,
    teamIdBetOn,
    amountBet,
    potentialWinnings,
    'pending'
  );
  return result.lastID;
}

export async function getUserBetsWithDetailsDb(userId: number): Promise<BetWithMatchDetails[]> {
  const db = await getDb();
  const betsFromDb = await db.all<Bet[]>('SELECT * FROM bets WHERE userId = ? ORDER BY createdAt DESC', userId);

  const detailedBets: BetWithMatchDetails[] = [];

  for (const bet of betsFromDb) {
    // Fetch live match details from API-Sports for each bet
    // This could be slow if there are many bets; consider optimizing if performance becomes an issue.
    const match: MatchApp | null = await getApiSportsFixtureById(bet.matchId); 
    const teamBetOn = teams.find(t => t.id === bet.teamIdBetOn); // Still using mockData for team name
    
    detailedBets.push({
      ...bet,
      homeTeamName: match?.homeTeam.name || 'Unknown Team',
      awayTeamName: match?.awayTeam.name || 'Unknown Team',
      teamBetOnName: teamBetOn?.name || 'Unknown Team',
      matchTime: match?.matchTime || 'Unknown Date',
      leagueName: match?.league?.name || 'Unknown League',
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
