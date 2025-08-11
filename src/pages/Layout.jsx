

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import {
  Car,
  Search,
  Plus,
  Heart,
  User as UserIcon,
  Settings,
  Home,
  TrendingUp,
  MessageSquare,
  LogIn,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationItems = [
  {
    title: "Marketplace",
    url: createPageUrl("Marketplace"),
    icon: Home
  },
  {
    title: "Messages",
    url: createPageUrl("Messages"),
    icon: MessageSquare
  },
  {
    title: "Sell Your Car",
    url: createPageUrl("CreateListing"),
    icon: Plus
  },
  {
    title: "Saved Listings",
    url: createPageUrl("SavedListings"),
    icon: Heart
  },
  {
    title: "My Listings",
    url: createPageUrl("MyListings"),
    icon: UserIcon
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Load current user on mount
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      // User not logged in - this is fine
      setCurrentUser(null);
    }
    setIsLoadingUser(false);
  };

  const handleLogin = async () => {
    try {
      await User.loginWithRedirect(window.location.href);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      setCurrentUser(null);
      // Redirect to marketplace instead of reloading the page
      window.location.href = createPageUrl("Marketplace");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  const getUserInitials = (user) => {
    if (!user) return "?";
    if (user.full_name) {
      const names = user.full_name.split(" ");
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getUserDisplayName = (user) => {
    return user?.full_name || user?.email?.split("@")[0] || "User";
  };

  const getProfilePictureUrl = (user) => {
    return user?.profile_picture_url || user?.logo_url;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full max-w-full overflow-x-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <style>
          {`
            :root {
              --primary-navy: #1e293b;
              --primary-silver: #64748b;
              --accent-blue: #3b82f6;
              --premium-gold: #f59e0b;
              --success-green: #10b981;
              --gradient-primary: linear-gradient(135deg, #1e293b 0%, #334155 100%);
              --gradient-card: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
            }
            
            .premium-card {
              background: var(--gradient-card);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            
            .premium-button {
              background: var(--gradient-primary);
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .premium-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 12px 24px rgba(30, 41, 59, 0.3);
            }

            /* Prevent horizontal scrolling on mobile */
            body, html {
              overflow-x: hidden;
              max-width: 100vw;
            }

            * {
              box-sizing: border-box;
            }
          `}
        </style>
        
        <Sidebar className="border-r border-slate-200/60 bg-white/80 backdrop-blur-xl hidden md:flex">
          <SidebarHeader className="border-b border-slate-200/60 p-6">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-bold text-xl text-slate-800">Qarvis</h2>
                <p className="text-xs text-slate-500 font-medium tracking-wide">AI-Powered Car Marketplace</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-4">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-slate-100/80 hover:text-slate-800 transition-all duration-300 rounded-xl px-4 py-3 ${
                          location.pathname === item.url 
                            ? 'bg-slate-800 text-white shadow-lg hover:bg-slate-700 hover:text-white' 
                            : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-8">
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3">
                Market Insights
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="px-4 py-3 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-slate-600">Market trending up</span>
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed">
                    AI analysis shows 12% increase in luxury vehicle demand this month.
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/60 p-6">
            {isLoadingUser ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-slate-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>
            ) : currentUser ? (
              <div className="space-y-3">
                <Link to={createPageUrl("Profile")} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 transition-colors">
                  {getProfilePictureUrl(currentUser) ? (
                    <img 
                      src={getProfilePictureUrl(currentUser)} 
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getUserInitials(currentUser)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">
                      {getUserDisplayName(currentUser)}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-slate-600 hover:text-slate-800 border-slate-200 hover:bg-slate-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Sign in to save listings, message sellers, and manage your vehicles</p>
                </div>
                <Button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-screen max-w-full overflow-x-hidden">
          <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-4 py-4 md:hidden sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-xl transition-colors duration-200" />
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">Qarvis</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-x-hidden max-w-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

