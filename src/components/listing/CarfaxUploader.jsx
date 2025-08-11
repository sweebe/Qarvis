import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, FileText, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CarfaxUploader({ onCarfaxUpload, existingCarfaxUrl = null }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({ type: null, message: "" });
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setIsUploading(true);
      setUploadStatus({ type: null, message: "" });
      const result = await onCarfaxUpload(file);
      setIsUploading(false);
      setUploadStatus({
        type: result.success ? "success" : "error",
        message: result.message
      });
    } else {
      setUploadStatus({ type: "error", message: "Please select a PDF file." });
    }
  };

  return (
    <div className="pt-5 space-y-4 border-t border-slate-200/80">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Vehicle History Report (Optional)
      </h3>
      <p className="text-slate-600 text-sm">
        Upload a PDF of the vehicle's history report (e.g., Carfax). Our AI will analyze it to enhance your listing's credibility.
      </p>

      {existingCarfaxUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Carfax Report Uploaded</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(existingCarfaxUrl, '_blank')}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              View Report
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="outline"
        className="w-full rounded-xl"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing Report...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            {existingCarfaxUrl ? 'Replace PDF Report' : 'Upload PDF Report'}
          </>
        )}
      </Button>

      {uploadStatus.type === "success" && (
        <Alert variant="default" className="bg-emerald-50 border-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700">
            {uploadStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {uploadStatus.type === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {uploadStatus.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}