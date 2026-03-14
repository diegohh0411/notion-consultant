import type { CardProgress } from './types';

export function createNewCard(questionId: string): CardProgress {
  return {
    questionId,
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: new Date().toISOString(),
    lastReview: null,
    totalAttempts: 0,
    correctAttempts: 0,
  };
}

export function calculateNextReview(
  card: CardProgress,
  isCorrect: boolean
): CardProgress {
  const now = new Date();
  const updated = { ...card };

  updated.totalAttempts += 1;
  updated.lastReview = now.toISOString();

  if (isCorrect) {
    updated.correctAttempts += 1;
    updated.repetitions += 1;

    if (updated.repetitions === 1) {
      updated.interval = 1;
    } else if (updated.repetitions === 2) {
      updated.interval = 6;
    } else {
      updated.interval = Math.round(updated.interval * updated.easeFactor);
    }

    updated.easeFactor = Math.max(1.3, updated.easeFactor + 0.1);
  } else {
    updated.repetitions = 0;
    updated.interval = 1;
    updated.easeFactor = Math.max(1.3, updated.easeFactor - 0.2);
  }

  const nextDate = new Date(now);
  nextDate.setDate(nextDate.getDate() + updated.interval);
  updated.nextReview = nextDate.toISOString();

  return updated;
}

export function isDue(card: CardProgress): boolean {
  return new Date(card.nextReview) <= new Date();
}

export function getMasteryLevel(
  card: CardProgress
): 'new' | 'learning' | 'reviewing' | 'mastered' {
  if (card.totalAttempts === 0) return 'new';
  if (card.repetitions < 2) return 'learning';
  if (card.repetitions < 5) return 'reviewing';
  return 'mastered';
}
