'use client';

import { motion } from 'framer-motion';
import { TruthGauge } from './TruthGauge';

interface JudgeVerdictProps {
  verdict: string;
  confidence: number;
  riskAssessment: 'low' | 'medium' | 'high';
}

const riskConfig = {
  low: { color: '#10B981', label: 'Low Risk', bgClass: 'bg-green-950', shadowColor: 'rgba(16, 185, 129, 0.3)' },
  medium: { color: '#FBBF24', label: 'Medium Risk', bgClass: 'bg-amber-950', shadowColor: 'rgba(251, 191, 36, 0.3)' },
  high: { color: '#DC2626', label: 'High Risk', bgClass: 'bg-red-950', shadowColor: 'rgba(220, 38, 38, 0.3)' }
};

export function JudgeVerdict({ verdict, confidence, riskAssessment }: JudgeVerdictProps) {
  const riskConfig_item = riskConfig[riskAssessment];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className="w-full bg-background-secondary border-l-4 border-[#8B5CF6] rounded-lg p-6 space-y-6 overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        boxShadow: `0 0 30px ${riskConfig_item.shadowColor}`
      }}
    >
      {/* Header */}
      <motion.div 
        className="border-b border-border pb-4"
        variants={itemVariants}
      >
        <motion.h2 
          className="text-xl font-bold text-[#8B5CF6] uppercase tracking-wider"
          animate={{ letterSpacing: ['0.05em', '0.1em', '0.05em'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚖️ Judge Verdict
        </motion.h2>
      </motion.div>

      {/* Verdict Statement */}
      <motion.div 
        className="space-y-2"
        variants={itemVariants}
      >
        <motion.p 
          className="text-sm font-semibold text-foreground-muted uppercase tracking-wide"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Verdict
        </motion.p>
        <motion.p 
          className="text-lg italic text-foreground leading-relaxed"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {verdict}
        </motion.p>
      </motion.div>

      {/* Confidence Gauge */}
      <motion.div variants={itemVariants}>
        <TruthGauge confidence={confidence} isAnimating={true} />
      </motion.div>

      {/* Risk Assessment Badge */}
      <motion.div 
        className="flex items-center justify-between p-4 rounded-lg overflow-hidden"
        style={{ backgroundColor: riskConfig_item.bgClass }}
        variants={itemVariants}
        animate={{
          boxShadow: [
            `0 0 10px ${riskConfig_item.shadowColor}`,
            `0 0 20px ${riskConfig_item.shadowColor}`,
            `0 0 10px ${riskConfig_item.shadowColor}`
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="space-y-1">
          <motion.p 
            className="text-xs font-semibold text-foreground-muted uppercase tracking-wide"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Risk Assessment
          </motion.p>
          <motion.p 
            className="text-sm font-bold" 
            style={{ color: riskConfig_item.color }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          >
            {riskConfig_item.label}
          </motion.p>
        </div>
        <motion.div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: riskConfig_item.color }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
}
