import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { StoreData } from './types.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'pawheal.json');

function createEmptyStore(): StoreData {
  return {
    sessionSecret: crypto.randomBytes(32).toString('hex'),
    users: [],
    pets: [],
    injuryAssessments: [],
    chatSessions: [],
    chatMessages: [],
    vaccinations: [],
    medications: [],
    appointments: [],
    weightLogs: [],
    healthNotes: [],
  };
}

function ensureStoreFile(): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = createEmptyStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      ...createEmptyStore(),
      ...parsed,
    };
  } catch {
    const fallback = createEmptyStore();
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

let cachedStore: StoreData = ensureStoreFile();

export function readStore(): StoreData {
  return cachedStore;
}

export function mutateStore<T>(updater: (draft: StoreData) => T): T {
  const result = updater(cachedStore);
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(cachedStore, null, 2), 'utf-8');
  fs.renameSync(tempFile, DATA_FILE);
  return result;
}
