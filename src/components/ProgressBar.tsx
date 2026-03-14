export function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar-label">
        {current} / {total}
      </span>

      <style>{`
        .progress-bar-wrap {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }
        .progress-bar-track {
          flex: 1;
          height: 4px;
          background: var(--bg-tertiary);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: var(--blue);
          border-radius: 2px;
          transition: width var(--transition-normal);
        }
        .progress-bar-label {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          white-space: nowrap;
          font-weight: var(--weight-medium);
        }
      `}</style>
    </div>
  );
}
