'use client';

import { useState } from 'react';

interface DebateInputProps {
  onSubmit: (claim: string, length: 'short' | 'medium' | 'long') => void;
  isLoading: boolean;
}

export function DebateInput({ onSubmit, isLoading }: DebateInputProps) {
  const [claim, setClaim] = useState('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [error, setError] = useState('');

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
    <div className="w-full bg-background border border-border rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="claim" className="block text-sm font-semibold text-foreground">
            Enter a Claim to Debate
          </label>
          <textarea
            id="claim"
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Enter a claim to debate..."
            disabled={isLoading}
            className="w-full h-32 px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          <div className="flex justify-between items-center text-xs text-foreground-muted">
            <span>{characterCount} / 500 characters</span>
            {!isValid && characterCount > 0 && (
              <span className="text-destructive">{error}</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">
            Debate Length
          </label>
          <div className="flex gap-2">
            {(['short', 'medium', 'long'] as const).map((dur) => (
              <button
                key={dur}
                type="button"
                onClick={() => setLength(dur)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  length === dur
                    ? 'bg-accent text-foreground-primary font-semibold'
                    : 'bg-border text-foreground-muted hover:bg-background-tertiary'
                }`}
              >
                {lengthDetails[dur].label}
                <br />
                <span className="text-xs">{lengthDetails[dur].tokens} tokens</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !isValid}
          className="w-full px-6 py-3 bg-accent text-foreground-primary font-semibold rounded-lg hover:bg-accent hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Debate in Progress...' : 'Start Debate'}
        </button>
      </form>
    </div>
  );
}
