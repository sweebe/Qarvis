
import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, Gauge, Building2, User, Fuel } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function VehicleCard({ vehicle, index, isSaved, onSaveToggle, hideSellerLink = false }) {

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage) => {
    return new Intl.NumberFormat('en-US').format(mileage) + ' mi';
  };

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

  const sellerDisplayName = vehicle.contact_info?.dealer_name || (vehicle.seller_type === 'dealer' ? 'Dealer' : 'Private Seller');

  return (
    <motion.div
      layout
      id={`vehicle-card-${vehicle.id}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ 
        y: -8, 
        transition: { duration: 0.3, ease: "easeOut" } 
      }}
      className="premium-card rounded-2xl overflow-hidden flex flex-col h-fit cursor-pointer hover:shadow-2xl transition-shadow duration-300"
    >
      <div className="relative">
        <Link to={createPageUrl(`VehicleDetail?id=${vehicle.id}`)} state={{ from: 'marketplace' }}>
          <div className="aspect-[4/3] relative">
            <img
              src={vehicle.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}
              alt={vehicle.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {vehicle.ai_analysis?.price_fairness && (
              <div className="absolute top-2 left-2">
                <Badge className={`${getPriceBadgeColor(vehicle.ai_analysis.price_fairness)} font-semibold`}>
                  {vehicle.ai_analysis.price_fairness.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </div>
        </Link>
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSaveToggle(vehicle.id)}
            className="bg-black/40 text-white hover:bg-black/60 rounded-full transition-all duration-200 hover:scale-110"
          >
            <Heart className={`w-5 h-5 transition-all ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 md:p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          <Link to={createPageUrl(`VehicleDetail?id=${vehicle.id}`)} state={{ from: 'marketplace' }}>
            <h3 className="font-bold text-lg text-slate-800 hover:text-blue-600 transition-colors truncate">
              {vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            </h3>
          </Link>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 mb-3">
            {formatPrice(vehicle.price)}
          </p>

          <div className="flex justify-between text-sm text-slate-600 border-t border-b border-slate-200/60 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{vehicle.year}</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-slate-500" />
              <span>{formatMileage(vehicle.mileage)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="w-4 h-4 text-slate-500" />
              <span className="capitalize">{vehicle.fuel_type}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200/60">
            <div>
              {!hideSellerLink ? (
                <Link to={createPageUrl(`SellerProfile?email=${vehicle.created_by}`)} className="group">
                  <div className="flex items-center gap-2 text-sm text-slate-600 group-hover:text-blue-600 transition-colors">
                    {vehicle.seller_type === 'dealer' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span className="font-medium truncate">{sellerDisplayName}</span>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {vehicle.seller_type === 'dealer' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <span className="font-medium truncate">{sellerDisplayName}</span>
                </div>
              )}
            </div>
            <Button asChild size="sm" className="premium-button text-white rounded-lg">
              <Link to={createPageUrl(`VehicleDetail?id=${vehicle.id}`)} state={{ from: 'marketplace' }}>
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </motion.div>
  );
}
