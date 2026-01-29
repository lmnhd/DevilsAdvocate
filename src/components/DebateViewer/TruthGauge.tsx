'use client';

import { motion } from 'framer-motion';

interface TruthGaugeProps {
  confidence: number; // 0-100
  isAnimating: boolean;
}

export function TruthGauge({ confidence, isAnimating }: TruthGaugeProps) {
  // Clamp confidence between 0 and 100
  const clampedConfidence = Math.max(0, Math.min(100, confidence));

  // Determine verdict category and color
  let category = 'Contested';
  let categoryColor = '#FBBF24';

  if (clampedConfidence <= 33) {
    category = 'False';
    categoryColor = '#EF4444';
  } else if (clampedConfidence >= 67) {
    category = 'True';
    categoryColor = '#10B981';
  }

  // Calculate needle rotation (0-100 maps to 0-180 degrees)
  const rotation = (clampedConfidence / 100) * 180 - 90;

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 px-6 bg-background-secondary border border-border rounded-lg">
      <h3 className="text-sm font-semibold text-foreground-muted mb-6 uppercase tracking-wide">
        Confidence Gauge
      </h3>

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
          </defs>
          {/* Gauge arc */}
          <path
            d="M 20 100 A 100 100 0 0 1 220 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
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
          className="absolute w-1 h-16 bg-foreground rounded-full origin-bottom"
          style={{ bottom: '50%' }}
          animate={{ rotate: rotation }}
          transition={{
            duration: isAnimating ? 0.5 : 0,
            ease: 'easeInOut'
          }}
        >
          {/* Needle cap */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-foreground rounded-full" />
        </motion.div>

        {/* Center circle */}
        <div className="absolute w-6 h-6 bg-background-secondary border-2 border-foreground rounded-full" />
      </div>

      {/* Stats below gauge */}
      <div className="mt-6 text-center space-y-2">
        <motion.div
          className="text-4xl font-bold"
          style={{ color: categoryColor }}
          animate={{ scale: isAnimating ? 1.05 : 1 }}
        >
          {clampedConfidence}%
        </motion.div>
        <div className="text-sm font-semibold" style={{ color: categoryColor }}>
          {category}
        </div>
      </div>
    </div>
  );
}
