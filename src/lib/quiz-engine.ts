import type { Question, Catalog, QuestionFile } from './types';
import { getProgress, getDueCards, getAllCards } from './storage';
import { isDue } from './spaced-repetition';

let loadedCatalog: Catalog | null = null;
let allQuestions: Question[] = [];
let questionSourceMap: Map<string, QuestionFile> = new Map();

export function initCatalog(catalog: Catalog) {
  loadedCatalog = catalog;
  allQuestions = [];
  questionSourceMap = new Map();

  for (const file of catalog.files) {
    for (const q of file.questions) {
      allQuestions.push(q);
      questionSourceMap.set(q.id, file);
    }
  }
}

export function getAllQuestions(): Question[] {
  return allQuestions;
}

export function getQuestionSource(questionId: string): QuestionFile | undefined {
  return questionSourceMap.get(questionId);
}

export function getTopics(): { source: string; sourceTitle: string; count: number }[] {
  if (!loadedCatalog) return [];
  return loadedCatalog.files.map((f) => ({
    source: f.source,
    sourceTitle: f.sourceTitle,
    count: f.questions.length,
  }));
}

export function getQuestionsByTopic(source: string): Question[] {
  if (!loadedCatalog) return [];
  const file = loadedCatalog.files.find((f) => f.source === source);
  return file?.questions ?? [];
}

export function selectSessionQuestions(count: number = 10): Question[] {
  const cards = getAllCards();
  const selected: Question[] = [];
  const usedIds = new Set<string>();

  // Priority 1: Due cards
  const dueQuestionIds = new Set(getDueCards().map((c) => c.questionId));
  const dueQuestions = allQuestions.filter((q) => dueQuestionIds.has(q.id));
  shuffle(dueQuestions);
  for (const q of dueQuestions) {
    if (selected.length >= count) break;
    selected.push(q);
    usedIds.add(q.id);
  }

  // Priority 2: Unseen cards
  const unseenQuestions = allQuestions.filter(
    (q) => !cards[q.id] && !usedIds.has(q.id)
  );
  shuffle(unseenQuestions);
  for (const q of unseenQuestions) {
    if (selected.length >= count) break;
    selected.push(q);
    usedIds.add(q.id);
  }

  // Priority 3: Random from remaining
  const remaining = allQuestions.filter((q) => !usedIds.has(q.id));
  shuffle(remaining);
  for (const q of remaining) {
    if (selected.length >= count) break;
    selected.push(q);
    usedIds.add(q.id);
  }

  shuffle(selected);
  return selected;
}

export function getReviewQuestions(): Question[] {
  const cards = getAllCards();
  return allQuestions.filter((q) => {
    const card = cards[q.id];
    return card && card.totalAttempts > card.correctAttempts;
  });
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
