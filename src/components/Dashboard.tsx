import { useState, useEffect } from 'react';
import type { Catalog } from '../lib/types';
import { getStats, getDueCards } from '../lib/storage';
import { initCatalog, getAllQuestions } from '../lib/quiz-engine';

interface Props {
  catalog: Catalog;
}

export function Dashboard({ catalog }: Props) {
  const [stats, setStats] = useState({ total: 0, due: 0, mastered: 0, accuracy: 0, totalAttempts: 0, correctAttempts: 0 });
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    initCatalog(catalog);
    setTotalQuestions(getAllQuestions().length);
    setStats(getStats());
  }, [catalog]);

  const accuracyPct = Math.round(stats.accuracy * 100);

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">Notion Quiz</h1>
      <p className="dashboard-subtitle">
        Master the Notion Help Center through spaced repetition
      </p>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-value">{totalQuestions}</span>
          <span className="stat-label">Total Questions</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.mastered}</span>
          <span className="stat-label">Mastered</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.due}</span>
          <span className="stat-label">Due for Review</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.totalAttempts > 0 ? `${accuracyPct}%` : '—'}</span>
          <span className="stat-label">Accuracy</span>
        </div>
      </div>

      <div className="dashboard-actions">
        <a href="/quiz" className="action-btn action-btn--primary">
          Start Practice
        </a>
        {stats.due > 0 && (
          <a href="/review" className="action-btn action-btn--secondary">
            Review Due ({stats.due})
          </a>
        )}
      </div>

      <style>{`
        .dashboard {
          max-width: 640px;
        }
        .dashboard-title {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          margin-bottom: var(--space-2);
        }
        .dashboard-subtitle {
          font-size: var(--text-base);
          color: var(--text-secondary);
          margin-bottom: var(--space-8);
        }
        .stat-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--space-3);
          margin-bottom: var(--space-8);
        }
        .stat-card {
          display: flex;
          flex-direction: column;
          padding: var(--space-4);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          background: var(--bg-primary);
        }
        .stat-value {
          font-size: var(--text-2xl);
          font-weight: var(--weight-bold);
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }
        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }
        .dashboard-actions {
          display: flex;
          gap: var(--space-3);
        }
        .action-btn {
          padding: var(--space-2) var(--space-6);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: var(--weight-medium);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: opacity var(--transition-fast);
        }
        .action-btn:hover { opacity: 0.85; }
        .action-btn--primary {
          background: var(--blue);
          color: #fff;
        }
        .action-btn--secondary {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
