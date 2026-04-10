import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginMockUser } from '@/services/mockAuth';

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({
    type: 'idle',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginMockUser(email, password);
    setStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setTimeout(() => {
        setLocation('/perfil');
      }, rememberMe ? 350 : 600);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-guarawatch-primary text-white flex-col justify-center px-12">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-guarawatch-accent rounded-full flex items-center justify-center text-2xl">
              🔥
            </div>
            <span className="font-display text-3xl font-bold">GuaráWatch</span>
          </div>
          <p className="text-xl text-gray-300">Antecipar riscos. Proteger o bioma.</p>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="font-heading text-lg font-semibold mb-2">Monitoramento Histórico</h3>
            <p className="text-gray-300 text-sm">
              Acompanhe queimadas e impactos ambientais desde 2019
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-2">Análise de Biodiversidade</h3>
            <p className="text-gray-300 text-sm">
              Identifique espécies impactadas em cada região
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-2">Dados Confiáveis</h3>
            <p className="text-gray-300 text-sm">
              Integração com MapBiomas, INMET e INPE
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-3/5 bg-white flex flex-col justify-center px-8 sm:px-12">
        <div className="max-w-md mx-auto w-full">
          <h1 className="font-display text-3xl font-bold text-guarawatch-primary mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-guarawatch-muted mb-8">
            Entre com suas credenciais para acessar o painel
          </p>

          <div className="rounded-lg border border-dashed border-guarawatch-accent/40 bg-guarawatch-bg px-4 py-3 mb-6 text-sm text-guarawatch-text">
            <p className="font-semibold">Acesso mockado para teste</p>
            <p>Email: usuario@demo.com</p>
            <p>Senha: 123456</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-heading font-semibold text-guarawatch-text mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-guarawatch-muted" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-guarawatch-accent focus:ring-2 focus:ring-guarawatch-accent focus:ring-opacity-20"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-heading font-semibold text-guarawatch-text mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-guarawatch-muted" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-guarawatch-accent focus:ring-2 focus:ring-guarawatch-accent focus:ring-opacity-20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-guarawatch-muted hover:text-guarawatch-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-guarawatch-text">Manter conectado</span>
              </label>
              <a href="#" className="text-sm text-guarawatch-accent hover:text-guarawatch-primary">
                Esqueci minha senha
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 bg-guarawatch-primary text-white font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Entrar
            </button>

            {status.type !== 'idle' && (
              <p
                className={`text-sm ${
                  status.type === 'error' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {status.message}
              </p>
            )}
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-sm text-guarawatch-muted">ou continue com</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* OAuth Button */}
          <button className="w-full py-2 border-2 border-gray-300 text-guarawatch-text font-heading font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <span>🔵</span>
            Google
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-guarawatch-muted mt-8">
            Não tem conta?{' '}
            <Link href="/cadastro">
              <a className="text-guarawatch-accent hover:text-guarawatch-primary font-semibold">
                Cadastre-se
              </a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
