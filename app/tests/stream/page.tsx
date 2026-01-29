'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface StreamedEvidence {
  url: string;
  credibility: number;
  snippet: string;
  domain: string;
  role: 'believer' | 'skeptic';
}

export default function StreamTestPage() {
  const [claim, setClaim] = useState('');
  const [debateLength, setDebateLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [believerTokens, setBelieverTokens] = useState('');
  const [skepticTokens, setSkepticTokens] = useState('');
  const [judge, setJudge] = useState('');
  const [confidence, setConfidence] = useState(50);

  const [evidence, setEvidence] = useState<StreamedEvidence[]>([]);
  const [evidenceSummary, setEvidenceSummary] = useState<{
    total: number;
    byRole: { believer: number; skeptic: number };
  } | null>(null);
  const believerRef = useRef<HTMLDivElement>(null);
  const skepticRef = useRef<HTMLDivElement>(null);

  const demoClaims = [
    'Artificial intelligence will surpass human intelligence within 10 years',
    'Climate change is primarily caused by human activity',
    'Social media has more negative than positive effects on society',
  ];

  const startStreaming = async (inputClaim: string) => {
    if (!inputClaim.trim()) return;

    setStreaming(true);
    setError(null);
    setBelieverTokens('');
    setSkepticTokens('');
    setJudge('');
    setEvidence([]);
    setEvidenceSummary(null);
    setConfidence(50);

    try {
      const response = await fetch('/api/debate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: inputClaim, debateLength }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines[lines.length - 1]; // Keep incomplete message in buffer

        for (let i = 0; i < lines.length - 1; i++) {
          const message = lines[i];
          if (!message.trim()) continue;

          const eventMatch = message.match(/event: (\w+)/);
          const dataMatch = message.match(/data: (.*)/s);

          if (eventMatch && dataMatch) {
            const event = eventMatch[1];
            try {
              const data = JSON.parse(dataMatch[1]);
              console.log('[SSE Event]', event, data);

              if (event === 'believer_token') {
                setBelieverTokens((prev) => prev + data.token);
              } else if (event === 'skeptic_token') {
                setSkepticTokens((prev) => prev + data.token);
              } else if (event === 'believer_evidence') {
                console.log('[Evidence] Believer:', data);
                setEvidence((prev) => [
                  ...prev,
                  { ...data, role: 'believer' as const },
                ]);
              } else if (event === 'skeptic_evidence') {
                console.log('[Evidence] Skeptic:', data);
                setEvidence((prev) => [
                  ...prev,
                  { ...data, role: 'skeptic' as const },
                ]);
              } else if (event === 'judge_complete') {
                console.log('[Judge] Complete:', data);
                setJudge(data.verdict || '');
                setConfidence(data.confidence || 50);
              } else if (event === 'evidence_summary') {
                console.log('[Evidence Summary]', data);
                setEvidenceSummary({
                  total: data.total || 0,
                  byRole: data.byRole || { believer: 0, skeptic: 0 },
                });
              } else if (event === 'error') {
                console.error('[Stream Error]', data.message);
                setError(data.message || 'Unknown error');
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stream failed');
    } finally {
      setStreaming(false);
    }
  };

  useEffect(() => {
    if (believerRef.current) {
      believerRef.current.scrollTop = believerRef.current.scrollHeight;
    }
  }, [believerTokens]);

  useEffect(() => {
    if (skepticRef.current) {
      skepticRef.current.scrollTop = skepticRef.current.scrollHeight;
    }
  }, [skepticTokens]);

  const getCredibilityColor = (score: number) => {
    if (score > 70) return 'text-[#10B981]';
    if (score > 40) return 'text-[#FBBF24]';
    return 'text-[#EF4444]';
  };

  const getCredibilityBg = (score: number) => {
    if (score > 70) return 'bg-[#10B981]/10 border-[#10B981]/40';
    if (score > 40) return 'bg-[#FBBF24]/10 border-[#FBBF24]/40';
    return 'bg-[#EF4444]/10 border-[#EF4444]/40';
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0A0A]">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-b from-[#171717] to-[#0A0A0A] border-b border-[#404040] py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold text-[#FAFAFA] mb-4 tracking-tight">
            Live Debate Stream
          </h1>
          <p className="text-xl md:text-2xl text-[#A3A3A3] leading-relaxed max-w-3xl font-light">
            Watch two AI perspectives clash in real-time. Track evidence sources and witness the judge's verdict unfold as it streams.
          </p>
        </div>
      </div>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-900/40 bg-red-950/20">
            <CardContent className="pt-6">
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Configuration Section */}
        <div className="flex flex-wrap gap-4 mb-10">
          {/* Debate Length Card */}
          <Card className="flex-1 min-w-xs border-[#404040] bg-[#171717]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#FAFAFA] text-lg">Debate Length</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(['short', 'medium', 'long'] as const).map((length) => (
                  <Button
                    key={length}
                    variant={debateLength === length ? 'default' : 'outline'}
                    onClick={() => setDebateLength(length)}
                    disabled={streaming}
                    className="flex-1 text-xs"
                  >
                    {length === 'short' ? '30s' : length === 'medium' ? '60s' : '120s'}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Demo Claims Card */}
          <Card className="flex-1 min-w-xs border-[#404040] bg-[#171717]">
            <CardHeader className="pb-3">
              <CardTitle className="text-[#FAFAFA] text-lg">Quick Start</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {demoClaims.slice(0, 2).map((claim, idx) => (
                  <Button
                    key={idx}
                    onClick={() => startStreaming(claim)}
                    disabled={streaming}
                    variant="outline"
                    className="flex-1 text-xs h-auto py-2 px-2 text-left"
                    title={claim}
                  >
                    <span className="truncate">{claim.substring(0, 20)}...</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Input Card */}
        <Card className="mb-10 border-[#404040] bg-[#171717]">
          <CardHeader className="pb-3">
            <CardTitle className="text-[#FAFAFA] text-lg">Custom Claim</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="text"
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !streaming) {
                    startStreaming(claim);
                  }
                }}
                placeholder="Enter your own claim..."
                disabled={streaming}
                className="bg-[#262626] border-[#404040] text-[#FAFAFA] placeholder:text-[#737373]"
              />
              <Button
                onClick={() => startStreaming(claim)}
                disabled={!claim.trim() || streaming}
                className="bg-[#0EA5E9] hover:bg-[#0284C7]"
              >
                {streaming ? 'Streaming...' : 'Stream'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Streaming Results Grid - Wrapping Layout */}
        <div className="flex flex-wrap gap-4 mb-10">
          {/* Believer Column */}
          <Card className="flex-1 min-w-sm border-[#404040] bg-[#171717] flex flex-col">
            <CardHeader className="pb-3 border-b border-[#404040]">
              <CardTitle className="text-[#FAFAFA] flex items-center gap-2">
                <span className="text-xl">✓</span> Believer
              </CardTitle>
              <CardDescription className="text-[#737373] text-xs">OpenAI GPT-4</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-3">
              <div
                ref={believerRef}
                className="flex-1 overflow-y-auto bg-[#262626] rounded p-3 text-[#E5E5E5] text-sm leading-relaxed border border-[#404040]"
              >
                {streaming && !believerTokens && <span className="text-[#737373]">Waiting for response...</span>}
                {believerTokens}
              </div>
            </CardContent>
          </Card>

          {/* Skeptic Column */}
          <Card className="flex-1 min-w-sm border-[#404040] bg-[#171717] flex flex-col">
            <CardHeader className="pb-3 border-b border-[#404040]">
              <CardTitle className="text-[#FAFAFA] flex items-center gap-2">
                <span className="text-xl">✗</span> Skeptic
              </CardTitle>
              <CardDescription className="text-[#737373] text-xs">Anthropic Claude</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-3">
              <div
                ref={skepticRef}
                className="flex-1 overflow-y-auto bg-[#262626] rounded p-3 text-[#E5E5E5] text-sm leading-relaxed border border-[#404040]"
              >
                {streaming && !skepticTokens && <span className="text-[#737373]">Waiting for response...</span>}
                {skepticTokens}
              </div>
            </CardContent>
          </Card>

          {/* Evidence Tracker */}
          <Card className="flex-1 min-w-sm border-[#404040] bg-[#171717] flex flex-col">
            <CardHeader className="pb-3 border-b border-[#404040]">
              <CardTitle className="text-[#FAFAFA]">Evidence</CardTitle>
              <CardDescription className="text-[#737373] text-xs">
                {evidenceSummary 
                  ? `${evidenceSummary.total} sources`
                  : streaming 
                    ? 'Tracking...' 
                    : 'Waiting for sources'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col pt-3">
              {evidenceSummary && (
                <div className="mb-3 p-2 bg-[#262626] rounded border border-[#404040] text-xs">
                  <div className="flex justify-between text-[#E5E5E5]">
                    <span>Believer: <span className="text-[#0EA5E9] font-semibold">{evidenceSummary.byRole.believer}</span></span>
                    <span>Skeptic: <span className="text-[#EF4444] font-semibold">{evidenceSummary.byRole.skeptic}</span></span>
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-xs">
                {evidence.length === 0 ? (
                  <p className="text-[#737373] text-xs">No evidence yet</p>
                ) : (
                  evidence.map((ev, idx) => (
                    <div key={idx} className={`p-2 rounded border text-xs ${getCredibilityBg(ev.credibility)}`}>
                      <div className="flex items-start justify-between mb-1">
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0EA5E9] hover:text-[#7DD3FC] truncate flex-1 text-xs"
                        >
                          {ev.domain}
                        </a>
                        <Badge
                          className={`ml-2 text-xs ${getCredibilityColor(ev.credibility)}`}
                          variant="outline"
                        >
                          {ev.credibility}%
                        </Badge>
                      </div>
                      <p className="text-[#A3A3A3] line-clamp-2 text-xs">{ev.snippet}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Judge Verdict */}
        {judge && (
          <Card className="border-[#404040] bg-[#171717]">
            <CardHeader className="pb-3 border-b border-[#404040]">
              <CardTitle className="text-[#FAFAFA] flex items-center gap-2">
                <span className="text-xl">⚖️</span> Judge's Verdict
              </CardTitle>
              <CardDescription className="text-[#737373] text-xs">Gemini 2.0 Flash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#E5E5E5] text-sm">Confidence Score</span>
                <Badge className="text-base px-3 py-1 bg-[#0EA5E9] text-[#0A0A0A]">{confidence}%</Badge>
              </div>
              <div className="w-full bg-[#262626] rounded-full h-2 overflow-hidden border border-[#404040]">
                <div
                  className="h-2 rounded-full bg-linear-to-r from-[#EF4444] via-[#FBBF24] to-[#10B981] transition-all duration-500"
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
              <p className="text-[#E5E5E5] leading-relaxed text-sm">{judge}</p>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
