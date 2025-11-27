'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import ArtifactRenderer from '@/components/artifacts/ArtifactRenderer';
import ArtifactActions from '@/components/artifacts/ArtifactActions';
import EditArtifactSidebar from '@/components/artifacts/EditArtifactSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PanelRight } from 'lucide-react';
import { Artifact } from '@/types/artifact';
import { notifyArtifactChanged } from '@/lib/events';

export default function ArtifactViewPage() {
  const router = useRouter();
  const params = useParams();
  const artifactId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEditSidebar, setShowEditSidebar] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }
    setUser(user);
    await loadArtifact(artifactId, user.id);
    setLoading(false);
  };

  const loadArtifact = async (id: string, userId: string) => {
    try {
      setError(null);
      console.log('🔍 Loading artifact:', id);
      const artifact = await apiClient.artifacts.get(id, userId);
      console.log('✅ Artifact loaded:', artifact);
      setArtifact(artifact);
    } catch (error) {
      console.error('❌ Error loading artifact:', error);
      setError('Failed to load artifact. It may not exist or you may not have permission to view it.');
    }
  };

  const handleDataUpdate = async (artifactId: string, data: Record<string, any>) => {
    try {
      // Update artifact data via API
      await apiClient.artifacts.updateData(artifactId, data);

      // Reload artifact to get fresh data
      if (user) {
        await loadArtifact(artifactId, user.id);
      }
    } catch (error) {
      console.error('Error updating artifact data:', error);
    }
  };

  const handleRename = async (newTitle: string) => {
    if (!user || !artifact) return;

    try {
      await apiClient.artifacts.update(artifact.id, user.id, { title: newTitle });
      // Reload artifact to get fresh data
      await loadArtifact(artifact.id, user.id);
      // Notify sidebar to refresh
      notifyArtifactChanged();
    } catch (error) {
      console.error('Error renaming artifact:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!user || !artifact) return;

    try {
      await apiClient.artifacts.delete(artifact.id, user.id);
      // Notify sidebar to refresh
      notifyArtifactChanged();
      // Navigate back to artifacts list
      router.push('/artifacts');
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

  if (error || !artifact) {
    return (
      <div className="text-center py-12">
        <h2 className="heading-2 mb-3 text-foreground">
          {error ? 'Error Loading Artifact' : 'Artifact not found'}
        </h2>
        {error && (
          <p className="body text-foreground/60 mb-4">{error}</p>
        )}
        <Button onClick={() => router.push('/artifacts')} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Artifacts
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className={`flex-1 ${showEditSidebar ? 'mr-[500px] transition-all duration-300' : ''}`}>
        {/* Header with Back Button and Actions */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/artifacts')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Artifacts
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowEditSidebar(!showEditSidebar)}
              className="gap-2"
            >
              Edit
              <PanelRight className="w-4 h-4" />
            </Button>

            <ArtifactActions
              artifactId={artifact.id}
              artifactTitle={artifact.title}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Artifact Renderer */}
        <ArtifactRenderer
          artifact={artifact}
          onDataUpdate={handleDataUpdate}
        />
      </div>

      {/* Edit Sidebar - Fixed Position */}
      {user && showEditSidebar && (
        <div className="fixed right-0 top-0 h-full w-[500px] border-l bg-background z-50">
          <EditArtifactSidebar
            open={showEditSidebar}
            onOpenChange={setShowEditSidebar}
            artifact={artifact}
            userId={user.id}
            onArtifactUpdated={() => loadArtifact(artifactId, user.id)}
          />
        </div>
      )}
    </div>
  );
}

