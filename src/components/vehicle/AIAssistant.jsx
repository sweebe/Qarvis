
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/api/integrations";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import RecommendedVehicleCard from "./RecommendedVehicleCard";

export default function AIAssistant({ vehicle, isOpen, onToggle, isMarketplace = false, listings = [] }) {
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      content: isMarketplace
        ? `Hi! I'm Qarvis, your personal car shopping assistant. I can help you find the perfect vehicle based on your needs, budget, and preferences. What kind of car are you looking for?`
        : `Hi! I'm Qarvis, your personal vehicle expert. I can help answer any questions about this ${vehicle.year} ${vehicle.make} ${vehicle.model}. Ask me anything!`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }

    const userMessage = {
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      let contextPrompt = "";
      const conversationHistory = messages.slice(-6).map(msg =>
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      if (isMarketplace) {
        // Prepare a simplified list of vehicles for the AI
        const simplifiedListings = listings.slice(0, 50).map(v => ({
          id: v.id,
          title: v.title,
          price: v.price,
          year: v.year,
          mileage: v.mileage,
          body_style: v.body_style,
          condition: v.condition,
          // Use AI analysis summary if available, otherwise a truncated description
          summary: v.ai_analysis?.summary || (v.description ? v.description.substring(0, Math.min(v.description.length, 100)) + (v.description.length > 100 ? '...' : '') : 'No description available.')
        }));

        contextPrompt = `You are Qarvis, an intelligent car shopping assistant integrated into a vehicle marketplace. Your primary goal is to help users find the perfect vehicle from a list of available listings.

Your task:
1.  Analyze the user's request: "${userMessage.content}".
2.  Carefully examine the provided JSON list of available vehicles.
3.  Select up to 3 of the best matching vehicles from the list that fit the user's criteria. Prioritize relevance, good condition, and fair pricing.
4.  Formulate a friendly, conversational text response that introduces your findings, explaining why these vehicles might be a good fit.
5.  Return a JSON object containing your text response and an array of the IDs of the vehicles you are recommending.

Here is the list of available vehicles:
${JSON.stringify(simplifiedListings)}

Recent conversation:
${conversationHistory}

Based on the user's request and the available vehicles, provide your response in the specified JSON format.`;
        
        const response = await InvokeLLM({
          prompt: contextPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              responseText: { 
                type: "string", 
                description: "A friendly, conversational text response to the user, introducing the recommendations." 
              },
              recommendedVehicleIds: {
                type: "array",
                items: { type: "string" },
                description: "An array of vehicle IDs from the provided list that best match the user's query. Return an empty array if no good matches are found."
              }
            },
            required: ["responseText", "recommendedVehicleIds"]
          },
          add_context_from_internet: false // Context is provided by listings
        });

        const aiMessage = {
          type: 'ai_recommendation',
          content: response.responseText,
          recommendations: response.recommendedVehicleIds || [],
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

      } else {
        // Prepare context about the vehicle
        const vehicleContext = `
        Vehicle Information:
        - Year: ${vehicle.year}
        - Make: ${vehicle.make}
        - Model: ${vehicle.model}
        - Trim: ${vehicle.trim || 'Not specified'}
        - Price: $${vehicle.price?.toLocaleString()}
        - Mileage: ${vehicle.mileage?.toLocaleString()} miles
        - Condition: ${vehicle.condition}
        - Fuel Type: ${vehicle.fuel_type}
        - Transmission: ${vehicle.transmission}
        - Body Style: ${vehicle.body_style}
        - Seller Type: ${vehicle.seller_type}
        - Location: ${vehicle.location}
        - VIN: ${vehicle.vin || 'Not provided'}

        ${vehicle.description ? `Description: ${vehicle.description}` : ''}

        ${vehicle.ai_analysis ? `
        AI Analysis:
        - Condition Score: ${vehicle.ai_analysis.condition_score}/10
        - Price Assessment: ${vehicle.ai_analysis.price_fairness}
        - Market Comparison: ${vehicle.ai_analysis.market_comparison}% vs market average
        - Summary: ${vehicle.ai_analysis.summary}
        ${vehicle.ai_analysis.image_flags?.length > 0 ? `- Visual Issues Detected: ${vehicle.ai_analysis.image_flags.join(', ')}` : ''}
        ` : ''}

        ${vehicle.ai_analysis?.carfax_analysis ? `
        Carfax History:
        - Accidents Reported: ${vehicle.ai_analysis.carfax_analysis.accidents_reported || 'N/A'}
        - Number of Owners: ${vehicle.ai_analysis.carfax_analysis.number_of_owners || 'N/A'}
        - Service Records: ${vehicle.ai_analysis.carfax_analysis.service_records || 'N/A'}
        - Salvage Title: ${vehicle.ai_analysis.carfax_analysis.salvage_title ? 'Yes' : 'No'}
        - Summary: ${vehicle.ai_analysis.carfax_analysis.summary || 'N/A'}
        ` : ''}

        ${vehicle.features?.length > 0 ? `Features: ${vehicle.features.join(', ')}` : ''}
      `;

        contextPrompt = `You are Qarvis, a knowledgeable and helpful AI assistant specializing in automotive advice. A user is looking at a specific vehicle listing and has a question.

Your role:
- Answer questions about this specific vehicle based on the provided data
- Provide helpful insights about the make/model in general when relevant
- Be conversational, friendly, and informative
- If asked about comparisons, use your knowledge of similar vehicles
- If asked about market value or pricing, reference the AI analysis provided
- If you need more specific information that isn't available, acknowledge that and suggest what the user might want to ask the seller
- Keep responses concise but informative (aim for 2-3 sentences unless more detail is specifically requested)

${vehicleContext}

Recent conversation:
${conversationHistory}

User's current question: "${userMessage.content}"

Please provide a helpful response about this vehicle.`;
      
        const response = await InvokeLLM({
          prompt: contextPrompt,
          add_context_from_internet: false // Specific vehicle context
        });

        const aiMessage = {
          type: 'ai',
          content: response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage = {
        type: 'ai',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
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

  const suggestedQuestions = isMarketplace
    ? [
        "What's a good SUV for a family?",
        "Help me find a car under $20k.",
        "What's a reliable first car?",
        "Compare sedans vs SUVs for me."
      ]
    : [
        "Is this a good deal?",
        "What should I look for when viewing?",
        "How reliable is this model?",
        "What are typical maintenance costs?"
      ];

  const handleSuggestedClick = (question) => {
    setInputMessage(question);
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-4 right-4 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 z-50"
      >
        <div className="flex flex-col items-center">
          <Bot className="w-5 h-5 md:w-6 md:h-6 mb-0.5" />
          <span className="text-xs font-medium hidden md:block">Qarvis</span>
        </div>
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed z-50 transition-all duration-300 ${
        isExpanded 
          ? 'inset-2 md:inset-4' 
          : 'bottom-4 right-4 left-4 h-[70vh] md:left-auto md:w-96 md:h-[500px]'
      }`}
    >
      <Card className="premium-card rounded-2xl shadow-2xl h-full flex flex-col">
        <CardHeader className="flex-row items-center justify-between p-3 md:p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">Qarvis</CardTitle>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {isMarketplace ? "Car Shopping Assistant" : "Vehicle Expert"}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Only show expand button on desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-7 h-7 md:w-8 md:h-8 hidden md:flex"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="w-7 h-7 md:w-8 md:h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-full flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 md:gap-3 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      {(message.type === 'ai' || message.type === 'ai_recommendation') ? (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-300 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 md:w-4 md:h-4 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className={`inline-block max-w-full rounded-2xl px-3 py-2 md:px-4 md:py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        <div className="text-xs md:text-sm leading-relaxed break-words overflow-wrap-anywhere">
                          <ReactMarkdown components={{
                            strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                            ul: ({node, ...props}) => <ul className="mt-2 space-y-1 list-disc list-inside" {...props} />,
                            li: ({node, ...props}) => <li className="text-xs md:text-sm" {...props} />,
                          }}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {message.type === 'ai_recommendation' && message.recommendations?.length > 0 && (
                          <div className="mt-2 md:mt-3 space-y-2">
                            {message.recommendations.map(vehicleId => {
                              const recommendedVehicle = listings.find(l => l.id === vehicleId);
                              if (!recommendedVehicle) return null;
                              return <RecommendedVehicleCard key={vehicleId} vehicle={recommendedVehicle} />;
                            })}
                          </div>
                        )}
                      </div>
                      <p className={`text-xs text-slate-400 mt-1 px-2 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex justify-start"
              >
                <div className="flex gap-2 md:gap-3 max-w-[85%]">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 md:w-4 md:h-4 text-white" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl px-3 py-2 md:px-4 md:py-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      <span className="text-xs md:text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input - Always at bottom */}
          <div className="border-t p-3 md:p-4">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isMarketplace ? "Describe your ideal car..." : "Ask me anything about this vehicle..."}
                disabled={isLoading}
                className="flex-1 rounded-xl text-sm md:text-base"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="premium-button text-white rounded-xl px-3 md:px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Suggested Questions - Only show if user hasn't interacted */}
            {!hasUserInteracted && (
              <div className="mt-3 flex flex-wrap gap-1.5 md:gap-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => handleSuggestedClick(question)}
                    className="text-xs px-2 py-1 md:px-3 md:py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
