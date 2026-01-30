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
  const clampedConfidence = Math.max(0, Math.min(100, confidence));

  // Determine verdict styling and explanatory text
  const getVerdictDisplay = () => {
    if (verdict.includes('Supported') && !verdict.includes('Unsupported')) {
      return {
        icon: '🟢',
        label: 'SUPPORTED BY EVIDENCE',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
        explanation: `The judge determined that the evidence presented favors the claim's validity.`,
      };
    } else if (verdict.includes('Unsupported')) {
      return {
        icon: '🔴',
        label: 'UNSUPPORTED BY EVIDENCE',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        explanation: `The judge determined that the evidence does NOT adequately support this claim.`,
      };
    } else if (verdict.includes('Partially')) {
      return {
        icon: '🟡',
        label: 'PARTIALLY SUPPORTED',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        explanation: `The judge found some supporting evidence, but significant gaps or counterevidence remain.`,
      };
    } else {
      return {
        icon: '⚪',
        label: 'UNPROVEN / INSUFFICIENT EVIDENCE',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30',
        explanation: `The judge could not determine validity due to insufficient or contradictory evidence.`,
      };
    }
  };

  const verdictDisplay = getVerdictDisplay();

  // Generate confidence explanation
  const getConfidenceExplanation = () => {
    const verdictType = verdict.includes('Unsupported') ? 'lacks sufficient supporting evidence' :
                        verdict.includes('Supported') ? 'is supported by the evidence' :
                        'has insufficient evidence to determine validity';
    
    if (confidence >= 80) {
      return `The judge is highly confident (${confidence}%) that the claim ${verdictType}.`;
    } else if (confidence >= 60) {
      return `The judge is moderately confident (${confidence}%) that the claim ${verdictType}.`;
    } else if (confidence >= 40) {
      return `The judge is somewhat uncertain (${confidence}% confidence) about whether the claim ${verdictType}.`;
    } else {
      return `The judge has low confidence (${confidence}%) in this assessment due to contradictory or insufficient evidence.`;
    }
  };

  // Confidence bar segments
  const confidenceSegments = Math.round(confidence / 5); // 20 segments total

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

  return (
    <motion.div 
      className="w-full space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-bold text-[#E5E5E5] flex items-center gap-3 uppercase tracking-wider">
          <span className="text-2xl">⚖️</span>
          Judge's Final Verdict
        </h2>
      </motion.div>

      {/* Verdict Section */}
      <motion.div 
        className={`p-6 rounded-lg border ${verdictDisplay.bgColor} ${verdictDisplay.borderColor} min-h-[120px] flex flex-col justify-center`}
        variants={itemVariants}
      >
        <p className="text-xs font-semibold text-[#A3A3A3] mb-3 uppercase tracking-wider">
          📋 Verdict
        </p>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl">{verdictDisplay.icon}</span>
          <span className={`text-2xl font-bold ${verdictDisplay.color}`}>
            {verdictDisplay.label}
          </span>
        </div>
        <p className="text-sm text-[#D4D4D4] leading-relaxed">
          {verdictDisplay.explanation}
        </p>
      </motion.div>

      {/* Confidence Section with Visual Gauge */}
      <motion.div variants={itemVariants} className="bg-[#0A0A0A] border border-[#404040] rounded-lg p-6">
        <p className="text-xs font-semibold text-[#A3A3A3] mb-6 uppercase tracking-wider">
          🎯 Judge's Confidence in This Assessment
        </p>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Visual Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-24 flex items-center justify-center mb-4">
              {/* Background gauge SVG */}
              <svg width="180" height="90" viewBox="0 0 240 120" className="absolute w-full h-full">
                <defs>
                  <linearGradient id="judgeGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="50%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                  <filter id="judgeGaugeGlow">
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
                  stroke="url(#judgeGaugeGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  filter="url(#judgeGaugeGlow)"
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
              <div
                className="absolute w-1 h-12 bg-[#FAFAFA] rounded-full origin-bottom shadow-lg"
                style={{ 
                  bottom: '50%',
                  transform: `rotateZ(${(confidence / 100) * 180 - 90}deg)`,
                  boxShadow: `0 0 10px ${confidence >= 67 ? '#10B981' : confidence >= 33 ? '#FBBF24' : '#EF4444'}`
                }}
              >
                {/* Needle cap */}
                <div 
                  className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-2.5 h-2.5 bg-[#FAFAFA] rounded-full"
                  style={{
                    boxShadow: `0 0 8px ${confidence >= 67 ? '#10B981' : confidence >= 33 ? '#FBBF24' : '#EF4444'}`
                  }}
                />
              </div>

              {/* Center circle */}
              <div 
                className="absolute w-5 h-5 bg-[#0A0A0A] border-2 border-[#FAFAFA] rounded-full"
                style={{
                  boxShadow: `0 0 12px ${confidence >= 67 ? '#10B981' : confidence >= 33 ? '#FBBF24' : '#EF4444'}`
                }}
              />
            </div>
            
            {/* Confidence Percentage Display */}
            <div className="text-center">
              <div className="text-3xl font-bold mb-1" style={{
                color: confidence >= 67 ? '#10B981' : confidence >= 33 ? '#FBBF24' : '#EF4444'
              }}>
                {confidence}%
              </div>
              <div className="text-xs font-semibold text-[#A3A3A3]">
                {confidence >= 80 ? 'Very High' : confidence >= 60 ? 'High' : confidence >= 40 ? 'Moderate' : 'Low'}
              </div>
            </div>
          </div>

          {/* Right: Confidence Explanation */}
          <div className="flex flex-col justify-center">
            <p className="text-sm text-[#D4D4D4] leading-relaxed">
              {getConfidenceExplanation()}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Real-World Impact Analysis */}
      {(harmIfWrong || opportunityIfWrong || keyFactors || criticalGaps) && (
        <motion.div 
          className="bg-[#0A0A0A] border border-[#404040] rounded-lg p-6 space-y-6"
          variants={itemVariants}
        >
          <h3 className="text-lg font-bold text-[#8B5CF6] uppercase tracking-wide flex items-center gap-2">
            <span>🌍</span>
            Real-World Impact Analysis
          </h3>

          {/* Harm if Wrong */}
          {harmIfWrong && (
            <div className="bg-[#171717] border border-[#DC2626]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚠️</span>
                <h4 className="text-sm font-bold text-[#DC2626] uppercase tracking-wide">If we accept this claim and it's wrong</h4>
              </div>
              <p className="text-sm text-[#D4D4D4] leading-relaxed ml-8">
                <span className="font-semibold text-[#E5E5E5]">Potential Harm:</span> {harmIfWrong}
              </p>
            </div>
          )}

          {/* Opportunity if Wrong */}
          {opportunityIfWrong && (
            <div className="bg-[#171717] border border-[#10B981]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">💡</span>
                <h4 className="text-sm font-bold text-[#10B981] uppercase tracking-wide">If we reject this claim and it's actually true</h4>
              </div>
              <p className="text-sm text-[#D4D4D4] leading-relaxed ml-8">
                <span className="font-semibold text-[#E5E5E5]">Missed Opportunity:</span> {opportunityIfWrong}
              </p>
            </div>
          )}

          {/* Key Evidence Factors */}
          {keyFactors && keyFactors.length > 0 && (
            <div className="bg-[#171717] border border-[#8B5CF6]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔑</span>
                <h4 className="text-sm font-bold text-[#8B5CF6] uppercase tracking-wide">Key Evidence Factors</h4>
              </div>
              <ul className="space-y-2 ml-8">
                {keyFactors.map((factor, idx) => (
                  <li key={idx} className="text-sm text-[#D4D4D4] flex items-start gap-3">
                    <span className="text-[#8B5CF6] shrink-0 mt-1">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critical Gaps */}
          {criticalGaps && (
            <div className="bg-[#171717] border border-[#FBBF24]/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">❓</span>
                <h4 className="text-sm font-bold text-[#FBBF24] uppercase tracking-wide">Critical Gaps in Evidence</h4>
              </div>
              <p className="text-sm text-[#D4D4D4] leading-relaxed ml-8 italic">{criticalGaps}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
