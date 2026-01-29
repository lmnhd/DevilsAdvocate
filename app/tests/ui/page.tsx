'use client';

import { useState, useRef } from 'react';
import { AlertCircle, Loader2, Link2, Square } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
        <div className="mb-8 space-y-1">
          <div className="flex items-baseline gap-3">
            <h1 className="text-4xl font-bold text-foreground">Devil's Advocate</h1>
            <Badge variant="secondary" className="text-xs">Debate Viewer</Badge>
          </div>
          <p className="text-sm text-foreground-muted">Real-time dual-perspective analysis with fact-checking</p>
        </div>

        <Separator className="mb-8 bg-border" />

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/10">
            <div className="p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{error}</p>
            </div>
          </Card>
        )}

        {/* Input Section */}
        <div className="mb-8">
          <DebateInput onSubmit={handleDebateStart} isLoading={debateState.isStreaming} />
        </div>

        {/* Quick Debate Samples */}
        {!debateState.isStreaming && debateState.believerTokens.length === 0 && (
          <div className="mb-8 space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">Quick Start</h2>
              <Separator className="flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SAMPLE_CLAIMS.map((claim, idx) => (
                <Button
                  key={idx}
                  onClick={() => handleQuickDebate(claim)}
                  variant="outline"
                  className="h-auto py-3 px-4 text-left text-sm font-normal text-foreground hover:bg-background-secondary/50 border-border"
                >
                  {claim}
                </Button>
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
            <div className="flex flex-wrap gap-3 justify-between border-t border-border pt-6">
              <Button
                onClick={handleStopDebate}
                disabled={!debateState.isStreaming}
                variant="destructive"
                className="gap-2"
              >
                <Square className="w-4 h-4" />
                Stop Debate
              </Button>
              {!debateState.isStreaming && debateState.believerTokens.length > 0 && (
                <Button
                  onClick={handleCopyLink}
                  className="gap-2 bg-accent hover:bg-accent/90 text-foreground"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Debate Link
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!debateState.isStreaming && debateState.believerTokens.length === 0 && (
          <Card className="border-border/50 bg-background-secondary/30">
            <div className="py-16 px-6 text-center">
              <p className="text-sm text-foreground-muted">
                Enter a claim above or select a quick example to begin
              </p>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
