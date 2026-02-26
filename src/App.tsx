import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeStep } from './components/HomeStep';
import { TopicsStep } from './components/TopicsStep';
import { EvaluationStep } from './components/EvaluationStep';
import { EditorStep } from './components/EditorStep';
import { Project, TopicEvaluation, Source } from './types';
import { evaluateTopics, generateInitialSources, summarizeSource, checkWriting } from './services/ai';
import { PanelLeftOpen } from 'lucide-react';

type Step = 'home' | 'topics' | 'evaluation' | 'editor';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Loading states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingSources, setIsGeneratingSources] = useState(false);
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Load projects from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('writeright_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
      } catch (e) {
        console.error('Failed to parse projects', e);
      }
    }
  }, []);

  // Save projects to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('writeright_projects', JSON.stringify(projects));
  }, [projects]);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const updateCurrentProject = (updates: Partial<Project>) => {
    if (!currentProjectId) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === currentProjectId ? { ...p, ...updates, updatedAt: Date.now() } : p
      )
    );
  };

  const handleNewProject = () => {
    setCurrentProjectId(null);
    setCurrentStep('home');
  };

  const handleSelectProject = (id: string) => {
    setCurrentProjectId(id);
    const project = projects.find((p) => p.id === id);
    if (project) {
      if (project.selectedTopic) {
        setCurrentStep('editor');
      } else if (project.evaluations.length > 0) {
        setCurrentStep('evaluation');
      } else if (project.topics.length > 0) {
        setCurrentStep('topics');
      } else {
        setCurrentStep('home');
      }
    }
  };

  const handleSubmitSpecs = (specs: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: specs.slice(0, 30) + (specs.length > 30 ? '...' : ''),
      specs,
      topics: [],
      evaluations: [],
      selectedTopic: null,
      sources: [],
      documentText: '',
      updatedAt: Date.now(),
    };
    setProjects((prev) => [newProject, ...prev]);
    setCurrentProjectId(newProject.id);
    setCurrentStep('topics');
  };

  const handleSubmitTopics = async (topics: string[]) => {
    if (!currentProject) return;
    updateCurrentProject({ topics });
    setIsEvaluating(true);
    try {
      const evaluations = await evaluateTopics(currentProject.specs, topics);
      updateCurrentProject({ evaluations });
      setCurrentStep('evaluation');
    } catch (error) {
      console.error('Failed to evaluate topics:', error);
      alert('Failed to evaluate topics. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSelectTopic = async (topic: string) => {
    if (!currentProject) return;
    updateCurrentProject({ selectedTopic: topic });
    setCurrentStep('editor');
    
    // Generate initial sources in the background
    if (currentProject.sources.length === 0) {
      setIsGeneratingSources(true);
      try {
        const initialSources = await generateInitialSources(topic, currentProject.specs);
        const sourcesWithIds = initialSources.map(s => ({ ...s, id: crypto.randomUUID() }));
        updateCurrentProject({ sources: sourcesWithIds });
      } catch (error) {
        console.error('Failed to generate initial sources:', error);
      } finally {
        setIsGeneratingSources(false);
      }
    }
  };

  const handleAddSource = async (url: string) => {
    if (!currentProject || !currentProject.selectedTopic) return;
    setIsAddingSource(true);
    try {
      const summary = await summarizeSource(url, currentProject.selectedTopic);
      const newSource: Source = {
        id: crypto.randomUUID(),
        url,
        ...summary,
      };
      updateCurrentProject({ sources: [...currentProject.sources, newSource] });
    } catch (error) {
      console.error('Failed to add source:', error);
      alert('Failed to summarize source. Please check the URL and try again.');
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleUpdateText = (text: string) => {
    updateCurrentProject({ documentText: text });
  };

  const handleCheckWriting = async () => {
    if (!currentProject || !currentProject.selectedTopic) return '';
    setIsChecking(true);
    try {
      const feedback = await checkWriting(
        currentProject.specs,
        currentProject.selectedTopic,
        currentProject.documentText
      );
      return feedback;
    } catch (error) {
      console.error('Failed to check writing:', error);
      return 'Failed to check writing. Please try again later.';
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Sidebar
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 top-4 z-10 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <PanelLeftOpen className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentStep === 'home' && (
            <HomeStep onSubmitSpecs={handleSubmitSpecs} />
          )}

          {currentStep === 'topics' && currentProject && (
            <TopicsStep
              onSubmitTopics={handleSubmitTopics}
              isEvaluating={isEvaluating}
            />
          )}

          {currentStep === 'evaluation' && currentProject && (
            <EvaluationStep
              evaluations={currentProject.evaluations}
              onSelectTopic={handleSelectTopic}
            />
          )}

          {currentStep === 'editor' && currentProject && currentProject.selectedTopic && (
            <EditorStep
              topic={currentProject.selectedTopic}
              specs={currentProject.specs}
              sources={currentProject.sources}
              documentText={currentProject.documentText}
              onUpdateText={handleUpdateText}
              onAddSource={handleAddSource}
              onCheckWriting={handleCheckWriting}
              isChecking={isChecking}
              isAddingSource={isAddingSource}
            />
          )}
        </div>
      </main>
    </div>
  );
}
