
import React, { useState, useEffect, useRef } from "react";
import { Vehicle } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile, InvokeLLM, ExtractDataFromUploadedFile, GenerateImage } from "@/api/integrations";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion"; // Added AnimatePresence
import {
  ArrowLeft,
  Upload,
  Camera,
  Car,
  Sparkles,
  Check,
  AlertCircle,
  Brain,
  Loader2,
  Save,
  Settings,
  Phone,
  ChevronDown,
  MapPin,
  Info, // Added Info icon
  FileText, // Added FileText icon
  Plus, // Added Plus icon
  User as UserIcon // Added UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import ImageUploader from "../components/listing/ImageUploader";
import AIAnalysisCard from "../components/listing/AIAnalysisCard";
import CarfaxUploader from "../components/listing/CarfaxUploader";
import ListingPreview from "../components/listing/ListingPreview";
import FeatureSelector from "../components/listing/FeatureSelector";

export default function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingVehicleId = searchParams.get('id');

  const [currentStep, setCurrentStep] = useState(1);
  const [vinNumber, setVinNumber] = useState("");
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinDecodeError, setVinDecodeError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    make: "",
    model: "",
    trim: "",
    year: new Date().getFullYear(),
    price: "",
    mileage: "",
    condition: "good",
    seller_type: "private",
    vin: "",
    location: "", // Combined city and state into a single location field
    latitude: null, // New: latitude for selected location
    longitude: null, // New: longitude for selected location
    description: "",
    fuel_type: "gasoline",
    transmission: "automatic",
    body_style: "sedan",
    drive_type: "fwd",
    doors: "",
    seating_capacity: "",
    engine_type: "",
    exterior_color: "",
    interior_color: "",
    efficiency_city: "",
    efficiency_highway: "",
    features: [],
    contact_info: {
      phone: "",
      email: "",
      dealer_name: ""
    }
  });
  const [images, setImages] = useState([]);
  const [carfaxReportUrl, setCarfaxReportUrl] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New: AI enrichment state
  const [isEnriching, setIsEnriching] = useState(false);

  // New: Contact info validation state
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phone: '',
  });

  // New: States for location autocomplete
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(-1);
  const debounceTimeoutRef = useRef(null); // Ref for debounce timer

  // New: AI title generation state and errors
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [errors, setErrors] = useState({ title: '' }); // Specific errors, can be expanded

  // State to hold current user info, added for authentication check
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Function to check user authentication and set currentUser state
  const checkAuthentication = async () => {
    setIsAuthLoading(true); // Set loading true at the start
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      setCurrentUser(null); // Explicitly set to null if authentication fails
    } finally {
      setIsAuthLoading(false); // Auth check is complete
    }
  };

  useEffect(() => {
    // Call authentication check on component mount
    checkAuthentication();

    const loadEditingData = async () => {
      if (editingVehicleId) {
        try {
          const vehicles = await Vehicle.filter({ id: editingVehicleId });
          if (vehicles.length > 0) {
            const v = vehicles[0];
            setFormData({
              title: v.title || "",
              make: v.make || "",
              model: v.model || "",
              trim: v.trim || "",
              year: v.year || new Date().getFullYear(),
              price: v.price || "",
              mileage: v.mileage || "",
              condition: v.condition || "good",
              seller_type: v.seller_type || "private",
              vin: v.vin || "",
              location: v.location || "", // Changed from separate city/state
              latitude: v.latitude || null, // Load existing latitude
              longitude: v.longitude || null, // Load existing longitude
              description: v.description || "",
              fuel_type: v.fuel_type || "gasoline",
              transmission: v.transmission || "automatic",
              body_style: v.body_style || "sedan",
              drive_type: v.drive_type || "fwd",
              doors: v.doors || "",
              seating_capacity: v.seating_capacity || "",
              engine_type: v.engine_type || "",
              exterior_color: v.exterior_color || "",
              interior_color: v.interior_color || "",
              efficiency_city: v.efficiency_city || "",
              efficiency_highway: v.efficiency_highway || "",
              features: v.features || [],
              contact_info: v.contact_info || { phone: "", email: "", dealer_name: "" }
            });
            setImages(v.images || []);
            setCarfaxReportUrl(v.carfax_report_url || null);
            setAiAnalysis(v.ai_analysis || null);
            setVinNumber(v.vin || "");
          } else {
            setError("Could not find the listing to edit.");
          }
        } catch (err) {
          setError("Failed to load listing data for editing.");
          console.error(err);
        }
      }
      setIsLoading(false);
    };

    loadEditingData();
  }, [editingVehicleId]); // Keep existing dependency array

  // Effect to clean up the debounce timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const validateEmail = (email) => {
    if (!email) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const validatePhone = (phone) => {
    if (!phone) return "Phone number is required.";
    // This regex is fairly permissive for international numbers
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,8}$/im;
    if (!phoneRegex.test(phone)) {
      return "Please enter a valid phone number format.";
    }
    return "";
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [name]: value
      }
    }));
    // Clear validation error on change
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleContactBlur = (e) => {
    const { name, value } = e.target;
    let error = '';
    if (name === 'email') {
      error = validateEmail(value);
    } else if (name === 'phone') {
      error = validatePhone(value);
    }
    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFeatureChange = (feature, isChecked) => {
    setFormData(prev => {
      const currentFeatures = prev.features || [];
      if (isChecked) {
        // Add feature if it's not already there
        if (!currentFeatures.includes(feature)) {
          return { ...prev, features: [...currentFeatures, feature] };
        }
      } else {
        // Remove feature
        return { ...prev, features: currentFeatures.filter(f => f !== feature) };
      }
      return prev; // Return previous state if no change
    });
  };

  // The function that actually fetches location suggestions from the API
  const fetchLocationSuggestions = async (value) => {
    if (value.length < 2) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      setLocationError(""); // Clear error if input is too short
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      // Use OpenStreetMap Nominatim for location suggestions with better filtering - US only
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=10&countrycodes=us&addressdetails=1&featuretype=settlement`,
        {
          headers: {
            'User-Agent': 'QarvisApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const suggestions = data
        .filter(item => {
          const address = item.address;
          const city = address?.city || address?.town || address?.village || address?.hamlet;
          const state = address?.state;
          
          // More strict filtering - only include if we have clear city and state
          // AND the city name contains part of what the user typed
          if (!city || !state) return false;
          
          const userInput = value.toLowerCase();
          const cityName = city.toLowerCase();
          
          // Check if the city name starts with or contains the user input
          return cityName.includes(userInput) || cityName.startsWith(userInput);
        })
        .map(item => {
          const address = item.address;
          const city = address.city || address.town || address.village || address.hamlet;
          const state = address.state;
          
          // Calculate relevance score based on how well it matches the input
          const userInput = value.toLowerCase();
          const cityName = city.toLowerCase();
          let relevanceScore = 0;
          
          if (cityName.startsWith(userInput)) {
            relevanceScore += 10; // Higher score for starts with
          }
          if (cityName === userInput) {
            relevanceScore += 20; // Highest score for exact match
          }
          if (cityName.includes(userInput)) {
            relevanceScore += 5; // Lower score for contains
          }
          
          return {
            display: `${city}, ${state}`,
            city,
            state,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            importance: item.importance || 0,
            relevanceScore
          };
        })
        // Remove duplicates based on display string
        .filter((item, index, self) =>
          index === self.findIndex(t => t.display === item.display)
        )
        // Sort by relevance score first, then by importance
        .sort((a, b) => {
          if (a.relevanceScore !== b.relevanceScore) {
            return b.relevanceScore - a.relevanceScore;
          }
          return b.importance - a.importance;
        })
        .slice(0, 6); // Limit to top 6 most relevant suggestions

      setLocationSuggestions(suggestions);
      setShowLocationSuggestions(suggestions.length > 0);
      setSelectedLocationIndex(-1);
      setLocationError(""); // Clear any previous error on successful search
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      // Optionally set a generic error message for location input
      // setLocationError("Could not fetch location suggestions. Please try again.");
    }
    setIsLoadingSuggestions(false);
  }

  // The debounced handler for the location input's onChange event
  const handleLocationSearch = (value) => {
    // Immediately update the input's displayed value
    setFormData(prev => ({ ...prev, location: value }));

    // Clear the previous timeout to reset the debounce timer
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout to fetch suggestions after a delay
    debounceTimeoutRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 300); // 300ms delay
  };

  const handleLocationSelect = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      location: suggestion.display,
      latitude: suggestion.lat,
      longitude: suggestion.lon
    }));
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    setSelectedLocationIndex(-1);
    setLocationError(""); // Clear any previous location errors
  };

  const handleLocationKeyDown = (e) => {
    if (!showLocationSuggestions || locationSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedLocationIndex(prev =>
          prev < locationSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedLocationIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedLocationIndex >= 0 && selectedLocationIndex < locationSuggestions.length) {
          handleLocationSelect(locationSuggestions[selectedLocationIndex]);
        } else if (locationSuggestions.length === 1) { // If only one suggestion, select it on Enter
            handleLocationSelect(locationSuggestions[0]);
        }
        break;
      case 'Escape':
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
        break;
      case 'Tab': // Hide suggestions on tab out
        setShowLocationSuggestions(false);
        setSelectedLocationIndex(-1);
        break;
      default:
        // Do nothing for other keys
        break;
    }
  };

  const handleGenerateTitle = async (dataForTitle) => {
    const vehicleData = dataForTitle || formData; // Use passed data or current form data
    if (!vehicleData.make || !vehicleData.model || !vehicleData.year) {
      setErrors(prev => ({...prev, title: "Please fill in Make, Model, and Year before generating a title."}));
      return;
    }
    setErrors(prev => ({...prev, title: ""})); // Clear previous error
    setIsGeneratingTitle(true);
    try {
      const titlePrompt = `Generate a concise, attractive, and SEO-friendly title for a vehicle listing.
      Include the year, make, model, and trim.
      Highlight 1-2 key features or the condition.
      
      Vehicle Details:
      - Year: ${vehicleData.year}
      - Make: ${vehicleData.make}
      - Model: ${vehicleData.model}
      - Trim: ${vehicleData.trim || ''}
      - Condition: ${vehicleData.condition}
      - Mileage: ${vehicleData.mileage}
      - Key Features: ${vehicleData.features?.slice(0, 2).join(', ') || 'N/A'}

      Examples:
      - 2021 Ford Bronco Sport Big Bend - Low Miles, 4x4
      - 2018 Tesla Model 3 Long Range - Autopilot, Premium Interior
      - 2022 Honda Civic Sport - Excellent Condition, Apple CarPlay

      Generate one title. Return only the title text without any quotation marks or special formatting.`;

      const response = await InvokeLLM({ prompt: titlePrompt });
      const cleanTitle = response.replace(/^["']|["']$/g, '').trim(); // Ensure no quotes
      setFormData(prev => ({ ...prev, title: cleanTitle }));
    } catch (error) {
      console.error("Error generating title:", error);
      setErrors(prev => ({ ...prev, title: "Could not generate title. Please try again." }));
    }
    setIsGeneratingTitle(false);
  };

  const handleVinDecode = async () => {
    if (!vinNumber || vinNumber.length !== 17) {
      setVinDecodeError("Please enter a valid 17-character VIN");
      return;
    }

    setIsDecodingVin(true);
    setVinDecodeError("");

    try {
      const response = await InvokeLLM({
        prompt: `Decode this Vehicle Identification Number (VIN): ${vinNumber}

Please provide detailed vehicle information including:
- Make (manufacturer)
- Model
- Year
- Trim level/package
- Engine type and size
- Transmission type (automatic/manual/CVT)
- Fuel type (gasoline/hybrid/electric/diesel)
- Body style
- Any other relevant specifications including exterior and interior color if available, and estimated city/highway MPG.

Use reliable VIN decoding sources and automotive databases to ensure accuracy.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            make: { type: "string", description: "Vehicle manufacturer" },
            model: { type: "string", description: "Vehicle model" },
            year: { type: "integer", description: "Model year" },
            trim: { type: "string", description: "Trim level or package" },
            engine: { type: "string", description: "Engine specifications" },
            transmission: { type: "string", enum: ["automatic", "manual", "cvt"], description: "Transmission type" },
            fuel_type: { type: "string", enum: ["gasoline", "hybrid", "electric", "diesel"], description: "Fuel type" },
            body_style: { type: "string", description: "Body style (sedan, SUV, coupe, etc.)" },
            drive_type: { type: "string", enum: ["fwd", "rwd", "awd", "4wd"], description: "Drive type (FWD, RWD, AWD, 4WD)" },
            doors: { type: "integer", description: "Number of doors" },
            seating_capacity: { type: "integer", description: "Number of seats" },
            exterior_color: { type: "string", description: "Exterior color of the vehicle" },
            interior_color: { type: "string", description: "Interior color of the vehicle" },
            efficiency_city: { type: "number", description: "Estimated city MPG" },
            efficiency_highway: { type: "number", description: "Estimated highway MPG" },
            success: { type: "boolean", description: "Whether VIN decoding was successful" },
            error_message: { type: "string", description: "Error message if decoding failed" }
          }
        }
      });

      if (response.success) {
        const decodedData = {
          make: response.make || "",
          model: response.model || "",
          year: response.year || new Date().getFullYear(),
          trim: response.trim || "",
          vin: vinNumber,
          fuel_type: response.fuel_type || "gasoline",
          transmission: response.transmission || "automatic",
          body_style: response.body_style?.toLowerCase().replace(" ", "-") || "sedan", // Ensure it matches a dropdown option
          drive_type: response.drive_type?.toLowerCase() || "fwd", // Ensure it matches a dropdown option
          doors: response.doors || "",
          seating_capacity: response.seating_capacity || "",
          engine_type: response.engine || "",
          exterior_color: response.exterior_color || "",
          interior_color: response.interior_color || "",
          efficiency_city: response.efficiency_city || "",
          efficiency_highway: response.efficiency_highway || ""
        };

        // Generate description with VIN decode results
        const autoDescription = `This is a ${decodedData.year || ''} ${decodedData.make || ''} ${decodedData.model || ''} ${decodedData.trim ? `(${decodedData.trim})` : ''}
${decodedData.engine_type ? `Engine: ${decodedData.engine_type}. ` : ''}
${decodedData.body_style ? `Body Style: ${decodedData.body_style}. ` : ''}
${decodedData.drive_type ? `Drive Type: ${decodedData.drive_type}. ` : ''}

VIN decoded automatically. Please verify all information and add additional details about condition, features, and history.`;

        const updatedFormDataForVin = {
            ...formData, // Start with current form data to preserve other fields
            ...decodedData, // Overlay with decoded data
            description: autoDescription
        };

        setFormData(updatedFormDataForVin); // Update the state
        await handleGenerateTitle(updatedFormDataForVin); // Generate title based on the newly updated data

      } else {
        setVinDecodeError(response.error_message || "Unable to decode VIN. Please enter vehicle information manually.");
      }
    } catch (error) {
      console.error("VIN decode error:", error);
      setVinDecodeError("VIN decoding failed. Please try again or enter vehicle information manually.");
    }

    setIsDecodingVin(false);
  };

  const clearVinData = () => {
    setVinNumber("");
    setVinDecodeError("");
    setFormData((prev) => ({
      ...prev,
      make: "",
      model: "",
      year: new Date().getFullYear(),
      trim: "",
      vin: "",
      fuel_type: "gasoline",
      transmission: "automatic",
      body_style: "sedan",
      drive_type: "fwd",
      doors: "",
      seating_capacity: "",
      engine_type: "",
      exterior_color: "",
      interior_color: "",
      efficiency_city: "",
      efficiency_highway: "",
      description: "",
      title: "" // Clear title when VIN data is cleared
    }));
  };

  const handleImageUpload = async (files) => {
    setIsAnalyzing(true);
    try {
      const uploadPromises = files.map((file) => UploadFile({ file }));
      const uploadResults = await Promise.all(uploadPromises);
      const imageUrls = uploadResults.map((result) => result.file_url);

      const updatedImages = [...images, ...imageUrls];
      setImages(updatedImages);

      // Generate AI analysis if we now have at least one image
      if (updatedImages.length > 0) {
        // If Carfax data already exists, pass it along
        const currentCarfaxAnalysis = aiAnalysis?.carfax_analysis || null;
        await generateAIAnalysis(updatedImages, currentCarfaxAnalysis);
      }
    } catch (error) {
      setError("Error uploading images. Please try again.");
    }
    setIsAnalyzing(false);
  };

  const handleImageReorder = async (newImageOrder) => {
    setImages(newImageOrder);

    // Re-run AI analysis with new order since first 4 images are analyzed
    if (newImageOrder.length > 0) {
      setIsAnalyzing(true);
      try {
        const currentCarfaxAnalysis = aiAnalysis?.carfax_analysis || null;
        await generateAIAnalysis(newImageOrder, currentCarfaxAnalysis);
      } catch (error) {
        console.error("Error re-analyzing images after reorder:", error);
      }
      setIsAnalyzing(false);
    }
  };

  const generateAIAnalysis = async (allImages, carfaxData = null) => {
    let carfaxContext = "";
    if (carfaxData) {
      carfaxContext = `
        Carfax History:
        - Accidents: ${carfaxData.accidents_reported ?? 'N/A'}
        - Owners: ${carfaxData.number_of_owners ?? 'N/A'}
        - Service Records: ${carfaxData.service_records ?? 'N/A'}
        - Salvage Title: ${carfaxData.salvage_title ? 'Yes' : 'No'}
        - Summary: ${carfaxData.summary ?? ''}
      `;
    }

    try {
      // Use the first 4 images for analysis
      const imagesToAnalyze = allImages.slice(0, 4);
      const imageLabels = ["Front", "Left Side", "Back", "Right Side"];

      let imageContext = "";
      if (imagesToAnalyze.length > 0) {
        imageContext = `\n\nImage Analysis Instructions:
You have ${imagesToAnalyze.length} vehicle images to analyze:
${imagesToAnalyze.map((_, index) => `- Image ${index + 1}: ${imageLabels[index] || `Photo ${index + 1}`} view`).join('\n')}

Please analyze ALL provided images comprehensively to assess:
- Overall vehicle condition from multiple angles
- Any visible damage, scratches, dents, or wear
- Paint condition and consistency
- Body panel alignment
- Tire condition (if visible)
- Any other condition indicators across all views`;
      }

      const response = await InvokeLLM({
        prompt: `Analyze this vehicle and its history, providing comprehensive insights about:
        1. Overall condition assessment (score 1-10) based on ALL provided images
        2. Any visible damage, wear, or issues from multiple angles
        3. Suggested market price range based on visible condition and history
        4. Key selling points or concerns, incorporating Carfax data

        Vehicle details: ${formData.year} ${formData.make} ${formData.model} ${formData.trim}
        Listed price: $${formData.price}
        Mileage: ${formData.mileage} miles
        ${carfaxContext}${imageContext}`,
        file_urls: imagesToAnalyze.length > 0 ? imagesToAnalyze : [],
        response_json_schema: {
          type: "object",
          properties: {
            condition_score: { type: "number" },
            price_fairness: { type: "string", enum: ["excellent_deal", "good_deal", "fair_price", "overpriced"] },
            market_comparison: { type: "number" },
            summary: { type: "string" },
            image_flags: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAiAnalysis((prev) => ({
        ...prev,
        ...response
      }));
    } catch (error) {
      console.error("Error generating AI analysis:", error);
    }
  };

  const handleCarfaxUpload = async (file) => {
    try {
      const { file_url } = await UploadFile({ file });
      setCarfaxReportUrl(file_url);

      const extractedData = await ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            accidents_reported: { type: "integer", description: "Number of accidents reported" },
            service_records: { type: "integer", description: "Number of service history records" },
            number_of_owners: { type: "integer", description: "Number of previous owners" },
            salvage_title: { type: "boolean", description: "Whether the vehicle has a salvage title" },
            summary: { type: "string", description: "A brief summary of the vehicle history report." }
          }
        }
      });

      if (extractedData.status === 'success' && extractedData.output) {
        setAiAnalysis((prev) => ({
          ...prev,
          carfax_analysis: extractedData.output
        }));
        // Re-run main analysis with new carfax data, using all available images
        await generateAIAnalysis(images, extractedData.output);
        return { success: true, message: "Carfax analyzed successfully!" };
      } else {
        throw new Error(extractedData.details || "Could not extract data from Carfax report.");
      }
    } catch (error) {
      console.error("Error processing Carfax report:", error);
      setError("Failed to analyze Carfax report. Please try again.");
      return { success: false, message: "Failed to analyze Carfax report." };
    }
  };

  // generateListingTitle is replaced by handleGenerateTitle

  // Updated geocodeLocation to work with the new location field and prioritize existing coordinates
  const geocodeLocation = async (locationString) => {
    if (!locationString) return { latitude: null, longitude: null };

    // If we already have coordinates from the autocomplete selection, use them
    if (formData.latitude && formData.longitude) {
      return { latitude: formData.latitude, longitude: formData.longitude };
    }

    try {
      const { geocodeCity } = await import("@/api/functions");
      const { data } = await geocodeCity({ cityState: locationString });

      if (data.success && data.coordinates) {
        return {
          latitude: data.coordinates.lat,
          longitude: data.coordinates.lng
        };
      }

      return { latitude: null, longitude: null };
    } catch (error) {
      console.error('Error geocoding location:', error);
      return { latitude: null, longitude: null };
    }
  };

  const enrichVehicleData = async (vehicleId, vehicleData) => {
    setIsEnriching(true);
    try {
        const { year, make, model, trim } = vehicleData;
        const prompt = `Research the vehicle: ${year} ${make} ${model} ${trim || ''}. Provide its typical horsepower, 0-60 mph time, and up to 5 common descriptive tags. Use tags from this list if applicable: sporty, luxury, reliable, family-friendly, off-road, commuter, economical, safe, high-performance, classic.`;
        const researchResult = await InvokeLLM({
            prompt: prompt,
            add_context_from_internet: true,
            response_json_schema: {
                type: "object",
                properties: {
                    horsepower: { type: "integer", description: "Engine horsepower" },
                    zero_to_sixty_time: { type: "number", description: "0-60 mph acceleration time in seconds" },
                    ai_tags: {
                        type: "array",
                        items: { type: "string" },
                        description: "Descriptive tags like 'sporty', 'luxury', 'reliable'."
                    }
                }
            }
        });

        const updatePayload = {};
        if (researchResult.horsepower) updatePayload.horsepower = researchResult.horsepower;
        if (researchResult.zero_to_sixty_time) updatePayload.zero_to_sixty_time = researchResult.zero_to_sixty_time;
        if (researchResult.ai_tags?.length > 0) updatePayload.ai_tags = researchResult.ai_tags;

        if (Object.keys(updatePayload).length > 0) {
            await Vehicle.update(vehicleId, updatePayload);
            console.log(`Enriched vehicle ${vehicleId} with:`, updatePayload);
        }

    } catch (error) {
        console.error("Failed to enrich vehicle data:", error);
        // Do not show an error to the user for this background task
    } finally {
        setIsEnriching(false);
    }
  };

  const handleSaveProgress = async () => {
    if (!editingVehicleId) return;
    setIsSavingProgress(true);
    setError("");
    setShowSaveConfirmation(false); // Clear previous confirmation on new save attempt

    try {
      const coordinates = await geocodeLocation(formData.location); // Use formData.location

      const vehicleData = {
        ...formData,
        location: formData.location || "", // Use the new location field directly
        price: parseFloat(formData.price) || 0,
        year: parseInt(formData.year) || 0,
        mileage: parseInt(formData.mileage) || 0,
        doors: formData.doors ? parseInt(formData.doors) : null,
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
        efficiency_city: formData.efficiency_city ? parseFloat(formData.efficiency_city) : null,
        efficiency_highway: formData.efficiency_highway ? parseFloat(formData.efficiency_highway) : null,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        images,
        carfax_report_url: carfaxReportUrl,
        ai_analysis: aiAnalysis
      };

      // Remove empty string fields to avoid validation issues
      Object.keys(vehicleData).forEach(key => {
        if (vehicleData[key] === "") {
          delete vehicleData[key];
        }
      });

      // Ensure city and state properties are not sent if they somehow still exist in the payload
      delete vehicleData.city;
      delete vehicleData.state;

      await Vehicle.update(editingVehicleId, vehicleData);

      // Trigger AI enrichment in the background for saved changes
      enrichVehicleData(editingVehicleId, vehicleData);

      // Show confirmation message
      setShowSaveConfirmation(true);
      // Hide it after 3 seconds
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } catch (err) {
      console.error("Error saving progress:", err);
      setError("Failed to save progress. Please try again.");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPublishing(true);
    setError("");
    setSuccess(false);

    // Final validation for contact info before publishing
    const emailError = validateEmail(formData.contact_info.email);
    const phoneError = validatePhone(formData.contact_info.phone);

    // Check for title presence
    if (!formData.title || formData.title.trim() === "") {
        setErrors(prev => ({...prev, title: "Listing title is required."}));
        setError("Please ensure all required fields are filled, including the listing title.");
        setIsPublishing(false);
        return;
    }

    if (emailError || phoneError) {
      setValidationErrors({
        email: emailError,
        phone: phoneError,
      });
      setError("Please fix the errors in your contact information before publishing."); // Set a general error message
      // Scroll to the contact info section
      setTimeout(() => {
        const contactSection = document.getElementById('contact-info-section');
        if (contactSection) {
          contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      setIsPublishing(false);
      return;
    }


    try {
      // Geocode the location before saving
      const coordinates = await geocodeLocation(formData.location); // Use formData.location

      const vehicleData = {
        ...formData,
        location: formData.location || "", // Use the new location field directly
        price: parseFloat(formData.price) || 0,
        year: parseInt(formData.year) || 0,
        mileage: parseInt(formData.mileage) || 0,
        doors: formData.doors ? parseInt(formData.doors) : null,
        seating_capacity: formData.seating_capacity ? parseInt(formData.seating_capacity) : null,
        efficiency_city: formData.efficiency_city ? parseFloat(formData.efficiency_city) : null,
        efficiency_highway: formData.efficiency_highway ? parseFloat(formData.efficiency_highway) : null,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        images,
        carfax_report_url: carfaxReportUrl,
        ai_analysis: aiAnalysis,
        status: "active"
      };

      // Remove empty string fields to avoid validation issues
      Object.keys(vehicleData).forEach(key => {
        if (vehicleData[key] === "") {
          delete vehicleData[key];
        }
      });

      // Ensure city and state properties are not sent if they somehow still exist in the payload
      delete vehicleData.city;
      delete vehicleData.state;

      let savedVehicle;
      if (editingVehicleId) {
        await Vehicle.update(editingVehicleId, vehicleData);
        savedVehicle = { id: editingVehicleId, ...vehicleData };
      } else {
        const newVehicle = await Vehicle.create(vehicleData);
        savedVehicle = newVehicle;
      }
      setSuccess(true);
      setError("");

      // Trigger AI enrichment in the background
      enrichVehicleData(savedVehicle.id, formData);

      setTimeout(() => {
        navigate(createPageUrl("MyListings"));
      }, 2000);
    } catch (err) {
      console.error("Error saving listing:", err);
      setError("Error saving listing. Please try again.");
      setSuccess(false);
    } finally {
      setIsPublishing(false);
    }
  };

  const steps = [
  { number: 1, title: "Basic Info", description: "Vehicle details" },
  { number: 2, title: "Images & AI", description: "Photos & analysis" },
  { number: 3, title: "Contact", description: "Your information" },
  { number: 4, title: "Preview", description: "Review & publish" }];

  if (isAuthLoading || (isLoading && editingVehicleId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
            <div className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-slate-600">Loading...</span>
            </div>
        </div>);
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Card className="premium-card rounded-2xl text-center max-w-md w-full">
          <CardContent className="p-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Sign In to Sell Your Car</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Please sign in to create a new vehicle listing and access our AI-powered tools.
            </p>
            <Button
              onClick={() => User.loginWithRedirect(window.location.href)}
              className="premium-button text-white rounded-xl px-8 py-3 w-full"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl(editingVehicleId ? "MyListings" : "Marketplace"))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{editingVehicleId ? "Edit Your Vehicle" : "Sell Your Vehicle"}</h1>
            <p className="text-slate-600">{editingVehicleId ? "Update your listing details below" : "Create a professional listing with AI insights"}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) =>
            <div key={step.number} className="flex items-center">
                <button
                onClick={() => editingVehicleId && setCurrentStep(step.number)}
                disabled={!editingVehicleId}
                className={`flex items-center gap-3 ${index < steps.length - 1 ? 'flex-1' : ''} ${editingVehicleId ? 'cursor-pointer group' : 'cursor-default'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                step.number <= currentStep ?
                'bg-blue-600 text-white' :
                'bg-slate-200 text-slate-500'} ${
                editingVehicleId && 'group-hover:bg-blue-200 group-hover:text-blue-600'}`
                }>
                    {step.number < currentStep ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="font-medium text-slate-800">{step.title}</p>
                    <p className="text-xs text-slate-500">{step.description}</p>
                  </div>
                </button>
                {index < steps.length - 1 &&
              <div className={`hidden md:block flex-1 h-px mx-4 ${
              step.number < currentStep ? 'bg-blue-600' : 'bg-slate-200'}`
              } />
              }
              </div>
            )}
          </div>
        </div>

        {error &&
        <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }
        {success && !editingVehicleId &&
            <Alert variant="default" className="mb-6 border-emerald-200 bg-emerald-50">
                <Check className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-700">Listing successfully published! Redirecting to your listings.</AlertDescription>
            </Alert>
        }

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
          {currentStep === 1 &&
          <>
              {/* VIN Decoder Card */}
              <Card className="premium-card rounded-2xl border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-slate-950 font-semibold leading-none tracking-tight flex items-center gap-2">Quick Start: VIN Decoder
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-slate-600">
                    Enter your vehicle's VIN number to automatically populate all vehicle details, or skip to enter information manually.
                  </p>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                      placeholder="Enter 17-character VIN (e.g., 1HGBH41JXMN109186)"
                      value={vinNumber}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
                        if (value.length <= 17) {
                          setVinNumber(value);
                          setVinDecodeError("");
                        }
                      }}
                      className="rounded-xl"
                      maxLength={17}
                      />
                    </div>
                    <Button
                    onClick={handleVinDecode}
                    disabled={vinNumber.length !== 17 || isDecodingVin}
                    className="premium-button text-white rounded-xl px-6"
                    >
                      {isDecodingVin ?
                    <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Decoding...
                        </> :
                    <>
                          <Brain className="w-4 h-4 mr-2" />
                          Decode VIN
                        </>
                    }
                    </Button>
                  </div>

                  {vinDecodeError &&
                <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{vinDecodeError}</AlertDescription>
                    </Alert>
                }

                  {formData.vin &&
                <Alert className="border-emerald-200 bg-emerald-50">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="text-emerald-700">
                        VIN decoded successfully! Vehicle information has been auto-filled. Please review and update as needed.
                        <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearVinData}
                      className="ml-2 text-emerald-600 hover:text-emerald-700"
                      >
                          Clear & Start Over
                        </Button>
                      </AlertDescription>
                    </Alert>
                }

                  <div className="text-center">
                    <div className="text-sm text-slate-500 mb-2">OR</div>
                    <p className="text-slate-600">Enter vehicle information manually below</p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Generated Title Card */}
              <Card className="premium-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    AI-Generated Title
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 mb-4">
                    Enter a title manually, or let our AI create an optimized title for you based on your vehicle's details.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter a title or generate one with AI"
                      className="rounded-xl flex-grow"
                    />
                    <Button
                      onClick={() => handleGenerateTitle()}
                      disabled={isGeneratingTitle}
                      className="premium-button text-white rounded-xl whitespace-nowrap"
                    >
                      {isGeneratingTitle ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Generate Title
                        </>
                      )}
                    </Button>
                  </div>
                  {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
                </CardContent>
              </Card>

              <Card className="premium-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="make">Make *</Label>
                      <Input
                      id="make"
                      value={formData.make}
                      onChange={(e) => handleInputChange('make', e.target.value)}
                      placeholder="e.g., Toyota"
                      className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model *</Label>
                      <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="e.g., Camry"
                      className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trim">Trim *</Label>
                      <Input
                      id="trim"
                      value={formData.trim}
                      onChange={(e) => handleInputChange('trim', e.target.value)}
                      placeholder="e.g., XLE, Sport"
                      className="rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Input
                      id="year"
                      type="number"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="25000"
                      className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Mileage *</Label>
                      <Input
                      id="mileage"
                      type="number"
                      value={formData.mileage}
                      onChange={(e) => handleInputChange('mileage', e.target.value)}
                      placeholder="50000"
                      className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fuel_type">Fuel Type</Label>
                      <Select value={formData.fuel_type} onValueChange={(value) => handleInputChange('fuel_type', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gasoline">Gasoline</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                          <SelectItem value="electric">Electric</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="transmission">Transmission</Label>
                      <Select value={formData.transmission} onValueChange={(value) => handleInputChange('transmission', value)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="automatic">Automatic</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="cvt">CVT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Doors remain in this card */}
                    <div className="space-y-2">
                      <Label htmlFor="doors">Doors</Label>
                      <Input
                        id="doors"
                        type="number"
                        min="2"
                        max="6"
                        value={formData.doors}
                        onChange={(e) => handleInputChange('doors', e.target.value)}
                        placeholder="e.g., 4"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Location Input (Combined city and state) */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        onKeyDown={handleLocationKeyDown}
                        onFocus={() => {
                          if (locationSuggestions.length > 0 || formData.location) { // Show suggestions if already populated or has previous suggestions
                            setShowLocationSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          // Delay hiding suggestions to allow for clicks
                          setTimeout(() => setShowLocationSuggestions(false), 200);
                        }}
                        placeholder="e.g., Los Angeles, CA or New York, NY"
                        className="rounded-xl pr-8"
                        autoComplete="off"
                      />
                      {isLoadingSuggestions && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                      )}
                      {!isLoadingSuggestions && formData.location && locationSuggestions.length > 0 && showLocationSuggestions && (
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      )}

                      {/* Location Suggestions Dropdown */}
                      {showLocationSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                          {locationSuggestions.map((suggestion, index) => (
                            <button
                              key={`${suggestion.display}-${index}`}
                              type="button"
                              className={`w-full px-4 py-3 text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none transition-colors ${
                                index === selectedLocationIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                              } ${index === 0 ? 'rounded-t-xl' : ''} ${index === locationSuggestions.length - 1 ? 'rounded-b-xl' : 'border-b border-slate-100'}`}
                              onClick={() => handleLocationSelect(suggestion)}
                              onMouseEnter={() => setSelectedLocationIndex(index)}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="font-medium">{suggestion.display}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {locationError && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{locationError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your vehicle's condition, history, and features..."
                    className="rounded-xl h-32"
                    />
                  </div>

                  {/* Moved Vehicle Specifications */}
                  <div className="pt-6 border-t border-slate-200/80">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Vehicle Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <Label htmlFor="body_style">Body Style</Label>
                        <Select name="body_style" value={formData.body_style} onValueChange={(value) => handleInputChange('body_style', value)}>
                          <SelectTrigger id="body_style" className="rounded-xl">
                            <SelectValue placeholder="Select body style" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sedan">Sedan</SelectItem>
                            <SelectItem value="suv">SUV</SelectItem>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="coupe">Coupe</SelectItem>
                            <SelectItem value="convertible">Convertible</SelectItem>
                            <SelectItem value="hatchback">Hatchback</SelectItem>
                            <SelectItem value="wagon">Wagon</SelectItem>
                            <SelectItem value="van">Van</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="drive_type">Drive Type</Label>
                        <Select name="drive_type" value={formData.drive_type} onValueChange={(value) => handleInputChange('drive_type', value)}>
                          <SelectTrigger id="drive_type" className="rounded-xl">
                            <SelectValue placeholder="Select drive type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fwd">FWD</SelectItem>
                            <SelectItem value="rwd">RWD</SelectItem>
                            <SelectItem value="awd">AWD</SelectItem>
                            <SelectItem value="4wd">4WD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="seating_capacity">Seating Capacity</Label>
                        <Input id="seating_capacity" type="number" name="seating_capacity" placeholder="e.g., 5" value={formData.seating_capacity} onChange={(e) => handleInputChange('seating_capacity', e.target.value)} className="rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="exterior_color">Exterior Color</Label>
                        <Input id="exterior_color" name="exterior_color" placeholder="e.g., Cosmic Blue" value={formData.exterior_color} onChange={(e) => handleInputChange('exterior_color', e.target.value)} className="rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="interior_color">Interior Color</Label>
                        <Input id="interior_color" name="interior_color" placeholder="e.g., Black Leather" value={formData.interior_color} onChange={(e) => handleInputChange('interior_color', e.target.value)} className="rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="engine_type">Engine</Label>
                        <Input id="engine_type" name="engine_type" placeholder="e.g., 2.5L I4" value={formData.engine_type} onChange={(e) => handleInputChange('engine_type', e.target.value)} className="rounded-xl" />
                      </div>
                      <div className="md:col-span-2 lg:col-span-1">
                        <Label>Fuel Efficiency (MPG)</Label>
                        <div className="flex gap-2">
                          <Input type="number" name="efficiency_city" placeholder="City" value={formData.efficiency_city} onChange={(e) => handleInputChange('efficiency_city', e.target.value)} className="rounded-xl" />
                          <Input type="number" name="efficiency_highway" placeholder="Highway" value={formData.efficiency_highway} onChange={(e) => handleInputChange('efficiency_highway', e.target.value)} className="rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <CarfaxUploader
                  onCarfaxUpload={handleCarfaxUpload}
                  existingCarfaxUrl={carfaxReportUrl} />

                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                 {editingVehicleId &&
              <div className="flex items-center gap-3">
                    <Button
                  onClick={handleSaveProgress}
                  variant="outline"
                  disabled={isSavingProgress}
                  className="rounded-xl"
                  >
                      {isSavingProgress ?
                  <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </> :
                  <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                  }
                    </Button>
                    {showSaveConfirmation &&
                <span className="text-green-600 text-sm font-medium">
                        Changes saved
                      </span>
                }
                  </div>
              }
                <Button
                onClick={() => setCurrentStep(2)}
                disabled={!formData.make || !formData.model || !formData.title || !formData.trim || !formData.year || !formData.price || !formData.mileage}
                className="premium-button text-white rounded-xl px-8 ml-auto"
                >
                  Next: Add Photos
                </Button>
              </div>
            </>
          }

          {currentStep === 2 &&
          <>
              <ImageUploader
              images={images}
              onImageUpload={handleImageUpload}
              isAnalyzing={isAnalyzing}
              onRemoveImage={(index) => {
                const updatedImages = images.filter((_, i) => i !== index);
                setImages(updatedImages);
                // Re-run AI analysis if images are removed and there are still images
                if (updatedImages.length > 0) {
                  const currentCarfaxAnalysis = aiAnalysis?.carfax_analysis || null;
                  generateAIAnalysis(updatedImages, currentCarfaxAnalysis);
                } else {
                    setAiAnalysis(null); // Clear AI analysis if no images remain
                }
              }}
              onReorderImages={handleImageReorder} />

              <FeatureSelector selectedFeatures={formData.features} onFeatureChange={handleFeatureChange} />

              {aiAnalysis && <AIAnalysisCard analysis={aiAnalysis} />}

              {/* AI-Generated Title Card moved to Step 1 */}

              <div className="flex justify-between items-center">
                <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="rounded-xl"
                >
                  Previous
                </Button>
                 {editingVehicleId &&
              <div className="flex items-center gap-3">
                    <Button
                  onClick={handleSaveProgress}
                  variant="outline"
                  disabled={isSavingProgress} className="bg-background mx-2 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 rounded-xl"
                  >
                      {isSavingProgress ?
                  <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </> :
                  <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                  }
                    </Button>
                    {showSaveConfirmation &&
                <span className="text-green-600 text-sm font-medium">
                        Changes saved
                      </span>
                }
                  </div>
              }
                <Button
                onClick={() => setCurrentStep(3)}
                disabled={images.length === 0}
                className="premium-button text-white rounded-xl px-8 ml-auto"
                >
                  Next: Contact Info
                </Button>
              </div>
            </>
          }

          {currentStep === 3 &&
          <>
              <Card id="contact-info-section" className="premium-card rounded-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Seller Type</Label>
                    <RadioGroup
                      value={formData.seller_type}
                      onValueChange={(value) => handleInputChange('seller_type', value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="private" />
                        <Label htmlFor="private">Private Seller</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dealer" id="dealer" />
                        <Label htmlFor="dealer">Dealer</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.seller_type === 'dealer' &&
                <div className="space-y-2">
                      <Label htmlFor="dealer_name">Dealer Name</Label>
                      <Input
                    id="dealer_name"
                    name="dealer_name"
                    placeholder="Your dealership name"
                    value={formData.contact_info.dealer_name || ""}
                    onChange={handleContactChange}
                    className="rounded-xl"
                    />
                    </div>
                }

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.contact_info.email || ""}
                      onChange={handleContactChange}
                      onBlur={handleContactBlur}
                      placeholder="your@email.com"
                      className={`rounded-xl ${validationErrors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {validationErrors.email && <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.contact_info.phone || ""}
                      onChange={handleContactChange}
                      onBlur={handleContactBlur}
                      placeholder="(555) 123-4567"
                      className={`rounded-xl ${validationErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {validationErrors.phone && <p className="text-sm text-red-600 mt-1">{validationErrors.phone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
                className="rounded-xl"
                >
                  Previous
                </Button>
                 {editingVehicleId &&
              <div className="flex items-center gap-3">
                    <Button
                  onClick={handleSaveProgress}
                  variant="outline"
                  disabled={isSavingProgress} className="bg-background mx-2 px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 rounded-xl"
                  >
                      {isSavingProgress ?
                  <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </> :
                  <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                  }
                    </Button>
                    {showSaveConfirmation &&
                <span className="text-green-600 text-sm font-medium">
                        Changes saved
                      </span>
                }
                  </div>
              }
                <Button
                onClick={() => setCurrentStep(4)}
                className="premium-button text-white rounded-xl px-8 ml-auto"
                >
                  Preview Listing
                </Button>
              </div>
            </>
          }

          {currentStep === 4 &&
          <>
              <ListingPreview
              formData={formData}
              images={images}
              aiAnalysis={aiAnalysis} />

              <div className="flex justify-between">
                <Button
                onClick={() => setCurrentStep(3)}
                variant="outline"
                className="rounded-xl"
                >
                  Previous
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={isPublishing || isAnalyzing || isEnriching}
                    className="premium-button text-white rounded-xl px-8"
                >
                  {isPublishing ?
                <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      {editingVehicleId ? "Saving..." : "Publishing..."}
                    </> :
                editingVehicleId ? "Save Changes" : "Publish Listing"
                }
                </Button>
              </div>
              {(isAnalyzing || isEnriching) && (
                <div className="text-center text-sm text-blue-600 flex items-center justify-center gap-2 mt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Performing AI magic... {isAnalyzing ? 'Analyzing images...' : 'Researching specs...'}</span>
                </div>
              )}
            </>
          }
          </motion.div>
        </AnimatePresence>
      </div>
    </div>);

}
