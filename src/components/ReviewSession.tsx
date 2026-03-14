import { useState, useEffect } from 'react';
import type { Catalog, Question } from '../lib/types';
import { initCatalog, getReviewQuestions, getQuestionSource } from '../lib/quiz-engine';
import { QuizSession } from './QuizSession';

interface Props {
  catalog: Catalog;
}

interface GroupedQuestions {
  topic: string;
  questions: Question[];
}

export function ReviewSession({ catalog }: Props) {
  const [groups, setGroups] = useState<GroupedQuestions[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    initCatalog(catalog);
    const reviewQs = getReviewQuestions();
    const byTopic = new Map<string, Question[]>();

    for (const q of reviewQs) {
      const source = getQuestionSource(q.id);
      const topic = source?.sourceTitle ?? 'Unknown';
      if (!byTopic.has(topic)) byTopic.set(topic, []);
      byTopic.get(topic)!.push(q);
    }

    setGroups(
      Array.from(byTopic.entries()).map(([topic, questions]) => ({
        topic,
        questions,
      }))
    );
  }, [catalog]);

  if (practiceQuestions) {
    return <QuizSession catalog={catalog} questionOverrides={practiceQuestions} />;
  }

  if (groups.length === 0) {
    return (
      <div className="review-empty">
        <h1 className="review-title">Review</h1>
        <p className="review-empty-text">
          No questions to review yet. Start practicing to build up your review list.
        </p>
        <a href="/quiz" className="review-start-btn">Start Practice</a>

        <style>{styles}</style>
      </div>
    );
  }

  const totalReview = groups.reduce((s, g) => s + g.questions.length, 0);

  return (
    <div className="review-view">
      <h1 className="review-title">Review</h1>
      <p className="review-subtitle">
        {totalReview} question{totalReview !== 1 ? 's' : ''} you've previously answered incorrectly
      </p>

      <button
        className="review-practice-all"
        onClick={() => {
          const all = groups.flatMap((g) => g.questions);
          setPracticeQuestions(all.slice(0, 10));
        }}
      >
        Practice All ({Math.min(totalReview, 10)} questions)
      </button>

      {groups.map((group) => (
        <div key={group.topic} className="review-group">
          <div className="review-group-header">
            <h2 className="review-group-title">{group.topic}</h2>
            <button
              className="review-group-btn"
              onClick={() => setPracticeQuestions(group.questions)}
            >
              Practice these
            </button>
          </div>
          <ul className="review-list">
            {group.questions.map((q) => (
              <li key={q.id} className="review-item">
                {q.question}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .review-view, .review-empty { max-width: 640px; }
  .review-title {
    font-size: var(--text-2xl);
    font-weight: var(--weight-bold);
    margin-bottom: var(--space-2);
  }
  .review-subtitle {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-6);
  }
  .review-empty-text {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-5);
  }
  .review-start-btn, .review-practice-all {
    padding: var(--space-2) var(--space-5);
    background: var(--blue);
    color: #fff;
    border-radius: var(--radius-md);
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    text-decoration: none;
    display: inline-flex;
    margin-bottom: var(--space-6);
    transition: opacity var(--transition-fast);
  }
  .review-start-btn:hover, .review-practice-all:hover { opacity: 0.85; }
  .review-group {
    margin-bottom: var(--space-6);
  }
  .review-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }
  .review-group-title {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
  }
  .review-group-btn {
    font-size: var(--text-sm);
    color: var(--blue);
    font-weight: var(--weight-medium);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-md);
    background: var(--blue-light);
    transition: background var(--transition-fast);
  }
  .review-group-btn:hover { background: var(--blue-bg); }
  .review-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .review-item {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    background: var(--bg-secondary);
    font-size: var(--text-base);
    color: var(--text-primary);
  }
`;
