import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2 } from 'lucide-react';
import { MessageThread } from '@/api/entities';
import { Message } from '@/api/entities';
import { User } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MessageSellerButton({ vehicle, className = "" }) {
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const navigate = useNavigate();

  const handleMessageSeller = async () => {
    setIsCreatingThread(true);
    
    try {
      // Check if user is logged in
      const currentUser = await User.me();
      if (!currentUser) {
        // Auto-redirect to login instead of showing alert
        await User.loginWithRedirect(window.location.href);
        setIsCreatingThread(false);
        return;
      }

      // Prevent user from messaging themselves
      if (currentUser.email === vehicle.created_by) {
        alert("You cannot message yourself about your own listing");
        setIsCreatingThread(false);
        return;
      }

      // Check if a thread already exists for this buyer-seller-vehicle combination
      const existingThreads = await MessageThread.filter({
        vehicle_id: vehicle.id,
        buyer_email: currentUser.email,
        seller_email: vehicle.created_by
      });

      let threadId;

      if (existingThreads.length > 0) {
        // Thread already exists, use the existing one
        threadId = existingThreads[0].id;
      } else {
        // Create a new thread
        const newThread = await MessageThread.create({
          vehicle_id: vehicle.id,
          buyer_email: currentUser.email,
          seller_email: vehicle.created_by,
          subject: `Inquiry about ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          last_message_at: new Date().toISOString(),
          last_message_preview: "New conversation started",
          status: "active",
          unread_count_buyer: 0,
          unread_count_seller: 1
        });

        threadId = newThread.id;

        // Create an initial system message to start the conversation
        await Message.create({
          thread_id: threadId,
          sender_email: "system@qarvis.com",
          recipient_email: vehicle.created_by,
          content: `${currentUser.full_name || currentUser.email} is interested in your ${vehicle.year} ${vehicle.make} ${vehicle.model} listing. They can now message you directly about this vehicle.`,
          message_type: "system"
        });

        // Update the thread with the system message info
        await MessageThread.update(threadId, {
          last_message_preview: `${currentUser.full_name || currentUser.email} started a conversation`
        });
      }

      // Navigate to the messages page with the specific thread ID
      navigate(createPageUrl(`Messages?thread=${threadId}`));

    } catch (error) {
      console.error("Error creating/accessing message thread:", error);
      
      if (error.message?.includes('not authenticated')) {
        // Auto-redirect to login instead of showing alert
        await User.loginWithRedirect(window.location.href);
      } else {
        alert("Unable to start conversation. Please try again.");
      }
    }
    
    setIsCreatingThread(false);
  };

  return (
    <Button
      onClick={handleMessageSeller}
      disabled={isCreatingThread}
      className={`premium-button text-white rounded-xl ${className}`}
    >
      {isCreatingThread ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Starting conversation...
        </>
      ) : (
        <>
          <MessageSquare className="w-4 h-4 mr-2" />
          Message Seller
        </>
      )}
    </Button>
  );
}