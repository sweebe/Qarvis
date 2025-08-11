import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

export default function OfferDialog({ isOpen, onClose, onSendOffer, vehiclePrice }) {
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(offerAmount);
    if (amount && amount > 0) {
      onSendOffer(amount, offerMessage || `I'd like to offer $${amount.toLocaleString()} for this vehicle.`);
      setOfferAmount('');
      setOfferMessage('');
    }
  };

  const suggestedOffers = vehiclePrice ? [
    { label: '5% below', amount: Math.round(vehiclePrice * 0.95) },
    { label: '10% below', amount: Math.round(vehiclePrice * 0.90) },
    { label: '15% below', amount: Math.round(vehiclePrice * 0.85) },
  ] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="premium-card rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Make an Offer
          </DialogTitle>
          <DialogDescription>
            {vehiclePrice && (
              <span>Listed at ${vehiclePrice.toLocaleString()}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="offer-amount">Offer Amount ($)</Label>
            <Input
              id="offer-amount"
              type="number"
              placeholder="Enter your offer"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="rounded-xl"
              min="1"
              required
            />
          </div>

          {suggestedOffers.length > 0 && (
            <div>
              <Label className="text-sm text-slate-600 mb-2 block">Quick offers:</Label>
              <div className="flex gap-2">
                {suggestedOffers.map((offer) => (
                  <Button
                    key={offer.amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOfferAmount(offer.amount.toString())}
                    className="rounded-xl text-xs"
                  >
                    <TrendingDown className="w-3 h-3 mr-1" />
                    ${offer.amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="offer-message">Message (Optional)</Label>
            <Textarea
              id="offer-message"
              placeholder="Add a personal message with your offer..."
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              className="rounded-xl"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 premium-button text-white rounded-xl"
            >
              Send Offer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}