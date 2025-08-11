
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, RotateCcw, Crop } from "lucide-react";
import { motion } from "framer-motion";

export default function ImageCropper({ imageFile, onCropComplete, onCancel }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  const cropSize = 300; // Size of the crop area
  const canvasSize = 400; // Canvas size (larger than crop for padding)

  React.useEffect(() => {
    if (imageFile) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
        
        // Calculate initial scale to fit the smaller dimension to the crop circle
        const minDimension = Math.min(img.width, img.height);
        const initialScale = cropSize / minDimension;
        setScale(initialScale);
        
        // Center the image
        const scaledWidth = img.width * initialScale;
        const scaledHeight = img.height * initialScale;
        setImagePosition({
          x: (canvasSize - scaledWidth) / 2,
          y: (canvasSize - scaledHeight) / 2
        });
        
        setImageLoaded(true);
      };
      img.src = URL.createObjectURL(imageFile);
      imageRef.current = img;
    }
  }, [imageFile]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    // Fix: Add a guard clause to ensure the canvas ref is available before proceeding.
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx || !img || !imageLoaded) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    
    // Draw image
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;
    
    ctx.drawImage(
      img,
      imagePosition.x,
      imagePosition.y,
      scaledWidth,
      scaledHeight
    );
    
    // Draw crop overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Clear the circular crop area
    ctx.globalCompositeOperation = 'destination-out';
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = cropSize / 2;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw crop circle border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
  }, [imageLoaded, imageDimensions, scale, imagePosition]);

  React.useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left - imagePosition.x,
      y: e.clientY - rect.top - imagePosition.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    setImagePosition({
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, scale * scaleChange));
    setScale(newScale);
  };

  const handleReset = () => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const minDimension = Math.min(img.width, img.height);
    const initialScale = cropSize / minDimension;
    setScale(initialScale);
    
    const scaledWidth = img.width * initialScale;
    const scaledHeight = img.height * initialScale;
    setImagePosition({
      x: (canvasSize - scaledWidth) / 2,
      y: (canvasSize - scaledHeight) / 2
    });
  };

  const handleCrop = async () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    if (!canvas || !img) return;

    // Create a new canvas for the cropped result
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d');
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;

    // Calculate the crop area relative to the original image
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const radius = cropSize / 2;
    
    // Save the context
    cropCtx.save();
    
    // Create circular clipping path
    cropCtx.beginPath();
    cropCtx.arc(radius, radius, radius, 0, 2 * Math.PI);
    cropCtx.clip();
    
    // Draw the image portion that's within the crop circle
    const scaledWidth = imageDimensions.width * scale;
    const scaledHeight = imageDimensions.height * scale;
    
    // Calculate the offset from center
    const offsetX = imagePosition.x - (centerX - radius);
    const offsetY = imagePosition.y - (centerY - radius);
    
    cropCtx.drawImage(
      img,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );
    
    // Restore context
    cropCtx.restore();
    
    // Convert to blob and call the callback
    cropCanvas.toBlob((blob) => {
      onCropComplete(blob);
    }, 'image/jpeg', 0.9);
  };

  if (!imageLoaded) {
    return (
      <Card className="premium-card rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading image...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <Card className="premium-card rounded-2xl max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Crop Profile Picture
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              className="border border-slate-200 rounded-lg cursor-move max-w-full h-auto"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            />
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-600">
                • Drag to reposition • Scroll to zoom
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="rounded-lg"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              className="flex-1 premium-button text-white rounded-xl"
            >
              <Crop className="w-4 h-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
