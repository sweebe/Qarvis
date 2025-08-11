import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Wrench, 
  ExternalLink,
  Shield,
  Car
} from "lucide-react";

export default function CarfaxInsights({ vehicle }) {
  const { carfax_report_url, ai_analysis } = vehicle;
  const carfaxData = ai_analysis?.carfax_analysis;

  if (!carfax_report_url && !carfaxData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="premium-card rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Vehicle History Report</h3>
            <p className="text-slate-600">
              Ask the seller for a Carfax or similar vehicle history report to learn more about this vehicle's past.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="premium-card rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Shield className="w-5 h-5 text-blue-500" />
            Vehicle History Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Carfax PDF Link */}
          {carfax_report_url && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900">Official Vehicle History Report</h4>
                    <p className="text-sm text-blue-700">Complete Carfax or similar report available</p>
                  </div>
                </div>
                <Button
                  onClick={() => window.open(carfax_report_url, '_blank')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Report
                </Button>
              </div>
            </div>
          )}

          {/* AI Analysis of Carfax Data */}
          {carfaxData && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Key Findings
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* Accidents */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Accidents Reported</span>
                    {carfaxData.accidents_reported === 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {carfaxData.accidents_reported || 0}
                  </div>
                  <Badge className={`${
                    carfaxData.accidents_reported === 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {carfaxData.accidents_reported === 0 ? 'Clean Record' : 'Has Accidents'}
                  </Badge>
                </div>

                {/* Previous Owners */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Previous Owners</span>
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {carfaxData.number_of_owners || 'Unknown'}
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {carfaxData.number_of_owners === 1 ? 'Single Owner' : `${carfaxData.number_of_owners || 'Multiple'} Owner${carfaxData.number_of_owners !== 1 ? 's' : ''}`}
                  </Badge>
                </div>

                {/* Service Records */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Service Records</span>
                    <Wrench className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {carfaxData.service_records || 0}
                  </div>
                  <Badge className={`${
                    (carfaxData.service_records || 0) > 5 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {(carfaxData.service_records || 0) > 5 ? 'Well Maintained' : 'Limited Records'}
                  </Badge>
                </div>

                {/* Title Status */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Title Status</span>
                    {carfaxData.salvage_title ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <div className="text-lg font-bold text-slate-800 mb-1">
                    {carfaxData.salvage_title ? 'Salvage' : 'Clean'}
                  </div>
                  <Badge className={`${
                    carfaxData.salvage_title 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {carfaxData.salvage_title ? 'Salvage Title' : 'Clean Title'}
                  </Badge>
                </div>
              </div>

              {/* Summary */}
              {carfaxData.summary && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h5 className="font-semibold text-slate-800 mb-2">Summary</h5>
                  <p className="text-slate-700 leading-relaxed">{carfaxData.summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-amber-800 mb-1">Important Note</h5>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Vehicle history reports may not include all incidents. Always have the vehicle independently inspected by a qualified mechanic before purchase.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}