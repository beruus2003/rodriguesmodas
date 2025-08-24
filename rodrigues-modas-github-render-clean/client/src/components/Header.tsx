import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useCart } from "../hooks/use-cart";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onCartOpen: () => void;
  onAuthOpen: () => void;
}

export function Header({ onCartOpen, onAuthOpen }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();

  const navigation = [
    { name: "Catálogo", href: "/produtos" },
    { name: "Sobre", href: "/sobre" },
    { name: "Contato", href: "/contato" },
  ];

  const handleAuthAction = () => {
    if (user) {
      return; // Menu dropdown já está lidando com usuário logado
    } else {
      onAuthOpen();
    }
  };

  return (
    <header className="gradient-primary shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo />
            <span className="ml-3 text-xl font-semibold text-secondary whitespace-nowrap">Rodrigues Modas</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-gray-700 hover:text-accent transition-colors duration-200 ${
                  location === item.href ? "text-accent font-medium" : ""
                }`}
              >
                {item.name}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-gray-700 hover:text-accent transition-colors duration-200 ${
                  location === "/admin" ? "text-accent font-medium" : ""
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Cart & Admin Login */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCartOpen}
              className="relative hover:bg-gray-100 transition-colors duration-200"
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center animate-scale-in">
                  {itemCount}
                </span>
              )}
            </Button>

            {/* Admin Menu (apenas para proprietário) */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-gray-100 transition-colors duration-200"
                    data-testid="button-user-menu"
                  >
                    <User className="h-5 w-5 text-gray-700" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">Proprietária</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Painel Admin</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Botão de Login apenas para Admin */
              <Button
                variant="ghost"
                size="sm"
                onClick={onAuthOpen}
                className="hover:bg-gray-100 transition-colors duration-200 text-xs"
                data-testid="button-admin-login"
              >
                <User className="h-4 w-4 mr-1" />
                Admin
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden hover:bg-gray-100 transition-colors duration-200"
                >
                  <Menu className="h-5 w-5 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-accent transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-accent transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
