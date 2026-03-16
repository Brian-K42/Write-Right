import { MessageSquarePlus, PanelLeftClose, FileText, Trash2 } from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onNewProject: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function Sidebar({ projects, currentProjectId, onSelectProject, onDeleteProject, onNewProject, isOpen, setIsOpen }: SidebarProps) {
  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-zinc-900 text-zinc-300 transition-[width] duration-300 ease-in-out ${
        isOpen ? 'w-64' : 'w-0'
      } md:relative overflow-hidden`}
    >
      <div className="flex h-14 min-w-64 items-center justify-between px-4">
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>New Project</span>
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-md p-1.5 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 min-w-64 overflow-y-auto px-3 py-2">
        <div className="text-xs font-semibold text-zinc-500 mb-3 px-2">Previous Projects</div>
        <div className="space-y-1">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`group flex w-full items-center rounded-md text-sm transition-colors ${
                currentProjectId === project.id
                  ? 'bg-zinc-800 text-white'
                  : 'hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <button
                onClick={() => onSelectProject(project.id)}
                className="flex flex-1 items-center gap-3 px-2 py-2 min-w-0"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate text-left">{project.title || 'Untitled Project'}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProject(project.id);
                }}
                className="shrink-0 rounded-md p-1.5 mr-1 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="px-2 py-3 text-sm text-zinc-500">No projects yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
