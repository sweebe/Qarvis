
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Star, TrendingUp } from "lucide-react"; // AlertTriangle removed

export default function AIAnalysisCard({ analysis }) {
  const getPriceBadgeColor = (fairness) => {
    switch (fairness) {
      case 'excellent_deal':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'good_deal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair_price':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overpriced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getConditionColor = (score) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="premium-card rounded-2xl border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Brain className="w-5 h-5" />
          AI Analysis Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        {analysis.summary && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <p className="text-slate-700 leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Condition Score */}
          {analysis.condition_score && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Condition Score
                </h4>
                <span className={`font-bold text-lg ${getConditionColor(analysis.condition_score)}`}>
                  {analysis.condition_score}/10
                </span>
              </div>
              <Progress value={analysis.condition_score * 10} className="h-2" />
            </div>
          )}

          {/* Price Assessment */}
          {analysis.price_fairness && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Price Assessment
              </h4>
              <Badge className={`${getPriceBadgeColor(analysis.price_fairness)} text-sm font-semibold`}>
                {analysis.price_fairness.replace('_', ' ').toUpperCase()}
              </Badge>
              {analysis.market_comparison && (
                <p className="text-sm text-slate-600">
                  {analysis.market_comparison > 0 ? '+' : ''}
                  {analysis.market_comparison}% vs market average
                </p>
              )}
            </div>
          )}
        </div>

        {/* Image Flags section removed as per instructions */}

        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-600">
            <strong>Note:</strong> This AI analysis is based on image recognition and market data. 
            It should be used as a guide only. Buyers should always inspect vehicles in person.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
