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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onCartOpen: () => void;
  // Não precisamos mais do onAuthOpen, pois o login agora será uma página
}

export function Header({ onCartOpen }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();

  const navigation = [
    { name: "Catálogo", href: "/produtos" },
    { name: "Sobre", href: "/sobre" },
    { name: "Contato", href: "/contato" },
  ];
  
  // ======================= LÓGICA DE AUTENTICAÇÃO ATUALIZADA =======================

  const AuthSection = () => {
    // Caso 1: Admin está logado
    if (user && isAdmin) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <User className="h-5 w-5 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Olá, {user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin">Painel Admin</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    
    // Caso 2: Cliente está logado (ainda não implementado, mas já preparado)
    if (user && !isAdmin) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <User className="h-5 w-5 text-gray-700" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Olá, {user.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Minha Conta</DropdownMenuItem>
            <DropdownMenuItem>Meus Pedidos</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    
    // Caso 3: Ninguém está logado
    return (
      <div className="hidden md:flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Entrar</Link>
        </Button>
        <Button asChild className="btn-primary">
          <Link href="/cadastro">Criar Conta</Link>
        </Button>
      </div>
    );
  };
  
  // ======================= FIM DA LÓGICA DE AUTENTICAÇÃO =======================

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
          </div>

          {/* Ações do Lado Direito */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Seção de Autenticação */}
            <AuthSection />

            {/* Carrinho */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCartOpen}
              className="relative hover:bg-gray-100"
            >
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>

            {/* Menu Mobile */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-xs">
                <div className="flex flex-col space-y-4 mt-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-gray-700 hover:text-accent"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <DropdownMenuSeparator />
                  {/* Lógica Mobile de Login/Cadastro */}
                  {!user && (
                    <>
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-accent">
                        Entrar
                      </Link>
                      <Link href="/cadastro" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-accent">
                        Criar Conta
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                     <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-accent">
                        Painel Admin
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
