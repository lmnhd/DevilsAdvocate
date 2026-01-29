'use client';

import { TruthGauge } from './TruthGauge';

interface JudgeVerdictProps {
  verdict: string;
  confidence: number;
  riskAssessment: 'low' | 'medium' | 'high';
}

const riskConfig = {
  low: { color: '#10B981', label: 'Low Risk', bgClass: 'bg-green-950' },
  medium: { color: '#FBBF24', label: 'Medium Risk', bgClass: 'bg-amber-950' },
  high: { color: '#DC2626', label: 'High Risk', bgClass: 'bg-red-950' }
};

export function JudgeVerdict({ verdict, confidence, riskAssessment }: JudgeVerdictProps) {
  const riskConfig_item = riskConfig[riskAssessment];

  return (
    <div className="w-full bg-background-secondary border-l-4 border-[#8B5CF6] rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold text-[#8B5CF6] uppercase tracking-wider">
          Judge Verdict
        </h2>
      </div>

      {/* Verdict Statement */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground-muted uppercase tracking-wide">
          Verdict
        </p>
        <p className="text-lg italic text-foreground leading-relaxed">
          {verdict}
        </p>
      </div>

      {/* Confidence Gauge */}
      <div>
        <TruthGauge confidence={confidence} isAnimating={true} />
      </div>

      {/* Risk Assessment Badge */}
      <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: riskConfig_item.bgClass }}>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
            Risk Assessment
          </p>
          <p className="text-sm font-bold" style={{ color: riskConfig_item.color }}>
            {riskConfig_item.label}
          </p>
        </div>
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: riskConfig_item.color }}
        />
      </div>
    </div>
  );
}
