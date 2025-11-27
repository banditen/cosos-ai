'use client';

import { useState } from 'react';
import { Artifact, ArtifactComponent } from '@/types/artifact';
import MetricCard from './MetricCard';
import DataList from './DataList';
import ProgressBarComponent from './ProgressBarComponent';
import InputForm from './InputForm';
import TextBlock from './TextBlock';

interface ArtifactRendererProps {
  artifact: Artifact;
  onDataUpdate?: (artifactId: string, data: Record<string, any>) => void;
  showHeader?: boolean; // Whether to show the artifact title and description
}

export default function ArtifactRenderer({ artifact, onDataUpdate, showHeader = true }: ArtifactRendererProps) {
  console.log('🎨 ArtifactRenderer - artifact:', artifact);
  console.log('🎨 ArtifactRenderer - content:', artifact.content);
  console.log('🎨 ArtifactRenderer - components:', artifact.content?.components);

  const [artifactData, setArtifactData] = useState(artifact.content?.data || {});

  const handleFormSubmit = (componentId: string, formData: Record<string, any>) => {
    // Determine which data collection to update based on component config
    // For now, we'll append to a generic array
    const component = artifact.content?.components?.find(c => c.id === componentId);
    if (!component) return;

    // Update local state
    const updatedData = { ...artifactData };
    
    // If the component has a data key in its config, use that
    // Otherwise, create a generic collection based on component ID
    const dataKey = (component.config as any).dataKey || `${componentId}_items`;
    
    if (!updatedData[dataKey]) {
      updatedData[dataKey] = [];
    }
    
    updatedData[dataKey] = [...updatedData[dataKey], formData];
    setArtifactData(updatedData);

    // Notify parent component
    if (onDataUpdate) {
      onDataUpdate(artifact.id, updatedData);
    }
  };

  const renderComponent = (component: ArtifactComponent) => {
    switch (component.type) {
      case 'MetricCard':
        return <MetricCard config={component.config as any} />;
      
      case 'DataList':
        // Inject actual data from artifactData
        const dataListConfig = component.config as any;
        const dataKey = dataListConfig.dataKey || `${component.id}_items`;
        const items = artifactData[dataKey] || dataListConfig.items || [];
        
        return (
          <DataList 
            config={{
              ...dataListConfig,
              items,
            }} 
          />
        );
      
      case 'ProgressBar':
        return <ProgressBarComponent config={component.config as any} />;
      
      case 'InputForm':
        return (
          <InputForm 
            config={component.config as any}
            onSubmit={(data) => handleFormSubmit(component.id, data)}
          />
        );
      
      case 'TextBlock':
        return <TextBlock config={component.config as any} />;
      
      default:
        return (
          <div className="p-4 border border-destructive rounded-lg text-sm text-destructive">
            Unknown component type: {component.type}
          </div>
        );
    }
  };

  // Check if artifact has valid content structure
  if (!artifact.content || !artifact.content.components || artifact.content.components.length === 0) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="space-y-2">
            <h1 className="heading-2 text-foreground">{artifact.title}</h1>
            {artifact.description && (
              <p className="body text-foreground/70">{artifact.description}</p>
            )}
          </div>
        )}
        <div className="card text-center py-12">
          <p className="body text-foreground/60 mb-2">
            This artifact doesn't have any components yet.
          </p>
          <p className="body-small text-foreground/40">
            {artifact.prompt ? `Generated from: ${artifact.prompt}` : 'Try editing this artifact to add components.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Artifact Header */}
      {showHeader && (
        <div className="space-y-2">
          <h1 className="heading-2 text-foreground">{artifact.title}</h1>
          {artifact.description && (
            <p className="body text-foreground/70">{artifact.description}</p>
          )}
        </div>
      )}

      {/* Render Components */}
      <div className="grid gap-4 md:grid-cols-2">
        {artifact.content.components.map((component) => (
          <div key={component.id} className="w-full">
            {renderComponent(component)}
          </div>
        ))}
      </div>
    </div>
  );
}

