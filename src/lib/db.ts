
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import type { User, Bet, BetWithMatchDetails, MatchApp, ManagedEventDb, ManagedEventApp, TeamApp, EventSource } from './types';
import { footballTeams, supportedSports } from './mockData';
import { getFootballFixtureById } from '@/services/apiSportsService';

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
      eventId INTEGER NOT NULL,      -- Can be API fixture ID or managed_event_id
      eventSource TEXT NOT NULL,   -- 'api' or 'custom'
      teamIdBetOn INTEGER NOT NULL,  -- This will be the API team ID (of the team bet on)
      amountBet INTEGER NOT NULL,
      potentialWinnings INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'won', 'lost'
      sportSlug TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id)
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS managed_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sportSlug TEXT NOT NULL,
      homeTeamApiId INTEGER NOT NULL,
      awayTeamApiId INTEGER NOT NULL,
      homeTeamName TEXT NOT NULL,
      awayTeamName TEXT NOT NULL,
      homeTeamLogoUrl TEXT,
      awayTeamLogoUrl TEXT,
      eventTime TEXT NOT NULL, -- ISO8601 string
      status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'live', 'paused', 'finished', 'cancelled'
      homeScore INTEGER,
      awayScore INTEGER,
      winnerTeamApiId INTEGER,
      leagueName TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME
    );
  `);
}

// --- User Functions ---
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

export async function updateUserScoreDb(userId: number, scoreChange: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.run('UPDATE users SET score = score + ? WHERE id = ?', scoreChange, userId);
  return (result.changes ?? 0) > 0;
}

// --- Bet Functions ---
export async function createBetDb(userId: number, eventId: number, eventSource: EventSource, teamIdBetOn: number, amountBet: number, potentialWinnings: number, sportSlug: string): Promise<number | undefined> {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO bets (userId, eventId, eventSource, teamIdBetOn, amountBet, potentialWinnings, status, sportSlug) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    userId,
    eventId,
    eventSource,
    teamIdBetOn,
    amountBet,
    potentialWinnings,
    'pending',
    sportSlug
  );
  return result.lastID;
}

function findTeamInMockData(teamApiId: number, sportSlug: string): TeamApp | undefined {
  // This is a simplified lookup, assumes footballTeams is the primary source or expand as needed
  if (sportSlug === 'football') {
    return footballTeams.find(t => t.id === teamApiId);
  }
  // TODO: Add similar lookups for other sports if needed for bet details
  return undefined;
}

export async function getUserBetsWithDetailsDb(userId: number): Promise<BetWithMatchDetails[]> {
  const db = await getDb();
  const betsFromDb = await db.all<Bet[]>('SELECT * FROM bets WHERE userId = ? ORDER BY createdAt DESC', userId);
  const detailedBets: BetWithMatchDetails[] = [];

  for (const bet of betsFromDb) {
    let homeTeamName = 'Unknown Team';
    let awayTeamName = 'Unknown Team';
    let teamBetOnName = 'Selected Team';
    let matchTime = 'Unknown Date';
    let leagueName = 'Unknown League';

    if (bet.eventSource === 'api' && bet.sportSlug === 'football') {
      const footballSport = supportedSports.find(s => s.slug === 'football');
      if (footballSport) {
        const match = await getFootballFixtureById(bet.eventId, footballSport.apiBaseUrl);
        if (match) {
          homeTeamName = match.homeTeam.name;
          awayTeamName = match.awayTeam.name;
          matchTime = match.matchTime;
          leagueName = match.league?.name || 'League';
          if (match.homeTeam.id === bet.teamIdBetOn) teamBetOnName = match.homeTeam.name;
          else if (match.awayTeam.id === bet.teamIdBetOn) teamBetOnName = match.awayTeam.name;
        }
      }
    } else if (bet.eventSource === 'custom') {
      const managedEvent = await getManagedEventFromDb(bet.eventId);
      if (managedEvent) {
        homeTeamName = managedEvent.homeTeamName;
        awayTeamName = managedEvent.awayTeamName;
        matchTime = managedEvent.eventTime;
        leagueName = managedEvent.leagueName || 'Custom Event';
        if (managedEvent.homeTeamApiId === bet.teamIdBetOn) teamBetOnName = managedEvent.homeTeamName;
        else if (managedEvent.awayTeamApiId === bet.teamIdBetOn) teamBetOnName = managedEvent.awayTeamName;
      }
    } else {
        // Fallback or other sports for API events
        const teamFromMock = findTeamInMockData(bet.teamIdBetOn, bet.sportSlug);
        if (teamFromMock) teamBetOnName = teamFromMock.name;
    }
    
    detailedBets.push({
      ...bet,
      homeTeamName,
      awayTeamName,
      teamBetOnName,
      matchTime,
      leagueName,
    });
  }
  return detailedBets;
}

export async function getBetByIdDb(betId: number): Promise<Bet | undefined> {
  const db = await getDb();
  return db.get<Bet>('SELECT * FROM bets WHERE id = ?', betId);
}

export async function updateBetStatusDb(betId: number, status: 'won' | 'lost'): Promise<boolean> {
  const db = await getDb();
  const result = await db.run('UPDATE bets SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', status, betId);
  return (result.changes ?? 0) > 0;
}

export async function getPendingBetsForManagedEventDb(managedEventId: number): Promise<Bet[]> {
    const db = await getDb();
    return db.all<Bet[]>("SELECT * FROM bets WHERE eventSource = 'custom' AND eventId = ? AND status = 'pending'", managedEventId);
}


// --- Managed Event Functions ---
export async function createManagedEventInDb(event: Omit<ManagedEventDb, 'id' | 'createdAt' | 'updatedAt'>): Promise<number | undefined> {
  const db = await getDb();
  const result = await db.run(
    `INSERT INTO managed_events (sportSlug, homeTeamApiId, awayTeamApiId, homeTeamName, awayTeamName, homeTeamLogoUrl, awayTeamLogoUrl, eventTime, status, homeScore, awayScore, winnerTeamApiId, leagueName) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    event.sportSlug, event.homeTeamApiId, event.awayTeamApiId, event.homeTeamName, event.awayTeamName, event.homeTeamLogoUrl, event.awayTeamLogoUrl, event.eventTime, event.status, event.homeScore, event.awayScore, event.winnerTeamApiId, event.leagueName
  );
  return result.lastID;
}

export async function getManagedEventFromDb(id: number): Promise<ManagedEventDb | undefined> {
  const db = await getDb();
  return db.get<ManagedEventDb>('SELECT * FROM managed_events WHERE id = ?', id);
}

export async function getAllManagedEventsFromDb(): Promise<ManagedEventDb[]> {
  const db = await getDb();
  return db.all<ManagedEventDb[]>('SELECT * FROM managed_events ORDER BY eventTime DESC');
}

export async function getManagedEventsBySportFromDb(sportSlug: string): Promise<ManagedEventDb[]> {
  const db = await getDb();
  return db.all<ManagedEventDb[]>('SELECT * FROM managed_events WHERE sportSlug = ? ORDER BY eventTime DESC', sportSlug);
}

export async function updateManagedEventInDb(event: Partial<ManagedEventDb> & { id: number }): Promise<boolean> {
  const db = await getDb();
  const { id, ...fieldsToUpdate } = event;
  
  if (Object.keys(fieldsToUpdate).length === 0) return false;

  const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
  const values = Object.values(fieldsToUpdate);
  values.push(id); // Add id for the WHERE clause

  const result = await db.run(`UPDATE managed_events SET ${setClauses}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, ...values);
  return (result.changes ?? 0) > 0;
}

