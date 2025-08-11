import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, TrendingUp, Shield, Zap, Brain, Car } from "lucide-react";

export default function FeaturedHero({ onScrollButtonClick }) {
  const getOptimizedImageUrl = (imageUrl, width = 800, height = 600) => {
    // Check if the image is from Unsplash and has common Unsplash parameters
    // If it's Unsplash, we can safely append `&w`, `&h`, `&q`, `&fm`
    if (imageUrl.includes('unsplash.com') && (imageUrl.includes('auto=format') || imageUrl.includes('fit=crop'))) {
      // Remove existing width, height, quality, and format parameters to avoid conflicts
      let optimizedUrl = imageUrl.replace(/&w=\d+/g, '')
                                 .replace(/&h=\d+/g, '')
                                 .replace(/&q=\d+/g, '')
                                 .replace(/&fm=\w+/g, '');
      return `${optimizedUrl}&w=${width}&h=${height}&q=80&fm=webp`;
    }
    // For other image URLs, append parameters carefully
    const separator = imageUrl.includes('?') ? '&' : '?';
    // This is a generic approach; might not work for all CDNs/image services
    // For a robust solution, specific CDN rules (e.g., Cloudinary, Imgix) would be needed
    return `${imageUrl}${separator}w=${width}&h=${height}&q=80&fm=webp`;
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 min-h-screen flex items-center">
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
      
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left">

            {/* Welcome Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 flex justify-center lg:justify-start">

              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Welcome to the Future of Car Shopping
              </Badge>
            </motion.div>
            
            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6">

              <div className="mb-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <div className="text-center lg:text-left">
                  <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-tight">
                    Qarvis
                  </h1>
                  <p className="text-blue-300 font-medium text-base sm:text-lg tracking-wide">
                    AI-Powered Car Marketplace
                  </p>
                </div>
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ededbd0fb_image.png"
                  alt="AI Car Icon" 
                  className="h-16 sm:h-20 w-auto flex-shrink-0" />
              </div>
              
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                Find Your Perfect Car with 
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {" "}Intelligent Insights
                </span>
              </h2>
            </motion.div>
            
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0 px-4 lg:px-0">

              Meet Qarvis, your personal car shopping assistant. Our advanced AI analyzes every vehicle for condition, pricing fairness, and market value, so you can make confident decisions and find amazing deals.
            </motion.p>
            
            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 mb-8 justify-center lg:justify-start">

              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div>
                  <span className="font-semibold block text-sm sm:text-base">AI Vehicle Analysis</span>
                  <span className="text-xs sm:text-sm text-slate-400">Smart condition scoring</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                </div>
                <div>
                  <span className="font-semibold block text-sm sm:text-base">Price Intelligence</span>
                  <span className="text-xs sm:text-sm text-slate-400">Fair deal detection</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                </div>
                <div>
                  <span className="font-semibold block text-sm sm:text-base">Buyer Protection</span>
                  <span className="text-xs sm:text-sm text-slate-400">Verified listings</span>
                </div>
              </div>
            </motion.div>
            
            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="flex justify-center lg:justify-start">

              <Button
                onClick={onScrollButtonClick}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold text-lg sm:text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">

                <Car className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                Start Shopping with Qarvis
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="flex items-center justify-center lg:justify-start gap-4 sm:gap-8 mt-8 pt-8 border-t border-slate-700">

              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">10K+</div>
                <div className="text-xs sm:text-sm text-slate-400">Vehicles Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">95%</div>
                <div className="text-xs sm:text-sm text-slate-400">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                  <span className="text-xl sm:text-2xl font-bold text-white">4.9</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-400">User Rating</div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block">

            <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={getOptimizedImageUrl("https://images.unsplash.com/photo-1549317336-206569e8475c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 800, 600)}
                alt="Luxury Car"
                loading="lazy"
                width="800"
                height="600"
                className="w-full h-full object-cover" />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* AI Analysis Overlay - Enhanced */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="absolute bottom-6 left-6 right-6">

                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-blue-600" />
                      <span className="font-bold text-slate-800">Qarvis AI Analysis</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-slate-800">9.2/10</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Condition Score</span>
                      <span className="font-semibold text-emerald-600">Excellent</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Price Assessment</span>
                      <span className="font-semibold text-blue-600">Great Deal</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Market Position</span>
                      <span className="font-semibold text-purple-600">15% Below Average</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}