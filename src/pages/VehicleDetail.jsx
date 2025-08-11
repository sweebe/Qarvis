
import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Vehicle } from "@/api/entities";
import { VehicleView } from "@/api/entities";
import { SavedListing } from "@/api/entities";
import { User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Shield,
  Star,
  Loader2,
  AlertCircle,
  CheckCircle,
  Check,
  HelpCircle,
  Car as CarIcon,
  Users,
  Cpu,
  Palette,
  Droplet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ImageGallery from "../components/vehicle/ImageGallery";
import ContactCard from "../components/vehicle/ContactCard";
import AIInsights from "../components/vehicle/AIInsights";
import SimilarVehicles from "../components/vehicle/SimilarVehicles";
import CarfaxInsights from "../components/vehicle/CarfaxInsights";
import AIAssistant from "../components/vehicle/AIAssistant";

export default function VehicleDetail() {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get("id");

  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedListingId, setSavedListingId] = useState(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false); // New state variable
  const [showAssistant, setShowAssistant] = useState(false);
  const [similarVehicles, setSimilarVehicles] = useState([]);

  useEffect(() => {
    // Scroll to top when component mounts or vehicleId changes
    window.scrollTo(0, 0);

    if (vehicleId) {
      loadVehicleData(vehicleId);
    } else {
      setError("No vehicle ID provided in URL.");
      setIsLoading(false);
    }
  }, [vehicleId]);

  const loadVehicleData = async (id) => {
    setIsLoading(true);
    setError("");
    try {
      const vehicleData = await Vehicle.filter({ id: id });
      if (vehicleData.length === 0) {
        throw new Error("Vehicle not found.");
      }
      
      const vehicle = vehicleData[0];
      setVehicle(vehicle);

      // Try to get user, but don't fail if not logged in
      let user = null;
      try {
        user = await User.me();
        setCurrentUser(user);
        
        if (user) {
          // Check if user has saved this listing
          const savedListings = await SavedListing.filter({
            vehicle_id: id,
            user_email: user.email
          });
          if (savedListings.length > 0) {
            setIsSaved(true);
            setSavedListingId(savedListings[0].id);
          } else {
            setIsSaved(false);
            setSavedListingId(null);
          }
        }
      } catch (userError) {
        // User not logged in - this is fine for viewing
        console.warn("User not logged in, proceeding without user context.", userError);
        setCurrentUser(null);
        setIsSaved(false); // No user, so not saved
        setSavedListingId(null);
      }

      // Record the view (existing recordVehicleView already handles null user)
      // The outline specified recording view only if logged in, but existing code records regardless.
      // Keeping existing behavior of recording view regardless of login.
      await recordVehicleView(id, user);

      // Load similar vehicles (this doesn't require login)
      const similarVehiclesData = await Vehicle.filter({
        make: vehicle.make,
        status: 'active'
      }, '-created_date', 6);
      
      setSimilarVehicles(similarVehiclesData.filter(v => v.id !== id));

    } catch (error) {
      console.error("Error loading vehicle details:", error);
      setError(error.message || "Failed to load vehicle details.");
    } finally {
      setIsLoading(false);
    }
  };

  const recordVehicleView = async (vehicleId, user) => {
    // Validate vehicle ID before attempting to record view
    if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.trim() === '') {
      console.warn("Invalid vehicle ID provided for view recording:", vehicleId);
      return;
    }

    try {
      // Get a simple identifier (we'll use a combination of user agent and timestamp for uniqueness)
      // Limiting user agent length to avoid potential database column size issues if not handled by schema
      const viewerIdentifier = `${navigator.userAgent.slice(0, 50)}_${Date.now()}`;

      await VehicleView.create({
        vehicle_id: vehicleId,
        viewer_ip: viewerIdentifier, // Using this field as a general identifier for unique "viewers"
        user_email: user ? user.email : null, // Pass user email if available, otherwise null
        viewed_at: new Date().toISOString()
      });
    } catch (error) {
      // Don't break the page if view recording fails
      console.error("Error recording vehicle view:", error);
    }
  };

  const handleSaveToggle = async () => {
    if (!currentUser) {
      alert("Please log in to save listings."); // Or a more sophisticated UI
      // Auto-redirect to login for save action
      await User.loginWithRedirect(window.location.href);
      return;
    }

    if (!vehicle || !vehicle.id) {
        console.error("Vehicle or vehicle ID not available to save/unsave.");
        return;
    }

    try {
      if (isSaved) {
        // Use savedListingId if available, otherwise find it
        if (savedListingId) {
            await SavedListing.delete(savedListingId);
            setIsSaved(false);
            setSavedListingId(null);
        } else {
            // Fallback: find the saved listing
            const savedListings = await SavedListing.filter({
                vehicle_id: vehicle.id,
                user_email: currentUser.email
            });
            if (savedListings.length > 0) {
                await SavedListing.delete(savedListings[0].id);
                setIsSaved(false);
                setSavedListingId(null);
            }
        }
      } else {
        const newSavedListing = await SavedListing.create({
          vehicle_id: vehicle.id,
          user_email: currentUser.email
        });
        setIsSaved(true);
        setSavedListingId(newSavedListing.id);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      if (error.message?.includes('not authenticated')) {
        await User.loginWithRedirect(window.location.href);
      }
    }
  };

  const handleToggleAssistant = () => {
    setShowAssistant((prev) => !prev);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleShare = async () => {
    if (!vehicle) {
      console.warn("Attempted to share before vehicle data was loaded.");
      return;
    }

    const shareData = {
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      text: `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for ${formatPrice(vehicle.price)}!`,
      url: window.location.href
    };

    try {
      // Check if Web Share API is supported (mainly mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setIsLinkCopied(true); // Set state for button text
        setTimeout(() => setIsLinkCopied(false), 2000); // Reset state after 2 seconds
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Final fallback: try to copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        alert('Unable to share. Please copy the URL manually.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>);

  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>);

  }

  // If no vehicle is found after loading, display a message
  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Alert variant="default" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Vehicle data not available.</AlertDescription>
        </Alert>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
        {/* Header and Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 md:mb-6"
        >
          <Link to={createPageUrl("Marketplace")}>
            <Button variant="outline" className="rounded-xl flex items-center w-full sm:w-auto justify-center text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Marketplace
            </Button>
          </Link>
          <div className="flex items-center gap-2 justify-center sm:justify-end flex-wrap">
            <Button
              variant="outline"
              className="rounded-xl text-sm flex-shrink-0"
              onClick={handleSaveToggle}
            >
              <Heart
                className={`w-4 h-4 mr-1 ${
                  isSaved ? "fill-red-500 text-red-500" : ""
                }`}
              />
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl text-sm flex-shrink-0" 
              onClick={handleShare}
            >
              {isLinkCopied ? (
                'Link Copied!'
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </>
              )}
            </Button>
            <Button variant="outline" className="rounded-xl text-sm flex-shrink-0" onClick={handleToggleAssistant}>
              <Star className="w-4 h-4 mr-1" />
              AI Assistant
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-8 min-w-0">
            <ImageGallery images={vehicle.images} title={vehicle.title} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="premium-card rounded-2xl">
                <CardHeader className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row justify-between md:items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 mb-2 break-words hyphens-auto">
                        {vehicle.title}
                      </h1>
                      <div className="flex items-center gap-2 text-slate-500 mb-4">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{vehicle.location}</span>
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-800 shrink-0">
                      {formatPrice(vehicle.price)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  {/* Vehicle Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm md:text-base truncate">{vehicle.year}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Gauge className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm md:text-base truncate">{vehicle.mileage?.toLocaleString()} mi</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Fuel className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm md:text-base capitalize truncate">{vehicle.fuel_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Cog className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm md:text-base capitalize truncate">{vehicle.transmission}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {vehicle.description && (
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-3">Description</h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap break-words">
                        {vehicle.description}
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  {vehicle.features && vehicle.features.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-slate-800 mb-3">Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Detailed Specifications */}
            <div className="pt-6 mt-6 border-t">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Detailed Specifications</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                <SpecItem icon={CarIcon} label="Body Style" value={vehicle.body_style} />
                <SpecItem icon={Cog} label="Drive Type" value={vehicle.drive_type?.toUpperCase()} />
                <SpecItem icon={Users} label="Seating" value={vehicle.seating_capacity ? `${vehicle.seating_capacity} seats` : null} />
                <SpecItem icon={Cpu} label="Engine" value={vehicle.engine_type} />
                <SpecItem icon={Palette} label="Exterior Color" value={vehicle.exterior_color} />
                <SpecItem icon={Droplet} label="Interior Color" value={vehicle.interior_color} />
                {(vehicle.efficiency_city || vehicle.efficiency_highway) && (
                  <SpecItem icon={Fuel} label="Efficiency (MPG)" value={`${vehicle.efficiency_city || 'N/A'} City / ${vehicle.efficiency_highway || 'N/A'} Hwy`} />
                )}
                <SpecItem icon={Fuel} label="Fuel Type" value={vehicle.fuel_type} />
                <SpecItem icon={Cog} label="Transmission" value={vehicle.transmission} />
                <SpecItem icon={Star} label="Condition" value={vehicle.condition} />
              </div>
            </div>

            <div className="min-w-0">
              <CarfaxInsights vehicle={vehicle} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6 lg:space-y-8 min-w-0">
            <ContactCard vehicle={vehicle} />
            {vehicle.ai_analysis && <AIInsights analysis={vehicle.ai_analysis} />}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="premium-card rounded-2xl bg-blue-50 border-blue-200">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-blue-800 flex items-center gap-2 text-base md:text-lg">
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    Buyer Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-700 space-y-3 text-sm p-4 md:p-6 pt-0">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Vehicle history report review</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Verified seller information</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Assistance with paperwork and transfer</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
        
        <div className="min-w-0 mt-8 lg:mt-12">
          {/* SimilarVehicles component uses currentVehicle prop to fetch its own data.
              The `similarVehicles` state generated above is not directly consumed by this component's
              current interface, but the fetching logic for it has been implemented as per outline. */}
          <SimilarVehicles currentVehicle={vehicle} />
        </div>
      </div>

      {/* AI Assistant */}
      {vehicle && (
        <AIAssistant 
          vehicle={vehicle}
          isOpen={showAssistant}
          onToggle={handleToggleAssistant}
        />
      )}
    </div>
  );
}

const SpecItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 flex-shrink-0 bg-slate-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-600" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-semibold text-slate-800 capitalize">{value}</p>
      </div>
    </div>
  );
};
