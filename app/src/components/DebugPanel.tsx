'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import apiClient from '@/lib/api';

export default function DebugPanel() {
  const [user, setUser] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    // Get user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Check API status
    checkApiStatus();
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch (error) {
      setApiStatus('offline');
    }
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      alert('User ID copied to clipboard!');
    }
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 text-sm"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-gray-900">🐛 Debug Panel</h3>
        <button
          onClick={() => setShowPanel(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* API Status */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <div className="text-xs font-medium text-gray-600 mb-1">Backend API</div>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              apiStatus === 'online'
                ? 'bg-green-500'
                : apiStatus === 'offline'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}
          />
          <span className="text-sm">
            {apiStatus === 'online'
              ? '✅ Online'
              : apiStatus === 'offline'
              ? '❌ Offline'
              : '⏳ Checking...'}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">http://localhost:8000</div>
      </div>

      {/* User Info */}
      {user && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <div className="text-xs font-medium text-gray-600 mb-1">User Info</div>
          <div className="text-sm text-gray-900 mb-1">{user.email}</div>
          <div className="flex items-center space-x-2">
            <code className="text-xs bg-gray-200 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
              {user.id}
            </code>
            <button
              onClick={copyUserId}
              className="text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600 mb-1">Quick Actions</div>
        
        <button
          onClick={async () => {
            if (!user) return;
            try {
              const response = await fetch(`http://localhost:8000/api/v1/briefs/generate?user_id=${user.id}`, {
                method: 'POST',
              });
              const data = await response.json();
              console.log('Brief generated:', data);
              alert('Brief generated! Check console for details.');
            } catch (error) {
              console.error('Error:', error);
              alert('Error generating brief. Check console.');
            }
          }}
          className="w-full text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
        >
          🧪 Test Brief Generation
        </button>

        <button
          onClick={async () => {
            if (!user) return;
            try {
              const response = await fetch(`http://localhost:8000/api/v1/auth/google/url?user_id=${user.id}`);
              const data = await response.json();
              console.log('OAuth URL response:', data);
              if (data.url) {
                console.log('Opening OAuth URL:', data.url);
                window.open(data.url, '_blank');
              } else {
                console.error('No URL in response:', data);
                alert('Error: No OAuth URL received. Check console.');
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error getting OAuth URL. Check console.');
            }
          }}
          className="w-full text-xs bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
        >
          🔗 Connect Gmail/Calendar
        </button>

        <button
          onClick={() => {
            console.log('User:', user);
            console.log('API Status:', apiStatus);
            console.log('User ID:', user?.id);
          }}
          className="w-full text-xs bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700"
        >
          📋 Log Debug Info
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
        <div className="text-xs text-blue-800">
          <strong>💡 Tip:</strong> Use the "Test Brief Generation" button to test the API directly.
          Check the browser console (F12) for detailed logs.
        </div>
      </div>
    </div>
  );
}

