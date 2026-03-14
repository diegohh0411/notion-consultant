interface Props {
  correct: boolean;
  explanation: string;
  correctAnswerText: string;
}

export function ExplanationPanel({ correct, explanation, correctAnswerText }: Props) {
  return (
    <div className={`explanation ${correct ? 'explanation--correct' : 'explanation--incorrect'}`}>
      <div className="explanation-header">
        <span className="explanation-icon">{correct ? '✓' : '✗'}</span>
        <span className="explanation-title">
          {correct ? 'Correct!' : `Incorrect — the answer is: ${correctAnswerText}`}
        </span>
      </div>
      <p className="explanation-body">{explanation}</p>

      <style>{`
        .explanation {
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          margin-top: var(--space-4);
        }
        .explanation--correct {
          background: var(--green-bg);
          border: 1px solid var(--green-light);
        }
        .explanation--incorrect {
          background: var(--red-bg);
          border: 1px solid var(--red-light);
        }
        .explanation-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }
        .explanation-icon {
          font-weight: var(--weight-bold);
          font-size: var(--text-lg);
        }
        .explanation--correct .explanation-icon {
          color: var(--green);
        }
        .explanation--incorrect .explanation-icon {
          color: var(--red);
        }
        .explanation-title {
          font-weight: var(--weight-semibold);
          font-size: var(--text-base);
        }
        .explanation-body {
          font-size: var(--text-base);
          color: var(--text-secondary);
          line-height: var(--leading-normal);
        }
      `}</style>
    </div>
  );
}
