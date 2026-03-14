import type { CardProgress, StorageData, SessionRecord } from './types';
import { createNewCard, calculateNextReview, isDue } from './spaced-repetition';

const STORAGE_KEY = 'notion-quiz-progress';
const CURRENT_VERSION = 1;

function getDefaultData(): StorageData {
  return {
    version: CURRENT_VERSION,
    cards: {},
    sessions: [],
  };
}

function loadData(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const data = JSON.parse(raw) as StorageData;
    if (data.version !== CURRENT_VERSION) return getDefaultData();
    return data;
  } catch {
    return getDefaultData();
  }
}

function saveData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    console.warn('Failed to save quiz progress to localStorage');
  }
}

export function getProgress(questionId: string): CardProgress {
  const data = loadData();
  return data.cards[questionId] ?? createNewCard(questionId);
}

export function updateProgress(
  questionId: string,
  isCorrect: boolean
): CardProgress {
  const data = loadData();
  const card = data.cards[questionId] ?? createNewCard(questionId);
  const updated = calculateNextReview(card, isCorrect);
  data.cards[questionId] = updated;
  saveData(data);
  return updated;
}

export function getDueCards(): CardProgress[] {
  const data = loadData();
  return Object.values(data.cards).filter(isDue);
}

export function getAllCards(): Record<string, CardProgress> {
  return loadData().cards;
}

export function getStats() {
  const data = loadData();
  const cards = Object.values(data.cards);
  const total = cards.length;
  const totalAttempts = cards.reduce((s, c) => s + c.totalAttempts, 0);
  const correctAttempts = cards.reduce((s, c) => s + c.correctAttempts, 0);
  const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
  const due = cards.filter(isDue).length;
  const mastered = cards.filter((c) => c.repetitions >= 5).length;

  return { total, due, mastered, accuracy, totalAttempts, correctAttempts };
}

export function getSessionHistory(): SessionRecord[] {
  return loadData().sessions;
}

export function saveSession(session: SessionRecord): void {
  const data = loadData();
  data.sessions.push(session);
  saveData(data);
}
