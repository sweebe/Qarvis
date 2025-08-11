
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Globe, Phone, User as UserIcon } from "lucide-react";

export default function SellerHeader({ sellerInfo }) {
  const getInitials = (name) => {
    if (!name) return "?";
    const names = name.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : name[0].toUpperCase();
  };

  const displayName = sellerInfo.is_dealer ? sellerInfo.dealer_name : sellerInfo.full_name;
  const displayPhone = sellerInfo.phone || sellerInfo.contact_info?.phone;
  const profileImageUrl = sellerInfo.profile_picture_url || sellerInfo.logo_url;

  return (
    <Card className="premium-card rounded-2xl w-full mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
            <AvatarImage src={profileImageUrl} alt={displayName} />
            <AvatarFallback className="text-3xl bg-slate-200 text-slate-600">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-bold text-slate-800">{displayName}</h1>
            {sellerInfo.is_dealer && <p className="text-sm font-medium text-blue-600 flex items-center justify-center sm:justify-start gap-2 mt-1"><Building2 className="w-4 h-4" /> Certified Dealer</p>}
            {!sellerInfo.is_dealer && <p className="text-sm font-medium text-green-600 flex items-center justify-center sm:justify-start gap-2 mt-1"><UserIcon className="w-4 h-4" /> Private Seller</p>}
            
            {sellerInfo.bio && <p className="text-slate-600 mt-2 max-w-2xl">{sellerInfo.bio}</p>}
            
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-4 text-sm text-slate-500">
              {displayPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{displayPhone}</span>
                </div>
              )}
              {sellerInfo.website && (
                <a href={sellerInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span>Visit Website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
