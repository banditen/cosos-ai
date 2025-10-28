'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import Navbar from '@/components/Navbar';
import Loading from '@/components/Loading';
import type { Project, Initiative } from '@/types';

export default function Projects() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewInitiative, setShowNewInitiative] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'active' as 'active' | 'on_hold' | 'completed' | 'archived',
    initiative_id: '',
  });
  const [newInitiative, setNewInitiative] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'active' as 'active' | 'on_hold' | 'completed' | 'archived',
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);
      await loadData(user.id);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadData = async (userId: string) => {
    try {
      const [projectsData, initiativesData] = await Promise.all([
        apiClient.projects.list(userId),
        apiClient.initiatives.list(userId),
      ]);
      setProjects(projectsData);
      setInitiatives(initiativesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCreateProject = async () => {
    if (!user || !newProject.name) return;

    try {
      await apiClient.projects.create(user.id, newProject);
      await loadData(user.id);
      setShowNewProject(false);
      setNewProject({
        name: '',
        description: '',
        priority: 'medium',
        status: 'active',
        initiative_id: '',
      });
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    }
  };

  const handleCreateInitiative = async () => {
    if (!user || !newInitiative.name) return;

    try {
      await apiClient.initiatives.create(user.id, newInitiative);
      await loadData(user.id);
      setShowNewInitiative(false);
      setNewInitiative({
        name: '',
        description: '',
        priority: 'medium',
        status: 'active',
      });
    } catch (error) {
      console.error('Error creating initiative:', error);
      alert('Failed to create initiative');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Projects & Initiatives</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewInitiative(true)}
              className="btn-secondary"
            >
              + New Initiative
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="btn-primary"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* New Initiative Modal */}
        {showNewInitiative && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="card max-w-lg w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Create New Initiative</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={newInitiative.name}
                    onChange={(e) => setNewInitiative({ ...newInitiative, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Product Launch Q2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newInitiative.description}
                    onChange={(e) => setNewInitiative({ ...newInitiative, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="What is this initiative about?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newInitiative.priority}
                      onChange={(e) => setNewInitiative({ ...newInitiative, priority: e.target.value as any })}
                      className="input"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newInitiative.status}
                      onChange={(e) => setNewInitiative({ ...newInitiative, status: e.target.value as any })}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button onClick={handleCreateInitiative} className="btn-primary flex-1">
                    Create Initiative
                  </button>
                  <button onClick={() => setShowNewInitiative(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Project Modal */}
        {showNewProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="card max-w-lg w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Build landing page"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="What needs to be done?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initiative (Optional)</label>
                  <select
                    value={newProject.initiative_id}
                    onChange={(e) => setNewProject({ ...newProject, initiative_id: e.target.value })}
                    className="input"
                  >
                    <option value="">None</option>
                    {initiatives.map((initiative) => (
                      <option key={initiative.id} value={initiative.id}>
                        {initiative.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newProject.priority}
                      onChange={(e) => setNewProject({ ...newProject, priority: e.target.value as any })}
                      className="input"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                      className="input"
                    >
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button onClick={handleCreateProject} className="btn-primary flex-1">
                    Create Project
                  </button>
                  <button onClick={() => setShowNewProject(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Initiatives Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Initiatives</h2>
          {initiatives.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600">No initiatives yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initiatives.map((initiative) => (
                <div key={initiative.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{initiative.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(initiative.priority)}`}>
                      {initiative.priority}
                    </span>
                  </div>
                  {initiative.description && (
                    <p className="text-sm text-gray-600 mb-3">{initiative.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(initiative.status)}`}>
                      {initiative.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {projects.filter(p => p.initiative_id === initiative.id).length} projects
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Projects</h2>
          {projects.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600">No projects yet. Create one to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                      )}
                      {project.initiative_id && (
                        <p className="text-xs text-gray-500">
                          Initiative: {initiatives.find(i => i.id === project.initiative_id)?.name || 'Unknown'}
                        </p>
                      )}
                    </div>
                    {project.progress_percentage !== undefined && (
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-700">{project.progress_percentage}%</div>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${project.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

