'use client';

import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  goal: string;
  deadline?: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  isEditing?: boolean;
}

export default function ProjectCard({ project, onEdit, onDelete, isEditing = false }: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (isEditing) {
    return (
      <div className="card border-2 border-action/20 bg-accent-lavender/5">
        <div className="space-y-4">
          <div>
            <label className="block body-small font-medium text-foreground/60 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => onEdit({ ...project, name: e.target.value })}
              className="input"
              placeholder="e.g., Launch MVP"
              autoFocus
            />
          </div>

          <div>
            <label className="block body-small font-medium text-foreground/60 mb-2">
              Goal
            </label>
            <input
              type="text"
              value={project.goal}
              onChange={(e) => onEdit({ ...project, goal: e.target.value })}
              className="input"
              placeholder="e.g., Ship to first 10 customers"
            />
          </div>

          <div>
            <label className="block body-small font-medium text-foreground/60 mb-2">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={project.deadline || ''}
              onChange={(e) => onEdit({ ...project, deadline: e.target.value })}
              className="input"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative card hover:border-action/30 transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit(project)}
    >
      {/* Hover gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-accent-lavender/5 to-transparent rounded-card transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      
      <div className="relative">
        {/* Project emoji/icon */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-lavender/20 flex items-center justify-center text-lg">
              📋
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-medium text-foreground">
                {project.name}
              </h3>
            </div>
          </div>
          
          {/* Delete button - shows on hover */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
            className={`p-2 rounded-lg hover:bg-red-50 text-foreground/40 hover:text-red-600 transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Goal */}
        <p className="body-small text-foreground/60 mb-3">
          {project.goal}
        </p>

        {/* Deadline */}
        {project.deadline && (
          <div className="flex items-center gap-2 body-small text-foreground/40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Target: {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </div>
        )}

        {/* Edit indicator */}
        <div className={`absolute bottom-3 right-3 body-small text-action transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          Edit →
        </div>
      </div>
    </div>
  );
}

export function AddProjectCard({ onClick }: { onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full card border-2 border-dashed border-accent-beige hover:border-action/40 hover:bg-accent-lavender/5 transition-all duration-300 min-h-[140px] flex items-center justify-center group"
    >
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-accent-beige group-hover:bg-action/10 flex items-center justify-center transition-all duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
          <svg className="w-6 h-6 text-foreground/40 group-hover:text-action transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="body font-medium text-foreground/60 group-hover:text-action transition-colors duration-300">
          Add Project
        </span>
      </div>
    </button>
  );
}

