import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, TrendingUp, Calendar, DollarSign, Gauge, MapPin } from 'lucide-react';

export default function SortingControls({ sortOption, setSortOption }) {
  const sortingOptions = [
    { value: '-created_date', label: 'Newest First', icon: Calendar },
    { value: 'created_date', label: 'Oldest First', icon: Calendar },
    { value: 'price', label: 'Price: Low to High', icon: DollarSign },
    { value: '-price', label: 'Price: High to Low', icon: DollarSign },
    { value: 'mileage', label: 'Mileage: Low to High', icon: Gauge },
    { value: '-mileage', label: 'Mileage: High to Low', icon: Gauge },
    { value: '-year', label: 'Year: Newest First', icon: TrendingUp },
    { value: 'year', label: 'Year: Oldest First', icon: TrendingUp },
    { value: 'distance', label: 'Distance: Nearest First', icon: MapPin },
    { value: '-ai_condition_score', label: 'Best Condition First', icon: TrendingUp },
    { value: 'title', label: 'Title: A to Z', icon: ArrowUpDown },
    { value: '-title', label: 'Title: Z to A', icon: ArrowUpDown }
  ];

  const getCurrentSortLabel = () => {
    const option = sortingOptions.find(opt => opt.value === sortOption);
    return option ? option.label : 'Newest First';
  };

  const getCurrentSortIcon = () => {
    const option = sortingOptions.find(opt => opt.value === sortOption);
    const IconComponent = option ? option.icon : Calendar;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-start gap-4 mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-600">
          {getCurrentSortIcon()}
          <span className="text-sm font-medium">Sort by:</span>
        </div>
        
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-48 rounded-xl border-slate-300 bg-white">
            <SelectValue>
              {getCurrentSortLabel()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {sortingOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}