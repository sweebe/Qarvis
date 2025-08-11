
import React, { useState, useEffect, useRef } from "react";
import { Vehicle } from "@/api/entities";
import { SavedListing } from "@/api/entities";
import { User } from "@/api/entities";
import { Search, Filter, Heart, MapPin, Calendar, Gauge, Fuel, Star, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import SearchFilters from "../components/marketplace/SearchFilters";
import VehicleCard from "../components/marketplace/VehicleCard";
import FeaturedHero from "../components/marketplace/FeaturedHero";
import AISearchBar from "../components/marketplace/AISearchBar";
import AIAssistant from "../components/vehicle/AIAssistant";
import GuidedSearch from "../components/marketplace/GuidedSearch";
import SortingControls from "../components/marketplace/SortingControls"; // New: Import SortingControls

export default function Marketplace() {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [geocodingQueue, setGeocodingQueue] = useState(new Set());
  const [searchCriteria, setSearchCriteria] = useState({ keywords: [], tags: [] });
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    make: "",
    model: "",
    trim: "",
    condition: "",
    seller_type: "",
    fuel_type: "",
    minYear: "",
    maxYear: "",
    body_style: "",
    drive_type: "",
    seating_capacity: "",
    features: [],
    exterior_color: "",
    interior_color: "",
    engine_type: "",
    userLocation: "",
    userLatitude: null,
    userLongitude: null,
    searchRadius: "unlimited"
  });
  const [sortOption, setSortOption] = useState('-created_date'); // New: Sort state
  const [savedListings, setSavedListings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isGuidedSearchOpen, setIsGuidedSearchOpen] = useState(false);
  const searchSectionRef = useRef(null);
  const listingsGridRef = useRef(null);

  useEffect(() => {
    // Load saved state on mount
    const savedFilters = sessionStorage.getItem('marketplaceFilters');
    const savedCriteria = sessionStorage.getItem('marketplaceCriteria');
    const savedSort = sessionStorage.getItem('marketplaceSort');
    
    if (savedFilters) {
      try {
        setFilters(prevFilters => ({ ...prevFilters, ...JSON.parse(savedFilters) }));
      } catch (e) {
        console.error('Error parsing saved filters:', e);
      }
    }
    
    if (savedCriteria) {
      try {
        setSearchCriteria(JSON.parse(savedCriteria));
      } catch (e) {
        console.error('Error parsing saved criteria:', e);
      }
    }

    if (savedSort) {
      setSortOption(savedSort);
    }
    
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
    // Save state whenever filters, criteria, or sortOption change
    sessionStorage.setItem('marketplaceFilters', JSON.stringify(filters));
    sessionStorage.setItem('marketplaceCriteria', JSON.stringify(searchCriteria));
    sessionStorage.setItem('marketplaceSort', sortOption); // Save sort option
  }, [vehicles, searchCriteria, filters, sortOption]); // Added sortOption

  useEffect(() => {
    // Handle scroll restoration after vehicles are loaded and filtered
    if (!isLoading && filteredVehicles.length > 0) {
      const targetVehicleId = sessionStorage.getItem('scrollToVehicleId');
      if (targetVehicleId) {
        setTimeout(() => {
          const targetElement = document.getElementById(`vehicle-card-${targetVehicleId}`);
          if (targetElement) {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center'
            });
            sessionStorage.removeItem('scrollToVehicleId');
          }
        }, 100);
      }
    }
  }, [isLoading, filteredVehicles]);

  useEffect(() => {
    const hasBeenAutoOpened = sessionStorage.getItem('qarvisAutoOpened') === 'true';

    if (hasBeenAutoOpened) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsAssistantOpen(true);
          sessionStorage.setItem('qarvisAutoOpened', 'true');
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    const currentGridRef = listingsGridRef.current;
    if (currentGridRef) {
      observer.observe(currentGridRef);
    }

    return () => {
      if (currentGridRef) {
        observer.unobserve(currentGridRef);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      const vehiclesData = await Vehicle.list("-created_date");
      setVehicles(vehiclesData);
      
      // Try to get user, but don't fail if not logged in
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        if (user) {
          const saved = await SavedListing.filter({ user_email: user.email });
          setSavedListings(saved.map(s => s.vehicle_id));
        } else {
          setCurrentUser(null);
          setSavedListings([]);
        }
      } catch (userError) {
        // User not logged in - this is fine for browsing
        console.log("User not logged in or session expired, proceeding without user context."); // Changed from console.info
        setCurrentUser(null);
        setSavedListings([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getLocationCoordinates = async (locationString) => {
    if (!locationString) return null;
    
    try {
      const { geocodeCity } = await import("@/api/functions");
      const { data } = await geocodeCity({ cityState: locationString });
      
      if (data.success && data.coordinates) {
        setFilters(prev => ({
          ...prev,
          userLatitude: data.coordinates.lat,
          userLongitude: data.coordinates.lng
        }));
        return data.coordinates;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting location coordinates:', error);
      return null;
    }
  };

  const handleAISearch = (criteria) => {
    const { keywords, userIntent, location, latitude, longitude, radius, ai_tags, ...restOfFilters } = criteria;
    
    const newFilters = {
      minPrice: "", maxPrice: "", make: "", model: "", trim: "",
      condition: "", seller_type: "", fuel_type: "", minYear: "", maxYear: "", body_style: "",
      drive_type: "", seating_capacity: "", features: [], 
      exterior_color: "", interior_color: "", engine_type: "",
      userLocation: "", userLatitude: null, userLongitude: null, searchRadius: "unlimited"
    };

    for(const key in restOfFilters) {
        if (restOfFilters[key] !== null && restOfFilters[key] !== undefined && newFilters.hasOwnProperty(key)) {
            newFilters[key] = restOfFilters[key];
        }
    }

    if (location) newFilters.userLocation = location;
    if (latitude) newFilters.userLatitude = latitude;
    if (longitude) newFilters.userLongitude = longitude;
    if (radius) newFilters.searchRadius = String(radius);
    else newFilters.searchRadius = "unlimited";

    setFilters(newFilters);
    
    const enhancedKeywords = [
      ...(keywords || []),
      userIntent?.purpose,
      ...(userIntent?.priorities || []),
      userIntent?.lifestyle
    ].filter(Boolean);
    
    setSearchCriteria({ keywords: enhancedKeywords, tags: ai_tags || [] });
  };

  const handleGuidedSearch = (criteria) => {
    handleAISearch(criteria);
    setIsGuidedSearchOpen(false);
  };

  const applySorting = (vehicles, sortOption) => {
    const sortedVehicles = [...vehicles];
    
    switch (sortOption) {
      case 'price':
        return sortedVehicles.sort((a, b) => a.price - b.price);
      case '-price':
        return sortedVehicles.sort((a, b) => b.price - a.price);
      case 'mileage':
        return sortedVehicles.sort((a, b) => a.mileage - b.mileage);
      case '-mileage':
        return sortedVehicles.sort((a, b) => b.mileage - a.mileage);
      case 'year':
        return sortedVehicles.sort((a, b) => a.year - b.year);
      case '-year':
        return sortedVehicles.sort((a, b) => b.year - a.year);
      case 'distance':
        return sortedVehicles.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      case 'title':
        return sortedVehicles.sort((a, b) => 
          (a.title || `${a.year} ${a.make} ${a.model}`).localeCompare(
            b.title || `${b.year} ${b.make} ${b.model}`
          )
        );
      case '-title':
        return sortedVehicles.sort((a, b) => 
          (b.title || `${b.year} ${b.make} ${b.model}`).localeCompare(
            a.title || `${a.year} ${a.make} ${a.model}`
          )
        );
      case '-ai_condition_score':
        return sortedVehicles.sort((a, b) => 
          (b.ai_analysis?.condition_score || 0) - (a.ai_analysis?.condition_score || 0)
        );
      case 'created_date':
        return sortedVehicles.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      case '-created_date':
      default:
        return sortedVehicles.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  };

  const applyFilters = async () => {
    setIsFiltering(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let filtered = vehicles.filter(vehicle => 
      vehicle.status === 'active'
    );

    if (searchCriteria.keywords.length > 0 || searchCriteria.tags.length > 0) {
      filtered = filtered.filter(vehicle => {
        let keywordMatch = false;
        if (searchCriteria.keywords.length > 0) {
            const vehicleText = `${vehicle.title} ${vehicle.description} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.features?.join(' ')} ${vehicle.fuel_type} ${vehicle.condition} ${vehicle.body_style || ''} ${vehicle.engine_type || ''}`.toLowerCase();
            
            keywordMatch = searchCriteria.keywords.some(keyword => {
                if (!keyword) return false;
                const lowerKeyword = keyword.toLowerCase();
                if (vehicleText.includes(lowerKeyword)) return true;
                if (lowerKeyword.includes('luxury') && (vehicleText.includes('leather') || vehicleText.includes('premium') || vehicleText.includes('luxury'))) {
                  return true;
                }
                if (lowerKeyword.includes('efficient') && (vehicleText.includes('hybrid') || vehicleText.includes('electric') || vehicleText.includes('mpg'))) {
                  return true;
                }
                return false;
            });
        }
        
        let tagMatch = false;
        if (searchCriteria.tags.length > 0) {
            tagMatch = vehicle.ai_tags?.some(vehicleTag => 
              searchCriteria.tags.some(searchTag => 
                vehicleTag.toLowerCase() === searchTag.toLowerCase()
              )
            );
        }

        if (searchCriteria.keywords.length > 0 && searchCriteria.tags.length > 0) {
            return keywordMatch || tagMatch;
        }
        if (searchCriteria.keywords.length > 0) {
            return keywordMatch;
        }
        if (searchCriteria.tags.length > 0) {
            return tagMatch;
        }
        return false;
      });
    }

    let vehiclesToProcess = filtered;
    if (filters.userLocation && filters.userLatitude && filters.userLongitude) {
      const userLat = filters.userLatitude;
      const userLng = filters.userLongitude;
      const maxRadius = filters.searchRadius !== "unlimited" ? parseInt(filters.searchRadius) : Infinity;

      const vehiclesWithDistancePromises = vehiclesToProcess.map(async (vehicle) => {
        let vehicleLat = vehicle.latitude;
        let vehicleLng = vehicle.longitude;
        
        if ((vehicleLat === undefined || vehicleLat === null || vehicleLng === undefined || vehicleLng === null) && vehicle.location && !geocodingQueue.has(vehicle.id)) {
          try {
            setGeocodingQueue(prev => new Set(prev).add(vehicle.id));
            
            const { geocodeCity } = await import("@/api/functions");
            const { data } = await geocodeCity({ cityState: vehicle.location });
            
            if (data.success && data.coordinates) {
              vehicleLat = data.coordinates.lat;
              vehicleLng = data.coordinates.lng;
              
              try {
                await Vehicle.update(vehicle.id, {
                  latitude: vehicleLat,
                  longitude: vehicleLng
                });
                
                setVehicles(prevVehicles => 
                  prevVehicles.map(v => 
                    v.id === vehicle.id 
                      ? { ...v, latitude: vehicleLat, longitude: vehicleLng }
                      : v
                  )
                );
              } catch (updateError) {
                console.warn(`Failed to update vehicle ${vehicle.id} with coordinates:`, updateError);
              }
            }
            
          } catch (geocodeError) {
            console.warn(`Failed to geocode vehicle ${vehicle.id} location:`, geocodeError);
          } finally {
             setGeocodingQueue(prev => {
              const newQueue = new Set(prev);
              newQueue.delete(vehicle.id);
              return newQueue;
            });
          }
        }
        
        if (vehicleLat !== undefined && vehicleLat !== null && vehicleLng !== undefined && vehicleLng !== null) {
          const distance = calculateDistance(userLat, userLng, vehicleLat, vehicleLng);
          return { ...vehicle, latitude: vehicleLat, longitude: vehicleLng, distance: Math.round(distance) };
        } else {
          return { ...vehicle, distance: null }; 
        }
      });

      const vehiclesWithDistance = await Promise.all(vehiclesWithDistancePromises);

      if (filters.searchRadius !== "unlimited") {
        filtered = vehiclesWithDistance.filter(vehicle => 
          vehicle.distance === null || vehicle.distance <= maxRadius
        );
      } else {
        filtered = vehiclesWithDistance;
      }
    } else {
      filtered = filtered.map(vehicle => ({ ...vehicle, distance: null }));
    }

    const minPrice = (filters.minPrice !== "" && filters.minPrice !== null) ? parseInt(filters.minPrice, 10) : null;
    const maxPrice = (filters.maxPrice !== "" && filters.maxPrice !== null) ? parseInt(filters.maxPrice, 10) : null;

    if (minPrice !== null) {
        filtered = filtered.filter(vehicle => vehicle.price >= minPrice);
    }
    if (maxPrice !== null) {
        filtered = filtered.filter(vehicle => vehicle.price <= maxPrice);
    }
    if (filters.make) {
      filtered = filtered.filter(vehicle => 
        vehicle.make?.toLowerCase().includes(filters.make.toLowerCase())
      );
    }
    if (filters.model) {
      filtered = filtered.filter(vehicle => 
        vehicle.model?.toLowerCase().includes(filters.model.toLowerCase())
      );
    }
    if (filters.trim) {
      filtered = filtered.filter(vehicle => 
        vehicle.trim?.toLowerCase().includes(filters.trim.toLowerCase())
      );
    }
    if (filters.condition) {
      filtered = filtered.filter(vehicle => vehicle.condition?.toLowerCase() === filters.condition.toLowerCase());
    }
    if (filters.seller_type) {
      filtered = filtered.filter(vehicle => vehicle.seller_type?.toLowerCase() === filters.seller_type.toLowerCase());
    }
    if (filters.fuel_type) {
      filtered = filtered.filter(vehicle => vehicle.fuel_type?.toLowerCase() === filters.fuel_type.toLowerCase());
    }
    if (filters.minYear) {
      filtered = filtered.filter(vehicle => vehicle.year >= parseInt(filters.minYear));
    }
    if (filters.maxYear) {
      filtered = filtered.filter(vehicle => vehicle.year <= parseInt(filters.maxYear));
    }
    if (filters.body_style) {
      filtered = filtered.filter(vehicle => vehicle.body_style?.toLowerCase() === filters.body_style.toLowerCase());
    }
    
    if (filters.drive_type) {
      filtered = filtered.filter(vehicle => vehicle.drive_type?.toLowerCase() === filters.drive_type.toLowerCase());
    }
    if (filters.seating_capacity) {
      filtered = filtered.filter(vehicle => vehicle.seating_capacity >= parseInt(filters.seating_capacity));
    }
    if (filters.features && filters.features.length > 0) {
      filtered = filtered.filter(vehicle => {
        if (!vehicle.features || !Array.isArray(vehicle.features) || vehicle.features.length === 0) return false;
        return filters.features.every(feature => 
          vehicle.features.some(vehicleFeature => 
            vehicleFeature.toLowerCase().includes(feature.toLowerCase())
          )
        );
      });
    }
    if (filters.exterior_color) {
        filtered = filtered.filter(vehicle => vehicle.exterior_color?.toLowerCase().includes(filters.exterior_color.toLowerCase()));
    }
    if (filters.interior_color) {
        filtered = filtered.filter(vehicle => vehicle.interior_color?.toLowerCase().includes(filters.interior_color.toLowerCase()));
    }
    if (filters.engine_type) {
        filtered = filtered.filter(vehicle => vehicle.engine_type?.toLowerCase().includes(filters.engine_type.toLowerCase()));
    }

    filtered = applySorting(filtered, sortOption);

    setFilteredVehicles(filtered);
    
    setIsFiltering(false);
  };

  const handleSaveToggle = async (vehicleId) => {
    if (!currentUser) {
      // Auto-redirect to login for save action
      await User.loginWithRedirect(window.location.href);
      return;
    }

    const isSaved = savedListings.includes(vehicleId);
    
    if (isSaved) {
      const savedListing = await SavedListing.filter({ 
        vehicle_id: vehicleId, 
        user_email: currentUser.email 
      });
      if (savedListing[0]) {
        await SavedListing.delete(savedListing[0].id);
        setSavedListings(prev => prev.filter(id => id !== vehicleId));
      }
    } else {
      await SavedListing.create({
        vehicle_id: vehicleId,
        user_email: currentUser.email
      });
      setSavedListings(prev => [...prev, vehicleId]);
    }
  };
  
  const clearAllFiltersAndSearch = () => {
    setFilters({
      minPrice: "", maxPrice: "", make: "", model: "", trim: "",
      condition: "", seller_type: "", fuel_type: "", minYear: "", maxYear: "", body_style: "",
      drive_type: "", seating_capacity: "", features: [], 
      exterior_color: "", interior_color: "", engine_type: "",
      userLocation: "", userLatitude: null, userLongitude: null, searchRadius: "unlimited"
    });
    setSearchCriteria({ keywords: [], tags: [] });
    setSortOption('-created_date'); // Reset sort to default
    sessionStorage.removeItem('marketplaceFilters');
    sessionStorage.removeItem('marketplaceCriteria');
    sessionStorage.removeItem('marketplaceSort'); // Clear saved sort
    sessionStorage.removeItem('qarvisAutoOpened');
  };

  const handleToggleAssistant = () => {
    setIsAssistantOpen(prev => {
      if (prev) {
        sessionStorage.removeItem('qarvisAutoOpened');
      }
      return !prev;
    });
  };

  const marketplaceAssistantVehicle = {
    year: new Date().getFullYear(),
    make: "Various",
    model: "Marketplace",
    title: "Car Shopping Assistant",
    description: "I can help you find the perfect vehicle based on your needs, budget, and preferences.",
    price: 0,
    mileage: 0,
    condition: "new",
    fuel_type: "various",
    transmission: "various",
    body_style: "various",
    seller_type: "various",
    location: "Nationwide"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 w-full max-w-full overflow-x-hidden">
      <FeaturedHero onScrollButtonClick={() => searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} />
      
      <div ref={searchSectionRef} className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-4 px-2"
          >
            Find Your Perfect Vehicle
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto px-4"
          >
            Search quickly with AI or let us guide you through finding your ideal car.
          </motion.p>
        </div>

        <AISearchBar 
          onSearch={handleAISearch} 
          onClear={clearAllFiltersAndSearch}
          onStartGuided={() => setIsGuidedSearchOpen(true)}
        />

        <SearchFilters 
          filters={filters} 
          setFilters={setFilters} 
          vehicles={vehicles} 
          onClear={clearAllFiltersAndSearch} 
          getLocationCoordinates={getLocationCoordinates} 
        />

        {!isLoading && !isFiltering && filteredVehicles.length > 0 && (
          <SortingControls 
            sortOption={sortOption}
            setSortOption={setSortOption}
          />
        )}

        {!isLoading && !isFiltering && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">
              {filteredVehicles.length} vehicles found
            </h2>
            {filteredVehicles.length > 0 && (
              <div className="text-slate-600 text-sm md:text-base">
                Showing {Math.min(20, filteredVehicles.length)} of {filteredVehicles.length} results
              </div>
            )}
          </div>
        )}

        <div ref={listingsGridRef} className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {isFiltering || geocodingQueue.size > 0 ? ( 
              <motion.div
                key="filtering-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 border-4 border-transparent rounded-full animate-spin" 
                       style={{
                         backgroundOrigin: 'border-box',
                         backgroundClip: 'content-box, border-box',
                         background: 'linear-gradient(white, white) content-box, linear-gradient(135deg, #3b82f6, #9333ea) border-box'
                       }}>
                  </div>
                  <span className="text-2xl font-bold text-slate-800">
                    {geocodingQueue.size > 0 ? "Geocoding vehicles..." : "Loading..."}
                  </span>
                </div>
                <p className="text-slate-600">
                  {geocodingQueue.size > 0 ? "Optimizing search results..." : "Updating your results..."}
                </p>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                key="initial-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8"
              >
                {Array(6).fill(0).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="premium-card rounded-2xl overflow-hidden"
                  >
                    <Skeleton className="h-48 w-full" />
                    <div className="p-6 space-y-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-8 w-1/3" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : filteredVehicles.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full text-center py-16"
              >
                <div className="text-slate-400 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No vehicles found</h3>
                <p className="text-slate-500">Try adjusting your search criteria</p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8"
              >
                {filteredVehicles.slice(0, 20).map((vehicle, index) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    index={index}
                    isSaved={savedListings.includes(vehicle.id)}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {filteredVehicles.length > 20 && !isFiltering && (
          <div className="text-center mt-8 md:mt-12">
            <Button className="premium-button text-white px-6 md:px-8 py-3 rounded-xl font-semibold">
              Load More Vehicles
            </Button>
          </div>
        )}
      </div>
      
      <GuidedSearch 
        isOpen={isGuidedSearchOpen}
        onClose={() => setIsGuidedSearchOpen(false)}
        onSearch={handleGuidedSearch}
      />
      
      <AIAssistant 
        vehicle={marketplaceAssistantVehicle} 
        isOpen={isAssistantOpen} 
        onToggle={handleToggleAssistant}
        isMarketplace={true}
        listings={filteredVehicles}
      />
    </div>
  );
}
