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
    if (score > 70) return 'text-green-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCredibilityBg = (score: number) => {
    if (score > 70) return 'bg-green-900/30 border-green-700';
    if (score > 40) return 'bg-yellow-900/30 border-yellow-700';
    return 'bg-red-900/30 border-red-700';
  };

  return (
    <div className="min-h-screen w-full mx-auto my-8 bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Live Debate Stream</h1>
          <p className="text-slate-400">Real-time streaming with evidence tracking</p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 border-slate-700 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white">Start Streaming Debate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">Debate Length:</p>
              <div className="flex gap-2">
                {(['short', 'medium', 'long'] as const).map((length) => (
                  <Button
                    key={length}
                    variant={debateLength === length ? 'default' : 'outline'}
                    onClick={() => setDebateLength(length)}
                    disabled={streaming}
                    className="flex-1"
                  >
                    {length.charAt(0).toUpperCase() + length.slice(1)} ({length === 'short' ? '30s' : length === 'medium' ? '60s' : '120s'})
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-slate-700" />

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">Demo Claims:</p>
              <div className="grid grid-cols-1 gap-2">
                {demoClaims.map((claim, idx) => (
                  <Button
                    key={idx}
                    onClick={() => startStreaming(claim)}
                    disabled={streaming}
                    variant="outline"
                    className="justify-start text-left h-auto whitespace-normal py-4 px-4 border-slate-600 hover:border-blue-500 dark:text-white"
                  >
                    <span className="font-semibold mr-2">{idx + 1}.</span>
                    <span>{claim}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-slate-700" />

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">Custom Claim:</p>
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
                  className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
                <Button
                  onClick={() => startStreaming(claim)}
                  disabled={!claim.trim() || streaming}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {streaming ? 'Streaming...' : 'Stream'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-900 bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-200">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Streaming Area */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Believer Column */}
          <Card className="border-slate-700 bg-slate-900 col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">✓</span> Believer
              </CardTitle>
              <CardDescription>OpenAI GPT-4</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={believerRef}
                className="h-64 overflow-y-auto bg-slate-800 rounded p-4 text-slate-100 text-sm leading-relaxed border border-slate-700"
              >
                {streaming && !believerTokens && <span className="text-slate-400">Waiting for response...</span>}
                {believerTokens}
              </div>
            </CardContent>
          </Card>

          {/* Evidence Sidebar */}
          <Card className="border-slate-700 bg-slate-900 col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Evidence Tracker</CardTitle>
              <CardDescription>
                {evidenceSummary 
                  ? `${evidenceSummary.total} sources tracked`
                  : streaming 
                    ? 'Tracking sources...' 
                    : 'Real-time sources'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evidenceSummary && (
                <div className="mb-3 p-3 bg-slate-800 rounded border border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Believer: <span className="text-blue-400 font-semibold">{evidenceSummary.byRole.believer}</span></span>
                    <span className="text-slate-300">Skeptic: <span className="text-red-400 font-semibold">{evidenceSummary.byRole.skeptic}</span></span>
                  </div>
                </div>
              )}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {evidence.length === 0 ? (
                  <p className="text-slate-400 text-sm">Waiting for evidence...</p>
                ) : (
                  evidence.map((ev, idx) => (
                    <div key={idx} className={`p-3 rounded border ${getCredibilityBg(ev.credibility)}`}>
                      <div className="flex items-start justify-between mb-1">
                        <a
                          href={ev.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-xs truncate flex-1"
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
                      <p className="text-xs text-slate-300 line-clamp-2">{ev.snippet}</p>
                      <Badge className="mt-2 text-xs bg-slate-700" variant="outline">
                        {ev.role}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skeptic Column */}
          <Card className="border-slate-700 bg-slate-900 col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">✗</span> Skeptic
              </CardTitle>
              <CardDescription>Anthropic Claude</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                ref={skepticRef}
                className="h-64 overflow-y-auto bg-slate-800 rounded p-4 text-slate-100 text-sm leading-relaxed border border-slate-700"
              >
                {streaming && !skepticTokens && <span className="text-slate-400">Waiting for response...</span>}
                {skepticTokens}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Judge Verdict */}
        {judge && (
          <Card className="border-slate-700 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span className="text-2xl">⚖️</span> Judge Verdict
              </CardTitle>
              <CardDescription>Gemini 2.0 Flash</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Confidence Score</span>
                <Badge className="text-lg px-3 py-1 bg-blue-900 text-blue-200">{confidence}%</Badge>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-500"
                  style={{ width: `${confidence}%` }}
                ></div>
              </div>
              <Separator className="bg-slate-700" />
              <p className="text-slate-100 leading-relaxed">{judge}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
