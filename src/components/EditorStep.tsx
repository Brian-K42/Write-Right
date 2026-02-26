import { useState, useEffect } from 'react';
import { Source } from '../types';
import { Plus, Search, CheckCircle, AlertCircle, Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import Markdown from 'react-markdown';

interface EditorStepProps {
  topic: string;
  specs: string;
  sources: Source[];
  documentText: string;
  onUpdateText: (text: string) => void;
  onAddSource: (url: string) => Promise<void>;
  onCheckWriting: () => Promise<string>;
  isChecking: boolean;
  isAddingSource: boolean;
}

export function EditorStep({
  topic,
  specs,
  sources,
  documentText,
  onUpdateText,
  onAddSource,
  onCheckWriting,
  isChecking,
  isAddingSource,
}: EditorStepProps) {
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSourceUrl.trim()) {
      await onAddSource(newSourceUrl.trim());
      setNewSourceUrl('');
    }
  };

  const handleCheck = async () => {
    const result = await onCheckWriting();
    setFeedback(result);
  };

  const categories = Array.from(new Set(sources.map((s) => s.category)));

  return (
    <div className="flex flex-1 w-full overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      {/* Left Panel: Sources */}
      <div className="flex w-80 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Sources</h3>
          <form onSubmit={handleAddSource} className="relative">
            <input
              type="url"
              value={newSourceUrl}
              onChange={(e) => setNewSourceUrl(e.target.value)}
              placeholder="Add a source URL..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-10 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
              required
            />
            <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <button
              type="submit"
              disabled={!newSourceUrl.trim() || isAddingSource}
              className="absolute right-2 top-1.5 rounded-md p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              {isAddingSource ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {category}
              </h4>
              <div className="space-y-3">
                {sources
                  .filter((s) => s.category === category)
                  .map((source) => (
                    <div
                      key={source.id}
                      className="group relative rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-1 flex items-start justify-between gap-2"
                      >
                        <h5 className="text-sm font-medium text-zinc-900 line-clamp-2 dark:text-zinc-100 hover:underline">
                          {source.title}
                        </h5>
                        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100" />
                      </a>
                      <p className="text-xs text-zinc-500 line-clamp-3 dark:text-zinc-400">
                        {source.summary}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {sources.length === 0 && (
            <div className="text-center text-sm text-zinc-500 py-8">
              No sources added yet.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Editor */}
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{topic}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-2xl">
              {specs}
            </p>
          </div>
          <button
            onClick={handleCheck}
            disabled={isChecking || documentText.trim().length < 50}
            className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Check Writing
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <textarea
            value={documentText}
            onChange={(e) => onUpdateText(e.target.value)}
            placeholder="Start writing your paper here..."
            className="h-full w-full resize-none bg-transparent p-8 text-base leading-relaxed text-zinc-900 focus:outline-none dark:text-zinc-100"
          />

          {/* Feedback Sidebar */}
          {feedback && (
            <div className="w-80 border-l border-zinc-200 bg-zinc-50 p-6 overflow-y-auto dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Feedback
                </h3>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Close
                </button>
              </div>
              <div className="prose prose-sm prose-zinc dark:prose-invert">
                <Markdown>{feedback}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
