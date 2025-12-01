'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import DebugPanel from '@/components/DebugPanel';
import ArtifactRenderer from '@/components/artifacts/ArtifactRenderer';
import ArtifactActions from '@/components/artifacts/ArtifactActions';
import type { Artifact } from '@/types/artifact';
import { ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notifyArtifactChanged } from '@/lib/events';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Check if user has completed setup
      try {
        await apiClient.onboarding.getContext(user.id);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // No user context, redirect to setup
          router.push('/setup');
          return;
        }
        // For other errors, just continue - don't block the user
        console.warn('Failed to get user context:', error);
      }

      setUser(user);
      await loadArtifacts(user.id);
      setLoading(false);
    };
    loadData();
  }, [router]);

  const loadArtifacts = async (userId: string) => {
    try {
      setError(null);
      const data = await apiClient.artifacts.list(userId);

      // Only show LIVE artifacts on the home page
      // Artifacts become "live" when the user marks them as live after:
      // 1. The spec is complete
      // 2. Required integrations are connected (if any)
      const liveArtifacts = (data.artifacts || []).filter((artifact: Artifact) => {
        return artifact.status === 'live';
      });

      setArtifacts(liveArtifacts);
    } catch (error) {
      console.error('Error loading artifacts:', error);
      setError('Failed to load artifacts. Please try refreshing the page.');
    }
  };

  const handleDataUpdate = async (artifactId: string, data: Record<string, any>) => {
    try {
      await apiClient.artifacts.updateData(artifactId, data);
      // Reload artifacts to get fresh data
      if (user) {
        await loadArtifacts(user.id);
      }
    } catch (error) {
      console.error('Error updating artifact data:', error);
    }
  };

  const handleRename = async (artifactId: string, newTitle: string) => {
    if (!user) return;

    try {
      await apiClient.artifacts.update(artifactId, user.id, { title: newTitle });
      // Reload artifacts to get fresh data
      await loadArtifacts(user.id);
      // Notify sidebar to refresh
      notifyArtifactChanged();
    } catch (error) {
      console.error('Error renaming artifact:', error);
      throw error;
    }
  };

  const handleDelete = async (artifactId: string) => {
    if (!user) return;

    try {
      await apiClient.artifacts.delete(artifactId, user.id);
      // Reload artifacts to get fresh data
      await loadArtifacts(user.id);
      // Notify sidebar to refresh
      notifyArtifactChanged();
    } catch (error) {
      console.error('Error deleting artifact:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-action"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="body text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="heading-2 text-foreground">Welcome to Cosos</h1>
          <p className="body text-foreground/70 mt-2">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Button
          onClick={() => router.push('/artifacts/new')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Artifact
        </Button>
      </div>

      {/* Artifacts Section */}
      {artifacts.length > 0 ? (
        <div className="mt-8 space-y-8">
          {artifacts.map((artifact) => (
            <div key={artifact.id} className="space-y-4">
              {/* Artifact Header */}
              <div className="flex items-center justify-between">
                <h2 className="heading-3 text-foreground">{artifact.title}</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/artifacts/${artifact.id}`)}
                    className="gap-1"
                  >
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <ArtifactActions
                    artifactId={artifact.id}
                    artifactTitle={artifact.title}
                    onRename={(newTitle) => handleRename(artifact.id, newTitle)}
                    onDelete={() => handleDelete(artifact.id)}
                  />
                </div>
              </div>

              {/* Artifact Component */}
              <ArtifactRenderer
                artifact={artifact}
                onDataUpdate={handleDataUpdate}
                showHeader={false}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 card text-center py-8">
          <h2 className="heading-3 mb-2 text-foreground">No Live Artifacts</h2>
          <p className="body text-foreground/60 mb-4">
            Create an artifact and set it live to see it here
          </p>
          <Button
            onClick={() => router.push('/artifacts/new')}
          >
            Create Artifact
          </Button>
        </div>
      )}

      {/* Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
    </div>
  );
}

