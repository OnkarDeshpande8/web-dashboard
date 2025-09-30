'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function SwaggerPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null);

  useEffect(() => {
    // Fetch the swagger spec from our API
    fetch('/api/swagger')
      .then((res) => res.json())
      .then((spec) => setSwaggerSpec(spec))
      .catch((error) => console.error('Error loading Swagger spec:', error));
  }, []);

  if (!swaggerSpec) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading API Documentation...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Flood Detection System</h1>
            </div>
            <div className="flex space-x-4">
              <a 
                href="/" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </a>
              <a 
                href="/swagger" 
                className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                📚 API Docs
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">API Documentation</h2>
        <SwaggerUI spec={swaggerSpec} />
      </div>
    </div>
  );
}