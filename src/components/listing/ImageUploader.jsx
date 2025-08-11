
import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, X, Image as ImageIcon, ChevronUp, ChevronDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ImageUploader({ images, onImageUpload, isAnalyzing, onRemoveImage, onReorderImages }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      onImageUpload(files);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      onImageUpload(files);
    }
  };

  const moveImage = (currentIndex, direction) => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Check bounds
    if (targetIndex < 0 || targetIndex >= images.length) return;

    // Swap images
    [newImages[currentIndex], newImages[targetIndex]] = [newImages[targetIndex], newImages[currentIndex]];

    onReorderImages(newImages);
  };

  const getImageLabel = (index) => {
    const labels = ["Front", "Left", "Back", "Right"];
    return labels[index] || `Photo ${index + 1}`;
  };

  const getOptimizedImageUrl = (imageUrl, width = 400, height = 300) => {
    if (!imageUrl) return imageUrl;

    // If it's an Unsplash image, optimize it
    if (imageUrl.includes('unsplash.com')) {
      return `${imageUrl}&w=${width}&h=${height}&q=80&fm=webp`;
    }

    // For uploaded images, add optimization parameters that can be handled by image CDNs
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}w=${width}&h=${height}&q=80&fm=webp`;
  };

  return (
    <Card className="premium-card rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Vehicle Photos
          {isAnalyzing && (
            <div className="ml-auto flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              <span className="text-sm">AI Analyzing...</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors duration-300"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Upload Vehicle Photos
              </h3>
              <p className="text-slate-600 mb-4">
                Add multiple high-quality photos. First four will be labeled as Front, Left, Back, Right for AI analysis.
              </p>

              <Button
                onClick={() => fileInputRef.current?.click()}
                className="premium-button text-white rounded-xl"
                disabled={isAnalyzing}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Choose Photos
              </Button>
            </div>

            <p className="text-xs text-slate-500">
              Drag and drop photos here or click to browse
            </p>
          </div>
        </div>

        {/* Uploaded Images */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800">
                Uploaded Photos ({images.length})
              </h4>
              <p className="text-sm text-slate-500">
                Use arrows to reorder • First 4 used for AI analysis
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence>
                {images.map((image, index) => (
                  <motion.div
                    key={`${image}-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      index === 0 ? 'border-yellow-400 shadow-lg' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-[4/3] relative">
                      <img
                        src={getOptimizedImageUrl(image, 400, 300)}
                        alt={`Vehicle photo ${index + 1}`}
                        loading="lazy"
                        width="400"
                        height="300"
                        className="w-full h-full object-cover"
                      />

                      {/* Main Thumbnail Badge */}
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2">
                          <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm">
                            Main Photo
                          </div>
                        </div>
                      )}

                      {/* Image Label */}
                      <div className="absolute top-2 left-2">
                        <div className={`text-white text-xs px-2 py-1 rounded-md font-medium shadow-sm ${
                          index < 4
                            ? 'bg-blue-500'
                            : 'bg-slate-500'
                        }`}>
                          {getImageLabel(index)}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <Button
                        onClick={() => onRemoveImage(index)}
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600/90 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Position Controls */}
                    <div className="p-3 bg-white border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          Position {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            onClick={() => moveImage(index, 'up')}
                            disabled={index === 0}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg disabled:opacity-50"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => moveImage(index, 'down')}
                            disabled={index === images.length - 1}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg disabled:opacity-50"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Processing images...</span>
              <span className="text-blue-600">AI Analysis in progress</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}

        {/* Updated Tips */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h5 className="font-semibold text-blue-800 mb-2">Photo Tips</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Upload in this order for best AI analysis: Front, Left Side, Back, Right Side</li>
            <li>• Use arrow buttons to reorder photos - first 4 positions get AI analysis</li>
            <li>• The first photo becomes your main listing thumbnail</li>
            <li>• Take photos in good lighting (preferably daylight)</li>
            <li>• Include interior, engine bay, and odometer shots after the main four</li>
            <li>• Show any damage or wear honestly</li>
            <li>• Clean the vehicle before photographing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
