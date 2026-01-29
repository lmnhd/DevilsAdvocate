'use client';

import { useState } from 'react';
import { TrackedEvidence } from '@/lib/evidence/tracker';

interface EvidencePanelProps {
  evidence: TrackedEvidence[];
}

const credibilityConfig = (score: number) => {
  if (score > 70) {
    return { emoji: '🟢', label: 'High', color: '#10B981', bgClass: 'bg-green-950' };
  } else if (score >= 40) {
    return { emoji: '🟡', label: 'Medium', color: '#FBBF24', bgClass: 'bg-amber-950' };
  } else {
    return { emoji: '🔴', label: 'Low', color: '#DC2626', bgClass: 'bg-red-950' };
  }
};

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Sort evidence by credibility score descending
  const sortedEvidence = [...evidence].sort((a, b) => b.credibility_score - a.credibility_score);

  return (
    <div className="w-full bg-background-secondary border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-background-tertiary transition-colors border-b border-border"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Evidence Sources
          </h3>
          <span className="px-2 py-1 bg-border text-foreground-muted text-xs font-semibold rounded-full">
            {sortedEvidence.length}
          </span>
        </div>
        <div className={`text-foreground-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-track-background-secondary scrollbar-thumb-border hover:scrollbar-thumb-foreground-muted">
          {sortedEvidence.length === 0 ? (
            <div className="px-6 py-8 text-center text-foreground-muted italic">
              No evidence tracked during debate
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedEvidence.map((item) => {
                const cred = credibilityConfig(item.credibility_score);
                return (
                  <div key={item.id} className="px-6 py-4 hover:bg-background-tertiary transition-colors space-y-2">
                    {/* Domain and credibility */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-accent hover:underline"
                        >
                          {item.domain}
                        </a>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              item.mentioned_by === 'believer'
                                ? 'bg-blue-950 text-blue-400 border border-blue-700'
                                : item.mentioned_by === 'skeptic'
                                ? 'bg-red-950 text-red-400 border border-red-700'
                                : 'bg-purple-950 text-purple-400 border border-purple-700'
                            }`}
                          >
                            {item.mentioned_by === 'believer' ? '✓ Believer' : item.mentioned_by === 'skeptic' ? '✗ Skeptic' : 'Both'}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 ${cred.bgClass}`}
                        style={{ color: cred.color }}
                      >
                        <span>{cred.emoji}</span>
                        <span>{item.credibility_score}%</span>
                      </div>
                    </div>

                    {/* Snippet */}
                    <p className="text-xs text-foreground-muted line-clamp-2 italic">
                      "{item.snippet}"
                    </p>

                    {/* Visit link */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs font-semibold text-accent hover:underline"
                    >
                      Visit Source →
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
