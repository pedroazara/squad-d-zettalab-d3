import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { registerMockUser, type UserProfileType } from '@/services/mockAuth';

export default function Register() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({
    type: 'idle',
    message: '',
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileType: 'researcher' as UserProfileType,
    acceptTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setStatus({
        type: 'error',
        message: 'As senhas nao conferem.',
      });
      return;
    }

    const result = registerMockUser({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      profileType: formData.profileType,
    });

    setStatus({
      type: result.ok ? 'success' : 'error',
      message: result.message,
    });

    if (result.ok) {
      setTimeout(() => {
        setLocation('/perfil');
      }, 700);
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
            <h3 className="font-heading text-lg font-semibold mb-2">Dados Históricos</h3>
            <p className="text-gray-300 text-sm">
              Acesso a 7 anos de dados sobre queimadas no Brasil
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-2">Análise Completa</h3>
            <p className="text-gray-300 text-sm">
              Ferramentas avançadas para análise de risco e biodiversidade
            </p>
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold mb-2">Suporte Científico</h3>
            <p className="text-gray-300 text-sm">
              Metodologia validada por especialistas ambientais
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-3/5 bg-white flex flex-col justify-center px-8 sm:px-12 overflow-y-auto">
        <div className="max-w-md mx-auto w-full py-12">
          <h1 className="font-display text-3xl font-bold text-guarawatch-primary mb-2">
            Criar Conta
          </h1>
          <p className="text-guarawatch-muted mb-8">
            Junte-se à comunidade de monitoramento ambiental
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-heading font-semibold text-guarawatch-text mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-guarawatch-muted" size={18} />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-guarawatch-accent focus:ring-2 focus:ring-guarawatch-accent focus:ring-opacity-20"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-heading font-semibold text-guarawatch-text mb-2">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-guarawatch-muted" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-heading font-semibold text-guarawatch-text mb-2">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-guarawatch-muted" size={18} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-guarawatch-accent focus:ring-2 focus:ring-guarawatch-accent focus:ring-opacity-20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-guarawatch-muted hover:text-guarawatch-primary"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Profile Type */}
            <div>
              <label className="block text-sm font-heading font-semibold text-guarawatch-text mb-2">
                Tipo de Perfil
              </label>
              <select
                name="profileType"
                value={formData.profileType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-guarawatch-accent focus:ring-2 focus:ring-guarawatch-accent focus:ring-opacity-20"
              >
                <option value="public">Instituição Pública</option>
                <option value="researcher">Pesquisador</option>
                <option value="farmer">Produtor Rural</option>
                <option value="other">Outro</option>
              </select>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="w-4 h-4 mt-1"
                required
              />
              <label className="text-sm text-guarawatch-text">
                Aceito os{' '}
                <a href="#" className="text-guarawatch-accent hover:text-guarawatch-primary">
                  termos de uso
                </a>{' '}
                e a{' '}
                <a href="#" className="text-guarawatch-accent hover:text-guarawatch-primary">
                  política de privacidade
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-2 bg-guarawatch-primary text-white font-heading font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Criar Conta
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

          {/* Sign In Link */}
          <p className="text-center text-sm text-guarawatch-muted mt-6">
            Já tem conta?{' '}
            <Link href="/login">
              <a className="text-guarawatch-accent hover:text-guarawatch-primary font-semibold">
                Entrar
              </a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
