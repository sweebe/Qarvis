
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { motion } from "framer-motion";
import { 
  User as UserIcon, 
  Camera, 
  Save, 
  Loader2, 
  Building2,
  Globe,
  Phone,
  Edit3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

import ImageCropper from "../components/profile/ImageCropper";

export default function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    phone: '',
    website: '',
    is_dealer: false,
    dealer_name: '',
    profile_picture_url: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setFormData({
        full_name: user.full_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        website: user.website || '',
        is_dealer: user.is_dealer || false,
        dealer_name: user.dealer_name || '',
        profile_picture_url: user.profile_picture_url || user.logo_url || ''
      });
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setMessage({ type: 'error', content: 'Failed to load profile. Please sign in.' });
    }
    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (message.type) setMessage({ type: '', content: '' });
  };

  const handleImageUpload = async (croppedBlob) => {
    setIsUploadingImage(true);
    setShowCropper(false);
    setSelectedImageFile(null);
    
    try {
      // Convert blob to file
      const file = new File([croppedBlob], 'profile-picture.jpg', { type: 'image/jpeg' });
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_picture_url: file_url }));
      setMessage({ type: 'success', content: 'Profile picture updated successfully!' });
    } catch (error) {
      console.error("Failed to upload image:", error);
      setMessage({ type: 'error', content: 'Failed to upload image. Please try again.' });
    }
    setIsUploadingImage(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImageFile(file);
      setShowCropper(true);
    } else {
      setMessage({ type: 'error', content: 'Please select a valid image file.' });
    }
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleCropperCancel = () => {
    setShowCropper(false);
    setSelectedImageFile(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = { ...formData };
      
      // If switching from dealer to private, clear dealer-specific fields
      if (!formData.is_dealer) {
        updateData.dealer_name = '';
      }
      
      await User.updateMyUserData(updateData);
      setCurrentUser(prev => ({ ...prev, ...updateData }));
      setMessage({ type: 'success', content: 'Profile updated successfully!' });
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({ type: 'error', content: 'Failed to update profile. Please try again.' });
    }
    setSaving(false);
  };

  const getInitials = (name, email) => {
    if (name) {
      const names = name.split(" ");
      return names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : name[0].toUpperCase();
    }
    return email ? email[0].toUpperCase() : "?";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <Card className="premium-card rounded-2xl p-8 text-center">
          <UserIcon className="w-16 h-16 mx-auto text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign In Required</h2>
          <p className="text-slate-600 mb-6">Please sign in to view and edit your profile.</p>
          <Button onClick={() => User.loginWithRedirect(window.location.href)} className="premium-button text-white rounded-xl">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Profile Settings</h1>
          <p className="text-slate-600">Manage your account information and preferences</p>
        </motion.div>

        {message.content && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} 
                   className={message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}>
              <AlertDescription>{message.content}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid gap-6">
          {/* Profile Picture Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="premium-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={formData.profile_picture_url} alt="Profile picture" />
                    <AvatarFallback className="text-2xl bg-slate-200 text-slate-600">
                      {getInitials(formData.full_name, currentUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-semibold text-slate-800 mb-1">Upload a new picture</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Choose a clear photo of yourself or your business logo. You'll be able to crop it to fit perfectly.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="rounded-xl"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        Choose Image
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="premium-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="rounded-xl"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="rounded-xl"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio / Description</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="rounded-xl min-h-[100px]"
                    placeholder="Tell others about yourself, your experience with cars, or your business..."
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="rounded-xl"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Seller Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="premium-card rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Seller Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_dealer"
                    checked={formData.is_dealer}
                    onCheckedChange={(checked) => handleInputChange('is_dealer', checked)}
                  />
                  <Label htmlFor="is_dealer" className="cursor-pointer">
                    I am a licensed dealer or business
                  </Label>
                </div>

                {formData.is_dealer && (
                  <div>
                    <Label htmlFor="dealer_name">Business/Dealer Name</Label>
                    <Input
                      id="dealer_name"
                      value={formData.dealer_name}
                      onChange={(e) => handleInputChange('dealer_name', e.target.value)}
                      className="rounded-xl"
                      placeholder="Enter your business or dealership name"
                    />
                  </div>
                )}

                <p className="text-sm text-slate-600">
                  {formData.is_dealer 
                    ? "Your listings will show a 'Certified Dealer' badge and your business name."
                    : "Your listings will show as 'Private Seller'."
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end"
          >
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="premium-button text-white rounded-xl px-8 py-3"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {showCropper && selectedImageFile && (
        <ImageCropper
          imageFile={selectedImageFile}
          onCropComplete={handleImageUpload}
          onCancel={handleCropperCancel}
        />
      )}
    </div>
  );
}
