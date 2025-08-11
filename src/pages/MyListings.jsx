
import React, { useState, useEffect } from "react";
import { Vehicle } from "@/api/entities";
import { User } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, List, AlertCircle, ShoppingCart, Search, User as UserIcon } from "lucide-react"; // Added Search and UserIcon
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // Added Input component

import MyListingCard from "../components/listing/MyListingCard";
import { notifySavedUsers } from "@/api/functions";

export default function MyListings() {
  const [myListings, setMyListings] = useState([]); // Renamed from 'listings' to hold the full list
  const [filteredListings, setFilteredListings] = useState([]); // New state for filtered list
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(""); // Kept for generic errors, but not used for auth errors anymore
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadMyListings();
  }, []);

  // Effect to apply filters whenever searchQuery or myListings changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, myListings]);

  const loadMyListings = async () => {
    setIsLoading(true);
    setError(""); // Clear any previous errors before attempting to load
    try {
      const user = await User.me();
      setCurrentUser(user);
      const userListings = await Vehicle.filter({ created_by: user.email }, "-created_date");
      setMyListings(userListings); // Set the full list
      setFilteredListings(userListings); // Initially, filtered list is the same as the full list
    } catch (err) {
      // For this page, any error during the initial load implies the user is not logged in.
      // We will treat all initial load errors as a sign-in requirement.
      setCurrentUser(null);
      setMyListings([]);
      setFilteredListings([]);
      // The error state is no longer explicitly set here, as the UI will show the sign-in prompt
      console.error("Failed to load listings:", err);
    }
    setIsLoading(false);
  };

  const applyFilters = () => {
    if (!searchQuery.trim()) {
      setFilteredListings(myListings); // If search query is empty, show all listings
      return;
    }

    const filtered = myListings.filter(vehicle => {
      // Convert both the vehicle text and the search query to lowercase for case-insensitive comparison
      const searchText = `${vehicle.title} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.description} ${vehicle.location}`.toLowerCase();
      return searchText.includes(searchQuery.toLowerCase());
    });

    setFilteredListings(filtered);
  };

  const handleStatusChange = async (vehicleId, newStatus) => {
    try {
      // Get the current status before updating
      const currentVehicle = myListings.find(listing => listing.id === vehicleId); // Use myListings
      const previousStatus = currentVehicle?.status;
      
      await Vehicle.update(vehicleId, { status: newStatus });
      setMyListings(prev => // Update myListings
        prev.map(listing => 
          listing.id === vehicleId ? { ...listing, status: newStatus } : listing
        )
      );
      // applyFilters will be triggered by the myListings state change in the useEffect above
      
      // Notify users who saved this listing (run in background, don't block UI)
      if (previousStatus !== newStatus) {
        try {
          await notifySavedUsers({
            vehicleId: vehicleId,
            newStatus: newStatus,
            previousStatus: previousStatus
          });
        } catch (notificationError) {
          // Log error but don't disrupt the user experience
          console.warn('Failed to send notifications:', notificationError);
        }
      }
      
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Could not update listing status. Please try again.");
    }
  };

  const handleDelete = async (vehicleId) => {
    try {
      await Vehicle.delete(vehicleId);
      setMyListings(prev => prev.filter(listing => listing.id !== vehicleId)); // Update myListings
      // applyFilters will be triggered by the myListings state change in the useEffect above
    } catch (error) {
      console.error("Failed to delete listing:", error);
      alert("Could not delete listing. Please try again.");
    }
  };

  // Only display a generic error message if an unexpected error occurs and is set in state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <List className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800">My Listings</h1>
              <p className="text-slate-600">Manage your active and sold vehicles</p>
            </div>
          </div>
          <Link to={createPageUrl("CreateListing")}>
            <Button className="premium-button text-white rounded-xl w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create New Listing
            </Button>
          </Link>
        </motion.div>

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-8"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search your listings by title, make, model, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
          />
        </motion.div>

        {/* Listings Grid */}
        <div className="space-y-6">
          <AnimatePresence>
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Card key={i} className="premium-card rounded-2xl">
                  <CardContent className="p-4 flex gap-4">
                    <Skeleton className="w-32 h-24 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : !currentUser ? ( // Check if user is not logged in
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full"
              >
                <Card className="premium-card rounded-2xl text-center">
                  <CardContent className="p-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <List className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4">Sign In Required</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed max-w-md mx-auto">
                      Please sign in to view and manage your vehicle listings.
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
            ) : myListings.length === 0 ? ( // User is logged in, but has no listings
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full"
              >
                <Card className="premium-card rounded-2xl text-center">
                  <CardContent className="p-12">
                    <ShoppingCart className="w-16 h-16 mx-auto text-slate-400 mb-6" />
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">You have no active listings</h3>
                    <p className="text-slate-600 mb-6">Ready to sell? Create a listing to reach thousands of potential buyers.</p>
                    <Link to={createPageUrl("CreateListing")}>
                      <Button className="premium-button text-white rounded-xl px-8">
                        List Your Vehicle
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ) : filteredListings.length === 0 ? ( // Check filtered list when search yields no results
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full"
              >
                <Card className="premium-card rounded-2xl text-center">
                  <CardContent className="p-12">
                    <Search className="w-16 h-16 mx-auto text-slate-400 mb-6" />
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">No listings match your search.</h3>
                    <p className="text-slate-600 mb-6">Try adjusting your search terms or clear the search field.</p>
                    {searchQuery && (
                      <Button 
                        onClick={() => setSearchQuery("")} 
                        className="premium-button text-white rounded-xl px-8 mt-4"
                      >
                        Clear Search
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              filteredListings.map((listing) => ( // Render the filtered list
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <MyListingCard 
                    vehicle={listing}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
