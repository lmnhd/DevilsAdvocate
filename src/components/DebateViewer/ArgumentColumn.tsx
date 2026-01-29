'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ArgumentColumnProps {
  agent: 'believer' | 'skeptic';
  tokens: string[];
  isStreaming: boolean;
}

const agentConfig = {
  believer: {
    color: '#0EA5E9',
    label: 'Believer',
    glowColor: 'rgba(14, 165, 233, 0.5)',
    borderClass: 'border-l-4 border-[#0EA5E9]'
  },
  skeptic: {
    color: '#EF4444',
    label: 'Skeptic',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    borderClass: 'border-l-4 border-[#EF4444]'
  }
};

export function ArgumentColumn({ agent, tokens, isStreaming }: ArgumentColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const config = agentConfig[agent];

  // Auto-scroll to bottom when new tokens arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      // Use setTimeout to ensure DOM has updated before scrolling
      const timer = setTimeout(() => {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [tokens]);

  const fullText = tokens.join('');

  return (
    <div className={`h-full flex flex-col bg-background-secondary rounded-lg ${config.borderClass} overflow-hidden transition-all ${isStreaming ? `shadow-[${config.glowColor}]` : ''}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b border-border flex items-center gap-2 bg-background-tertiary`}>
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: config.color }}
        />
        <h3 className="font-bold text-foreground" style={{ color: config.color }}>
          {config.label}
        </h3>
        {isStreaming && (
          <div className="ml-auto">
            <div className="animate-spin">
              <div className="w-4 h-4 border-2 border-transparent border-t-accent rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin scrollbar-track-background-secondary scrollbar-thumb-border hover:scrollbar-thumb-foreground-muted"
      >
        {fullText ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-foreground leading-relaxed whitespace-pre-wrap"
          >
            {fullText}
          </motion.div>
        ) : (
          <div className="text-foreground-muted italic">
            {isStreaming ? 'Waiting for response...' : 'No arguments yet'}
          </div>
        )}
      </div>

      {/* Footer */}
      {!isStreaming && fullText && (
        <div className="px-4 py-2 border-t border-border text-xs text-foreground-muted bg-background-tertiary">
          Streaming complete
        </div>
      )}
    </div>
  );
}
