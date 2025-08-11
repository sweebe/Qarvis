
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InvokeLLM } from '@/api/integrations';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AISearchBar({ onSearch, onClear, onStartGuided }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await InvokeLLM({
        prompt: `You are Qarvis, an intelligent car shopping assistant. Your goal is to translate a user's natural language query into a structured set of search filters for a vehicle marketplace.

Analyze the user's request: "${query}"

Be intelligent about interpreting context and user intent:
- "family car" implies SUV/minivan, high safety ratings, and the "family-friendly" tag.
- "teenager's first car" implies affordable, safe, reliable and "safe", "reliable", "economical" tags.
- "fast car" or "sportscar" suggests "coupe" or "sedan" body styles, and the "sporty", "high-performance" tags.
- "luxury" suggests premium brands, features like leather seats, and the "luxury" tag.
- "work truck" suggests pickup trucks with good hauling capacity and potentially the "off-road" tag.
- "city driving" or "commuting" suggests compact, fuel-efficient, and the "commuter", "economical" tags.
- "road trips" suggests comfort, reliability, space, and "reliable", "family-friendly" tags.
- If a budget like "under $30k" is mentioned, set maxPrice to 30000.
- If a year like "newer than 2020" is mentioned, set minYear to 2020.
- If keywords like "AWD" or "all-wheel drive" are mentioned, set drive_type to "awd".

Based on your analysis, extract the following information into a JSON object. Only include a field if you can confidently infer it from the query.

1.  Structured Filters: Extract specific vehicle attributes.
2.  Keywords: Create a list of general keywords from the query for a broad text search.
3.  AI Tags: Infer a list of descriptive tags that capture the user's core intent. Use tags from this list: "sporty", "luxury", "reliable", "family-friendly", "off-road", "commuter", "economical", "safe", "high-performance".
4.  User Intent: Summarize the user's underlying goal.`,
        response_json_schema: {
          type: "object",
          properties: {
            body_style: { 
              type: "string", 
              enum: ["sedan", "suv", "truck", "coupe", "convertible", "hatchback", "wagon", "van"],
              description: "The primary vehicle body style inferred from the query."
            },
            minPrice: { 
              type: "integer", 
              description: "Minimum price inferred from budget terms" 
            },
            maxPrice: { 
              type: "integer", 
              description: "Maximum price inferred from budget terms" 
            },
            make: { 
              type: "string", 
              description: "Specific brand if mentioned" 
            },
            model: { 
              type: "string", 
              description: "Specific model if mentioned" 
            },
            condition: { 
              type: "string", 
              enum: ["new", "excellent", "good", "fair"], 
              description: "Condition preference inferred" 
            },
            drive_type: { 
              type: "string", 
              enum: ["awd", "fwd", "rwd"], 
              description: "Drivetrain preference if mentioned (e.g., AWD)" 
            },
            fuel_type: { 
              type: "string", 
              enum: ["gasoline", "hybrid", "electric", "diesel"], 
              description: "Fuel type preference if mentioned" 
            },
            maxYear: { 
              type: "integer", 
              description: "Latest year based on 'new' or 'recent' preferences" 
            },
            minYear: { 
              type: "integer", 
              description: "Earliest year based on preferences" 
            },
            keywords: {
              type: "array",
              items: { type: "string" },
              description: "Important keywords for text search including vehicle types, features, use cases, and descriptors"
            },
            ai_tags: {
              type: "array",
              items: { 
                "type": "string",
                "enum": ["sporty", "luxury", "reliable", "family-friendly", "off-road", "commuter", "economical", "safe", "high-performance"]
              },
              description: "AI-generated descriptive tags like 'sporty', 'luxury', 'reliable'."
            },
            userIntent: {
              type: "object",
              properties: {
                purpose: { type: "string", description: "Primary use case (family, commuting, work, etc.)" },
                priorities: { 
                  type: "array", 
                  items: { type: "string" },
                  description: "Key priorities (safety, fuel economy, luxury, performance, etc.)"
                },
                lifestyle: { type: "string", description: "Lifestyle context (urban, suburban, rural, etc.)" }
              }
            }
          }
        }
      });
      
      // Enhanced search criteria with intelligent keyword expansion
      const enhancedCriteria = {
        ...response,
        // Add expanded keywords based on intent
        keywords: [
          ...(response.keywords || []),
          response.userIntent?.purpose,
          response.userIntent?.lifestyle,
          ...(response.userIntent?.priorities || [])
        ].filter(Boolean)
      };
      
      onSearch(enhancedCriteria);
    } catch (e) {
      console.error("AI Search Error:", e);
      setError("I couldn't understand that search. Please try rephrasing your request or use the guided search below.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setError(null);
    onClear();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="max-w-4xl mx-auto mb-8 space-y-4"
    >
      {/* Quick Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input
          placeholder="Quick search: 'reliable family SUV under $30k' or 'luxury sedan for city commuting'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="pl-11 pr-12 py-4 border-2 border-slate-200 rounded-xl text-sm md:text-base"
          disabled={isLoading}
        />

        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && !isLoading && (
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={handleClear}>
              <X className="w-4 h-4 text-slate-500" />
            </Button>
          )}
          {isLoading && (
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Guided Search Option */}
      <div className="flex flex-col sm:flex-row items-center gap-4 py-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        <div className="text-slate-500 text-sm font-medium">OR</div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
      </div>

      <div className="text-center">
        <Button
          onClick={onStartGuided}
          className="premium-button text-white rounded-xl px-8 py-4 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <MessageSquare className="w-5 h-5 mr-3" />
          Start Guided Car Search
          <Sparkles className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-slate-500 text-sm mt-3">
          Let our AI ask you questions to find your perfect match
        </p>
      </div>
    </motion.div>
  );
}
