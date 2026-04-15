import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Bell, LogOut, User, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { clearSession } from '@/services/authApi';
import LogoBrand from './LogoBrand';

export default function Navbar() {
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    clearSession();
    setUserMenuOpen(false);
    setLocation('/login');
  };

  const navLinks = [
    { label: 'Início', href: '/' },
    { label: 'Painel Nacional', href: '/dashboard/nacional' },
    { label: 'Análise por Estado', href: '/dashboard/estados' },
    { label: 'Ocorrências', href: '/dashboard/ocorrencias' },
    { label: 'Biodiversidade', href: '/dashboard/biodiversidade' },
    { label: 'Tendências', href: '/dashboard/tendencias' },
    { label: 'Educativo', href: '/educativo' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-guarawatch-primary text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 font-display text-xl font-bold">
              <LogoBrand size="sm" />
              GuaráWatch
            </a>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a className="text-sm font-medium hover:text-guarawatch-accent transition-colors">
                  {link.label}
                </a>
              </Link>
            ))}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toggleTheme?.()}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              className="relative text-white hover:text-guarawatch-accent transition-colors"
              aria-label="Notificações"
            >
              <Bell size={18} />
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-guarawatch-danger rounded-full text-[10px] flex items-center justify-center">
                2
              </span>
            </button>

            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-white hover:text-guarawatch-accent transition-colors"
              >
                <div className="w-8 h-8 bg-guarawatch-accent rounded-full flex items-center justify-center">
                  <User size={16} />
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-guarawatch-text rounded-lg shadow-lg">
                  <Link href="/perfil">
                    <a className="block px-4 py-2 hover:bg-guarawatch-bg">Perfil</a>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-guarawatch-bg flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sair
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-white"
              aria-label={mobileOpen ? 'Fechar menu mobile' : 'Abrir menu mobile'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-guarawatch-secondary">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <a
                  className="block px-4 py-2 text-sm hover:bg-guarawatch-secondary transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
