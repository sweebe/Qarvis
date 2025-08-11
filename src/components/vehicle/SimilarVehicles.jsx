import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Vehicle } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Gauge } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SimilarVehicles({ currentVehicle }) {
  const [similarVehicles, setSimilarVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSimilarVehicles();
  }, [currentVehicle]);

  const loadSimilarVehicles = async () => {
    try {
      const allVehicles = await Vehicle.list("-created_date");
      
      // Filter for similar vehicles (same make, similar year range, different ID)
      const similar = allVehicles
        .filter(v => 
          v.id !== currentVehicle.id &&
          v.status === 'active' &&
          (v.make === currentVehicle.make || 
           Math.abs(v.year - currentVehicle.year) <= 3)
        )
        .slice(0, 3);
      
      setSimilarVehicles(similar);
    } catch (error) {
      console.error("Error loading similar vehicles:", error);
    }
    setIsLoading(false);
  };

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

  if (isLoading || similarVehicles.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="premium-card rounded-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-slate-800">Similar Vehicles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {similarVehicles.map((vehicle) => (
            <Link 
              key={vehicle.id} 
              to={createPageUrl(`VehicleDetail?id=${vehicle.id}`)}
              className="block group"
            >
              <div className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors duration-200">
                <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"}
                    alt={vehicle.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                    {vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  </h4>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>{vehicle.year}</span>
                    <Gauge className="w-3 h-3" />
                    <span>{formatMileage(vehicle.mileage)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-slate-800 text-sm">
                      {formatPrice(vehicle.price)}
                    </span>
                    
                    {vehicle.ai_analysis?.price_fairness === 'excellent_deal' && (
                      <Badge className="bg-emerald-100 text-emerald-800 text-xs">
                        Great Deal
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}