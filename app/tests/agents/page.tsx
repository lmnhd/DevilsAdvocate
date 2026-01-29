'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 70) return 'text-green-600';
    if (confidence > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence > 70) return 'bg-green-100 text-green-800';
    if (confidence > 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen w-2/3 mx-auto my-8 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-700 dark:to-slate-950 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Agent Debate System</h1>
          <p className="text-slate-400 text-lg">Three-agent debate with believer, skeptic, and judge</p>
        </div>

        {/* Claim Input Card */}
        <Card className="mb-8 border-slate-700 bg-slate-800 dark:bg-slate-950 dark:text-white">
          <CardHeader>
            <CardTitle className="text-white">Start a Debate</CardTitle>
            <CardDescription>Select a demo claim or enter your own to begin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm dark: text-white font-medium text-slate-200">Demo Claims:</p>
              <div className="grid grid-cols-2 gap-8">
                {demoClaims.map((claim, idx) => (
                  <Button
                    key={idx}
                    onClick={() => runDebate(claim)}
                    disabled={state.loading}
                    variant="outline"
                    className="justify-start  bg-black text-left dark:text-white h-auto whitespace-normal py-6 px-6 border-slate-600 hover:bg-red-200"
                  >
                    <span className="font-semibold mr-2">{idx + 1}.</span>
                    <span>{claim}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-slate-600" />

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-200">Custom Claim:</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={state.claim}
                  onChange={(e) => setState((prev) => ({ ...prev, claim: e.target.value }))}
                  placeholder="Enter your own claim..."
                  disabled={state.loading}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
                <Button
                  onClick={() => runDebate(state.claim)}
                  disabled={!state.claim || state.loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {state.loading ? 'Running...' : 'Debate'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {state.error && (
          <Card className="mb-8 border-red-900 bg-red-950">
            <CardHeader>
              <CardTitle className="text-red-200">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-200">{state.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {state.loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 text-lg">Running debate across all agents...</p>
          </div>
        )}

        {/* Debate Results */}
        {state.believerArg && !state.loading && (
          <div className="space-y-6">
            {/* Claim Display */}
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Debate Claim</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-100 text-lg">{state.claim}</p>
              </CardContent>
            </Card>

            {/* Tabs for Arguments */}
            <Tabs defaultValue="believer" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                <TabsTrigger value="believer" className="data-[state=active]:bg-green-600">
                  ✓ Believer
                </TabsTrigger>
                <TabsTrigger value="skeptic" className="data-[state=active]:bg-red-600">
                  ✗ Skeptic
                </TabsTrigger>
                <TabsTrigger value="judge" className="data-[state=active]:bg-indigo-600">
                  ⚖️ Judge
                </TabsTrigger>
              </TabsList>

              {/* Believer Tab */}
              <TabsContent value="believer" className="mt-4">
                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <span className="text-2xl">✓</span> Believer Argument
                      </CardTitle>
                      <Badge className="bg-green-600">OpenAI GPT-4</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">{state.believerArg}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skeptic Tab */}
              <TabsContent value="skeptic" className="mt-4">
                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <span className="text-2xl">✗</span> Skeptic Argument
                      </CardTitle>
                      <Badge className="bg-red-600">Anthropic Claude</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">{state.skepticArg}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Judge Tab */}
              <TabsContent value="judge" className="mt-4">
                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <span className="text-2xl">⚖️</span> Judge Verdict
                      </CardTitle>
                      <Badge className="bg-indigo-600">Gemini 2.0 Flash</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Confidence Gauge */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-200">Confidence in Claim</span>
                        <Badge className={`text-lg px-3 py-1 ${getConfidenceBadgeColor(state.confidence)}`}>
                          {state.confidence}%
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
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

                    <Separator className="bg-slate-600" />

                    {/* Verdict Text */}
                    <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">{state.judgeVerdict}</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Info Box */}
        {!state.believerArg && !state.loading && (
          <Card className="border-blue-900 bg-blue-950">
            <CardContent className="pt-6">
              <p className="text-blue-200">
                Select a demo claim or enter your own to start the debate. The system will generate arguments from three different AI
                perspectives and a neutral judge verdict.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
