import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreVertical, Eye, EyeOff, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MyListingCard({ vehicle, onStatusChange, onDelete }) {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { text: 'Active', badgeClass: 'bg-emerald-100 text-emerald-800' };
      case 'pending':
        return { text: 'Pending', badgeClass: 'bg-yellow-100 text-yellow-800' };
      case 'sold':
        return { text: 'Sold', badgeClass: 'bg-rose-100 text-rose-800' };
      case 'hidden':
        return { text: 'Hidden', badgeClass: 'bg-slate-200 text-slate-800' };
      default:
        return { text: 'Unknown', badgeClass: 'bg-gray-200 text-gray-800' };
    }
  };

  const statusInfo = getStatusInfo(vehicle.status);
  const isHidden = vehicle.status === 'hidden';

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className={`premium-card rounded-2xl overflow-hidden transition-opacity duration-300 ${isHidden ? 'opacity-60' : ''}`}>
      <CardContent className="p-0">
        {/* Mobile Layout */}
        <div className="block md:hidden">
          <div className="relative">
            <img
              src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80"}
              alt={vehicle.title}
              className="w-full h-48 object-cover"
            />
            <div className={`absolute top-3 left-3 font-bold text-xs uppercase px-3 py-1.5 rounded-full ${statusInfo.badgeClass}`}>
              {statusInfo.text}
            </div>
            
            {/* Mobile Action Buttons - Top Right */}
            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStatusChange(vehicle.id, isHidden ? 'active' : 'hidden')}
                className="bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white rounded-full w-8 h-8"
                title={isHidden ? 'Show Listing' : 'Hide Listing'}
              >
                {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white rounded-full w-8 h-8"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl(`CreateListing?id=${vehicle.id}`)} className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Listing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={vehicle.status === 'active'} onClick={() => onStatusChange(vehicle.id, 'active')}>
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={vehicle.status === 'pending'} onClick={() => onStatusChange(vehicle.id, 'pending')}>
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={vehicle.status === 'sold'} onClick={() => onStatusChange(vehicle.id, 'sold')}>
                    Mark as Sold
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 focus:text-white focus:bg-red-500" onClick={() => {if(confirm('Are you sure you want to permanently delete this listing?')) onDelete(vehicle.id)}}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Listing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Mobile Content */}
          <div className="p-4">
            <Link to={createPageUrl(`VehicleDetail?id=${vehicle.id}`)} className="block mb-3">
              <h3 className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors mb-1">
                {vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              </h3>
              <p className="text-sm text-slate-600 mb-2">{vehicle.location}</p>
              <p className="text-xl font-bold text-slate-800">{formatPrice(vehicle.price)}</p>
            </Link>
            
            <Button variant="outline" className="w-full rounded-xl text-sm py-2">
              <BarChart2 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex p-4 gap-4 h-32">
          <div className="relative w-40 h-full flex-shrink-0">
            <img
              src={vehicle.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=80"}
              alt={vehicle.title}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className={`absolute top-2 left-2 font-bold text-xs uppercase px-2 py-1 rounded-full ${statusInfo.badgeClass}`}>
              {statusInfo.text}
            </div>
          </div>

          <div className="flex-1 space-y-1 min-w-0 flex flex-col justify-center">
            <Link to={createPageUrl(`VehicleDetail?id=${vehicle.id}`)} className="block">
              <h3 className="text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1">
                {vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              </h3>
            </Link>
            <p className="text-sm text-slate-600 line-clamp-1">{vehicle.location}</p>
            <p className="text-lg font-bold text-slate-800">{formatPrice(vehicle.price)}</p>
          </div>

          <div className="flex flex-col items-end justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStatusChange(vehicle.id, isHidden ? 'active' : 'hidden')}
                className="text-slate-500 hover:text-slate-700 rounded-full w-8 h-8"
                title={isHidden ? 'Show Listing' : 'Hide Listing'}
              >
                {isHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              
              <Link to={createPageUrl(`CreateListing?id=${vehicle.id}`)}>
                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 rounded-full w-8 h-8" title="Edit Listing">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 rounded-full w-8 h-8" title="More Actions">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={vehicle.status === 'active'} onClick={() => onStatusChange(vehicle.id, 'active')}>
                    Mark as Active
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={vehicle.status === 'pending'} onClick={() => onStatusChange(vehicle.id, 'pending')}>
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={vehicle.status === 'sold'} onClick={() => onStatusChange(vehicle.id, 'sold')}>
                    Mark as Sold
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 focus:text-white focus:bg-red-500" onClick={() => {if(confirm('Are you sure you want to permanently delete this listing?')) onDelete(vehicle.id)}}>
                    Delete Listing
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button variant="outline" className="rounded-xl text-xs px-2 py-1 h-8">
              <BarChart2 className="w-3 h-3 mr-1" />
              Analytics
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}