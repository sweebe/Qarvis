
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { InvokeLLM } from '@/api/integrations';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  X,
  ArrowLeft,
  Search,
  Sparkles,
  Car,
  Truck,
  Users,
  Zap,
  Package,
  Wind,
  Luggage
} from "lucide-react";

export default function GuidedSearch({ isOpen, onClose, onSearch }) {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: `Hi! I'm here to help you find the perfect car. Let's start with the basics - what type of vehicle are you generally interested in?`,
      timestamp: new Date(),
      isWelcome: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(10);
  const [collectedData, setCollectedData] = useState({});

  const vehicleTypes = [
    {
      type: 'SUV',
      icon: Car,
      description: 'For families, cargo space, or higher seating',
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      textColor: 'text-blue-700'
    },
    {
      type: 'Sedan',
      icon: Car,
      description: 'For fuel efficiency and comfortable daily driving',
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 hover:bg-green-100',
      textColor: 'text-green-700'
    },
    {
      type: 'Truck',
      icon: Truck,
      description: 'For work, hauling, or off-road adventures',
      gradient: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      textColor: 'text-orange-700'
    },
    {
      type: 'Coupe',
      icon: Zap,
      description: 'For a sporty look and performance',
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      textColor: 'text-purple-700'
    },
    {
      type: 'Convertible',
      icon: Wind,
      description: 'For open-air driving and style',
      gradient: 'from-rose-400 to-red-500',
      bgColor: 'bg-rose-50 hover:bg-rose-100',
      textColor: 'text-rose-700'
    },
    {
      type: 'Hatchback',
      icon: Package,
      description: 'For city driving and practicality',
      gradient: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      textColor: 'text-indigo-700'
    },
    {
      type: 'Wagon',
      icon: Luggage,
      description: 'For extra cargo space with car-like handling',
      gradient: 'from-teal-400 to-cyan-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      textColor: 'text-teal-700'
    },
    {
      type: 'Van',
      icon: Users,
      description: 'For maximum passenger or cargo space',
      gradient: 'from-slate-500 to-slate-700',
      bgColor: 'bg-slate-100 hover:bg-slate-200',
      textColor: 'text-slate-700'
    }
  ];

  const handleVehicleTypeSelect = (vehicleType) => {
    setInputMessage(vehicleType);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Build conversation context
      const conversationHistory = [...messages, userMessage].map(msg =>
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');

      const response = await InvokeLLM({
        prompt: `You are Qarvis, an expert car shopping consultant conducting a guided search to help a user find their perfect vehicle. 

Your role:
1. Ask ONE focused question at a time to understand their needs.
2. Build understanding progressively: vehicle type → budget → usage → specific preferences.
3. Keep responses conversational, friendly, and concise.
4. After 4-6 exchanges, when you have enough info, offer to search.

Current conversation:
${conversationHistory}

Based on the user's latest response, determine your next action:

If you have sufficient information (e.g., a body style and/or budget), respond with \`search_ready: true\` and provide the search criteria.

**IMPORTANT RULES for \`search_criteria\`:**
- **Default to 'any'**: All filter values in the JSON output must be null or omitted by default.
- **Only set a filter value if the user gives a specific, positive preference.**
- **Budget Handling**: If a user gives a single number for their budget (e.g., 'under $30,000' or 'around $25k'), set \`maxPrice\` to that value and leave \`minPrice\` as null. If they provide a range (e.g., '$10k to $20k'), set both \`minPrice\` and \`maxPrice\` accordingly.
- If the user says "no," "any," "I don't care," or gives a negative/non-specific answer for a category (like fuel type), that filter **MUST remain null**. For example, if asked about fuel type and the user says "no preference", \`fuel_type\` must be null.

If you don't have enough information yet, ask the most important remaining question from these areas:
- Vehicle type/body style (if not clear)
- Budget range (if not discussed)  
- Primary usage (family, commuting, work)
- Key preferences (fuel efficiency, luxury, reliability)

Respond in JSON format.`,
        response_json_schema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Your conversational response to the user"
            },
            search_ready: {
              type: "boolean",
              description: "True if you have enough info to perform a search"
            },
            search_criteria: {
              type: "object",
              properties: {
                body_style: {
                  type: "string",
                  enum: ["sedan", "suv", "truck", "coupe", "convertible", "hatchback", "wagon", "van"],
                  description: "Vehicle body style - use lowercase values"
                },
                minPrice: { type: "integer" },
                maxPrice: { type: "integer" },
                make: { type: "string" },
                condition: { type: "string" },
                fuel_type: { type: "string" },
                keywords: { type: "array", items: { type: "string" } },
                ai_tags: { type: "array", items: { type: "string" } }
              },
              description: "Search filters if search_ready is true"
            },
            progress_percentage: {
              type: "integer",
              description: "Estimated progress toward having enough info (10-100)"
            }
          },
          required: ["message", "search_ready", "progress_percentage"]
        }
      });

      const aiMessage = {
        type: 'ai',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setProgress(response.progress_percentage);

      if (response.search_ready && response.search_criteria) {
        // Store the collected data for the search button
        setCollectedData(response.search_criteria);
      } else {
        // Clear collected data if not search ready
        setCollectedData({});
      }

    } catch (error) {
      console.error("Guided search error:", error);
      const errorMessage = {
        type: 'ai',
        content: "I apologize, but I'm having trouble processing that. Could you try rephrasing your response?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleSearch = () => {
    onSearch(collectedData);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isOpen) return null;

  const isSearchReady = Object.keys(collectedData).length > 0;
  const isFirstMessage = messages.length === 1 && messages[0].isWelcome;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl h-[80vh] max-h-[600px]"
      >
        <Card className="premium-card rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
          <CardHeader className="flex-row items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Guided Car Search
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={progress} className="w-24 h-2" />
                  <span className="text-xs text-slate-500 font-medium">{progress}% complete</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="w-9 h-9 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`w-full flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        {message.type === 'ai' ? (
                          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-full h-full bg-slate-300 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className={`inline-block max-w-full rounded-2xl px-4 py-3 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                            : 'bg-white border-2 border-slate-100 text-slate-800 shadow-sm'
                        }`}>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        </div>
                        <p className={`text-xs text-slate-400 mt-1 px-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Vehicle Type Selection Cards - Only show for first message */}
              {isFirstMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 gap-3 mt-6"
                >
                  <p className="text-sm text-slate-600 text-center mb-3">
                    Choose a vehicle type to get started, or describe what you're looking for:
                  </p>
                  {vehicleTypes.map((vehicle, index) => {
                    const IconComponent = vehicle.icon;
                    return (
                      <motion.button
                        key={vehicle.type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        onClick={() => handleVehicleTypeSelect(vehicle.type)}
                        className={`${vehicle.bgColor} ${vehicle.textColor} border-2 border-transparent hover:border-current rounded-xl p-4 text-left transition-all duration-300 hover:shadow-md group`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${vehicle.gradient} rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-lg">{vehicle.type}</div>
                            <div className="text-sm opacity-80">{vehicle.description}</div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex justify-start"
                >
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span className="text-sm">Qarvis is thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t bg-slate-50 p-4">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tell me about your car needs..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border-2 border-slate-200 focus:border-blue-400 bg-white"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="premium-button text-white rounded-xl px-4 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {isSearchReady && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3"
                >
                  <Button
                    onClick={handleSearch}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-base font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Show Me Matching Vehicles
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
