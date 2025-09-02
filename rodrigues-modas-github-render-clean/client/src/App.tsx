import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";

// Components
import { Header } from "./components/Header";
import { Cart } from "./components/Cart";
import { Checkout } from "./components/Checkout";
import { AuthModal } from "./components/AuthModal";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import Admin from "./pages/Admin";
import Register from "./pages/Register";
import VerifyAccount from "./pages/VerifyAccount";
import Login from "./pages/Login";
import NotFound from "./pages/not-found";

// Hooks
import { useAuth } from "./hooks/use-auth";

function Router() {
  const { isAdmin } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/produtos" component={Products} />
      <Route path="/cadastro" component={Register} />
      <Route path="/verificar-conta" component={VerifyAccount} />
      <Route path="/login" component={Login} />
      {isAdmin && <Route path="/admin" component={Admin} />}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const handleCartOpen = () => setCartOpen(true);
  const handleCartClose = () => setCartOpen(false);
  const handleCheckoutOpen = () => { setCartOpen(false); setCheckoutOpen(true); };
  const handleCheckoutClose = () => setCheckoutOpen(false);
  const handleAuthOpen = () => setAuthOpen(true);
  const handleAuthClose = () => setAuthOpen(false);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Header onCartOpen={handleCartOpen} />
            <main>
              <Router />
            </main>
            <footer className="bg-secondary text-white py-12 mt-16">
              {/* ... seu footer ... */}
            </footer>
          </div>
          
          <Cart isOpen={cartOpen} onClose={handleCartClose} onCheckout={handleCheckoutOpen} />
          <Checkout isOpen={checkoutOpen} onClose={handleCheckoutClose} />
          <AuthModal isOpen={authOpen} onClose={handleAuthClose} />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
