import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FindStations from "./pages/FindStations";
import AddStation from "./pages/AddStation";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import JoinUsInfo from "./pages/JoinUsInfo"; // Import the new info page
import JoinUsForm from "./pages/JoinUsForm"; // Import the renamed form page
import EditStation from "./pages/EditStation";
import RedeemRewards from "./pages/RedeemRewards"; // Import the RedeemRewards component

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/find" element={<FindStations />} />
            
            {/* Protected routes */}
            <Route path="/add" element={<ProtectedRoute><AddStation /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/redeem-rewards" element={<ProtectedRoute><RedeemRewards /></ProtectedRoute>} /> {/* Add this line */}
            
            {/* Join Us routes */}
            <Route path="/join-us" element={<JoinUsInfo />} />
            <Route path="/join-us-form" element={<ProtectedRoute><JoinUsForm /></ProtectedRoute>} />
            <Route path="/edit-station/:id" element={<ProtectedRoute><EditStation /></ProtectedRoute>} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
