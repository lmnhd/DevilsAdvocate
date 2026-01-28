'use client';

import { useState } from 'react';

export default function MCPTestPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runAllTools = async () => {
    if (!input) return;
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/test/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      setResults({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-2">MCP Tools Test Page</h1>
      <p className="text-gray-600 mb-8">Test parallel execution of all 4 verification tools</p>

      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runAllTools()}
          placeholder="Enter claim or URL to verify..."
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={runAllTools}
          disabled={!input || loading}
          className="w-full px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
        >
          {loading ? 'Running All Tools...' : 'Run All Tools'}
        </button>
      </div>

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brave Search */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-blue-600">Brave Search</h2>
            <div className="text-xs text-gray-600 mb-3">
              <p>Cached: {results.brave?.cached ? '✓ Yes' : '✗ No'}</p>
              <p>Rate Limit: {results.brave?.rateLimit?.remaining} remaining</p>
              <p>Status: {results.brave?.error ? `Error: ${results.brave.error}` : 'Success'}</p>
            </div>
            <div className="space-y-2">
              {results.brave?.data?.slice(0, 3).map((r: any, i: number) => (
                <div key={i} className="text-sm">
                  <a href={r.url} className="text-blue-600 hover:underline font-medium" target="_blank" rel="noopener">
                    {r.title}
                  </a>
                  <p className="text-gray-700 text-xs">{r.snippet}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Fact Check */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-green-600">Google Fact Check</h2>
            <div className="text-xs text-gray-600 mb-3">
              <p>Cached: {results.factcheck?.cached ? '✓ Yes' : '✗ No'}</p>
              <p>Rate Limit: {results.factcheck?.rateLimit?.remaining} remaining</p>
              <p>Status: {results.factcheck?.error ? `Error: ${results.factcheck.error}` : 'Success'}</p>
            </div>
            <div className="space-y-2">
              {results.factcheck?.data?.slice(0, 3).map((fc: any, i: number) => (
                <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                  <p className="font-medium">{fc.claim}</p>
                  <p className="text-gray-600">Rating: <span className="font-bold text-orange-600">{fc.rating}</span></p>
                  <p className="text-gray-500 text-xs">{fc.publisher}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Archive */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-purple-600">Archive.org Wayback</h2>
            <div className="text-xs text-gray-600 mb-3">
              <p>Cached: {results.archive?.cached ? '✓ Yes' : '✗ No'}</p>
              <p>Rate Limit: {results.archive?.rateLimit?.remaining} remaining</p>
              <p>Status: {results.archive?.error ? `Error: ${results.archive.error}` : 'Success'}</p>
            </div>
            <div className="space-y-2">
              {results.archive?.data?.slice(0, 3).map((snap: any, i: number) => (
                <div key={i} className="text-sm p-2 bg-gray-50 rounded">
                  <p>Available: {snap.available ? '✓ Yes' : '✗ No'}</p>
                  <p className="text-gray-600 text-xs">{snap.timestamp}</p>
                  {snap.archiveUrl && (
                    <a href={snap.archiveUrl} className="text-blue-600 hover:underline text-xs" target="_blank" rel="noopener">
                      View Archive
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* WHOIS */}
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-red-600">WHOIS Lookup</h2>
            <div className="text-xs text-gray-600 mb-3">
              <p>Cached: {results.whois?.cached ? '✓ Yes' : '✗ No'}</p>
              <p>Rate Limit: {results.whois?.rateLimit?.remaining} remaining</p>
              <p>Status: {results.whois?.error ? `Error: ${results.whois.error}` : 'Success'}</p>
            </div>
            {results.whois?.data && !results.whois.data.error && (
              <div className="text-sm space-y-1">
                <p>Domain: <span className="font-mono">{results.whois.data.domain}</span></p>
                <p>Registrar: {results.whois.data.registrar || 'N/A'}</p>
                <p>Age: {results.whois.data.ageInDays || 0} days</p>
                <p>Credibility: <span className="font-bold">{Math.round(results.whois.data.credibilityScore || 0)}%</span></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
