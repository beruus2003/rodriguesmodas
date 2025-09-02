import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, User, Menu, Loader2 } from "lucide-react"; // 1. Adicionado o ícone de Loading
import { Logo } from "./Logo";
import { useCart } from "../hooks/use-cart";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "@/hooks/use-toast"; // 2. Adicionado o hook de toast
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthModal } from "./AuthModal";

interface HeaderProps {
  onCartOpen: () => void;
}

export function Header({ onCartOpen }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const { itemCount } = useCart();
  const { user, signOut, isAdmin, signIn } = useAuth();

  const navigation = [
    { name: "Catálogo", href: "/produtos" },
    { name: "Sobre", href: "/sobre" },
    { name: "Contato", href: "/contato" },
  ];

  const AuthSection = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // 3. Adicionado estado de loading e erro para o formulário
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const handleCustomerLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      if (signIn) {
        try {
          await signIn(email, password);
          // O hook useAuth vai atualizar o 'user', e o componente vai re-renderizar para a visão de logado
          // Não precisamos fazer mais nada aqui em caso de sucesso
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
          setError(errorMessage); // Mostra o erro no formulário
          toast({ // Mostra o erro na notificação
            title: "Falha no Login",
            description: errorMessage,
            variant: "destructive",
          });
          console.error("Falha no login do cliente:", err);
        } finally {
          setIsLoading(false); // Garante que o loading para, mesmo com erro
        }
      }
    };

    return (
      <DropdownMenu onOpenChange={() => setError(null)}> {/* Limpa o erro ao fechar/abrir o menu */}
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="flex hover:bg-gray-100">
            <User className="h-5 w-5 text-gray-700" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 p-4">
          {user ? (
            <>
              <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">Olá, {user.name}</p><p className="text-xs leading-none text-muted-foreground">{user.email}</p></div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin ? (<DropdownMenuItem asChild><Link href="/admin">Painel Admin</Link></DropdownMenuItem>) : (<DropdownMenuItem asChild><Link href="/meus-pedidos">Meus Pedidos</Link></DropdownMenuItem>)}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">Sair</DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel>Acesse sua conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form onSubmit={handleCustomerLogin} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="email-login">Email</Label><Input id="email-login" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} /></div>
                <div className="space-y-2"><Label htmlFor="password-login">Senha</Label><Input id="password-login" type="password" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} /></div>
                
                {/* 4. Mensagem de erro e botão com estado de loading */}
                {error && <p className="text-sm text-destructive">{error}</p>}
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
                </Button>
              </form>
              <DropdownMenuSeparator className="my-4"/>
              <div className="text-center text-sm text-muted-foreground">Não tem uma conta?{' '}<Link href="/cadastro" className="text-primary hover:underline">Cadastre-se</Link></div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  
  const MobileNav = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon"><Menu className="h-5 w-5 text-gray-700" /></Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs p-0">
        <div className="flex flex-col h-full py-6">
          <div className="px-6"><Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center"><Logo /><span className="ml-3 text-lg font-semibold text-primary">Rodrigues Modas</span></Link></div>
          <div className="flex-grow mt-8 px-6 space-y-4">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className="block text-lg font-medium text-gray-700 hover:text-accent">{item.name}</Link>
            ))}
          </div>
          <div className="mt-auto border-t">
            {!user && (<div className="p-4"><Button onClick={() => { setAdminAuthOpen(true); setMobileMenuOpen(false); }} className="w-full" variant="link">Acesso do Dono</Button></div>)}
            {user && (<div className="p-4"><Button onClick={signOut} className="w-full text-destructive" variant="ghost">Sair</Button></div>)}
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
            <Link href="/" className="flex items-center"><Logo /><span className="ml-3 text-xl font-semibold text-primary whitespace-nowrap hidden sm:block">Rodrigues Modas</span></Link>
            <div className="hidden md:flex flex-grow justify-center space-x-8">
              {navigation.map((item) => (<Link key={item.name} href={item.href} className={`text-sm font-medium text-muted-foreground hover:text-primary ${location === item.href ? "text-primary" : ""}`}>{item.name}</Link>))}
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <AuthSection />
              <Button variant="ghost" size="icon" onClick={onCartOpen} className="relative"><ShoppingCart className="h-5 w-5 text-gray-700" />{itemCount > 0 && (<span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{itemCount}</span>)}</Button>
              <MobileNav />
            </div>
          </div>
        </nav>
      </header>
      <AuthModal isOpen={adminAuthOpen} onClose={() => setAdminAuthOpen(false)} />
    </>
  );
}
