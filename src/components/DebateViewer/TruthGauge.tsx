'use client';

import { motion } from 'framer-motion';

interface TruthGaugeProps {
  confidence: number; // 0-100
  verdict: string; // Judge's actual verdict text
  isAnimating: boolean;
}

export function TruthGauge({ confidence, verdict, isAnimating }: TruthGaugeProps) {
  // Clamp confidence between 0 and 100
  const clampedConfidence = Math.max(0, Math.min(100, confidence));

  // Determine category based on VERDICT, not just confidence
  let category = 'Contested';
  let categoryColor = '#FBBF24';

  // Map verdict to gauge display
  if (verdict.includes('Supported') && !verdict.includes('Unsupported')) {
    if (clampedConfidence >= 75) {
      category = 'Supported';
      categoryColor = '#10B981'; // Green
    } else if (clampedConfidence >= 50) {
      category = 'Likely';
      categoryColor = '#3B82F6'; // Blue
    } else {
      category = 'Weak Support';
      categoryColor = '#FBBF24'; // Yellow
    }
  } else if (verdict.includes('Unsupported') || verdict.includes('False')) {
    if (clampedConfidence >= 75) {
      category = 'Unsupported';
      categoryColor = '#EF4444'; // Red
    } else if (clampedConfidence >= 50) {
      category = 'Unlikely';
      categoryColor = '#F97316'; // Orange
    } else {
      category = 'Weak Rejection';
      categoryColor = '#FBBF24'; // Yellow
    }
  } else if (verdict.includes('Partially')) {
    if (clampedConfidence >= 75) {
      category = 'Partially Supported';
      categoryColor = '#3B82F6'; // Blue
    } else {
      category = 'Mixed Evidence';
      categoryColor = '#FBBF24'; // Yellow
    }
  } else {
    // Unproven or contested
    category = 'Contested';
    categoryColor = '#FBBF24'; // Yellow
  }

  // Calculate needle rotation (0-100 maps to 0-180 degrees)
  const rotation = (clampedConfidence / 100) * 180 - 90;

  return (
    <motion.div 
      className="w-full flex flex-col items-center justify-center py-8 px-6 bg-background-secondary border border-border rounded-lg"
      animate={isAnimating ? { boxShadow: [
        `inset 0 0 0 1px rgba(${categoryColor === '#EF4444' ? '239, 68, 68' : categoryColor === '#10B981' ? '16, 185, 129' : '251, 191, 36'}, 0.2)`,
        `inset 0 0 20px 2px rgba(${categoryColor === '#EF4444' ? '239, 68, 68' : categoryColor === '#10B981' ? '16, 185, 129' : '251, 191, 36'}, 0.4)`,
        `inset 0 0 0 1px rgba(${categoryColor === '#EF4444' ? '239, 68, 68' : categoryColor === '#10B981' ? '16, 185, 129' : '251, 191, 36'}, 0.2)`
      ] } : {}}
      transition={isAnimating ? { duration: 2, repeat: Infinity } : {}}
    >
      <motion.h3 
        className="text-sm font-semibold text-foreground-muted mb-6 uppercase tracking-wide"
        animate={isAnimating ? { opacity: [0.6, 1, 0.6] } : {}}
        transition={isAnimating ? { duration: 1.5, repeat: Infinity } : {}}
      >
        Confidence Gauge
      </motion.h3>

      {/* Gauge Container */}
      <div className="relative w-64 h-32 flex items-center justify-center">
        {/* Background gauge */}
        <svg width="240" height="120" viewBox="0 0 240 120" className="absolute">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="50%" stopColor="#FBBF24" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Gauge arc */}
          <path
            d="M 20 100 A 100 100 0 0 1 220 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            opacity="0.9"
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = (tick / 100) * Math.PI;
            const x1 = 120 + 105 * Math.cos(angle);
            const y1 = 100 - 105 * Math.sin(angle);
            const x2 = 120 + 115 * Math.cos(angle);
            const y2 = 100 - 115 * Math.sin(angle);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#404040"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {/* Needle */}
        <motion.div
          className="absolute w-1 h-16 bg-foreground rounded-full origin-bottom shadow-lg"
          style={{ 
            bottom: '50%',
            boxShadow: `0 0 10px ${categoryColor}`
          }}
          animate={{ rotate: rotation }}
          transition={{
            duration: isAnimating ? 0.8 : 0,
            ease: 'easeInOut'
          }}
        >
          {/* Needle cap */}
          <motion.div 
            className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-foreground rounded-full"
            animate={isAnimating ? { boxShadow: `0 0 8px ${categoryColor}` } : {}}
            transition={isAnimating ? { duration: 1.5, repeat: Infinity } : {}}
          />
        </motion.div>

        {/* Center circle */}
        <motion.div 
          className="absolute w-6 h-6 bg-background-secondary border-2 border-foreground rounded-full"
          animate={isAnimating ? { boxShadow: `0 0 15px ${categoryColor}` } : {}}
          transition={isAnimating ? { duration: 1.5, repeat: Infinity } : {}}
        />
      </div>

      {/* Stats below gauge */}
      <div className="mt-6 text-center space-y-2">
        <motion.div
          className="text-4xl font-bold"
          style={{ color: categoryColor }}
          animate={{ 
            scale: isAnimating ? [1, 1.08, 1] : 1,
            textShadow: isAnimating ? [
              `0 0 0px ${categoryColor}`,
              `0 0 20px ${categoryColor}`,
              `0 0 0px ${categoryColor}`
            ] : `none`
          }}
          transition={isAnimating ? { duration: 1.5, repeat: Infinity } : {}}
        >
          {clampedConfidence}%
        </motion.div>
        <motion.div 
          className="text-sm font-semibold" 
          style={{ color: categoryColor }}
          animate={isAnimating ? { opacity: [0.8, 1, 0.8] } : {}}
          transition={isAnimating ? { duration: 1.5, repeat: Infinity } : {}}
        >
          {category}
        </motion.div>
      </div>
    </motion.div>
  );
}
