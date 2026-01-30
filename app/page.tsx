'use client';

import { useState, useRef } from 'react';
import { AlertCircle, Loader2, Link2, Square } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DebateInput } from '@/components/DebateViewer/DebateInput';
import { ArgumentColumn } from '@/components/DebateViewer/ArgumentColumn';
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
  debateId: string | null;
  harmIfWrong: string | null;
  opportunityIfWrong: string | null;
  keyFactors: string[];
  criticalGaps: string | null;
}

const SAMPLE_CLAIMS = [
  { text: 'Social media causes more harm than good', emoji: '📱', classes: 'bg-pink-200 hover:bg-pink-300 text-pink-900' },
  { text: 'Remote work is more productive than office work', emoji: '🏠', classes: 'bg-indigo-200 hover:bg-indigo-300 text-indigo-900' },
  { text: 'Cryptocurrency is the future of finance', emoji: '₿', classes: 'bg-yellow-200 hover:bg-yellow-300 text-yellow-900' },
  { text: 'Nuclear energy is essential for fighting climate change', emoji: '⚛️', classes: 'bg-teal-200 hover:bg-teal-300 text-teal-900' },
  { text: 'Genetic engineering should be used to enhance humans', emoji: '🧬', classes: 'bg-rose-200 hover:bg-rose-300 text-rose-900' },
  { text: 'Space exploration is worth the investment', emoji: '🚀', classes: 'bg-purple-200 hover:bg-purple-300 text-purple-900' },
  { text: 'Climate change is primarily caused by human activity', emoji: '🌍', classes: 'bg-emerald-200 hover:bg-emerald-300 text-emerald-900' },
  { text: 'Artificial intelligence will replace most human jobs by 2030', emoji: '🤖', classes: 'bg-sky-200 hover:bg-sky-300 text-sky-900' },
  { text: 'Universal basic income would solve poverty', emoji: '💰', classes: 'bg-amber-200 hover:bg-amber-300 text-amber-900' }
];

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, multimodal flagship' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Affordable small model' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation flagship' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Original GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and affordable' },
  { id: 'o1', name: 'o1', description: 'Advanced reasoning model' },
  { id: 'o1-mini', name: 'o1 Mini', description: 'Faster reasoning model' }
];

const ANTHROPIC_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Most intelligent model' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Fastest model' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Powerful performance' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Fast responses' }
];

export default function HomePage() {
  const [debateState, setDebateState] = useState<DebateState>({
    believerTokens: [],
    skepticTokens: [],
    isStreaming: false,
    evidence: [],
    verdict: null,
    confidence: null,
    riskAssessment: null,
    debateId: null,
    harmIfWrong: null,
    opportunityIfWrong: null,
    keyFactors: [],
    criticalGaps: null,
  });

  const [error, setError] = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<string>('');
  const [currentClaim, setCurrentClaim] = useState<string>('');
  const [activeClaim, setActiveClaim] = useState<string>('');
  const [believerModel, setBelieverModel] = useState('gpt-4o');
  const [skepticModel, setSkepticModel] = useState('claude-3-5-sonnet-20241022');
  const [judgeModel, setJudgeModel] = useState('gpt-4o');
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleDebateStart = async (claim: string, length: 'short' | 'medium' | 'long') => {
    // Close any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setActiveClaim(claim);
    setError(null);
    setDebateState({
      believerTokens: [],
      skepticTokens: [],
      isStreaming: true,
      evidence: [],
      verdict: null,
      confidence: null,
      riskAssessment: null,
      debateId: null,
      harmIfWrong: null,
      opportunityIfWrong: null,
      keyFactors: [],
      criticalGaps: null,
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
          harmIfWrong: data.harmIfWrong || null,
          opportunityIfWrong: data.opportunityIfWrong || null,
          keyFactors: data.keyFactors || [],
          criticalGaps: data.criticalGaps || null,
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

  const handleNewDebate = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setDebateState({
      believerTokens: [],
      skepticTokens: [],
      isStreaming: false,
      evidence: [],
      verdict: null,
      confidence: null,
      riskAssessment: null,
      debateId: null,
      harmIfWrong: null,
      opportunityIfWrong: null,
      keyFactors: [],
      criticalGaps: null,
    });
    setActiveClaim('');
    setSelectedClaim('');
    setCurrentClaim('');
  };

  const handleQuickDebate = (claim: string) => {
    setSelectedClaim(claim);
  };

  const handleSaveDebate = async () => {
    if (!debateState.verdict || debateState.confidence === null) {
      setError('Debate must be complete before saving');
      return;
    }

    try {
      const claim = activeClaim;
      const response = await fetch('/api/debate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim,
          believer_argument: debateState.believerTokens.join(''),
          skeptic_argument: debateState.skepticTokens.join(''),
          judge_verdict: debateState.verdict,
          confidence_score: debateState.confidence,
          believer_strength: debateState.verdict && debateState.verdict.includes('Supported') ? 'Strong' : 'Moderate',
          skeptic_strength: debateState.verdict && debateState.verdict.includes('Unsupported') ? 'Strong' : 'Moderate',
          risk_assessment: debateState.riskAssessment,
          evidence: debateState.evidence.map((e) => ({
            url: e.url,
            domain: e.domain,
            snippet: e.snippet,
            credibility_score: e.credibility_score
          })),
        })
      });

      if (!response.ok) throw new Error('Failed to save debate');
      const result = await response.json();
      setDebateState((prev) => ({ ...prev, debateId: result.debateId }));
      setError(null);
      alert('✅ Debate saved! Debate ID: ' + result.debateId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save debate');
    }
  };

  const handleCopyLink = () => {
    if (debateState.debateId) {
      const url = new URL(window.location.href);
      url.searchParams.set('debateId', debateState.debateId);
      navigator.clipboard.writeText(url.toString()).then(() => {
        alert('Debate link copied to clipboard!');
      });
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      {/* Hero Section */}
      <Card className="w-full  bg-linear-to-b from-[#171717] to-[#0A0A0A] border-b border-[#404040] py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <h1 
          className="text-2xl md:text-3xl font-bold text-[#FAFAFA] mb-4 tracking-tight"
          >
            Devil's Advocate
          </h1>
          <p className="text-lg ml-auto md:text-xl text-[#A3A3A3] leading-relaxed max-w-3xl font-light mb-4">
            Multi-agent fact-checking with real-time dual-perspective debate analysis
          </p>
          <p className="text-sm text-pink-700 p-2 rounded-2xl opacity-80 mx-auto bg-linear-30 from-slate-900 to-55% text-[#dac6c6] max-w-3xl leading-relaxed">
            Watch AI agents argue opposing viewpoints on any claim, with real-time evidence tracking and credibility scoring.
          </p>
        </div>
      </Card>

      <div className="px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {error && (
            <Card className="mb-8 border-red-900/40 bg-red-950/20">
              <div className="p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-[#E5E5E5]">{error}</p>
              </div>
            </Card>
          )}

          {/* INITIAL STATE: Claims + Model Selection */}
          {!debateState.isStreaming && debateState.believerTokens.length === 0 && (
            <>
              {/* Claim Input Section */}
              <div className="mb-6">
                <DebateInput 
                  onSubmit={handleDebateStart} 
                  isLoading={debateState.isStreaming}
                  externalClaim={selectedClaim}
                  onClaimChange={setCurrentClaim}
                />
              </div>

              {/* Two-Column Layout: Start Button + Model Selectors (30% smaller) */}
              <div className="flex gap-6 mb-10 max-w-2xl mx-auto">
                {/* Left: Start Debate Button */}
                <Card className="flex-1 border-[#404040] bg-[#171717] flex items-stretch">
                  <button
                    onClick={() => {
                      const claim = currentClaim || selectedClaim || '';
                      if (claim.length >= 10 && claim.length <= 500) {
                        handleDebateStart(claim, 'medium');
                      }
                    }}
                    disabled={debateState.isStreaming || (!currentClaim && !selectedClaim) || (currentClaim || selectedClaim || '').length < 10}
                    className="w-full flex flex-col items-center justify-center gap-3 px-8 py-8 hover:bg-[#262626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-4xl">▶</div>
                    <span className="text-lg font-semibold text-[#FAFAFA]">
                      {debateState.isStreaming ? 'Debate in Progress...' : 'Start Debate'}
                    </span>
                    <span className="text-xs text-[#737373]">Enter claim above to begin</span>
                  </button>
                </Card>

                {/* Right: Model Selectors Card */}
                <Card className="flex-1 border-[#404040] bg-[#171717] p-5">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[#FAFAFA] uppercase tracking-tight">AI Models</h3>
                    
                    {/* Believer Model */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[#0EA5E9] uppercase tracking-tight">
                        <span>✓</span>
                        Believer
                      </label>
                      <select
                        value={believerModel}
                        onChange={(e) => setBelieverModel(e.target.value)}
                        disabled={debateState.isStreaming}
                        className="w-full px-2.5 py-1.5 bg-[#262626] border border-[#404040] rounded-md text-[#E5E5E5] text-xs focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] disabled:opacity-50"
                      >
                        <optgroup label="OpenAI">
                          {OPENAI_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Anthropic">
                          {ANTHROPIC_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Skeptic Model */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[#EF4444] uppercase tracking-tight">
                        <span>✗</span>
                        Skeptic
                      </label>
                      <select
                        value={skepticModel}
                        onChange={(e) => setSkepticModel(e.target.value)}
                        disabled={debateState.isStreaming}
                        className="w-full px-2.5 py-1.5 bg-[#262626] border border-[#404040] rounded-md text-[#E5E5E5] text-xs focus:outline-none focus:ring-2 focus:ring-[#EF4444] disabled:opacity-50"
                      >
                        <optgroup label="Anthropic">
                          {ANTHROPIC_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="OpenAI">
                          {OPENAI_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Judge Model */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[#8B5CF6] uppercase tracking-tight">
                        <span>⚖️</span>
                        Judge
                      </label>
                      <select
                        value={judgeModel}
                        onChange={(e) => setJudgeModel(e.target.value)}
                        disabled={debateState.isStreaming}
                        className="w-full px-2.5 py-1.5 bg-[#262626] border border-[#404040] rounded-md text-[#E5E5E5] text-xs focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] disabled:opacity-50"
                      >
                        <optgroup label="OpenAI">
                          {OPENAI_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Anthropic">
                          {ANTHROPIC_MODELS.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <p className="text-xs text-[#737373] pt-1">
                      💡 Mix for diverse perspectives
                    </p>
                  </div>
                </Card>
              </div>

              {/* Quick Start Examples - Only show in initial state */}
              <div className="mt-12">
                <h2 className="text-lg font-bold text-[#FAFAFA] mb-6 text-center uppercase tracking-wide">⚡ Quick Start Examples</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {SAMPLE_CLAIMS.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickDebate(example.text)}
                      disabled={debateState.isStreaming}
                      className={`relative overflow-hidden rounded-xl w-full h-48 shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-black/10 ${example.classes}`}
                    >
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                        <span className="text-5xl">{example.emoji}</span>
                        <p className="text-xs font-bold leading-tight text-center px-2">
                          {example.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* DEBATE STATE: Processing + Results */}
          {(debateState.isStreaming || debateState.believerTokens.length > 0) && (
            <div className="space-y-8">
              {/* Active Debate Claim Header */}
              <Card className="border-[#404040] bg-[#171717]/80 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🎯</div>
                  <div className="flex-1">
                    <h2 className="text-xs font-semibold text-[#737373] uppercase tracking-wide mb-2">Active Debate Topic</h2>
                    <p className="text-lg font-semibold text-[#FAFAFA] leading-relaxed">{activeClaim}</p>
                  </div>
                </div>
              </Card>
              {/* Judge Verdict or Streaming Placeholder - Fixed at Top */}
              {debateState.verdict && debateState.confidence !== null ? (
                <div className="bg-[#171717] border border-[#404040] rounded-lg p-6">
                  <JudgeVerdict
                    verdict={debateState.verdict}
                    confidence={debateState.confidence}
                    riskAssessment={debateState.riskAssessment || 'medium'}
                    harmIfWrong={debateState.harmIfWrong || undefined}
                    opportunityIfWrong={debateState.opportunityIfWrong || undefined}
                    keyFactors={debateState.keyFactors}
                    criticalGaps={debateState.criticalGaps || undefined}
                  />
                </div>
              ) : (
                <div className="bg-[#171717] border border-[#404040] rounded-lg p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#8B5CF6] mx-auto mb-3" />
                      <p className="text-sm text-[#A3A3A3]">{debateState.isStreaming ? 'Debate in progress...' : 'Analyzing results...'}</p>
                      <p className="text-xs text-[#737373] mt-1">Judge verdict pending</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dual Columns with Evidence - Fixed Height with Scrolling */}
              <div className="flex flex-wrap gap-4">
                {/* Believer Column */}
                <Card className="flex-1 min-w-sm border-[#404040] bg-[#171717] flex flex-col max-h-[calc(100vh-16rem)]">
                  <div className="p-4 border-b border-[#404040] shrink-0">
                    <h3 className="text-lg font-semibold text-[#FAFAFA]">✓ Believer</h3>
                    <p className="text-xs text-[#737373]">OpenAI GPT-4</p>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <ArgumentColumn
                      agent="believer"
                      tokens={debateState.believerTokens}
                      isStreaming={debateState.isStreaming}
                    />
                  </div>
                </Card>

                {/* Skeptic Column */}
                <Card className="flex-1 min-w-sm border-[#404040] bg-[#171717] flex flex-col max-h-[calc(100vh-16rem)]">
                  <div className="p-4 border-b border-[#404040] shrink-0">
                    <h3 className="text-lg font-semibold text-[#FAFAFA]">✗ Skeptic</h3>
                    <p className="text-xs text-[#737373]">Anthropic Claude</p>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <ArgumentColumn
                      agent="skeptic"
                      tokens={debateState.skepticTokens}
                      isStreaming={debateState.isStreaming}
                    />
                  </div>
                </Card>

                {/* Evidence Panel */}
                <Card className="flex-1 min-w-sm border-[#404040] bg-[#171717] flex flex-col max-h-[calc(100vh-16rem)]">
                  <div className="p-4 border-b border-[#404040] shrink-0">
                    <h3 className="text-lg font-semibold text-[#FAFAFA]">Evidence Sources</h3>
                    <p className="text-xs text-[#737373]">{debateState.evidence.length} sources tracked</p>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    <EvidencePanel evidence={debateState.evidence} />
                  </div>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-between border-t border-[#404040] pt-6">
                <div className="flex gap-3">
                  <Button
                    onClick={handleStopDebate}
                    disabled={!debateState.isStreaming}
                    variant="destructive"
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop Debate
                  </Button>
                  <Button
                    onClick={handleNewDebate}
                    className="gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-[#FAFAFA]"
                  >
                    ← New Debate
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => window.location.href = '/tests/debates'}
                    className="gap-2 bg-[#10B981] hover:bg-[#059669] text-[#FAFAFA]"
                  >
                    📚 View Saved Debates
                  </Button>
                  {!debateState.isStreaming && debateState.believerTokens.length > 0 && (
                    <Button
                      onClick={handleSaveDebate}
                      className="gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-[#0A0A0A]"
                      disabled={!debateState.verdict}
                    >
                      💾 Save Debate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
