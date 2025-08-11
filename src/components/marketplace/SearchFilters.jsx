
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, X, ChevronDown, MapPin, Loader2, Sparkles, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { reverseGeocode } from "@/api/functions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";


const commonFeatures = [
  "Sunroof", "Heated Seats", "Backup Camera", "Navigation System",
  "Apple CarPlay", "Android Auto", "Bluetooth", "Leather Seats",
  "Third-Row Seating", "Blind Spot Monitoring", "Lane Keep Assist", "Adaptive Cruise Control"
];

export default function SearchFilters({ filters, setFilters, vehicles, onClear, getLocationCoordinates }) {
  const [showFilters, setShowFilters] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isFormattingLocation, setIsFormattingLocation] = useState(false); // New: Track location formatting

  // Local state for price inputs to allow typing without immediate validation
  const [localMinPrice, setLocalMinPrice] = useState(
    filters.minPrice !== undefined && filters.minPrice !== null ? filters.minPrice.toString() : ""
  );
  const [localMaxPrice, setLocalMaxPrice] = useState(
    filters.maxPrice !== undefined && filters.maxPrice !== null ? filters.maxPrice.toString() : ""
  );

  useEffect(() => {
    // Sync local state if filters are cleared externally or initialized
    setLocalMinPrice(filters.minPrice !== undefined && filters.minPrice !== null ? filters.minPrice.toString() : "");
    setLocalMaxPrice(filters.maxPrice !== undefined && filters.maxPrice !== null ? filters.maxPrice.toString() : "");
  }, [filters.minPrice, filters.maxPrice]);

  // Update unique values extraction to be case insensitive
  const uniqueMakes = [...new Set(vehicles.map((v) => v.make).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const uniqueModels = filters.make ?
  [...new Set(vehicles.filter((v) => v.make?.toLowerCase() === filters.make.toLowerCase()).map((v) => v.model).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })) :
  [];

  const uniqueTrims = filters.make && filters.model ?
  [...new Set(vehicles.filter((v) => v.make?.toLowerCase() === filters.make.toLowerCase() && v.model?.toLowerCase() === filters.model.toLowerCase()).map((v) => v.trim).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })) :
  [];

  const uniqueEngineTypes = [...new Set(vehicles.map((v) => v.engine_type).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };

    if (key === 'make') {
      newFilters.model = "";
      newFilters.trim = "";
    }
    if (key === 'model') {
      newFilters.trim = "";
    }

    // When userLocation is manually changed, clear coordinates and any related errors.
    // The actual geocoding for typed input will now be handled by handleLocationBlur.
    if (key === 'userLocation') {
      newFilters.userLatitude = null;
      newFilters.userLongitude = null;
      setLocationError("");
      // Removed the setTimeout(() => getLocationCoordinates(value), 500) from here
      // to avoid conflicting geocoding calls with handleLocationBlur.
    }

    setFilters(newFilters);
  };

  // New: Handle location input change
  const handleLocationInputChange = (inputValue) => {
    // Update the filter immediately for responsive UI
    // Also, clear coordinates so they can be re-geocoded on blur.
    setFilters(prev => ({
        ...prev,
        userLocation: inputValue,
        userLatitude: null,
        userLongitude: null
    }));
    setLocationError(""); // Clear any previous location-related errors
  };

  // New: Format location when user finishes typing (onBlur)
  const handleLocationBlur = async () => {
    const currentLocation = filters.userLocation?.trim();
    if (!currentLocation || isFormattingLocation) return;

    setIsFormattingLocation(true);
    setLocationError("");

    try {
      // Dynamic import of geocodeCity
      const { geocodeCity } = await import("@/api/functions");
      const { data } = await geocodeCity({ cityState: currentLocation });

      if (data.success && data.location) {
        // The backend now returns the perfectly formatted "City, State" string.
        setFilters(prev => ({
          ...prev,
          userLocation: data.location,
          userLatitude: data.coordinates?.lat || null,
          userLongitude: data.coordinates?.lng || null
        }));
      }
    } catch (error) {
      console.error('Location formatting error:', error);
      // Don't show error for formatting, just keep the original input if geocoding fails.
      // The user can try again or use "Use my current location".
    } finally {
      setIsFormattingLocation(false);
    }
  };

  // Handle price input validation on blur (when user clicks away)
  const handlePriceBlur = (type) => {
    if (type === 'min') {
      const numValue = parseInt(localMinPrice);
      if (localMinPrice === "") {// User cleared the input
        handleFilterChange('minPrice', "");
      } else if (isNaN(numValue) || numValue < 0) {
        setLocalMinPrice(""); // Clear invalid local input
        handleFilterChange('minPrice', ""); // Clear parent filter state
      } else {
        handleFilterChange('minPrice', numValue);
      }
    } else if (type === 'max') {
      const numValue = parseInt(localMaxPrice);
      if (localMaxPrice === "") {// User cleared the input
        handleFilterChange('maxPrice', "");
      } else if (isNaN(numValue) || numValue < 1000) {// Validation: Max price must be at least 1000 if entered
        setLocalMaxPrice("");
        handleFilterChange('maxPrice', "");
      } else {
        handleFilterChange('maxPrice', numValue);
      }
    }
  };

  // Handle price change on Enter key
  const handlePriceKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      e.target.blur(); // Trigger the onBlur validation
    }
  };

  const handleFeatureChange = (feature, isChecked) => {
    const currentFeatures = filters.features || [];
    let newFeatures;
    if (isChecked) {
      newFeatures = [...currentFeatures, feature];
    } else {
      newFeatures = currentFeatures.filter(f => f !== feature);
    }
    setFilters({ ...filters, features: newFeatures });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use our backend function with BigDataCloud API
          const { data } = await reverseGeocode({ latitude, longitude });

          if (data.success && data.fullLocation) {
            // Auto-populate the location field and set coordinates
            setFilters((prev) => ({
              ...prev,
              userLocation: data.fullLocation,
              userLatitude: latitude,
              userLongitude: longitude
            }));
            setLocationError("");
          } else {
            setLocationError("Could not determine your location. Please enter manually.");
          }
        } catch (error) {
          console.error("Geocoding error:", error);
          setLocationError("Error determining location. Please enter manually.");
        }

        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied. Please enable location services or enter manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out.");
            break;
          default:
            setLocationError("An error occurred while getting your location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const activeFiltersCount = Object.values(filters).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== "" && value !== null && value !== undefined
  }).length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border-2 border-slate-200 hover:border-slate-300 rounded-xl px-6 py-3 h-12"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </Button>

          {/* Location & Distance - Aligned properly */}
          <div className="hidden lg:flex items-center gap-3 bg-blue-50 rounded-xl p-3 border-2 border-blue-200 h-12">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  placeholder="Enter city, state"
                  value={filters.userLocation || ""}
                  onChange={(e) => handleLocationInputChange(e.target.value)}
                  onBlur={handleLocationBlur}
                  className="rounded-xl w-48 h-8 text-sm border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300"
                />
                {isFormattingLocation && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="rounded-xl whitespace-nowrap h-8 w-8 p-0 hover:bg-blue-100"
                title="Use my current location"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </Button>

              <Select
                value={filters.searchRadius || "50"}
                onValueChange={(value) => handleFilterChange('searchRadius', value)}
                disabled={!filters.userLocation}
              >
                <SelectTrigger className="rounded-xl w-28 h-8 text-sm border-0 bg-transparent focus:bg-white focus:border focus:border-blue-300">
                  <SelectValue placeholder="Radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                  <SelectItem value="100">100 miles</SelectItem>
                  <SelectItem value="200">200 miles</SelectItem>
                  <SelectItem value="500">500 miles</SelectItem>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={onClear}
            className="text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4 mr-2" />
            Clear all
          </Button>
        )}
      </div>

      {/* Location Error - Show outside of filters panel */}
      {locationError && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription className="text-sm">{locationError}</AlertDescription>
        </Alert>
      )}

      {/* Active Location Info - Show outside of filters panel */}
      {filters.userLocation && filters.searchRadius && filters.searchRadius !== "unlimited" && (
        <div className="mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg p-2">
          🔍 Searching within {filters.searchRadius} miles of {filters.userLocation}
        </div>
      )}

      <AnimatePresence>
        {showFilters &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}>

            <Card className="premium-card rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Location & Radius Section - Mobile Only */}
                  <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200 lg:hidden">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Location & Distance
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Your Location</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                            placeholder="Enter city, state"
                            value={filters.userLocation || ""}
                            onChange={(e) => handleLocationInputChange(e.target.value)}
                            onBlur={handleLocationBlur}
                            className="rounded-xl" />

                            {isFormattingLocation && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              </div>
                            )}
                          </div>

                          <Button
                          variant="outline"
                          onClick={getCurrentLocation}
                          disabled={isGettingLocation}
                          className="rounded-xl whitespace-nowrap"
                          title="Use my current location">

                            {isGettingLocation ?
                          <Loader2 className="w-4 h-4 animate-spin" /> :

                          <MapPin className="w-4 h-4" />
                          }
                          </Button>
                        </div>
                        {isFormattingLocation && (
                          <p className="text-xs text-blue-600">Formatting location...</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Search Radius</label>
                        <Select
                        value={filters.searchRadius || "50"}
                        onValueChange={(value) => handleFilterChange('searchRadius', value)}
                        disabled={!filters.userLocation}>

                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select radius" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10 miles</SelectItem>
                            <SelectItem value="25">25 miles</SelectItem>
                            <SelectItem value="50">50 miles</SelectItem>
                            <SelectItem value="100">100 miles</SelectItem>
                            <SelectItem value="200">200 miles</SelectItem>
                            <SelectItem value="500">500 miles</SelectItem>
                            <SelectItem value="unlimited">Unlimited</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Price Range */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Price Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Input
                          placeholder="Min"
                          type="number"
                          min="0"
                          value={localMinPrice}
                          onChange={(e) => setLocalMinPrice(e.target.value)}
                          onBlur={() => handlePriceBlur('min')}
                          onKeyDown={(e) => handlePriceKeyDown(e, 'min')}
                          className="rounded-xl" />

                        </div>
                        <div>
                          <Input
                          placeholder="Max"
                          type="number"
                          min="1000"
                          value={localMaxPrice}
                          onChange={(e) => setLocalMaxPrice(e.target.value)}
                          onBlur={() => handlePriceBlur('max')}
                          onKeyDown={(e) => handlePriceKeyDown(e, 'max')}
                          className="rounded-xl" />

                          <p className="text-slate-500 mt-1 mr-1 ml-1 px-1 text-xs">min $1,000</p>
                        </div>
                      </div>
                    </div>

                    {/* Body Style */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Body Style</label>
                      <Select value={filters.body_style} onValueChange={(value) => handleFilterChange('body_style', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any style</SelectItem>
                          <SelectItem value="sedan">Sedan</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                          <SelectItem value="truck">Truck</SelectItem>
                          <SelectItem value="coupe">Coupe</SelectItem>
                          <SelectItem value="convertible">Convertible</SelectItem>
                          <SelectItem value="hatchback">Hatchback</SelectItem>
                          <SelectItem value="wagon">Wagon</SelectItem>
                          <SelectItem value="van">Van</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Make */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Make</label>
                      <Select value={filters.make} onValueChange={(value) => handleFilterChange('make', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any make" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any make</SelectItem>
                          {uniqueMakes.map((make) =>
                        <SelectItem key={make} value={make}>{make}</SelectItem>
                        )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Model */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Model</label>
                      <Select value={filters.model} onValueChange={(value) => handleFilterChange('model', value)} disabled={!filters.make || uniqueModels.length === 0}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any model</SelectItem>
                          {uniqueModels.map((model) =>
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                        )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Trim */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Trim</label>
                      <Select value={filters.trim} onValueChange={(value) => handleFilterChange('trim', value)} disabled={!filters.model || uniqueTrims.length === 0}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any trim" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any trim</SelectItem>
                          {uniqueTrims.map((trim) =>
                        <SelectItem key={trim} value={trim}>{trim}</SelectItem>
                        )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Condition */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Condition</label>
                      <Select value={filters.condition} onValueChange={(value) => handleFilterChange('condition', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any condition</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Seller Type */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Seller</label>
                      <Select value={filters.seller_type} onValueChange={(value) => handleFilterChange('seller_type', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any seller" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any seller</SelectItem>
                          <SelectItem value="dealer">Dealer</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Year Range */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Year Range</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                        placeholder="Min year"
                        type="number"
                        value={filters.minYear || ""}
                        onChange={(e) => handleFilterChange('minYear', e.target.value)}
                        className="rounded-xl" />

                        <Input
                        placeholder="Max year"
                        type="number"
                        value={filters.maxYear || ""}
                        onChange={(e) => handleFilterChange('maxYear', e.target.value)}
                        className="rounded-xl" />

                      </div>
                    </div>

                    {/* Fuel Type */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Fuel Type</label>
                      <Select value={filters.fuel_type} onValueChange={(value) => handleFilterChange('fuel_type', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any fuel type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any fuel type</SelectItem>
                          <SelectItem value="gasoline">Gasoline</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Drive Type */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Drive Type</label>
                      <Select value={filters.drive_type} onValueChange={(value) => handleFilterChange('drive_type', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any drive type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any drive type</SelectItem>
                          <SelectItem value="fwd">FWD</SelectItem>
                          <SelectItem value="rwd">RWD</SelectItem>
                          <SelectItem value="awd">AWD</SelectItem>
                          <SelectItem value="4wd">4WD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Seating Capacity */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-slate-700">Seats</label>
                      <Select value={filters.seating_capacity} onValueChange={(value) => handleFilterChange('seating_capacity', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={null}>Any</SelectItem>
                          <SelectItem value="2">2+</SelectItem>
                          <SelectItem value="4">4+</SelectItem>
                          <SelectItem value="5">5+</SelectItem>
                          <SelectItem value="7">7+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Exterior Color */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">Exterior Color</label>
                        <Input
                            placeholder="e.g., Blue"
                            value={filters.exterior_color || ""}
                            onChange={(e) => handleFilterChange('exterior_color', e.target.value)}
                            className="rounded-xl" />
                    </div>

                    {/* Interior Color */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">Interior Color</label>
                        <Input
                            placeholder="e.g., Black"
                            value={filters.interior_color || ""}
                            onChange={(e) => handleFilterChange('interior_color', e.target.value)}
                            className="rounded-xl" />
                    </div>

                    {/* Engine Type */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">Engine</label>
                        <Select value={filters.engine_type} onValueChange={(value) => handleFilterChange('engine_type', value)}>
                            <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Any engine" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>Any engine</SelectItem>
                                {uniqueEngineTypes.map((engineType) => (
                                    <SelectItem key={engineType} value={engineType}>{engineType}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                  </div>
                  {/* Features Section */}
                  <div className="pt-6 border-t border-slate-200/80">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        Must-Have Features
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {commonFeatures.map(feature => {
                            const featureId = `filter-${feature.toLowerCase().replace(/ /g, '-')}`;
                            return (
                                <div key={featureId} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={featureId}
                                        checked={(filters.features || []).includes(feature)}
                                        onCheckedChange={(checked) => handleFeatureChange(feature, checked)}
                                    />
                                    <Label htmlFor={featureId} className="font-normal text-slate-700 cursor-pointer">
                                        {feature}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}
