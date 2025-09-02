import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext"; // Importação correta

// Components
import { Header } from "./components/Header";
import { Cart } from "./components/Cart";
// ... resto das suas importações ...

function Router() {
  // ... (O componente Router continua exatamente igual)
}

function App() {
  // ... (Sua lógica de state dos modais continua exatamente igual)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider> {/* <--- O Provedor abraçando tudo */}
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <Header onCartOpen={handleCartOpen} />
            <main>
              <Router />
            </main>
            <footer className="bg-secondary text-white py-12 mt-16">
              {/* Conteúdo do seu footer */}
            </footer>
          </div>
          
          <Cart 
            isOpen={cartOpen} 
            onClose={handleCartClose}
            onCheckout={handleCheckoutOpen}
          />
          {/* ... resto dos seus modais e Toaster ... */}
          
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
