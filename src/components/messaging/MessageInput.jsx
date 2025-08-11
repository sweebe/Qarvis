import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, DollarSign, Paperclip } from 'lucide-react';

export default function MessageInput({ onSendMessage, onSendOffer, canMakeOffer }) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-slate-200 bg-white">
      <div className="flex gap-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="rounded-xl border-2 border-slate-200 focus:border-blue-400 resize-none min-h-[80px] max-h-[120px]"
            rows={2}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSend}
            disabled={!message.trim()}
            className="premium-button text-white rounded-xl px-4 py-2 h-10"
          >
            <Send className="w-4 h-4" />
          </Button>
          
          {canMakeOffer && (
            <Button
              onClick={onSendOffer}
              variant="outline"
              className="rounded-xl px-4 py-2 h-10"
              title="Make an offer"
            >
              <DollarSign className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            className="rounded-xl px-4 py-2 h-10"
            title="Attach file (coming soon)"
            disabled
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}