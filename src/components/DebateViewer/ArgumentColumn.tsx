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
    glowColor: 'rgba(14, 165, 233, 0.3)',
    borderClass: 'border-l-4 border-[#0EA5E9]',
    shadowClass: 'shadow-lg shadow-blue-500/20'
  },
  skeptic: {
    color: '#EF4444',
    label: 'Skeptic',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    borderClass: 'border-l-4 border-[#EF4444]',
    shadowClass: 'shadow-lg shadow-red-500/20'
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
    <motion.div
      className={`h-full flex flex-col bg-background-secondary rounded-lg ${config.borderClass} overflow-hidden transition-all duration-300 ${isStreaming ? config.shadowClass : ''}`}
      animate={isStreaming ? { boxShadow: [
        `0 0 0 0 ${config.glowColor}`,
        `0 0 20px 5px ${config.glowColor}`,
        `0 0 0 0 ${config.glowColor}`
      ] } : {}}
      transition={isStreaming ? { duration: 2, repeat: Infinity } : {}}
    >
      {/* Header */}
      <motion.div 
        className={`px-4 py-3 border-b border-border flex items-center gap-2 bg-background-tertiary`}
        animate={isStreaming ? { backgroundColor: `rgba(${agent === 'believer' ? '14, 165, 233' : '239, 68, 68'}, 0.05)` } : {}}
        transition={isStreaming ? { duration: 1.5, repeat: Infinity, repeatType: 'reverse' } : {}}
      >
        <motion.div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: config.color }}
          animate={isStreaming ? { scale: [1, 1.2, 1] } : {}}
          transition={isStreaming ? { duration: 1.5, repeat: Infinity } : {}}
        />
        <h3 className="font-bold text-foreground" style={{ color: config.color }}>
          {config.label}
        </h3>
        {isStreaming && (
          <div className="ml-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-4 h-4 border-2 border-transparent border-t-accent rounded-full" />
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin scrollbar-track-background-secondary scrollbar-thumb-border hover:scrollbar-thumb-foreground-muted"
      >
        {fullText ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-foreground leading-relaxed whitespace-pre-wrap"
          >
            {/* Typewriter effect: render character by character */}
            {fullText.split('').map((char, idx) => (
              <motion.span
                key={idx}
                initial={isStreaming ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ delay: isStreaming ? idx * 0.002 : 0 }}
              >
                {char}
              </motion.span>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            className="text-foreground-muted italic"
            animate={isStreaming ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={isStreaming ? { duration: 1.5, repeat: Infinity } : {}}
          >
            {isStreaming ? 'Waiting for response...' : 'No arguments yet'}
          </motion.div>
        )}
      </div>

      {/* Footer */}
      {!isStreaming && fullText && (
        <motion.div 
          className="px-4 py-2 border-t border-border text-xs text-foreground-muted bg-background-tertiary"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          ✓ Streaming complete
        </motion.div>
      )}
    </motion.div>
  );
}
