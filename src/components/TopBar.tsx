export function TopBar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>

      <style>{`
        .topbar {
          height: var(--topbar-height);
          display: flex;
          align-items: center;
          padding: 0 var(--space-4);
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-primary);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .topbar-title {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: var(--weight-medium);
        }
        @media (max-width: 767px) {
          .topbar {
            padding-left: 48px;
          }
        }
      `}</style>
    </header>
  );
}
