import { useState, useEffect } from 'react';
import type { Catalog } from '../lib/types';
import { getStats, getAllCards, getSessionHistory } from '../lib/storage';
import { getMasteryLevel } from '../lib/spaced-repetition';
import { initCatalog, getTopics, getQuestionsByTopic } from '../lib/quiz-engine';

interface Props {
  catalog: Catalog;
}

export function StatsView({ catalog }: Props) {
  const [stats, setStats] = useState({ total: 0, due: 0, mastered: 0, accuracy: 0, totalAttempts: 0, correctAttempts: 0 });
  const [mastery, setMastery] = useState({ new: 0, learning: 0, reviewing: 0, mastered: 0 });
  const [topicStats, setTopicStats] = useState<{ title: string; total: number; attempted: number; accuracy: number }[]>([]);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    initCatalog(catalog);
    const s = getStats();
    setStats(s);

    const cards = getAllCards();
    const m = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
    for (const card of Object.values(cards)) {
      m[getMasteryLevel(card)]++;
    }
    setMastery(m);

    const topics = getTopics();
    setTopicStats(
      topics.map((t) => {
        const qs = getQuestionsByTopic(t.source);
        let attempted = 0;
        let correct = 0;
        let total = 0;
        for (const q of qs) {
          const card = cards[q.id];
          if (card && card.totalAttempts > 0) {
            attempted++;
            correct += card.correctAttempts;
            total += card.totalAttempts;
          }
        }
        return {
          title: t.sourceTitle,
          total: qs.length,
          attempted,
          accuracy: total > 0 ? correct / total : 0,
        };
      })
    );

    setSessionCount(getSessionHistory().length);
  }, [catalog]);

  const accuracyPct = Math.round(stats.accuracy * 100);

  return (
    <div className="stats-view">
      <h1 className="stats-title">Progress</h1>

      <div className="stats-grid">
        <div className="stats-card">
          <span className="stats-card-value">{stats.totalAttempts > 0 ? `${accuracyPct}%` : '—'}</span>
          <span className="stats-card-label">Overall Accuracy</span>
        </div>
        <div className="stats-card">
          <span className="stats-card-value">{sessionCount}</span>
          <span className="stats-card-label">Sessions Completed</span>
        </div>
        <div className="stats-card">
          <span className="stats-card-value">{stats.totalAttempts}</span>
          <span className="stats-card-label">Questions Answered</span>
        </div>
      </div>

      <h2 className="stats-section-title">Mastery Breakdown</h2>
      <div className="mastery-bars">
        {(['new', 'learning', 'reviewing', 'mastered'] as const).map((level) => (
          <div key={level} className="mastery-row">
            <span className="mastery-label">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
            <div className="mastery-bar-track">
              <div
                className={`mastery-bar-fill mastery-bar-fill--${level}`}
                style={{
                  width: stats.total > 0 ? `${(mastery[level] / stats.total) * 100}%` : '0%',
                }}
              />
            </div>
            <span className="mastery-count">{mastery[level]}</span>
          </div>
        ))}
      </div>

      {topicStats.length > 0 && (
        <>
          <h2 className="stats-section-title">Per-Topic Accuracy</h2>
          <table className="topic-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Attempted</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {topicStats.map((t) => (
                <tr key={t.title}>
                  <td>{t.title}</td>
                  <td>{t.attempted} / {t.total}</td>
                  <td>{t.attempted > 0 ? `${Math.round(t.accuracy * 100)}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <style>{`
        .stats-view { max-width: 640px; }
        .stats-title {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          margin-bottom: var(--space-6);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--space-3);
          margin-bottom: var(--space-8);
        }
        .stats-card {
          display: flex;
          flex-direction: column;
          padding: var(--space-4);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
        }
        .stats-card-value {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          margin-bottom: var(--space-1);
        }
        .stats-card-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }
        .stats-section-title {
          font-size: var(--text-lg);
          font-weight: var(--weight-semibold);
          margin-bottom: var(--space-4);
        }
        .mastery-bars {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-bottom: var(--space-8);
        }
        .mastery-row {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }
        .mastery-label {
          width: 80px;
          font-size: var(--text-sm);
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .mastery-bar-track {
          flex: 1;
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          overflow: hidden;
        }
        .mastery-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width var(--transition-normal);
        }
        .mastery-bar-fill--new { background: var(--text-tertiary); }
        .mastery-bar-fill--learning { background: var(--orange); }
        .mastery-bar-fill--reviewing { background: var(--blue); }
        .mastery-bar-fill--mastered { background: var(--green); }
        .mastery-count {
          width: 30px;
          text-align: right;
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
        .topic-table {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--text-base);
        }
        .topic-table th {
          text-align: left;
          font-weight: var(--weight-medium);
          color: var(--text-tertiary);
          font-size: var(--text-sm);
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--border-color);
        }
        .topic-table td {
          padding: var(--space-2) var(--space-3);
          border-bottom: 1px solid var(--border-color);
        }
      `}</style>
    </div>
  );
}
