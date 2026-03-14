import { useState, useRef, useEffect } from 'react';
import type { Question, Catalog } from '../lib/types';
import { initCatalog, selectSessionQuestions, getQuestionSource } from '../lib/quiz-engine';
import { updateProgress, saveSession } from '../lib/storage';
import { ProgressBar } from './ProgressBar';
import { QuestionCard } from './QuestionCard';

interface Props {
  catalog: Catalog;
  questionOverrides?: Question[];
}

interface SessionResult {
  total: number;
  correct: number;
  timeSeconds: number;
  answers: { question: Question; selectedKey: string; correct: boolean }[];
}

export function QuizSession({ catalog, questionOverrides }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<SessionResult | null>(null);
  const answersRef = useRef<SessionResult['answers']>([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    initCatalog(catalog);
    const qs = questionOverrides ?? selectSessionQuestions(10);
    setQuestions(qs);
    startTimeRef.current = Date.now();
  }, [catalog, questionOverrides]);

  function handleAnswer(selectedKey: string, correct: boolean) {
    const question = questions[currentIndex];
    updateProgress(question.id, correct);
    answersRef.current.push({ question, selectedKey, correct });
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      finishSession();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function finishSession() {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    const correctCount = answersRef.current.filter((a) => a.correct).length;
    const topics = [...new Set(
      answersRef.current.map((a) => getQuestionSource(a.question.id)?.sourceTitle ?? 'Unknown')
    )];

    saveSession({
      date: new Date().toISOString(),
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      timeSeconds: elapsed,
      topics,
    });

    setResult({
      total: questions.length,
      correct: correctCount,
      timeSeconds: elapsed,
      answers: answersRef.current,
    });
  }

  function restart() {
    initCatalog(catalog);
    const qs = questionOverrides ?? selectSessionQuestions(10);
    setQuestions(qs);
    setCurrentIndex(0);
    answersRef.current = [];
    startTimeRef.current = Date.now();
    setResult(null);
  }

  if (questions.length === 0) {
    return <p style={{ color: 'var(--text-secondary)' }}>No questions available.</p>;
  }

  if (result) {
    const pct = Math.round((result.correct / result.total) * 100);
    const mins = Math.floor(result.timeSeconds / 60);
    const secs = result.timeSeconds % 60;

    return (
      <div className="session-result">
        <h2 className="result-title">Session Complete</h2>
        <div className="result-score">
          <span className="result-pct">{pct}%</span>
          <span className="result-fraction">{result.correct} / {result.total} correct</span>
        </div>
        <p className="result-time">Time: {mins}m {secs}s</p>

        <div className="result-breakdown">
          {result.answers.map((a, i) => (
            <div key={a.question.id} className={`result-row ${a.correct ? 'result-row--correct' : 'result-row--incorrect'}`}>
              <span className="result-row-num">{i + 1}.</span>
              <span className="result-row-icon">{a.correct ? '✓' : '✗'}</span>
              <span className="result-row-text">{a.question.question}</span>
            </div>
          ))}
        </div>

        <div className="result-actions">
          <button className="result-btn result-btn--primary" onClick={restart}>
            Practice Again
          </button>
          <a href="/" className="result-btn result-btn--secondary">
            Back to Home
          </a>
        </div>

        <style>{resultStyles}</style>
      </div>
    );
  }

  return (
    <div>
      <ProgressBar current={currentIndex + 1} total={questions.length} />
      <QuestionCard
        key={questions[currentIndex].id}
        question={questions[currentIndex]}
        onAnswer={handleAnswer}
        onNext={handleNext}
        isLast={currentIndex + 1 === questions.length}
      />
    </div>
  );
}

const resultStyles = `
  .session-result {
    max-width: 640px;
  }
  .result-title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    margin-bottom: var(--space-6);
  }
  .result-score {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
  }
  .result-pct {
    font-size: var(--text-3xl);
    font-weight: var(--weight-bold);
    color: var(--blue);
  }
  .result-fraction {
    font-size: var(--text-base);
    color: var(--text-secondary);
  }
  .result-time {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin-bottom: var(--space-6);
  }
  .result-breakdown {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-6);
  }
  .result-row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
  }
  .result-row--correct {
    background: var(--green-bg);
  }
  .result-row--incorrect {
    background: var(--red-bg);
  }
  .result-row-num {
    color: var(--text-tertiary);
    width: 20px;
    flex-shrink: 0;
  }
  .result-row-icon {
    flex-shrink: 0;
    font-weight: var(--weight-bold);
  }
  .result-row--correct .result-row-icon { color: var(--green); }
  .result-row--incorrect .result-row-icon { color: var(--red); }
  .result-row-text {
    color: var(--text-primary);
    line-height: var(--leading-normal);
  }
  .result-actions {
    display: flex;
    gap: var(--space-3);
  }
  .result-btn {
    padding: var(--space-2) var(--space-5);
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    transition: opacity var(--transition-fast);
  }
  .result-btn:hover { opacity: 0.85; }
  .result-btn--primary {
    background: var(--blue);
    color: #fff;
  }
  .result-btn--secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
`;
