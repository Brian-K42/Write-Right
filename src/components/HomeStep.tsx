import { useState } from 'react';
import { ArrowUp, BookOpenText } from 'lucide-react';

interface HomeStepProps {
  onSubmitSpecs: (specs: string) => void;
}

export function HomeStep({ onSubmitSpecs }: HomeStepProps) {
  const [specs, setSpecs] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (specs.trim()) {
      onSubmitSpecs(specs);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 overflow-y-auto">
      <div className="mb-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <BookOpenText className="h-8 w-8 text-zinc-900 dark:text-zinc-100" />
        </div>
        <h1 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          What are you writing about?
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Paste your assignment description or specs below to get started.
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm focus-within:ring-2 focus-within:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:ring-zinc-100"
        >
          <textarea
            value={specs}
            onChange={(e) => setSpecs(e.target.value)}
            placeholder="e.g., Write a 5-page research paper on the impact of artificial intelligence on modern healthcare, citing at least 3 peer-reviewed sources..."
            className="max-h-[200px] min-h-[56px] w-full resize-none bg-transparent px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:outline-none dark:text-zinc-100 dark:placeholder-zinc-400"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!specs.trim()}
            className="mb-1 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          WriteRight can make mistakes. Consider verifying important information.
        </div>
      </div>
    </div>
  );
}
