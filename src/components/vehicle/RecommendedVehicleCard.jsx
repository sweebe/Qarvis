
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function RecommendedVehicleCard({ vehicle }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getOptimizedImageUrl = (imageUrl, width = 80, height = 64) => {
    if (!imageUrl) return "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=64&q=80";
    
    // If it's an Unsplash image, optimize it
    if (imageUrl.includes('unsplash.com')) {
      return `${imageUrl}&w=${width}&h=${height}&q=80&fm=webp`;
    }
    
    // For other images, add optimization parameters
    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}w=${width}&h=${height}&q=80&fm=webp`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="block border-t border-slate-200/60 pt-3 text-slate-800"
    >
      <Link to={createPageUrl(`VehicleDetail?id=${vehicle.id}`)} className="flex items-center gap-3">
        <img 
          src={getOptimizedImageUrl(vehicle.images?.[0], 80, 64)} 
          alt={vehicle.title}
          loading="lazy"
          width="80"
          height="64"
          className="w-20 h-16 object-cover rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{vehicle.title}</p>
          <p className="text-sm">{formatPrice(vehicle.price)}</p>
        </div>
      </Link>
    </motion.div>
  );
}
