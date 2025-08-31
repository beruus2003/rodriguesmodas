import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu } from "lucide-react";
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
import { AuthModal } from "./AuthModal"; // Importamos o Modal de Admin

interface HeaderProps {
  onCartOpen: () => void;
}

export function Header({ onCartOpen }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminAuthOpen, setAdminAuthOpen] = useState(false); // Estado para o modal de admin
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();

  const navigation = [
    { name: "Catálogo", href: "/produtos" },
    { name: "Sobre", href: "/sobre" },
    { name: "Contato", href: "/contato" },
  ];

  const AuthSection = () => {
    // Caso 1: Usuário (admin ou cliente) está logado
    if (user) {
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
            {isAdmin ? (
              <DropdownMenuItem asChild>
                <Link href="/admin">Painel Admin</Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>Meus Pedidos</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    
    // Caso 2: Ninguém está logado (versão desktop)
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

  return (
    <>
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
              {/* Seção de Autenticação para Desktop */}
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

              {/* Botão do Menu Mobile */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5 text-gray-700" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xs">
                  <div className="flex flex-col h-full">
                    <div className="flex-grow space-y-4 mt-8">
                      {/* Lógica Mobile: Se usuário logado */}
                      {user && (
                        <>
                          <div className="px-3 py-2 text-center">
                            <p className="font-medium text-lg">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{isAdmin ? 'Proprietária' : 'Cliente'}</p>
                          </div>
                          <DropdownMenuSeparator />
                          {isAdmin ? (
                            <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-accent">
                              Painel Admin
                            </Link>
                          ) : (
                             <Link href="/meus-pedidos" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-accent">
                              Meus Pedidos
                            </Link>
                          )}
                          <DropdownMenuSeparator />
                        </>
                      )}

                      {/* Navegação Principal Mobile */}
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
                      
                      {/* Lógica Mobile: Se ninguém logado */}
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
                    </div>
                    
                    {/* Botão de Sair ou Login Admin no final */}
                    <div className="mt-auto pt-4 border-t">
                      {user ? (
                         <Button onClick={signOut} className="w-full text-destructive" variant="ghost">
                           Sair
                         </Button>
                      ) : (
                        <Button onClick={() => { setAdminAuthOpen(true); setMobileMenuOpen(false); }} className="w-full" variant="ghost">
                          Login do Dono
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </nav>
      </header>
      
      {/* O modal de login do admin continua existindo, mas agora só é chamado pelo menu mobile */}
      <AuthModal
        isOpen={adminAuthOpen}
        onClose={() => setAdminAuthOpen(false)}
      />
    </>
  );
}
