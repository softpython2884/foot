
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import type { User, Bet, BetWithMatchDetails, MatchApp, ManagedEventDb, ManagedEventApp, TeamApp, EventSource, ManagedEventStatus } from './types';
import { footballTeams, supportedSports, formula1Entities, basketballTeams } from './mockData';
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
    CREATE TABLE IF NOT EXISTS managed_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sport_slug TEXT NOT NULL,
      home_team_id INTEGER NOT NULL,
      away_team_id INTEGER NOT NULL,
      event_time TEXT NOT NULL, -- ISO8601 string
      status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'live', 'paused', 'finished', 'cancelled'
      home_score INTEGER,
      away_score INTEGER,
      winning_team_id INTEGER,
      elapsed_time INTEGER, -- e.g., in minutes
      notes TEXT, -- For sub-events, cards, etc.
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS bets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      eventId INTEGER NOT NULL,      -- Can be API fixture ID or managed_event ID
      eventSource TEXT NOT NULL, -- 'api' or 'custom'
      teamIdBetOn INTEGER NOT NULL,  -- API team ID
      amountBet INTEGER NOT NULL,
      potentialWinnings INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'won', 'lost'
      sportSlug TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id)
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

export async function getUserBetsWithDetailsDb(userId: number): Promise<BetWithMatchDetails[]> {
  const db = await getDb();
  const betsFromDb = await db.all<Bet[]>('SELECT * FROM bets WHERE userId = ? ORDER BY createdAt DESC', userId);
  const detailedBets: BetWithMatchDetails[] = [];

  for (const bet of betsFromDb) {
    let homeTeamName = 'Unknown Team';
    let awayTeamName = 'Unknown Team';
    let teamBetOnName = 'Unknown Team';
    let matchTime = 'Unknown Date';
    let leagueName = 'Unknown Event';

    if (bet.eventSource === 'api') {
      if (bet.sportSlug === 'football') {
        const footballSport = supportedSports.find(s => s.slug === 'football');
        if (footballSport) {
          const match = await getFootballFixtureById(bet.eventId, footballSport.apiBaseUrl);
          if (match) {
            homeTeamName = match.homeTeam.name;
            awayTeamName = match.awayTeam.name;
            teamBetOnName = match.homeTeam.id === bet.teamIdBetOn ? match.homeTeam.name : match.awayTeam.name;
            matchTime = match.matchTime;
            leagueName = match.league.name;
          }
        }
      }
      // TODO: Add similar logic for 'api' events of other sports (F1, Basketball) if betting is enabled for them
    } else if (bet.eventSource === 'custom') {
      const managedEvent = await getManagedEventFromDb(bet.eventId);
      if (managedEvent) {
        homeTeamName = managedEvent.homeTeam.name;
        awayTeamName = managedEvent.awayTeam.name;
        teamBetOnName = managedEvent.homeTeam.id === bet.teamIdBetOn ? managedEvent.homeTeam.name : managedEvent.awayTeam.name;
        matchTime = managedEvent.eventTime;
        leagueName = managedEvent.name; // Or some other identifier for custom events
      }
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

export async function getPendingBetsForManagedEventDb(managedEventId: number): Promise<Bet[]> {
  const db = await getDb();
  return db.all<Bet[]>("SELECT * FROM bets WHERE eventId = ? AND eventSource = 'custom' AND status = 'pending'", managedEventId);
}

// --- Managed Event Functions ---

function getTeamById(teamId: number, sportSlug: string): TeamApp | undefined {
    let teamList: TeamApp[] = [];
    if (sportSlug === 'football') teamList = footballTeams;
    else if (sportSlug === 'formula-1') teamList = formula1Entities;
    else if (sportSlug === 'basketball') teamList = basketballTeams;
    return teamList.find(t => t.id === teamId);
}


export async function createManagedEventInDb(
  name: string,
  sportSlug: string,
  homeTeamId: number,
  awayTeamId: number,
  eventTime: string, // ISO string
  status: ManagedEventStatus = 'upcoming',
  homeScore?: number | null,
  awayScore?: number | null,
  elapsedTime?: number | null,
  notes?: string | null
): Promise<number | undefined> {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO managed_events (name, sport_slug, home_team_id, away_team_id, event_time, status, home_score, away_score, elapsed_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    name, sportSlug, homeTeamId, awayTeamId, eventTime, status, homeScore, awayScore, elapsedTime, notes
  );
  return result.lastID;
}

export async function getManagedEventFromDb(id: number): Promise<ManagedEventApp | undefined> {
  const db = await getDb();
  const eventDb = await db.get<ManagedEventDb>('SELECT * FROM managed_events WHERE id = ?', id);
  if (!eventDb) return undefined;

  const homeTeam = getTeamById(eventDb.home_team_id, eventDb.sport_slug);
  const awayTeam = getTeamById(eventDb.away_team_id, eventDb.sport_slug);

  if (!homeTeam || !awayTeam) {
    console.error(`Could not find team details for managed event ${id}`);
    return undefined; // Or handle as a partial object if preferred
  }

  return {
    id: eventDb.id,
    name: eventDb.name,
    sportSlug: eventDb.sport_slug,
    homeTeam,
    awayTeam,
    eventTime: eventDb.event_time,
    status: eventDb.status,
    homeScore: eventDb.home_score,
    awayScore: eventDb.away_score,
    winningTeamId: eventDb.winning_team_id,
    elapsedTime: eventDb.elapsed_time,
    notes: eventDb.notes,
  };
}

export async function getAllManagedEventsFromDb(): Promise<ManagedEventApp[]> {
  const db = await getDb();
  const eventsDb = await db.all<ManagedEventDb[]>('SELECT * FROM managed_events ORDER BY event_time DESC');
  
  return eventsDb.map(eventDb => {
    const homeTeam = getTeamById(eventDb.home_team_id, eventDb.sport_slug) || {id: eventDb.home_team_id, name: 'Unknown Home', sportSlug: eventDb.sport_slug};
    const awayTeam = getTeamById(eventDb.away_team_id, eventDb.sport_slug) || {id: eventDb.away_team_id, name: 'Unknown Away', sportSlug: eventDb.sport_slug};
    return {
      id: eventDb.id,
      name: eventDb.name,
      sportSlug: eventDb.sport_slug,
      homeTeam,
      awayTeam,
      eventTime: eventDb.event_time,
      status: eventDb.status,
      homeScore: eventDb.home_score,
      awayScore: eventDb.away_score,
      winningTeamId: eventDb.winning_team_id,
      elapsedTime: eventDb.elapsed_time,
      notes: eventDb.notes,
    };
  });
}

export async function getManagedEventsBySportFromDb(sportSlug: string, statusFilters?: ManagedEventStatus[]): Promise<ManagedEventApp[]> {
  const db = await getDb();
  let query = 'SELECT * FROM managed_events WHERE sport_slug = ?';
  const queryParams: any[] = [sportSlug];

  if (statusFilters && statusFilters.length > 0) {
    query += ` AND status IN (${statusFilters.map(() => '?').join(',')})`;
    queryParams.push(...statusFilters);
  }
  query += ' ORDER BY event_time DESC';

  const eventsDb = await db.all<ManagedEventDb[]>(query, ...queryParams);
  
  return eventsDb.map(eventDb => {
    const homeTeam = getTeamById(eventDb.home_team_id, eventDb.sport_slug) || {id: eventDb.home_team_id, name: `Home Team ID ${eventDb.home_team_id}`, sportSlug: eventDb.sport_slug};
    const awayTeam = getTeamById(eventDb.away_team_id, eventDb.sport_slug) || {id: eventDb.away_team_id, name: `Away Team ID ${eventDb.away_team_id}`, sportSlug: eventDb.sport_slug};
    return {
      id: eventDb.id,
      name: eventDb.name,
      sportSlug: eventDb.sport_slug,
      homeTeam,
      awayTeam,
      eventTime: eventDb.event_time,
      status: eventDb.status,
      homeScore: eventDb.home_score,
      awayScore: eventDb.away_score,
      winningTeamId: eventDb.winning_team_id,
      elapsedTime: eventDb.elapsed_time,
      notes: eventDb.notes,
    };
  });
}


export async function updateManagedEventInDb(
  eventId: number,
  status: ManagedEventStatus,
  homeScore?: number | null,
  awayScore?: number | null,
  winningTeamId?: number | null,
  elapsedTime?: number | null,
  notes?: string | null
): Promise<boolean> {
  const db = await getDb();
  const result = await db.run(
    'UPDATE managed_events SET status = ?, home_score = ?, away_score = ?, winning_team_id = ?, elapsed_time = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    status, homeScore, awayScore, winningTeamId, elapsedTime, notes, eventId
  );
  return (result.changes ?? 0) > 0;
}
