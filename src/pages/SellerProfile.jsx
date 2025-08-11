import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { User } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { SavedListing } from "@/api/entities";
import { Loader2, ServerCrash, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import VehicleCard from "../components/marketplace/VehicleCard";
import SellerHeader from "../components/profile/SellerHeader";

export default function SellerProfile() {
  const [searchParams] = useSearchParams();
  const sellerEmail = searchParams.get('email');

  const [sellerInfo, setSellerInfo] = useState(null);
  const [sellerListings, setSellerListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [savedListings, setSavedListings] = useState([]);

  useEffect(() => {
    if (!sellerEmail) {
      setError("No seller specified.");
      setIsLoading(false);
      return;
    }
    loadData();
  }, [sellerEmail]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch current user and their saved listings in parallel
      const userPromise = User.me().catch(() => null);
      
      const [user, sellerData] = await Promise.all([
        userPromise,
        User.filter({ email: sellerEmail })
      ]);
      
      setCurrentUser(user);

      if (!sellerData || sellerData.length === 0) {
        throw new Error("Seller not found.");
      }
      const currentSellerInfo = sellerData[0];
      setSellerInfo(currentSellerInfo);

      // Fetch saved listings if user is logged in
      if (user) {
        const savedData = await SavedListing.filter({ user_email: user.email });
        setSavedListings(savedData.map(s => s.vehicle_id));
      }

      // Fetch seller's active listings
      const listingsData = await Vehicle.filter({
        created_by: sellerEmail,
        status: 'active'
      }, '-created_date');

      setSellerListings(listingsData);

    } catch (err) {
      console.error("Failed to load seller profile:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToggle = async (vehicleId) => {
    if (!currentUser) {
      await User.loginWithRedirect(window.location.href);
      return;
    }
    const isSaved = savedListings.includes(vehicleId);
    if (isSaved) {
      const savedListingToDelete = await SavedListing.filter({ vehicle_id: vehicleId, user_email: currentUser.email });
      if (savedListingToDelete.length > 0) {
        await SavedListing.delete(savedListingToDelete[0].id);
        setSavedListings(prev => prev.filter(id => id !== vehicleId));
      }
    } else {
      await SavedListing.create({ vehicle_id: vehicleId, user_email: currentUser.email });
      setSavedListings(prev => [...prev, vehicleId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <ServerCrash className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Profile</h2>
        <p className="text-slate-600 mb-6">{error}</p>
        <Link to={createPageUrl("Marketplace")}>
          <Button className="premium-button text-white rounded-xl">
            <Home className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sellerInfo && <SellerHeader sellerInfo={sellerInfo} />}

        <h2 className="text-2xl font-bold text-slate-800 mb-6">Listings from this Seller ({sellerListings.length})</h2>
        
        {sellerListings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {sellerListings.map((vehicle, index) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                index={index}
                isSaved={savedListings.includes(vehicle.id)}
                onSaveToggle={() => handleSaveToggle(vehicle.id)}
                hideSellerLink={true} // New prop to avoid linking to self
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
            <Search className="w-16 h-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-600">No active listings</h3>
            <p className="text-slate-500 mt-2">This seller does not have any active listings at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}