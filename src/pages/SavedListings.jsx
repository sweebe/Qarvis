
import React, { useState, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { SavedListing } from "@/api/entities";
import { User } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Search, Filter, Trash2, Share, MessageSquare, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import VehicleCard from "../components/marketplace/VehicleCard";

export default function SavedListings() {
  const [savedVehicles, setSavedVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSavedListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [savedVehicles, searchQuery]);

  const loadSavedListings = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      // Get all saved listings for this user, sorted by creation date as per outline
      const savedListings = await SavedListing.filter({ user_email: user.email }, "-created_date");

      if (savedListings.length === 0) {
        setSavedVehicles([]);
        setFilteredVehicles([]);
        setIsLoading(false);
        return;
      }

      // Get vehicle details for each saved listing
      const vehiclePromises = savedListings.map(async (savedListing) => {
        try {
          const vehicles = await Vehicle.filter({ id: savedListing.vehicle_id });
          if (vehicles.length > 0) {
            return {
              ...vehicles[0],
              savedListingId: savedListing.id,
              savedNotes: savedListing.notes
            };
          }
          console.warn(`Could not find vehicle for ID: ${savedListing.vehicle_id}`);
          return null;
        } catch (error) {
          console.error(`Error loading vehicle ${savedListing.vehicle_id}:`, error);
          return null;
        }
      });

      const vehicles = await Promise.all(vehiclePromises);
      const validVehicles = vehicles.filter(vehicle => vehicle !== null);

      setSavedVehicles(validVehicles);
    } catch (error) {
      console.error("Error loading saved listings:", error);
      setCurrentUser(null); // Set currentUser to null if not authenticated or error
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    if (!searchQuery.trim()) {
      setFilteredVehicles(savedVehicles);
      return;
    }

    const filtered = savedVehicles.filter(vehicle => {
      // Convert both the vehicle text and the search query to lowercase for case-insensitive comparison
      const searchText = `${vehicle.title} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.description} ${vehicle.location}`.toLowerCase();
      return searchText.includes(searchQuery.toLowerCase());
    });

    setFilteredVehicles(filtered);
  };

  const handleUnsave = async (vehicleId, savedListingId) => {
    try {
      await SavedListing.delete(savedListingId);
      setSavedVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
    } catch (error) {
      console.error("Error removing saved listing:", error);
    }
  };

  const handleSaveToggle = (vehicleId) => {
    // Find the saved listing ID
    const vehicle = savedVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      handleUnsave(vehicleId, vehicle.savedListingId);
    }
  };

  // Remove the previous error display as sign-in prompt handles unauthenticated state
  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
  //       <Alert variant="destructive" className="max-w-md">
  //         <AlertDescription>{error}</AlertDescription>
  //       </Alert>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart className="w-7 h-7 text-white fill-current" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800">
              Saved Listings
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Keep track of vehicles you're interested in and compare them easily.
          </p>
        </motion.div>

        {/* Search Bar */}
        {!isLoading && currentUser && savedVehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-xl mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search your saved vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-slate-200 rounded-xl py-3"
              />
            </div>
          </motion.div>
        )}

        {/* Results Count */}
        {!isLoading && currentUser && savedVehicles.length > 0 && (
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {searchQuery
                ? `${filteredVehicles.length} of ${savedVehicles.length} saved vehicles`
                : `${savedVehicles.length} saved vehicle${savedVehicles.length !== 1 ? 's' : ''}`
              }
            </h2>

            {savedVehicles.length > 0 && (
              <div className="flex items-center gap-3">
                <Button variant="outline" className="rounded-xl">
                  <Share className="w-4 h-4 mr-2" />
                  Share List
                </Button>
                <Button variant="outline" className="rounded-xl">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Compare
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
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
              ))
            ) : !currentUser ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full"
              >
                <Card className="premium-card rounded-2xl text-center">
                  <CardContent className="p-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Sign In to View Saved Listings</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      Please sign in to see the vehicles you've saved.
                    </p>
                    <Button
                      onClick={() => User.loginWithRedirect(window.location.href)}
                      className="premium-button text-white rounded-xl px-8 py-3"
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : savedVehicles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full"
              >
                <Card className="premium-card rounded-2xl">
                  <CardContent className="text-center py-16">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">No Saved Listings Yet</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      Start browsing vehicles and click the heart icon to save them here for easy comparison and reference.
                    </p>
                    <Button className="premium-button text-white rounded-xl px-8 py-3">
                      Browse Marketplace
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : filteredVehicles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-16"
              >
                <div className="text-slate-400 mb-4">
                  <Search className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-slate-600 mb-2">No matches found</h3>
                <p className="text-slate-500">Try adjusting your search terms</p>
                <Button
                  onClick={() => setSearchQuery("")}
                  variant="outline"
                  className="mt-4 rounded-xl"
                >
                  Clear Search
                </Button>
              </motion.div>
            ) : (
              filteredVehicles.map((vehicle, index) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  index={index}
                  isSaved={true}
                  onSaveToggle={handleSaveToggle}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Tips for Saved Listings */}
        {!isLoading && currentUser && savedVehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-16"
          >
            <Card className="premium-card rounded-2xl">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4">💡 Tips for Managing Saved Listings</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Compare Wisely</h4>
                    <p className="text-sm text-slate-600">Compare similar vehicles side-by-side to find the best deal based on condition, mileage, and AI insights.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Act Fast</h4>
                    <p className="text-sm text-slate-600">Good deals don't last long. Contact sellers quickly for vehicles marked as "Excellent Deal" by our AI.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Stay Organized</h4>
                    <p className="text-sm text-slate-600">Use the search function to quickly find specific vehicles in your saved list as it grows.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2">Monitor Prices</h4>
                    <p className="text-sm text-slate-600">Vehicle prices can change. Check back regularly to see if any of your saved listings have been updated.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
