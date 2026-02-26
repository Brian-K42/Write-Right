import { useState } from 'react';
import { TopicEvaluation } from '../types';
import { Info, ChevronRight, CheckCircle2 } from 'lucide-react';

interface EvaluationStepProps {
  evaluations: TopicEvaluation[];
  onSelectTopic: (topic: string) => void;
}

export function EvaluationStep({ evaluations, onSelectTopic }: EvaluationStepProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<{ topic: string; type: string } | null>(null);

  const handleSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleNext = () => {
    if (selectedTopic) {
      onSelectTopic(selectedTopic);
    }
  };

  const toggleInfo = (topic: string, type: string) => {
    if (expandedInfo?.topic === topic && expandedInfo?.type === type) {
      setExpandedInfo(null);
    } else {
      setExpandedInfo({ topic, type });
    }
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-12 md:px-12 lg:px-24 overflow-y-auto">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Topic Evaluations
        </h2>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Review the difficulty scores and select the topic you want to write about.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {evaluations.map((evalData) => (
          <div
            key={evalData.topic}
            className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all ${
              selectedTopic === evalData.topic
                ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/50'
                : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
            }`}
            onClick={() => handleSelect(evalData.topic)}
          >
            {selectedTopic === evalData.topic && (
              <div className="absolute -right-3 -top-3 rounded-full bg-white dark:bg-zinc-900">
                <CheckCircle2 className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
              </div>
            )}
            
            <h3 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {evalData.topic}
            </h3>

            <div className="mb-6 flex items-center justify-between rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                Overall Difficulty
              </span>
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {evalData.overallScore}
                <span className="text-sm font-normal text-zinc-500">/100</span>
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {[
                { key: 'complexity', label: 'Complexity', data: evalData.complexity },
                { key: 'nicheness', label: 'Nicheness', data: evalData.nicheness },
                { key: 'fit', label: 'Topic Fit', data: evalData.fit },
              ].map((subscore) => (
                <div key={subscore.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {subscore.label}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleInfo(evalData.topic, subscore.key);
                        }}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {subscore.data.score}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className="h-full bg-zinc-900 dark:bg-zinc-100"
                      style={{ width: `${subscore.data.score}%` }}
                    />
                  </div>

                  {/* Expandable Blurb */}
                  {expandedInfo?.topic === evalData.topic && expandedInfo?.type === subscore.key && (
                    <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
                      {subscore.data.blurb}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <button
          onClick={handleNext}
          disabled={!selectedTopic}
          className="flex items-center gap-2 rounded-xl bg-zinc-900 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Start Writing
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
