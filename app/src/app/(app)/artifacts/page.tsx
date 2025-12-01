'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ArtifactActions from '@/components/artifacts/ArtifactActions';
import { Plus, Sparkles } from 'lucide-react';
import { Artifact } from '@/types/artifact';
import { notifyArtifactChanged } from '@/lib/events';

export default function ArtifactsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

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
    await loadArtifacts(user.id);
    setLoading(false);
  };

  const loadArtifacts = async (userId: string) => {
    try {
      const data = await apiClient.artifacts.list(userId);
      console.log('📦 Artifacts API response:', data);
      console.log('📦 Number of artifacts:', data.artifacts?.length || 0);
      console.log('📦 Artifacts:', data.artifacts);
      setArtifacts(data.artifacts || []);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    }
  };

  const handleCreateNew = () => {
    router.push('/artifacts/new');
  };

  const handleViewArtifact = (artifactId: string) => {
    router.push(`/artifacts/${artifactId}`);
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

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="heading-2 text-foreground">Your Artifacts</h1>
          <p className="body text-foreground/70 mt-2">
            Custom tools and dashboards built for your business
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Create New
        </Button>
      </div>

{/* Artifacts Grid */}
{artifacts.length === 0 ? (
  <Card className="text-center py-12 mt-8">
    <CardContent className="pt-6">
      <Sparkles className="w-12 h-12 mx-auto mb-4 text-action" />
      <h2 className="heading-3 mb-3 text-foreground">No artifacts yet</h2>
      <p className="body text-foreground/70 mb-6 max-w-md mx-auto">
        Create your first artifact by describing what you need.
        Cosos will build a custom tool for you in seconds.
      </p>
      <Button onClick={handleCreateNew} className="gap-2">
        <Plus className="w-4 h-4" />
        Create Your First Artifact
      </Button>
    </CardContent>
  </Card>
) : (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
    {artifacts.map((artifact) => (
      <Card
        key={artifact.id}
        className="hover:shadow-md transition-shadow relative"
      >
        <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
          <ArtifactActions
            artifactId={artifact.id}
            artifactTitle={artifact.title}
            onRename={(newTitle) => handleRename(artifact.id, newTitle)}
            onDelete={() => handleDelete(artifact.id)}
          />
        </div>
        <div className="cursor-pointer" onClick={() => handleViewArtifact(artifact.id)}>
          <CardHeader>
            <CardTitle className="text-lg pr-8">{artifact.title}</CardTitle>
            {artifact.description && (
              <CardDescription className="text-xs line-clamp-2">
                {artifact.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-xs text-foreground/60">
              <span className="capitalize">{artifact.type.replace('_', ' ')}</span>
              <span>
                {new Date(artifact.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </div>
      </Card>
    ))}
  </div>
)}
    </div>
  );
}

