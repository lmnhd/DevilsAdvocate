'use client';

import { motion } from 'framer-motion';

interface JudgeVerdictProps {
  verdict: string;
  confidence: number;
  riskAssessment: 'low' | 'medium' | 'high';
  harmIfWrong?: string;
  opportunityIfWrong?: string;
  keyFactors?: string[];
  criticalGaps?: string;
}

const riskConfig = {
  low: { color: '#10B981', label: 'Low Risk', bgClass: 'bg-green-950', shadowColor: 'rgba(16, 185, 129, 0.3)' },
  medium: { color: '#FBBF24', label: 'Medium Risk', bgClass: 'bg-amber-950', shadowColor: 'rgba(251, 191, 36, 0.3)' },
  high: { color: '#DC2626', label: 'High Risk', bgClass: 'bg-red-950', shadowColor: 'rgba(220, 38, 38, 0.3)' }
};

export function JudgeVerdict({ verdict, confidence, riskAssessment, harmIfWrong, opportunityIfWrong, keyFactors, criticalGaps }: JudgeVerdictProps) {
  const riskConfig_item = riskConfig[riskAssessment];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
  };

  // Calculate needle rotation and category for gauge
  const clampedConfidence = Math.max(0, Math.min(100, confidence));
  let category = 'Contested';
  let categoryColor = '#FBBF24';
  
  if (clampedConfidence <= 33) {
    category = 'False';
    categoryColor = '#EF4444';
  } else if (clampedConfidence >= 67) {
    category = 'True';
    categoryColor = '#10B981';
  }
  
  const rotation = (clampedConfidence / 100) * 180 - 90;

  return (
    <motion.div 
      className="w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="mb-4">
        <motion.h2 
          className="text-xl font-bold text-[#8B5CF6] uppercase tracking-wider"
          animate={{ letterSpacing: ['0.05em', '0.1em', '0.05em'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ⚖️ Judge Verdict
        </motion.h2>
      </motion.div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Verdict Card */}
        <motion.div 
          className="bg-[#171717] border border-[#404040] rounded-lg p-6 flex flex-col justify-center min-h-[240px]"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-3">
            <motion.p 
              className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wide"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Verdict
            </motion.p>
            <div className="group relative">
              <span className="text-[#737373] cursor-help">ⓘ</span>
              <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-64 p-2 bg-[#262626] border border-[#404040] rounded text-xs text-[#E5E5E5] z-10">
                The judge's conclusion about the claim's validity based on evidence and reasoning from both sides.
              </div>
            </div>
          </div>
          <motion.p 
            className="text-lg italic text-[#FAFAFA] leading-relaxed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {verdict}
          </motion.p>
        </motion.div>

        {/* Confidence Gauge Card */}
        <motion.div 
          className="bg-[#171717] border border-[#404040] rounded-lg p-6 flex flex-col items-center justify-center min-h-[240px]"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-4">
            <motion.h3 
              className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wide"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Confidence Gauge
            </motion.h3>
            <div className="group relative">
              <span className="text-[#737373] cursor-help">ⓘ</span>
              <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-[#262626] border border-[#404040] rounded text-xs text-[#E5E5E5] z-10">
                How confident the judge is that the claim is TRUE. 0-33% = FALSE, 34-66% = UNCERTAIN, 67-100% = TRUE. If verdict is "Unsupported", expect LOW confidence.
              </div>
            </div>
          </div>

          {/* Gauge SVG */}
          <div className="relative w-48 h-24 flex items-center justify-center">
            <svg width="180" height="90" viewBox="0 0 180 90" className="absolute">
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <path
                d="M 15 75 A 75 75 0 0 1 165 75"
                fill="none"
                stroke="url(#gaugeGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                opacity="0.9"
              />
            </svg>

            {/* Needle */}
            <motion.div
              className="absolute w-1 h-12 bg-[#FAFAFA] rounded-full origin-bottom shadow-lg"
              style={{ 
                bottom: '50%',
                transformOrigin: 'bottom center'
              }}
              initial={{ rotate: -90 }}
              animate={{ rotate: rotation }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* Confidence Display */}
          <motion.div 
            className="text-center mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div 
              className="text-3xl font-bold mb-1"
              style={{ color: categoryColor }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {clampedConfidence}%
            </motion.div>
            <motion.div 
              className="text-sm font-semibold"
              style={{ color: categoryColor }}
            >
              {category}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Risk Assessment Card */}
        <motion.div 
          className="bg-[#171717] border border-[#404040] rounded-lg p-6 flex flex-col justify-center min-h-[240px]"
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
          <div className="flex items-center gap-2 mb-3">
            <motion.p 
              className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-wide"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Risk Assessment
            </motion.p>
            <div className="group relative">
              <span className="text-[#737373] cursor-help">ⓘ</span>
              <div className="invisible group-hover:visible absolute bottom-full right-0 mb-2 w-72 p-2 bg-[#262626] border border-[#404040] rounded text-xs text-[#E5E5E5] z-10">
                Measures potential harm if we believe a false claim OR potential missed opportunity if we reject a true claim. Based on real-world consequences, not debate quality.
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <motion.p 
              className="text-2xl font-bold" 
              style={{ color: riskConfig_item.color }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            >
              {riskConfig_item.label}
            </motion.p>
            <motion.div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: riskConfig_item.color }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>

      {/* Real-World Impact Analysis */}
      {(harmIfWrong || opportunityIfWrong || keyFactors || criticalGaps) && (
        <motion.div 
          className="mt-4 bg-[#171717] border border-[#404040] rounded-lg p-6"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-bold text-[#8B5CF6] uppercase tracking-wide">
              🌍 Real-World Impact Analysis
            </h3>
            <div className="group relative">
              <span className="text-[#737373] cursor-help">ⓘ</span>
              <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-80 p-2 bg-[#262626] border border-[#404040] rounded text-xs text-[#E5E5E5] z-10">
                Analysis of real-world consequences if this claim is accepted or rejected incorrectly. Helps understand the practical stakes beyond the debate itself.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Harm if Wrong */}
            {harmIfWrong && (
              <div className="bg-[#0A0A0A] border border-[#DC2626]/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⚠️</span>
                  <h4 className="text-sm font-bold text-[#DC2626] uppercase">Harm if Believed Incorrectly</h4>
                </div>
                <p className="text-sm text-[#E5E5E5] leading-relaxed">{harmIfWrong}</p>
              </div>
            )}

            {/* Opportunity if Wrong */}
            {opportunityIfWrong && (
              <div className="bg-[#0A0A0A] border border-[#10B981]/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💡</span>
                  <h4 className="text-sm font-bold text-[#10B981] uppercase">Opportunity if Rejected Incorrectly</h4>
                </div>
                <p className="text-sm text-[#E5E5E5] leading-relaxed">{opportunityIfWrong}</p>
              </div>
            )}
          </div>

          {/* Key Evidence Factors */}
          {keyFactors && keyFactors.length > 0 && (
            <div className="mt-4 bg-[#0A0A0A] border border-[#8B5CF6]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔑</span>
                <h4 className="text-sm font-bold text-[#8B5CF6] uppercase">Key Evidence Factors</h4>
              </div>
              <ul className="space-y-2">
                {keyFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-[#E5E5E5] flex items-start gap-2">
                    <span className="text-[#8B5CF6] shrink-0">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critical Gaps */}
          {criticalGaps && (
            <div className="mt-4 bg-[#0A0A0A] border border-[#FBBF24]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">❓</span>
                <h4 className="text-sm font-bold text-[#FBBF24] uppercase">Critical Gaps</h4>
              </div>
              <p className="text-sm text-[#E5E5E5] leading-relaxed italic">{criticalGaps}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
