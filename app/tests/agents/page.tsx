'use client';

import { useState } from 'react';

interface DebateState {
  claim: string;
  believerArg: string;
  skepticArg: string;
  judgeVerdict: string;
  confidence: number;
  loading: boolean;
  error: string | null;
}

export default function AgentsTestPage() {
  const [state, setState] = useState<DebateState>({
    claim: '',
    believerArg: '',
    skepticArg: '',
    judgeVerdict: '',
    confidence: 50,
    loading: false,
    error: null,
  });

  const demoClaims = [
    'Artificial intelligence will surpass human intelligence within 10 years',
    'Climate change is primarily caused by human activity',
    'Social media has more negative than positive effects on society',
  ];

  const runDebate = async (claim: string) => {
    setState((prev) => ({
      ...prev,
      claim,
      loading: true,
      error: null,
      believerArg: '',
      skepticArg: '',
      judgeVerdict: '',
    }));

    try {
      const response = await fetch('/api/test/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        believerArg: data.believerResponse?.content || 'No response',
        skepticArg: data.skepticResponse?.content || 'No response',
        judgeVerdict: data.judgeResponse?.content || 'No verdict',
        confidence: data.verdict?.confidence || 50,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agent Debate System</h1>
          <p className="text-gray-600">Three-agent debate with believer, skeptic, and judge</p>
        </div>

        {/* Claim Input */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Select or Enter a Claim</h2>
          <div className="space-y-3 mb-4">
            {demoClaims.map((claim, idx) => (
              <button
                key={idx}
                onClick={() => runDebate(claim)}
                disabled={state.loading}
                className="w-full text-left p-3 border-2 border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 transition"
              >
                {idx + 1}. {claim}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={state.claim}
              onChange={(e) => setState((prev) => ({ ...prev, claim: e.target.value }))}
              placeholder="Or enter your own claim..."
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => runDebate(state.claim)}
              disabled={!state.claim || state.loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {state.loading ? 'Running...' : 'Debate'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <p className="text-red-700 font-semibold">Error</p>
            <p className="text-red-600">{state.error}</p>
          </div>
        )}

        {/* Loading State */}
        {state.loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Running debate...</p>
            </div>
          </div>
        )}

        {/* Debate Results */}
        {state.believerArg && !state.loading && (
          <div className="space-y-6">
            {/* Claim Display */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Debate Claim</h2>
              <p className="text-gray-800 text-lg">{state.claim}</p>
            </div>

            {/* Arguments Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Believer Argument */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-green-500 px-6 py-3">
                  <h3 className="text-white font-bold text-lg">✓ Believer Argument</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-3">Provider: OpenAI GPT-4</p>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap">{state.believerArg}</p>
                  </div>
                </div>
              </div>

              {/* Skeptic Argument */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-red-500 px-6 py-3">
                  <h3 className="text-white font-bold text-lg">✗ Skeptic Argument</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500 mb-3">Provider: Anthropic Claude</p>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 whitespace-pre-wrap">{state.skepticArg}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Judge Verdict */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-indigo-600 px-6 py-3">
                <h3 className="text-white font-bold text-lg">⚖️ Judge Verdict</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-3">Provider: Gemini 2.0 Flash</p>

                {/* Confidence Gauge */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">Confidence in Claim</span>
                    <span className="text-lg font-bold text-blue-600">{state.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        state.confidence > 70
                          ? 'bg-green-500'
                          : state.confidence > 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${state.confidence}%` }}
                    ></div>
                  </div>
                </div>

                {/* Verdict Text */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-800 whitespace-pre-wrap">{state.judgeVerdict}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        {!state.believerArg && !state.loading && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-blue-700">
              Select a demo claim or enter your own to start the debate. The system will generate arguments from three different AI
              perspectives.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
