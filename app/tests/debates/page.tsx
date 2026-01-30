'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function DebateHistoryPage() {
  const [debates, setDebates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDebateId, setSelectedDebateId] = useState('');
  const [selectedDebate, setSelectedDebate] = useState<any>(null);
  const [debateIdInput, setDebateIdInput] = useState('');

  const fetchRecentDebates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debates?limit=10');
      const result = await response.json();
      if (result.success) {
        setDebates(result.data);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to fetch debates: ' + (error instanceof Error ? error.message : 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDebateById = async () => {
    if (!debateIdInput.trim()) {
      alert('Please enter a debate ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/debates/${encodeURIComponent(debateIdInput)}`);
      const result = await response.json();
      if (result.success) {
        setSelectedDebate(result.data);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Failed to fetch debate: ' + (error instanceof Error ? error.message : 'unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">📚 Debate History</h1>

      {/* Recent Debates Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Debates</CardTitle>
          <CardDescription>View the last 10 completed debates</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchRecentDebates} disabled={loading}>
            {loading ? 'Loading...' : 'Load Recent Debates'}
          </Button>

          {debates.length > 0 && (
            <div className="mt-6 space-y-4">
              {debates.map((debate) => (
                <div
                  key={debate.debateId}
                  className="border rounded-lg p-4 hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setSelectedDebate(debate);
                  }}
                >
                  <h3 className="font-semibold text-lg mb-2">{debate.claim}</h3>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Verdict: {debate.verdict}</span>
                    <span>Confidence: {debate.confidence}%</span>
                    <span>
                      {new Date(debate.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search by ID Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search Debate by ID</CardTitle>
          <CardDescription>Enter a debate ID to view its details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter debate ID (UUID)"
              value={debateIdInput}
              onChange={(e) => setDebateIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchDebateById()}
            />
            <Button onClick={fetchDebateById} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Debate Details */}
      {selectedDebate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{selectedDebate.claim}</CardTitle>
            <CardDescription>
              Created: {new Date(selectedDebate.createdAt).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Verdict Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Judge's Verdict</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verdict</p>
                  <p className="text-xl font-bold">{selectedDebate.verdict}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Confidence Score</p>
                  <p className="text-xl font-bold">{selectedDebate.confidence}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Believer Strength</p>
                  <p className="text-lg">{selectedDebate.believerStrength || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Skeptic Strength</p>
                  <p className="text-lg">{selectedDebate.skepticStrength || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-2">Risk Assessment</h3>
              <p className="text-lg font-semibold">{selectedDebate.riskAssessment || 'Medium'}</p>
            </div>

            {/* Arguments Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Arguments</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">👤 Believer's Argument</h4>
                  <div className="bg-blue-50 p-4 rounded text-sm max-h-[200px] overflow-y-auto">
                    {selectedDebate.believerArgument || 'No argument recorded'}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🤨 Skeptic's Argument</h4>
                  <div className="bg-red-50 p-4 rounded text-sm max-h-[200px] overflow-y-auto">
                    {selectedDebate.skepticArgument || 'No argument recorded'}
                  </div>
                </div>
              </div>
            </div>

            {/* Evidence Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Evidence</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">
                    👤 Believer Evidence ({selectedDebate.believerEvidence?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedDebate.believerEvidence && selectedDebate.believerEvidence.length > 0 ? (
                      selectedDebate.believerEvidence.map((ev: any, i: number) => (
                        <div key={i} className="text-sm bg-blue-50 p-2 rounded">
                          <p className="font-medium">{ev.domain}</p>
                          <p className="text-xs text-gray-600 truncate">{ev.url}</p>
                          <p className="text-xs">
                            Credibility: {Math.round(ev.credibility_score)}%
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No evidence recorded</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">
                    🤨 Skeptic Evidence ({selectedDebate.skepticEvidence?.length || 0})
                  </h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedDebate.skepticEvidence && selectedDebate.skepticEvidence.length > 0 ? (
                      selectedDebate.skepticEvidence.map((ev: any, i: number) => (
                        <div key={i} className="text-sm bg-red-50 p-2 rounded">
                          <p className="font-medium">{ev.domain}</p>
                          <p className="text-xs text-gray-600 truncate">{ev.url}</p>
                          <p className="text-xs">
                            Credibility: {Math.round(ev.credibility_score)}%
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No evidence recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t pt-4 text-sm text-gray-600">
              <p>Debate ID: <code className="bg-gray-100 px-2 py-1 rounded">{selectedDebate.debateId}</code></p>
              <p>Status: {selectedDebate.status}</p>
              <p>Updated: {new Date(selectedDebate.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
