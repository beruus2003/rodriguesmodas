import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Components
import { Header } from "./components/Header";
import { Cart } from "./components/Cart";
import { Checkout } from "./components/Checkout";
import { AuthModal } from "./components/AuthModal";

// Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import Admin from "./pages/Admin";
import NotFound from "./pages/not-found";

// Hooks
import { useAuth } from "./hooks/use-auth";

function Router() {
  const { isAdmin } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/produtos" component={Products} />
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
  
  const handleCheckoutOpen = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };
  
  const handleCheckoutClose = () => setCheckoutOpen(false);
  
  const handleAuthOpen = () => setAuthOpen(true);
  const handleAuthClose = () => setAuthOpen(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header 
            onCartOpen={handleCartOpen}
            onAuthOpen={handleAuthOpen}
          />
          
          <main>
            <Router />
          </main>
          
          {/* Footer */}
          <footer className="bg-secondary text-white py-12 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand */}
                <div>
                  <div className="flex items-center mb-4">
                    <div className="logo-container mr-3">
                      <span className="text-primary font-bold text-lg">RM</span>
                    </div>
                    <span className="text-lg font-semibold">Rodrigues Modas</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Especializada em moda íntima feminina, oferecendo qualidade, conforto e elegância.
                  </p>
                </div>
                
                {/* Links */}
                <div>
                  <h3 className="font-semibold mb-4">Navegação</h3>
                  <ul className="space-y-2 text-sm">
                    <li><a href="/produtos" className="text-gray-300 hover:text-primary transition-colors">Catálogo</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Sobre Nós</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Contato</a></li>
                    <li><a href="#" className="text-gray-300 hover:text-primary transition-colors">Política de Privacidade</a></li>
                  </ul>
                </div>
                
                {/* Contact */}
                <div>
                  <h3 className="font-semibold mb-4">Contato</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <i className="fab fa-whatsapp"></i>
                      <span className="text-gray-300">+55 85 99180-2352</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <i className="fas fa-envelope"></i>
                      <span className="text-gray-300">contact.rodriguesmoda@gmail.com</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <i className="fas fa-map-marker-alt"></i>
                      <span className="text-gray-300">Fortaleza, CE</span>
                    </li>
                  </ul>
                </div>
                
                {/* Social */}
                <div>
                  <h3 className="font-semibold mb-4">Redes Sociais</h3>
                  <div className="flex space-x-4">
                    <a href="https://www.instagram.com/rodriguesmoda___?igsh=MWk0enZwdGdpcXg4dA==" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary transition-colors text-xl">
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a href="https://wa.me/5585991802352" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-primary transition-colors text-xl">
                      <i className="fab fa-whatsapp"></i>
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-700 mt-8 pt-8 text-center">
                <p className="text-sm text-gray-300">
                  &copy; 2024 Rodrigues Modas - Moda Íntima. Todos os direitos reservados.
                </p>
              </div>
            </div>
          </footer>
        </div>
        
        {/* Modals */}
        <Cart 
          isOpen={cartOpen} 
          onClose={handleCartClose}
          onCheckout={handleCheckoutOpen}
        />
        
        <Checkout
          isOpen={checkoutOpen}
          onClose={handleCheckoutClose}
        />
        
        <AuthModal
          isOpen={authOpen}
          onClose={handleAuthClose}
        />
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
