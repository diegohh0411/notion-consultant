type OptionState = 'default' | 'selected' | 'correct' | 'incorrect';

interface Props {
  letterKey: string;
  text: string;
  state: OptionState;
  disabled: boolean;
  onClick: () => void;
}

export function AnswerOption({ letterKey, text, state, disabled, onClick }: Props) {
  const stateClass = state !== 'default' ? `answer-option--${state}` : '';

  return (
    <button
      className={`answer-option ${stateClass}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="answer-option-badge">{letterKey}</span>
      <span className="answer-option-text">{text}</span>

      <style>{`
        .answer-option {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          width: 100%;
          padding: var(--space-3) var(--space-4);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          text-align: left;
          background: var(--bg-primary);
          cursor: pointer;
          transition: border-color var(--transition-fast), background var(--transition-fast);
        }
        .answer-option:hover:not(:disabled) {
          background: var(--bg-hover);
          border-color: var(--border-color-strong);
        }
        .answer-option:disabled {
          cursor: default;
        }
        .answer-option--selected {
          border-color: var(--blue);
          background: var(--blue-light);
        }
        .answer-option--correct {
          border-color: var(--green);
          background: var(--green-light);
        }
        .answer-option--incorrect {
          border-color: var(--red);
          background: var(--red-light);
        }
        .answer-option-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: var(--radius-sm);
          background: var(--bg-tertiary);
          font-size: var(--text-sm);
          font-weight: var(--weight-semibold);
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .answer-option--correct .answer-option-badge {
          background: var(--green);
          color: #fff;
        }
        .answer-option--incorrect .answer-option-badge {
          background: var(--red);
          color: #fff;
        }
        .answer-option-text {
          font-size: var(--text-base);
          line-height: var(--leading-normal);
          color: var(--text-primary);
          padding-top: 1px;
        }
      `}</style>
    </button>
  );
}
