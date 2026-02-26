import { useState } from 'react';
import { Plus, X, ArrowRight } from 'lucide-react';

interface TopicsStepProps {
  onSubmitTopics: (topics: string[]) => void;
  isEvaluating: boolean;
}

export function TopicsStep({ onSubmitTopics, isEvaluating }: TopicsStepProps) {
  const [topics, setTopics] = useState<string[]>(['']);

  const handleAddTopic = () => {
    setTopics([...topics, '']);
  };

  const handleRemoveTopic = (index: number) => {
    const newTopics = [...topics];
    newTopics.splice(index, 1);
    setTopics(newTopics);
  };

  const handleTopicChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = value;
    setTopics(newTopics);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validTopics = topics.filter((t) => t.trim() !== '');
    if (validTopics.length > 0) {
      onSubmitTopics(validTopics);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            What topics are you considering?
          </h2>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Enter a few ideas you have for your paper. We'll evaluate them based on your assignment specs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {topics.map((topic, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => handleTopicChange(index, e.target.value)}
                placeholder={`Topic Idea ${index + 1}`}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
                autoFocus={index === topics.length - 1}
              />
              {topics.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTopic(index)}
                  className="rounded-xl p-3 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={handleAddTopic}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Add another topic
            </button>

            <button
              type="submit"
              disabled={topics.filter((t) => t.trim() !== '').length === 0 || isEvaluating}
              className="flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isEvaluating ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-white dark:border-zinc-600 dark:border-t-zinc-900" />
                  Evaluating...
                </span>
              ) : (
                <>
                  Evaluate Topics
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
