'use client';

import { useState } from 'react';
import { Rocket, LayoutGrid } from 'lucide-react';
import ProjectCard, { AddProjectCard } from '../ProjectCard';

interface Project {
  id: string;
  name: string;
  goal: string;
  deadline?: string;
}

interface ProjectsStepProps {
  projects: Project[];
  onUpdate: (projects: Project[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function ProjectsStep({ projects, onUpdate, onContinue, onBack }: ProjectsStepProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addProject = () => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: '',
      goal: '',
      deadline: '',
    };
    onUpdate([...projects, newProject]);
    setEditingId(newProject.id);
  };

  const updateProject = (updatedProject: Project) => {
    onUpdate(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const deleteProject = (id: string) => {
    onUpdate(projects.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleEdit = (project: Project) => {
    if (editingId === project.id) {
      // Save and close
      if (project.name.trim() && project.goal.trim()) {
        setEditingId(null);
      }
    } else {
      setEditingId(project.id);
    }
  };

  const isValid = projects.length >= 1 && projects.every(p => p.name.trim() && p.goal.trim());
  const canAddMore = projects.length < 7;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="heading-2 mb-2 flex items-center justify-center gap-2">
          <Rocket className="w-6 h-6 text-action" />
          Key Projects
        </h1>
        <p className="body text-foreground/60">
          What are the 3-5 major things you're working on?
        </p>
      </div>

      {/* Projects grid */}
      <div className="grid gap-3 mb-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={updateProject}
            onDelete={deleteProject}
            isEditing={editingId === project.id}
          />
        ))}

        {/* Add project button */}
        {canAddMore && (
          <AddProjectCard onClick={addProject} />
        )}
      </div>

      {/* Helper text */}
      <div className="mb-8 p-4 rounded-2xl bg-accent-lavender/10 border border-accent-lavender/20">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-accent-lavender/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-action" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="body-small text-foreground/80 mb-2">
              <strong>Examples of projects:</strong>
            </p>
            <ul className="body-small text-foreground/60 space-y-1">
              <li>• Launch MVP — Ship to first 10 customers by March 2026</li>
              <li>• Raise Pre-Seed — $500k at $5M cap by Q1 2026</li>
              <li>• Build waitlist — 1,000 signups by February 2026</li>
              <li>• Hire first engineer — Full-time by end of Q1</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Linear import suggestion */}
      {projects.length === 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-white border-2 border-dashed border-accent-beige hover:border-action/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-lavender/20 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-action" />
              </div>
              <div>
                <h3 className="font-heading font-medium text-foreground mb-1">
                  Import from Linear
                </h3>
                <p className="body-small text-foreground/60">
                  We found 3 projects in your Linear workspace
                </p>
              </div>
            </div>
            <button className="btn-secondary">
              Import
            </button>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!isValid}
          className="btn-primary px-8 py-3 disabled:opacity-40 disabled:cursor-not-allowed group"
        >
          <span className="flex items-center gap-2">
            Continue
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>

      {/* Validation message */}
      {!isValid && projects.length > 0 && (
        <p className="mt-4 text-center body-small text-foreground/40">
          Please complete all project details to continue
        </p>
      )}

      {projects.length === 0 && (
        <p className="mt-4 text-center body-small text-foreground/40">
          Add at least one project to continue
        </p>
      )}
    </div>
  );
}

