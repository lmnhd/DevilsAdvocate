'use client';

import { useState, useRef } from 'react';
import { DebateInput } from '@/components/DebateViewer/DebateInput';
import { ArgumentColumn } from '@/components/DebateViewer/ArgumentColumn';
import { TruthGauge } from '@/components/DebateViewer/TruthGauge';
import { JudgeVerdict } from '@/components/DebateViewer/JudgeVerdict';
import { EvidencePanel } from '@/components/DebateViewer/EvidencePanel';
import { TrackedEvidence } from '@/lib/evidence/tracker';

interface DebateState {
  believerTokens: string[];
  skepticTokens: string[];
  isStreaming: boolean;
  evidence: TrackedEvidence[];
  verdict: string | null;
  confidence: number | null;
  riskAssessment: 'low' | 'medium' | 'high' | null;
}

const SAMPLE_CLAIMS = [
  'Climate change is primarily caused by human activity',
  'Artificial Intelligence will replace human workers within 20 years',
  'Social media is harmful to mental health'
];

export default function UITestPage() {
  const [debateState, setDebateState] = useState<DebateState>({
    believerTokens: [],
    skepticTokens: [],
    isStreaming: false,
    evidence: [],
    verdict: null,
    confidence: null,
    riskAssessment: null
  });

  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleDebateStart = async (claim: string, length: 'short' | 'medium' | 'long') => {
    setError(null);
    setDebateState({
      believerTokens: [],
      skepticTokens: [],
      isStreaming: true,
      evidence: [],
      verdict: null,
      confidence: null,
      riskAssessment: null
    });

    try {
      const params = new URLSearchParams({
        claim,
        debateLength: length
      });

      const eventSource = new EventSource(`/api/debate/stream?${params}`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('believer_token', (event) => {
        const data = JSON.parse(event.data);
        setDebateState((prev) => ({
          ...prev,
          believerTokens: [...prev.believerTokens, data.token]
        }));
      });

      eventSource.addEventListener('skeptic_token', (event) => {
        const data = JSON.parse(event.data);
        setDebateState((prev) => ({
          ...prev,
          skepticTokens: [...prev.skepticTokens, data.token]
        }));
      });

      eventSource.addEventListener('believer_evidence', (event) => {
        const data = JSON.parse(event.data);
        setDebateState((prev) => {
          const existingEvidence = prev.evidence.find((e) => e.url === data.url);
          if (existingEvidence) {
            return {
              ...prev,
              evidence: prev.evidence.map((e) =>
                e.url === data.url
                  ? { ...e, mentioned_by: 'both' as const }
                  : e
              )
            };
          }
          return {
            ...prev,
            evidence: [
              ...prev.evidence,
              {
                id: Math.random().toString(36).substr(2, 9),
                url: data.url,
                domain: new URL(data.url).hostname,
                snippet: data.snippet || 'No snippet available',
                credibility_score: data.credibility || 50,
                mentioned_by: 'believer' as const,
                first_mentioned_at: new Date(),
                source_type: 'unknown' as const
              }
            ]
          };
        });
      });

      eventSource.addEventListener('skeptic_evidence', (event) => {
        const data = JSON.parse(event.data);
        setDebateState((prev) => {
          const existingEvidence = prev.evidence.find((e) => e.url === data.url);
          if (existingEvidence) {
            return {
              ...prev,
              evidence: prev.evidence.map((e) =>
                e.url === data.url
                  ? { ...e, mentioned_by: 'both' as const }
                  : e
              )
            };
          }
          return {
            ...prev,
            evidence: [
              ...prev.evidence,
              {
                id: Math.random().toString(36).substr(2, 9),
                url: data.url,
                domain: new URL(data.url).hostname,
                snippet: data.snippet || 'No snippet available',
                credibility_score: data.credibility || 50,
                mentioned_by: 'skeptic' as const,
                first_mentioned_at: new Date(),
                source_type: 'unknown' as const
              }
            ]
          };
        });
      });

      eventSource.addEventListener('judge_complete', (event) => {
        const data = JSON.parse(event.data);
        setDebateState((prev) => ({
          ...prev,
          verdict: data.verdict,
          confidence: data.confidence,
          riskAssessment: data.riskAssessment || 'medium',
          isStreaming: false
        }));
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.addEventListener('error', (event) => {
        setError('Failed to connect to debate stream');
        setDebateState((prev) => ({
          ...prev,
          isStreaming: false
        }));
        eventSource.close();
        eventSourceRef.current = null;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start debate';
      setError(message);
      setDebateState((prev) => ({
        ...prev,
        isStreaming: false
      }));
    }
  };

  const handleStopDebate = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setDebateState((prev) => ({
      ...prev,
      isStreaming: false
    }));
  };

  const handleQuickDebate = (claim: string) => {
    handleDebateStart(claim, 'medium');
  };

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    const encodedClaim = encodeURIComponent(debateState.believerTokens.join('').substring(0, 100));
    url.searchParams.set('claim', encodedClaim);
    navigator.clipboard.writeText(url.toString()).then(() => {
      alert('Debate link copied to clipboard!');
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Devil's Advocate</h1>
          <p className="text-foreground-muted">Multi-agent debate viewer - 2D UI test</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive bg-opacity-10 border border-destructive rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Input Section */}
        <div className="mb-8">
          <DebateInput onSubmit={handleDebateStart} isLoading={debateState.isStreaming} />
        </div>

        {/* Quick Debate Samples */}
        {!debateState.isStreaming && debateState.believerTokens.length === 0 && (
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Quick Start Examples</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SAMPLE_CLAIMS.map((claim, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickDebate(claim)}
                  className="px-4 py-3 bg-background-secondary border border-border rounded-lg text-sm text-foreground hover:bg-background-tertiary transition-colors text-left"
                >
                  {claim}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Debate Content */}
        {(debateState.isStreaming || debateState.believerTokens.length > 0) && (
          <div className="space-y-8">
            {/* Dual Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-96">
              <ArgumentColumn
                agent="believer"
                tokens={debateState.believerTokens}
                isStreaming={debateState.isStreaming}
              />
              <ArgumentColumn
                agent="skeptic"
                tokens={debateState.skepticTokens}
                isStreaming={debateState.isStreaming}
              />
            </div>

            {/* Truth Gauge - Show after some streaming has occurred */}
            {(debateState.confidence !== null || debateState.isStreaming) && (
              <TruthGauge
                confidence={debateState.confidence || 50}
                isAnimating={debateState.isStreaming}
              />
            )}

            {/* Judge Verdict - Show only after streaming completes */}
            {debateState.verdict && debateState.confidence !== null && (
              <JudgeVerdict
                verdict={debateState.verdict}
                confidence={debateState.confidence}
                riskAssessment={debateState.riskAssessment || 'medium'}
              />
            )}

            {/* Evidence Panel */}
            <EvidencePanel evidence={debateState.evidence} />

            {/* Action Buttons */}
            <div className="flex gap-3 justify-between">
              <button
                onClick={handleStopDebate}
                disabled={!debateState.isStreaming}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Stop Debate
              </button>
              {!debateState.isStreaming && debateState.believerTokens.length > 0 && (
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-accent text-foreground-primary rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Copy Debate Link
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!debateState.isStreaming && debateState.believerTokens.length === 0 && (
          <div className="text-center py-16 text-foreground-muted">
            <p>Enter a claim above or select a quick example to begin</p>
          </div>
        )}
      </div>
    </main>
  );
}
