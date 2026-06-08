import { useState } from 'react';
import { CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import type { QuizQuestion as QuizQuestionType } from '../../shared/types.js';
import { cn } from '@/lib/utils';

interface QuizQuestionProps {
  question: QuizQuestionType;
  onSubmit: (answers: number[]) => void;
  submitted?: boolean;
  userAnswers?: number[];
}

const typeLabels: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  boolean: '判断题',
};

export default function QuizQuestion({
  question,
  onSubmit,
  submitted = false,
  userAnswers = [],
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<number[]>(userAnswers);

  const isCorrect = (index: number) => question.correctAnswers.includes(index);
  const isUserSelected = (index: number) => selected.includes(index);

  const handleSelect = (index: number) => {
    if (submitted) return;

    if (question.type === 'single' || question.type === 'boolean') {
      setSelected([index]);
      onSubmit([index]);
    } else {
      setSelected((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0 && !submitted) {
      onSubmit(selected);
    }
  };

  const getOptionClass = (index: number) => {
    if (!submitted) {
      return cn(
        'border-2 border-gray-200 hover:border-blue-800 hover:bg-blue-50',
        isUserSelected(index) && 'border-blue-800 bg-blue-50'
      );
    }
    if (isCorrect(index)) {
      return 'border-2 border-teal-600 bg-teal-50';
    }
    if (isUserSelected(index) && !isCorrect(index)) {
      return 'border-2 border-red-500 bg-red-50';
    }
    return 'border-2 border-gray-200 opacity-50';
  };

  const isAnswerCorrect =
    submitted &&
    selected.length === question.correctAnswers.length &&
    selected.every((a) => question.correctAnswers.includes(a));

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full mb-3">
            {typeLabels[question.type]}
          </span>
          <h3 className="text-lg font-semibold text-gray-900">{question.question}</h3>
        </div>
        {submitted && (
          <div className="flex items-center gap-2">
            {isAnswerCorrect ? (
              <span className="flex items-center gap-1 text-teal-600 font-medium">
                <CheckCircle className="w-5 h-5" />
                正确
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <XCircle className="w-5 h-5" />
                错误
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={submitted}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left',
              getOptionClass(index)
            )}
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-sm font-semibold',
                submitted && isCorrect(index) && 'border-teal-600 bg-teal-600 text-white',
                submitted && isUserSelected(index) && !isCorrect(index) && 'border-red-500 bg-red-500 text-white',
                !submitted && isUserSelected(index) && 'border-blue-800 bg-blue-800 text-white',
                !submitted && !isUserSelected(index) && 'border-gray-300'
              )}
            >
              {submitted && isCorrect(index) && <CheckCircle className="w-4 h-4" />}
              {submitted && isUserSelected(index) && !isCorrect(index) && <XCircle className="w-4 h-4" />}
              {!submitted && String.fromCharCode(65 + index)}
            </div>
            <span
              className={cn(
                'flex-1',
                submitted && isCorrect(index) && 'font-medium text-teal-700',
                submitted && isUserSelected(index) && !isCorrect(index) && 'text-red-700 line-through'
              )}
            >
              {option}
            </span>
          </button>
        ))}
      </div>

      {question.type === 'multiple' && !submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0}
          className="w-full py-3 bg-blue-800 text-white font-medium rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          提交答案
        </button>
      )}

      {submitted && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-800 mb-1">答案解析</div>
              <p className="text-sm text-amber-700">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
