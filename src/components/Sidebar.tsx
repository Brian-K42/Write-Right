import { MessageSquarePlus, PanelLeftClose, PanelLeftOpen, FileText } from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ projects, currentProjectId, onSelectProject, onNewProject, isOpen, setIsOpen }: SidebarProps) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-zinc-900 text-zinc-300 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 -translate-x-full'
      } md:relative md:translate-x-0`}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>New Project</span>
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-md p-1.5 hover:bg-zinc-800 hover:text-white md:hidden"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="text-xs font-semibold text-zinc-500 mb-3 px-2">Previous Projects</div>
        <div className="space-y-1">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                currentProjectId === project.id
                  ? 'bg-zinc-800 text-white'
                  : 'hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate text-left">{project.title || 'Untitled Project'}</span>
            </button>
          ))}
          {projects.length === 0 && (
            <div className="px-2 py-3 text-sm text-zinc-500">No projects yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
