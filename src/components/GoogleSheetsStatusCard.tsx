'use client';

import { useState, useEffect } from 'react';

interface GoogleSheetsStatus {
  connected: boolean;
  sheetId?: string;
  error?: string;
  configStatus?: {
    hasSheetId: boolean;
    hasClientEmail: boolean;
    hasPrivateKey: boolean;
  };
}

export default function GoogleSheetsStatusCard() {
  const [status, setStatus] = useState<GoogleSheetsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/sheets/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Error checking Google Sheets status:', error);
        setStatus({
          connected: false,
          error: 'Failed to check status',
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleInitialize = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sheets/init', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh status after initialization
        const statusResponse = await fetch('/api/sheets/status');
        const statusData = await statusResponse.json();
        setStatus(statusData);
      }
    } catch (error) {
      console.error('Error initializing Google Sheets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !status) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Google Sheets Status</p>
            <p className="text-lg font-bold text-gray-900">Checking...</p>
          </div>
          <div className="text-2xl">📊</div>
        </div>
      </div>
    );
  }

  const isConnected = status?.connected || false;
  const hasConfiguration = status?.configStatus?.hasSheetId && 
                          status?.configStatus?.hasClientEmail && 
                          status?.configStatus?.hasPrivateKey;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${
      isConnected ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Google Sheets Integration</p>
          <p className={`text-lg font-bold ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
        <div className="text-2xl">📊</div>
      </div>
      
      <div className="space-y-2">
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isConnected ? 'Data Syncing' : 'Using Mock Data'}
        </div>
        
        {!hasConfiguration && (
          <div className="text-xs text-orange-600 mt-2">
            ⚠️ Configuration incomplete - check environment variables
          </div>
        )}
        
        {status?.error && (
          <div className="text-xs text-red-600 mt-2">
            Error: {status.error}
          </div>
        )}
        
        {status?.sheetId && (
          <div className="text-xs text-gray-500 mt-2">
            Sheet: {status.sheetId.substring(0, 8)}...
          </div>
        )}
      </div>

      {hasConfiguration && !isConnected && (
        <button
          onClick={handleInitialize}
          disabled={isLoading}
          className="mt-3 w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Initializing...' : 'Initialize Sheet'}
        </button>
      )}
      
      {!hasConfiguration && (
        <div className="mt-3 text-xs text-gray-600">
          <a 
            href="/GOOGLE_SHEETS_SETUP.md" 
            target="_blank" 
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Setup Guide
          </a>
        </div>
      )}
    </div>
  );
}