import { useState } from 'react';
import type { Question } from '../lib/types';
import { AnswerOption } from './AnswerOption';
import { ExplanationPanel } from './ExplanationPanel';

interface Props {
  question: Question;
  onAnswer: (selectedKey: string, correct: boolean) => void;
  onNext: () => void;
  isLast: boolean;
}

export function QuestionCard({ question, onAnswer, onNext, isLast }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const correctOption = question.options.find((o) => o.correct)!;

  function handleSelect(key: string) {
    if (answered) return;
    setSelectedKey(key);
    setAnswered(true);
    const isCorrect = question.options.find((o) => o.key === key)?.correct ?? false;
    onAnswer(key, isCorrect);
  }

  function getOptionState(key: string) {
    if (!answered) return 'default' as const;
    const opt = question.options.find((o) => o.key === key)!;
    if (opt.correct) return 'correct' as const;
    if (key === selectedKey && !opt.correct) return 'incorrect' as const;
    return 'default' as const;
  }

  const selectedOption = question.options.find((o) => o.key === selectedKey);
  const isCorrect = selectedOption?.correct ?? false;

  return (
    <div className="question-card">
      <p className="question-text">{question.question}</p>

      <div className="question-options">
        {question.options.map((opt) => (
          <AnswerOption
            key={opt.key}
            letterKey={opt.key}
            text={opt.text}
            state={getOptionState(opt.key)}
            disabled={answered}
            onClick={() => handleSelect(opt.key)}
          />
        ))}
      </div>

      {answered && selectedOption && (
        <>
          <ExplanationPanel
            correct={isCorrect}
            explanation={selectedOption.explanation}
            correctAnswerText={correctOption.text}
          />
          <button className="question-next-btn" onClick={onNext}>
            {isLast ? 'See Results' : 'Next Question'}
          </button>
        </>
      )}

      <style>{`
        .question-card {
          max-width: 640px;
        }
        .question-text {
          font-size: var(--text-lg);
          font-weight: var(--weight-semibold);
          color: var(--text-primary);
          margin-bottom: var(--space-5);
          line-height: var(--leading-normal);
        }
        .question-options {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .question-next-btn {
          margin-top: var(--space-5);
          padding: var(--space-2) var(--space-5);
          background: var(--blue);
          color: #fff;
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: var(--weight-medium);
          transition: opacity var(--transition-fast);
        }
        .question-next-btn:hover {
          opacity: 0.85;
        }
      `}</style>
    </div>
  );
}
