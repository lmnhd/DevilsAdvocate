'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';

interface DebateInputProps {
  onSubmit: (claim: string, length: 'short' | 'medium' | 'long') => void;
  isLoading: boolean;
  externalClaim?: string;
  onClaimChange?: (claim: string) => void;
}

export function DebateInput({ onSubmit, isLoading, externalClaim, onClaimChange }: DebateInputProps) {
  const [claim, setClaim] = useState('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [error, setError] = useState('');

  // Update claim when externalClaim changes
  React.useEffect(() => {
    if (externalClaim && externalClaim !== claim) {
      setClaim(externalClaim);
      setError('');
      // Scroll to the input
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [externalClaim]);

  const characterCount = claim.length;
  const remainingChars = 500 - characterCount;
  const isValid = characterCount >= 10 && characterCount <= 500;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (characterCount < 10) {
      setError('Claim must be at least 10 characters');
      return;
    }

    if (characterCount > 500) {
      setError('Claim cannot exceed 500 characters');
      return;
    }

    setError('');
    onSubmit(claim, length);
  };

  const lengthDetails: Record<'short' | 'medium' | 'long', { tokens: number; label: string }> = {
    short: { tokens: 1000, label: 'Short (≈30s)' },
    medium: { tokens: 2500, label: 'Medium (≈60s)' },
    long: { tokens: 5000, label: 'Long (≈120s)' }
  };

  return (
    <div className="w-5/6 m-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6 ">
        {/* Single Card with Grid Layout */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 items-start">
            {/* Claim Section - Left side (3 columns) */}
            <div className="lg:col-span-3 space-y-2">
              <label htmlFor="claim" className="block text-sm font-semibold text-foreground">
                Enter a Claim to Debate
              </label>
              <textarea
                id="claim"
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                placeholder="Enter a claim to debate..."
                disabled={isLoading}
                rows={6}
                className="w-full h-32 px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
              <div className="flex justify-between items-center text-xs text-foreground-muted">
                <span>{characterCount} / 500 characters</span>
                {!isValid && characterCount > 0 && (
                  <span className="text-destructive">{error}</span>
                )}
              </div>
            </div>

            {/* Debate Length Section - Right side (2 columns) */}
            <div className="lg:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-foreground">
                Debate Length
              </label>
              <div className="grid grid-cols-3 gap-2 h-full">
                {(['short', 'medium', 'long'] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setLength(dur)}
                    disabled={isLoading}
                    className={`px-4 py-3 rounded font-medium text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 ${
                      length === dur
                        ? 'bg-accent text-foreground-primary font-semibold shadow-lg'
                        : 'bg-border text-foreground-muted hover:bg-background-tertiary hover:shadow-md'
                    }`}
                  >
                    <span className="font-semibold text-xs">{lengthDetails[dur].label}</span>
                    <span className="text-xs opacity-80">{lengthDetails[dur].tokens}t</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <Button
            type="submit"
            disabled={isLoading || !isValid}
            className="w-1/3 right-1/2 mx-auto border-2 border-black px-6 py-3 bg-accent text-foreground-primary font-semibold rounded-lg hover:bg-accent hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Debate in Progress...' : 'Start Debate'}
          </Button>
        </div>
      </form>
    </div>
  );
}
