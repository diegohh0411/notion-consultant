import { useState, useEffect } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: 'Practice', href: '/quiz', icon: '📝' },
  { label: 'Progress', href: '/stats', icon: '📊' },
  { label: 'Review', href: '/review', icon: '🔄' },
  { label: 'Home', href: '/', icon: '🏠' },
];

export function Sidebar({ currentPath }: { currentPath: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <button
        className="sidebar-hamburger"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <nav className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">📓</span>
          <span className="sidebar-title">Notion Quiz</span>
        </div>

        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`sidebar-item ${currentPath === item.href ? 'sidebar-item--active' : ''}`}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <style>{`
        .sidebar-hamburger {
          display: none;
          position: fixed;
          top: 10px;
          left: 12px;
          z-index: 110;
          width: 28px;
          height: 28px;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          padding: 4px;
          border-radius: var(--radius-md);
          background: var(--bg-primary);
        }
        .sidebar-hamburger span {
          display: block;
          width: 100%;
          height: 2px;
          background: var(--text-secondary);
          border-radius: 1px;
        }
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.2);
          z-index: 99;
        }
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: var(--bg-secondary);
          padding: var(--space-2);
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
        }
        .sidebar-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-2);
          margin-bottom: var(--space-2);
        }
        .sidebar-logo {
          font-size: 18px;
        }
        .sidebar-title {
          font-size: var(--text-base);
          font-weight: var(--weight-semibold);
          color: var(--text-primary);
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          height: 28px;
          padding: 0 var(--space-2);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          color: var(--text-secondary);
          text-decoration: none;
          transition: background var(--transition-fast);
        }
        .sidebar-item:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .sidebar-item--active {
          background: var(--bg-active);
          color: var(--text-primary);
          font-weight: var(--weight-medium);
        }
        .sidebar-item-icon {
          font-size: 14px;
          width: 20px;
          text-align: center;
        }

        @media (max-width: 767px) {
          .sidebar-hamburger {
            display: flex;
          }
          .sidebar {
            transform: translateX(-100%);
            transition: transform var(--transition-normal);
            box-shadow: var(--shadow-lg);
          }
          .sidebar--open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            display: block;
          }
        }
      `}</style>
    </>
  );
}
