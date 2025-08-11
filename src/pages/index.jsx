import Layout from "./Layout.jsx";

import Marketplace from "./Marketplace";

import VehicleDetail from "./VehicleDetail";

import CreateListing from "./CreateListing";

import SavedListings from "./SavedListings";

import MyListings from "./MyListings";

import Messages from "./Messages";

import SellerProfile from "./SellerProfile";

import Profile from "./Profile";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Marketplace: Marketplace,
    
    VehicleDetail: VehicleDetail,
    
    CreateListing: CreateListing,
    
    SavedListings: SavedListings,
    
    MyListings: MyListings,
    
    Messages: Messages,
    
    SellerProfile: SellerProfile,
    
    Profile: Profile,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Marketplace />} />
                
                
                <Route path="/Marketplace" element={<Marketplace />} />
                
                <Route path="/VehicleDetail" element={<VehicleDetail />} />
                
                <Route path="/CreateListing" element={<CreateListing />} />
                
                <Route path="/SavedListings" element={<SavedListings />} />
                
                <Route path="/MyListings" element={<MyListings />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/SellerProfile" element={<SellerProfile />} />
                
                <Route path="/Profile" element={<Profile />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}