'use client';

import { useState } from 'react';

interface DebateRecord {
  id: string;
  claim: string;
  believer_argument: string;
  skeptic_argument: string;
  judge_verdict: string;
  confidence_score: number;
  status: string;
}

export default function DatabaseTestPage() {
  const [claim, setClaim] = useState('');
  const [queryId, setQueryId] = useState('');
  const [scoreId, setScoreId] = useState('');
  const [newScore, setNewScore] = useState(50);
  const [deleteId, setDeleteId] = useState('');
  const [result, setResult] = useState<string>('');
  const [debates, setDebates] = useState<DebateRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCreateDebate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/db/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim,
          believer_argument: 'Test believer argument supporting the claim.',
          skeptic_argument: 'Test skeptic argument challenging the claim.',
          judge_verdict: 'Test verdict analyzing both sides.',
          confidence_score: 50,
          evidence_sources: [],
          status: 'completed',
        }),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryById = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/db/query?id=${queryId}`);
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListAll = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/db/list');
      const data = await response.json();
      setDebates(data.debates || []);
      setResult(`Found ${data.debates?.length || 0} debates`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/db/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scoreId, confidence_score: newScore }),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/test/db/delete?id=${deleteId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Database Layer Test</h1>

      {/* Create Debate */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create Debate</h2>
        <input
          type="text"
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="Enter claim..."
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleCreateDebate}
          disabled={loading || !claim}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Create Debate
        </button>
      </div>

      {/* Query by ID */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Query Debate by ID</h2>
        <input
          type="text"
          value={queryId}
          onChange={(e) => setQueryId(e.target.value)}
          placeholder="Enter debate ID..."
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleQueryById}
          disabled={loading || !queryId}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Query
        </button>
      </div>

      {/* List All */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">List All Debates</h2>
        <button
          onClick={handleListAll}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          List All
        </button>
        {debates.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Claim
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {debates.map((debate) => (
                  <tr key={debate.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{debate.id}</td>
                    <td className="px-6 py-4 text-sm">{debate.claim}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{debate.confidence_score}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{debate.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Score */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Update Confidence Score</h2>
        <input
          type="text"
          value={scoreId}
          onChange={(e) => setScoreId(e.target.value)}
          placeholder="Enter debate ID..."
          className="w-full p-2 border rounded mb-4"
        />
        <input type="range" min="0" max="100" value={newScore} onChange={(e) => setNewScore(Number(e.target.value))} className="w-full mb-2" />
        <p className="mb-4">New Score: {newScore}</p>
        <button
          onClick={handleUpdateScore}
          disabled={loading || !scoreId}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400"
        >
          Update Score
        </button>
      </div>

      {/* Delete */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Delete Debate</h2>
        <input
          type="text"
          value={deleteId}
          onChange={(e) => setDeleteId(e.target.value)}
          placeholder="Enter debate ID..."
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleDelete}
          disabled={loading || !deleteId}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          Delete
        </button>
      </div>

      {/* Result Display */}
      <div className="p-6 bg-gray-800 text-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Result</h2>
        <pre className="whitespace-pre-wrap break-all text-sm">{result || 'No results yet'}</pre>
      </div>
    </div>
  );
}
