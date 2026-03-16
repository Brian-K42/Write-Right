import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Source, FeedbackPoint } from '../types';
import {
  Plus, CheckCircle, Loader2, Link as LinkIcon, ExternalLink, X,
  ChevronLeft, ChevronRight, Check, XIcon,
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Eye, Pencil, PanelLeftOpen,
} from 'lucide-react';
import Markdown from 'react-markdown';

interface EditorStepProps {
  topic: string;
  specs: string;
  sources: Source[];
  documentText: string;
  onUpdateText: (text: string) => void;
  onAddSource: (url: string) => Promise<void>;
  onCheckWriting: () => Promise<FeedbackPoint[]>;
  isChecking: boolean;
  isAddingSource: boolean;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
}

type FormatAction =
  | { type: 'wrap'; before: string; after: string }
  | { type: 'line-prefix'; prefix: string };

const FORMAT_ACTIONS: Record<string, FormatAction> = {
  bold: { type: 'wrap', before: '**', after: '**' },
  italic: { type: 'wrap', before: '_', after: '_' },
  underline: { type: 'wrap', before: '<u>', after: '</u>' },
  h1: { type: 'line-prefix', prefix: '# ' },
  h2: { type: 'line-prefix', prefix: '## ' },
  h3: { type: 'line-prefix', prefix: '### ' },
  ul: { type: 'line-prefix', prefix: '- ' },
  ol: { type: 'line-prefix', prefix: '1. ' },
  quote: { type: 'line-prefix', prefix: '> ' },
  hr: { type: 'line-prefix', prefix: '---\n' },
};

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
  isSidebarOpen,
  onOpenSidebar,
}: EditorStepProps) {
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLElement>(null);

  // Review mode state
  const [feedbackPoints, setFeedbackPoints] = useState<FeedbackPoint[]>([]);
  const [currentPointIndex, setCurrentPointIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);

  // Scroll to highlighted section when it changes
  useEffect(() => {
    if (reviewMode && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [reviewMode, currentPointIndex]);

  // Find a section in text with flexible whitespace matching.
  // The AI often returns sections without the line breaks present in the actual text.
  const findSection = useCallback((text: string, section: string): { start: number; end: number } | null => {
    // Try exact match first
    const exactIdx = text.indexOf(section);
    if (exactIdx !== -1) {
      return { start: exactIdx, end: exactIdx + section.length };
    }
    // Build a regex where each whitespace run in the section matches any whitespace run in the text
    const escaped = section.split(/\s+/).map(
      word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('\\s+');
    try {
      const regex = new RegExp(escaped);
      const match = regex.exec(text);
      if (match) {
        return { start: match.index, end: match.index + match[0].length };
      }
    } catch {
      // Invalid regex — fall through
    }
    return null;
  }, []);

  const applyFormat = useCallback((actionKey: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const action = FORMAT_ACTIONS[actionKey];
    if (!action) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = documentText;

    if (action.type === 'wrap') {
      const selected = text.slice(start, end);
      const replacement = action.before + (selected || 'text') + action.after;
      const newText = text.slice(0, start) + replacement + text.slice(end);
      onUpdateText(newText);
      // Position cursor around inserted text
      requestAnimationFrame(() => {
        ta.focus();
        if (selected) {
          ta.selectionStart = start;
          ta.selectionEnd = start + replacement.length;
        } else {
          ta.selectionStart = start + action.before.length;
          ta.selectionEnd = start + action.before.length + 4; // "text"
        }
      });
    } else if (action.type === 'line-prefix') {
      // Find the start of the current line
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const newText = text.slice(0, lineStart) + action.prefix + text.slice(lineStart);
      onUpdateText(newText);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = start + action.prefix.length;
        ta.selectionEnd = end + action.prefix.length;
      });
    }
  }, [documentText, onUpdateText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    const keyMap: Record<string, string> = {
      b: 'bold',
      i: 'italic',
      u: 'underline',
    };

    const action = keyMap[e.key.toLowerCase()];
    if (action) {
      e.preventDefault();
      applyFormat(action);
    }
  }, [applyFormat]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSourceUrl.trim()) {
      await onAddSource(newSourceUrl.trim());
      setNewSourceUrl('');
    }
  };

  const handleCheck = async () => {
    const points = await onCheckWriting();
    if (points.length > 0) {
      // Sort points by position in the document (last to first).
      // Reviewing from the end means accepted replacements only shift text
      // before the remaining points, never after — so their sections stay valid.
      const sorted = [...points].sort((a, b) => {
        const posA = findSection(documentText, a.section);
        const posB = findSection(documentText, b.section);
        return (posB?.start ?? 0) - (posA?.start ?? 0);
      });
      setFeedbackPoints(sorted);
      setCurrentPointIndex(0);
      setReviewMode(true);
    }
  };

  const currentPoint = reviewMode ? feedbackPoints[currentPointIndex] : null;

  const handleAccept = () => {
    if (!currentPoint || currentPoint.type !== 'negative' || !currentPoint.suggestion) return;
    const match = findSection(documentText, currentPoint.section);
    if (!match) {
      advance();
      return;
    }
    const newText = documentText.slice(0, match.start) + currentPoint.suggestion + documentText.slice(match.end);
    onUpdateText(newText);
    advance();
  };

  const handleDecline = () => {
    advance();
  };

  const advance = () => {
    if (currentPointIndex < feedbackPoints.length - 1) {
      setCurrentPointIndex(currentPointIndex + 1);
    } else {
      exitReview();
    }
  };

  const exitReview = () => {
    setReviewMode(false);
    setFeedbackPoints([]);
    setCurrentPointIndex(0);
  };

  const highlightedContent = useMemo(() => {
    if (!reviewMode || !currentPoint) return null;

    const match = findSection(documentText, currentPoint.section);
    if (!match) {
      return [{ text: documentText, type: 'plain' as const }];
    }

    return [
      { text: documentText.slice(0, match.start), type: 'plain' as const },
      { text: documentText.slice(match.start, match.end), type: 'highlight' as const },
      { text: documentText.slice(match.end), type: 'plain' as const },
    ];
  }, [reviewMode, currentPoint, documentText, findSection]);

  const wordCount = documentText.trim() ? documentText.trim().split(/\s+/).length : 0;
  const charCount = documentText.length;

  const categories = Array.from(new Set(sources.map((s) => s.category)));

  const toolbarButtons = [
    { key: 'bold', icon: Bold, label: 'Bold (Ctrl+B)' },
    { key: 'italic', icon: Italic, label: 'Italic (Ctrl+I)' },
    { key: 'underline', icon: Underline, label: 'Underline (Ctrl+U)' },
    { key: 'divider1', icon: null, label: '' },
    { key: 'h1', icon: Heading1, label: 'Heading 1' },
    { key: 'h2', icon: Heading2, label: 'Heading 2' },
    { key: 'h3', icon: Heading3, label: 'Heading 3' },
    { key: 'divider2', icon: null, label: '' },
    { key: 'ul', icon: List, label: 'Bullet list' },
    { key: 'ol', icon: ListOrdered, label: 'Numbered list' },
    { key: 'quote', icon: Quote, label: 'Block quote' },
    { key: 'hr', icon: Minus, label: 'Horizontal rule' },
  ];

  return (
    <div className="flex flex-1 w-full overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      {/* Left Panel: Sources */}
      <div className="flex w-80 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            {!isSidebarOpen && (
              <button
                onClick={onOpenSidebar}
                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <PanelLeftOpen className="h-5 w-5" />
              </button>
            )}
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Sources</h3>
          </div>
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
                      className="group relative rounded-xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
                      onClick={() => setSelectedSource(source)}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <h5 className="text-sm font-medium text-zinc-900 line-clamp-2 dark:text-zinc-100">
                          {source.title}
                        </h5>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5 shrink-0 rounded p-0.5 text-zinc-400 opacity-0 transition-opacity hover:text-zinc-700 group-hover:opacity-100 dark:hover:text-zinc-200"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
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

      {/* Right Panel: Editor / Review */}
      <div className="relative flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{topic}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-2xl">
              {specs}
            </p>
          </div>
          {reviewMode ? (
            <button
              onClick={exitReview}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
              Exit Review
            </button>
          ) : (
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
          )}
        </div>

        {reviewMode && currentPoint ? (
          /* Review mode */
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="whitespace-pre-wrap text-base leading-relaxed text-zinc-900 dark:text-zinc-100">
                {highlightedContent?.map((segment, i) =>
                  segment.type === 'highlight' ? (
                    <mark
                      key={i}
                      ref={highlightRef}
                      className={`rounded px-0.5 ${
                        currentPoint.type === 'positive'
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200'
                      }`}
                    >
                      {segment.text}
                    </mark>
                  ) : (
                    <span key={i}>{segment.text}</span>
                  )
                )}
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mx-auto max-w-3xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        currentPoint.type === 'positive'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}
                    >
                      {currentPoint.type === 'positive' ? 'Strength' : 'Suggestion'}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {currentPointIndex + 1} of {feedbackPoints.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPointIndex(Math.max(0, currentPointIndex - 1))}
                      disabled={currentPointIndex === 0}
                      className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPointIndex(Math.min(feedbackPoints.length - 1, currentPointIndex + 1))}
                      disabled={currentPointIndex === feedbackPoints.length - 1}
                      className="rounded-md p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30 dark:hover:text-zinc-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
                  {currentPoint.feedback}
                </p>

                {currentPoint.type === 'negative' && currentPoint.suggestion && (
                  <div className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Suggested revision
                    </div>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200">
                      {currentPoint.suggestion}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  {currentPoint.type === 'positive' ? (
                    <button
                      onClick={advance}
                      className="flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      {currentPointIndex < feedbackPoints.length - 1 ? 'Continue' : 'Done'}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleAccept}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={handleDecline}
                        className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        <XIcon className="h-4 w-4" />
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Editor mode */
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 border-b border-zinc-200 bg-white px-4 py-1.5 dark:border-zinc-800 dark:bg-zinc-950">
              {toolbarButtons.map((btn) =>
                btn.icon === null ? (
                  <div key={btn.key} className="mx-1.5 h-5 w-px bg-zinc-200 dark:bg-zinc-700" />
                ) : (
                  <button
                    key={btn.key}
                    onClick={() => applyFormat(btn.key)}
                    title={btn.label}
                    className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <btn.icon className="h-4 w-4" />
                  </button>
                )
              )}

              <div className="flex-1" />

              <button
                onClick={() => setPreviewMode(!previewMode)}
                title={previewMode ? 'Edit' : 'Preview'}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  previewMode
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                {previewMode ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {previewMode ? 'Edit' : 'Preview'}
              </button>
            </div>

            {/* Editor / Preview area */}
            {previewMode ? (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="prose prose-zinc mx-auto max-w-none dark:prose-invert">
                  <Markdown>{documentText || '*Nothing to preview yet.*'}</Markdown>
                </div>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={documentText}
                onChange={(e) => onUpdateText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start writing your paper here..."
                className="h-full w-full flex-1 resize-none bg-white p-8 font-mono text-[15px] leading-relaxed text-zinc-900 focus:outline-none dark:bg-zinc-950 dark:text-zinc-100"
              />
            )}

            {/* Status bar */}
            <div className="flex items-center justify-between border-t border-zinc-200 bg-white px-4 py-1.5 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
              <div className="flex items-center gap-4">
                <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
                <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
              </div>
              <span>Markdown</span>
            </div>
          </div>
        )}
      </div>

      {/* Source Detail Modal */}
      {selectedSource && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedSource(null)}
        >
          <div
            className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-zinc-200 p-6 dark:border-zinc-800">
              <div className="min-w-0 flex-1 pr-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedSource.title}
                </h2>
                <div className="mt-1 flex items-center gap-3">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {selectedSource.category}
                  </span>
                  <a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {selectedSource.url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm prose-zinc max-w-none dark:prose-invert">
                <Markdown>{selectedSource.content || selectedSource.summary}</Markdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
