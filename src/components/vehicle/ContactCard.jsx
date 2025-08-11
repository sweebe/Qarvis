
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import MessageSellerButton from './MessageSellerButton';

export default function ContactCard({ vehicle, onMessageSeller }) {
  const sellerDisplayName = vehicle.contact_info?.dealer_name || vehicle.created_by.split('@')[0];

  return (
    <Card className="premium-card rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Contact Seller</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={vehicle.seller_logo_url} />
            <AvatarFallback className="bg-slate-200 text-slate-600">
              {sellerDisplayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link to={createPageUrl(`SellerProfile?email=${vehicle.created_by}`)} className="hover:underline">
              <p className="font-bold text-lg text-slate-800">{sellerDisplayName}</p>
            </Link>
            <Badge
              className={vehicle.seller_type === 'dealer'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-green-100 text-green-800 border-green-200'}
            >
              {vehicle.seller_type === 'dealer' ? 'Dealer' : 'Private Seller'}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-slate-600">
          {vehicle.contact_info?.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4" />
              <span>{vehicle.contact_info.phone}</span>
            </div>
          )}
          {vehicle.contact_info?.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" />
              <span>{vehicle.contact_info.email}</span>
            </div>
          )}
        </div>

        <MessageSellerButton
          vehicleId={vehicle.id}
          sellerEmail={vehicle.created_by}
          onMessageSeller={onMessageSeller}
        />
      </CardContent>
    </Card>
  );
}
