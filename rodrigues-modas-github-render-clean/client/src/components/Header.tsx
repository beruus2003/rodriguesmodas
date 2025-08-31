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
import { AuthModal } from "./AuthModal";

interface HeaderProps {
  onCartOpen: () => void;
}

export function Header({ onCartOpen }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut, isAdmin } = useAuth();

  const navigation = [
    { name: "Catálogo", href: "/produtos" },
    { name: "Sobre", href: "/sobre" },
    { name: "Contato", href: "/contato" },
  ];

  // --- COMPONENTE DE AUTENTICAÇÃO PARA DESKTOP ---
  // Lógica principal para o seu pedido: ou mostra os botões, ou mostra o ícone do usuário.
  const AuthSectionDesktop = () => {
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
              <DropdownMenuItem asChild>
                <Link href="/meus-pedidos">Meus Pedidos</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // Se não há usuário, mostra os botões de Entrar/Criar Conta
    return (
      <div className="hidden md:flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Entrar</Link>
        </Button>
        <Button asChild>
          <Link href="/cadastro">Criar Conta</Link>
        </Button>
      </div>
    );
  };

  // --- COMPONENTE DO MENU MOBILE ---
  // Contém toda a lógica do menu lateral, incluindo o login discreto do admin
  const MobileNav = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5 text-gray-700" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs p-0">
        <div className="flex flex-col h-full py-6">
          <div className="px-6">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center hover:opacity-80 transition-opacity">
              <Logo />
              <span className="ml-3 text-lg font-semibold text-primary">Rodrigues Modas</span>
            </Link>
          </div>
          
          <div className="flex-grow mt-8 px-6 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-lg font-medium text-gray-700 hover:text-accent"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="mt-auto border-t">
            {user ? (
              <div className="p-4 space-y-2">
                <div className="text-center">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{isAdmin ? 'Proprietária' : 'Cliente'}</p>
                </div>
                 {isAdmin ? (
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>Painel Admin</Link>
                    </Button>
                  ) : (
                     <Button asChild variant="outline" className="w-full">
                        <Link href="/meus-pedidos" onClick={() => setMobileMenuOpen(false)}>Meus Pedidos</Link>
                    </Button>
                  )}
                <Button onClick={signOut} className="w-full text-destructive" variant="ghost">Sair</Button>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                 <Button asChild className="w-full">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Entrar</Link>
                 </Button>
                 <Button asChild variant="outline" className="w-full">
                    <Link href="/cadastro" onClick={() => setMobileMenuOpen(false)}>Criar Conta</Link>
                 </Button>
                 <DropdownMenuSeparator className="my-4"/>
                 {/* AQUI ESTÁ A SOLUÇÃO: Login do Dono discreto no final */}
                 <Button onClick={() => { setAdminAuthOpen(true); setMobileMenuOpen(false); }} className="w-full" variant="link">
                   Acesso do Dono
                 </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <header className="bg-background/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Logo />
              <span className="ml-3 text-xl font-semibold text-primary whitespace-nowrap hidden sm:block">Rodrigues Modas</span>
            </Link>

            <div className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 ${
                    location === item.href ? "text-primary" : ""
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-1 md:space-x-2">
              <AuthSectionDesktop />

              <Button variant="ghost" size="icon" onClick={onCartOpen} className="relative hover:bg-gray-100">
                <ShoppingCart className="h-5 w-5 text-gray-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
              
              <MobileNav />
            </div>
          </div>
        </nav>
      </header>
      
      <AuthModal isOpen={adminAuthOpen} onClose={() => setAdminAuthOpen(false)} />
    </>
  );
}
