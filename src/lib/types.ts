export interface QuestionOption {
  key: string;
  text: string;
  correct: boolean;
  explanation: string;
}

export interface Question {
  id: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: QuestionOption[];
}

export interface QuestionFile {
  source: string;
  sourceTitle: string;
  sourceUrl: string;
  questions: Question[];
}

export interface Catalog {
  generatedAt: string;
  totalQuestions: number;
  files: QuestionFile[];
}

export interface CardProgress {
  questionId: string;
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReview: string; // ISO date string
  lastReview: string | null;
  totalAttempts: number;
  correctAttempts: number;
}

export interface SessionRecord {
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSeconds: number;
  topics: string[];
}

export interface StorageData {
  version: number;
  cards: Record<string, CardProgress>;
  sessions: SessionRecord[];
}

export interface QuizSessionState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, { selectedKey: string; correct: boolean }>;
  startTime: number;
  completed: boolean;
}
