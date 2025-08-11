import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

const commonFeatures = [
  "Sunroof", "Heated Seats", "Backup Camera", "Navigation System",
  "Apple CarPlay", "Android Auto", "Bluetooth", "Leather Seats",
  "Third-Row Seating", "Blind Spot Monitoring", "Lane Keep Assist", "Adaptive Cruise Control"
];

export default function FeatureSelector({ selectedFeatures, onFeatureChange }) {
  return (
    <Card className="premium-card rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Vehicle Features
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 mb-4">Select the key features your vehicle has.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {commonFeatures.map(feature => {
            const featureId = feature.toLowerCase().replace(/ /g, '-');
            return (
              <div key={featureId} className="flex items-center space-x-2">
                <Checkbox
                  id={featureId}
                  checked={selectedFeatures.includes(feature)}
                  onCheckedChange={(checked) => onFeatureChange(feature, checked)}
                />
                <Label htmlFor={featureId} className="font-normal text-slate-700 cursor-pointer">
                  {feature}
                </Label>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}