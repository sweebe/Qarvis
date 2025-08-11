import React, { useState, useEffect, useRef } from "react";
import { MessageThread } from "@/api/entities";
import { Message } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { User } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Car, 
  User as UserIcon,
  Clock,
  ChevronLeft,
  MoreVertical,
  Archive,
  Trash2,
  DollarSign,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import MessageInput from "../components/messaging/MessageInput";
import OfferDialog from "../components/messaging/OfferDialog";

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedThread) {
      const intervalId = setInterval(() => {
        loadMessages(selectedThread.id, true);
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [selectedThread]);

  useEffect(() => {
    if (threads.length > 0 && !selectedThread) {
      const urlParams = new URLSearchParams(window.location.search);
      const threadId = urlParams.get('thread');
      
      if (threadId) {
        const targetThread = threads.find(t => t.id === threadId);
        if (targetThread) {
          setSelectedThread(targetThread);
        }
      }
    }
  }, [threads, selectedThread]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread.id);
    }
  }, [selectedThread, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadThreads = async (user) => {
    const buyerThreads = await MessageThread.filter({ buyer_email: user.email }, "-last_message_at");
    const sellerThreads = await MessageThread.filter({ seller_email: user.email }, "-last_message_at");
    
    const allThreads = [...buyerThreads, ...sellerThreads];
    const uniqueThreads = allThreads.filter((thread, index, self) => 
      index === self.findIndex(t => t.id === thread.id)
    );
    
    const threadsWithVehicles = await Promise.all(
      uniqueThreads.map(async (thread) => {
        const vehicle = await Vehicle.filter({ id: thread.vehicle_id });
        return { ...thread, vehicle: vehicle[0] };
      })
    );

    setThreads(threadsWithVehicles);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const user = await User.me();
      setCurrentUser(user);
      await loadThreads(user);
      setError(null);
    } catch (error) {
      console.error("Error loading user or messaging data:", error);
      // For this page, any failure during the initial load requires the user to be authenticated.
      // We will treat all initial load errors as a sign-in requirement for a more robust user experience.
      setCurrentUser(null);
      setError("sign_in_required");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (threadId, isBackgroundRefresh = false) => {
    try {
      const threadMessages = await Message.filter({ thread_id: threadId }, "created_date");

      setMessages(prevMessages => {
        if (JSON.stringify(prevMessages) !== JSON.stringify(threadMessages)) {
          return threadMessages;
        }
        return prevMessages;
      });

      if (!isBackgroundRefresh) {
        markThreadAsRead(threadId);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      setError("Failed to load messages for this conversation.");
    }
  };

  const markThreadAsRead = async (threadId) => {
    if (!currentUser || !selectedThread) return;

    try {
      const isUserBuyer = currentUser.email === selectedThread.buyer_email;
      const updateData = isUserBuyer 
        ? { unread_count_buyer: 0 }
        : { unread_count_seller: 0 };

      await MessageThread.update(threadId, updateData);
      
      setThreads(prevThreads => 
        prevThreads.map(t => 
          t.id === threadId ? { ...t, ...updateData } : t
        )
      );

      const unreadMessages = messages.filter(msg => 
        !msg.is_read && msg.recipient_email === currentUser.email
      );
      
      for (const message of unreadMessages) {
        await Message.update(message.id, { 
          is_read: true, 
          read_at: new Date().toISOString() 
        });
      }

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          unreadMessages.some(unreadMsg => unreadMsg.id === msg.id)
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );

    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (content) => {
    if (!selectedThread || !currentUser) return;

    const recipientEmail = currentUser.email === selectedThread.buyer_email 
      ? selectedThread.seller_email 
      : selectedThread.buyer_email;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      thread_id: selectedThread.id,
      sender_email: currentUser.email,
      recipient_email: recipientEmail,
      content,
      message_type: "text",
      created_date: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const newMessage = await Message.create({
        thread_id: selectedThread.id,
        sender_email: currentUser.email,
        recipient_email: recipientEmail,
        content,
        message_type: "text"
      });

      setMessages(prev => prev.map(msg => msg.id === tempId ? newMessage : msg));

      const updatedThreadData = {
        last_message_at: new Date().toISOString(),
        last_message_preview: content.substring(0, 100),
        unread_count_buyer: currentUser.email === selectedThread.buyer_email ? 0 : (selectedThread.unread_count_buyer || 0) + 1,
        unread_count_seller: currentUser.email === selectedThread.buyer_email ? (selectedThread.unread_count_seller || 0) + 1 : 0
      };
      
      await MessageThread.update(selectedThread.id, updatedThreadData);

      setThreads(prevThreads => 
        prevThreads.map(t => 
          t.id === selectedThread.id ? { ...t, ...updatedThreadData } : t
        ).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
      );

    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to send message. Please try again.");
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    }
  };

  const handleSendOffer = async (amount, content) => {
    if (!selectedThread || !currentUser) return;

    const recipientEmail = currentUser.email === selectedThread.buyer_email 
      ? selectedThread.seller_email 
      : selectedThread.buyer_email;

    try {
      const offerMessage = await Message.create({
        thread_id: selectedThread.id,
        sender_email: currentUser.email,
        recipient_email: recipientEmail,
        content,
        message_type: "offer",
        offer_amount: amount,
        offer_status: "pending"
      });

      const updatedThreadData = {
        last_message_at: new Date().toISOString(),
        last_message_preview: `Offer: $${amount.toLocaleString()}`,
        unread_count_buyer: currentUser.email === selectedThread.buyer_email ? 0 : (selectedThread.unread_count_buyer || 0) + 1,
        unread_count_seller: currentUser.email === selectedThread.buyer_email ? (selectedThread.unread_count_seller || 0) + 1 : 0
      };

      await MessageThread.update(selectedThread.id, updatedThreadData);

      setThreads(prevThreads => 
        prevThreads.map(t => 
          t.id === selectedThread.id ? { ...t, ...updatedThreadData } : t
        ).sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
      );

      setMessages(prev => [...prev, offerMessage]);
      setIsOfferDialogOpen(false);
    } catch (error) {
      console.error("Failed to send offer:", error);
      setError("Failed to send offer. Please try again.");
    }
  };

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true;
    const vehicleText = `${thread.vehicle?.year} ${thread.vehicle?.make} ${thread.vehicle?.model}`.toLowerCase();
    const otherPartyEmail = currentUser?.email === thread.buyer_email ? thread.seller_email : thread.buyer_email;
    return vehicleText.includes(searchQuery.toLowerCase()) || otherPartyEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Loading your messages...</p>
        </div>
      </div>
    );
  }

  // Display sign-in required message if user is not authenticated
  if (error === "sign_in_required") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Sign In Required</h3>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Please sign in to view your conversations with sellers and manage your messages.
          </p>
          <Button 
            onClick={() => User.loginWithRedirect(window.location.href)} 
            className="premium-button text-white rounded-xl px-8 py-3 w-full"
          >
            <UserIcon className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Display error message if there's a different error
  if (error && error !== "sign_in_required") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Error</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => { setError(null); setIsLoading(true); loadData(); }}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* Thread List - Left Side */}
        <div className={`w-full md:w-1/3 border-r border-slate-200 bg-white ${selectedThread ? 'hidden md:block' : ''}`}>
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Messages</h1>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[calc(100vh-140px)]">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No conversations yet</h3>
                <p className="text-slate-500 text-sm">Start messaging sellers about vehicles you're interested in</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredThreads.map((thread) => {
                  const isUserBuyer = currentUser?.email === thread.buyer_email;
                  const unreadCount = isUserBuyer ? thread.unread_count_buyer : thread.unread_count_seller;
                  const otherPartyEmail = isUserBuyer ? thread.seller_email : thread.buyer_email;
                  
                  return (
                    <motion.div
                      key={thread.id}
                      whileHover={{ backgroundColor: '#f8fafc' }}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedThread?.id === thread.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedThread(thread)}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={thread.vehicle?.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80"}
                          alt={thread.vehicle?.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-slate-800 text-sm truncate">
                              {thread.vehicle?.year} {thread.vehicle?.make} {thread.vehicle?.model}
                            </h4>
                            {unreadCount > 0 && (
                              <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5 ml-2">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-500 mb-1">
                            {isUserBuyer ? 'To' : 'From'}: {otherPartyEmail}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600 truncate flex-1">
                              {thread.last_message_preview}
                            </p>
                            <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                              {formatTime(thread.last_message_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface - Right Side */}
        {selectedThread ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedThread(null)}
                className="md:hidden"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <img
                src={selectedThread.vehicle?.images?.[0] || "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100&q=80"}
                alt={selectedThread.vehicle?.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">
                  {selectedThread.vehicle?.year} {selectedThread.vehicle?.make} {selectedThread.vehicle?.model}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Car className="w-4 h-4" />
                  <Link 
                    to={createPageUrl(`VehicleDetail?id=${selectedThread.vehicle_id}`)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    View Listing
                  </Link>
                  <span className="text-slate-400">•</span>
                  <span>${selectedThread.vehicle?.price?.toLocaleString()}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Conversation
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              <AnimatePresence>
                {messages.map((message) => {
                  const isFromCurrentUser = message.sender_email === currentUser?.email;
                  const isSystemMessage = message.message_type === 'system';
                  const isOfferMessage = message.message_type === 'offer';

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {isSystemMessage ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 max-w-md mx-auto text-center">
                          <p className="text-sm text-blue-700">{message.content}</p>
                          <p className="text-xs text-blue-500 mt-1">{formatTime(message.created_date)}</p>
                        </div>
                      ) : isOfferMessage ? (
                        <div className={`max-w-md ${isFromCurrentUser ? 'ml-12' : 'mr-12'}`}>
                          <div className={`rounded-2xl p-4 ${
                            isFromCurrentUser 
                              ? 'bg-green-500 text-white' 
                              : 'bg-white border-2 border-green-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold">
                                ${message.offer_amount?.toLocaleString()} Offer
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                            
                            {!isFromCurrentUser && message.offer_status === 'pending' && (
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" className="bg-green-600 text-white">
                                  <Check className="w-3 h-3 mr-1" />
                                  Accept
                                </Button>
                                <Button size="sm" variant="outline">
                                  <X className="w-3 h-3 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className={`text-xs text-slate-500 mt-1 ${isFromCurrentUser ? 'text-right' : 'text-left'}`}>
                            {formatTime(message.created_date)}
                          </p>
                        </div>
                      ) : (
                        <div className={`max-w-md ${isFromCurrentUser ? 'ml-12' : 'mr-12'}`}>
                          <div className={`rounded-2xl p-3 ${
                            isFromCurrentUser 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-slate-200'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <p className={`text-xs text-slate-500 mt-1 ${isFromCurrentUser ? 'text-right' : 'text-left'}`}>
                            {formatTime(message.created_date)}
                            {isFromCurrentUser && message.is_read && (
                              <span className="ml-2 text-blue-500">✓</span>
                            )}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <MessageInput
              onSendMessage={handleSendMessage}
              onSendOffer={() => setIsOfferDialogOpen(true)}
              canMakeOffer={currentUser?.email === selectedThread.buyer_email}
            />
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-slate-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">Select a conversation</h3>
              <p className="text-slate-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Offer Dialog */}
      <OfferDialog
        isOpen={isOfferDialogOpen}
        onClose={() => setIsOfferDialogOpen(false)}
        onSendOffer={handleSendOffer}
        vehiclePrice={selectedThread?.vehicle?.price}
      />
    </div>
  );
}