
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Gauge, 
  Fuel, 
  Cog, 
  Star,
  TrendingUp,
  AlertTriangle,
  Phone,
  Mail,
  Building2,
  User,
  Sparkles,
  Check, // Added
  Users, // Added
  Cpu, // Added
  Palette, // Added
  Droplet // Added
} from "lucide-react";

export default function ListingPreview({ formData, images, aiAnalysis }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatMileage = (mileage) => {
    return new Intl.NumberFormat('en-US').format(mileage) + ' miles';
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Listing Preview</h2>
        <p className="text-slate-600">This is how your listing will appear to buyers</p>
      </div>

      <Card className="premium-card rounded-2xl">
        <div className="relative">
          <div className="aspect-[16/9] sm:aspect-[16/10] overflow-hidden rounded-t-2xl">
            <img
              src={images[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
              alt={formData.title}
              className="w-full h-full object-cover object-center"
            />
          </div>
          
          {aiAnalysis?.price_fairness && (
            <div className="absolute top-4 left-4">
              <Badge className={`${getPriceBadgeColor(aiAnalysis.price_fairness)} font-semibold`}>
                <TrendingUp className="w-3 h-3 mr-1" />
                {aiAnalysis.price_fairness.replace('_', ' ')}
              </Badge>
            </div>
          )}

          {formData.condition === 'new' && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                NEW
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {formData.title || `${formData.year} ${formData.make} ${formData.model} ${formData.trim || ''}`}
              </h3>
              <div className="flex items-center gap-2 text-slate-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{formData.city && formData.state ? `${formData.city}, ${formData.state}` : (formData.city || formData.state || "Location not specified")}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-800">
                  {formatPrice(formData.price)}
                </div>
                {aiAnalysis?.condition_score && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-semibold text-slate-700 text-lg">
                      {aiAnalysis.condition_score}/10
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-800">Year</p>
                    <p className="text-slate-600">{formData.year}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-800">Mileage</p>
                    <p className="text-slate-600">{formatMileage(formData.mileage)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Fuel className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-800">Fuel Type</p>
                    <p className="text-slate-600 capitalize">{formData.fuel_type}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Cog className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-800">Transmission</p>
                    <p className="text-slate-600 capitalize">{formData.transmission}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 text-slate-500 font-bold">C</div>
                  <div>
                    <p className="font-medium text-slate-800">Condition</p>
                    <p className="text-slate-600 capitalize">{formData.condition}</p>
                  </div>
                </div>
                {formData.trim && (
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-800">Trim</p>
                      <p className="text-slate-600">{formData.trim}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* New Specs Section */}
            <div className="pt-6 border-t border-slate-200/80">
                <h4 className="font-semibold text-slate-800 mb-4">Specifications</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    {formData.drive_type && <div className="flex items-center gap-2"><Cog className="w-4 h-4 text-slate-500"/> <span>{formData.drive_type.toUpperCase()}</span></div>}
                    {formData.seating_capacity && <div className="flex items-center gap-2"><Users className="w-4 h-4 text-slate-500"/> <span>{formData.seating_capacity} Seats</span></div>}
                    {formData.engine_type && <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-slate-500"/> <span>{formData.engine_type}</span></div>}
                    {formData.exterior_color && <div className="flex items-center gap-2"><Palette className="w-4 h-4 text-slate-500"/> <span>{formData.exterior_color}</span></div>}
                    {formData.interior_color && <div className="flex items-center gap-2"><Droplet className="w-4 h-4 text-slate-500"/> <span>{formData.interior_color}</span></div>}
                    {(formData.efficiency_city || formData.efficiency_highway) && (
                        <div className="flex items-center gap-2">
                            <Fuel className="w-4 h-4 text-slate-500"/>
                            <span>{formData.efficiency_city || 'N/A'} City / {formData.efficiency_highway || 'N/A'} Hwy</span>
                        </div>
                    )}
                </div>
            </div>

            {formData.description && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Description</h4>
                <p className="text-slate-700 leading-relaxed">{formData.description}</p>
              </div>
            )}

            {/* Features */}
            {formData.features && formData.features.length > 0 && (
                <div className="pt-6 border-t border-slate-200/80">
                    <h4 className="font-semibold text-slate-800 mb-4">Features</h4>
                    <div className="flex flex-wrap gap-2">
                        {formData.features.map(feature => (
                            <Badge key={feature} variant="outline" className="flex items-center gap-2 bg-slate-100 border-slate-200">
                                <Check className="w-3 h-3 text-green-600"/>
                                {feature}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {aiAnalysis?.summary && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  AI Analysis Summary
                </h4>
                <p className="text-blue-700 text-sm mb-3">{aiAnalysis.summary}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Preview */}
      <Card className="premium-card rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {formData.seller_type === 'dealer' ? (
              <Building2 className="w-5 h-5 text-blue-500" />
            ) : (
              <User className="w-5 h-5 text-green-500" />
            )}
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge className={`${
            formData.seller_type === 'dealer' 
              ? 'bg-blue-100 text-blue-800 border-blue-200' 
              : 'bg-green-100 text-green-800 border-green-200'
          }`}>
            {formData.seller_type === 'dealer' ? 'Certified Dealer' : 'Private Seller'}
          </Badge>

          {formData.contact_info.dealer_name && (
            <p className="font-semibold text-slate-800">{formData.contact_info.dealer_name}</p>
          )}

          <div className="space-y-2">
            {formData.contact_info.phone && (
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{formData.contact_info.phone}</span>
              </div>
            )}
            {formData.contact_info.email && (
              <div className="flex items-center gap-3 text-slate-600">
                <Mail className="w-4 h-4" />
                <span>{formData.contact_info.email}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
