/**
 * Utility functions for dispatching custom events
 */

/**
 * Notify all listeners that an artifact has been changed (created, updated, or deleted)
 */
export function notifyArtifactChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('artifactChanged'));
  }
}

