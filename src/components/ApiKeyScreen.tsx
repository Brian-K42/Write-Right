import { useState } from 'react';
import { KeyRound, ArrowRight, FlaskConical } from 'lucide-react';

interface ApiKeyScreenProps {
  onSubmitKey: (key: string) => void;
  onSkip: () => void;
}

export function ApiKeyScreen({ onSubmitKey, onSkip }: ApiKeyScreenProps) {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onSubmitKey(key.trim());
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <KeyRound className="h-8 w-8 text-zinc-900 dark:text-zinc-100" />
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            WriteRight
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Enter your Gemini API key to get started, or try demo mode.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Gemini API key"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:ring-zinc-100"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-sm text-zinc-400 dark:text-zinc-500">or</span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <button
          onClick={onSkip}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
        >
          <FlaskConical className="h-4 w-4" />
          Try demo mode
        </button>
        <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Demo mode uses placeholder responses instead of AI.
        </p>
      </div>
    </div>
  );
}
