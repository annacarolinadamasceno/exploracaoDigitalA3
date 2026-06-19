import React, { useState } from 'react';
import {
  Heart,
  Mail,
  Lock,
  User,
  Building,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabaseClient';

interface AuthViewProps {
  onLoginSuccess: (user: { name: string; role: 'ong' | 'supermercado'; email: string; id?: string }) => void;
}

export default function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<'ong' | 'supermercado'>('ong');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contato, setContato] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Check if Supabase is using real credentials
  const isRealSupabase =
    // @ts-ignore
    import.meta.env.VITE_SUPABASE_URL &&
    // @ts-ignore
    !import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project');

  // Quick credentials for testing
  const handleQuickLogin = (type: 'ong' | 'supermercado') => {
    if (type === 'ong') {
      onLoginSuccess({
        name: 'ONG Mesa Unida',
        role: 'ong',
        email: 'ong@fomezero.org'
      });
    } else {
      onLoginSuccess({
        name: 'Supermercado Silva',
        role: 'supermercado',
        email: 'doador@silva.com.br'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isLogin) {
      // 1. ATTEMPT REAL SUPABASE AUTH (if configured)
      if (isRealSupabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (error) throw error;

          if (data && data.user) {
            // Load custom profile details from public.perfis_usuarios table
            const { data: profile, error: profileError } = await supabase
              .from('perfis_usuarios')
              .select('nome, role')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.warn("Erro ao buscar perfil. Criando perfil temporário...", profileError.message);
              onLoginSuccess({
                name: email.split('@')[0].toUpperCase(),
                role: email.includes('ong') ? 'ong' : 'supermercado',
                email: email,
                id: data.user.id
              });
            } else {
              onLoginSuccess({
                name: profile.nome,
                role: profile.role as 'ong' | 'supermercado',
                email: email,
                id: data.user.id
              });
            }
            return; // Success
          }
        } catch (err: any) {
          console.error("Erro no Supabase Auth, tentando mock local...", err.message);
          setErrorMsg(`Erro de login real: ${err.message || err}. Tentando entrar com mock...`);
          // Continue to mock below if they entered specific test account
        }
      }

      // 2. MOCK LOGIN FALLBACK
      if (email === 'ong@fomezero.org' && password === '123456') {
        onLoginSuccess({
          name: 'ONG Mesa Unida',
          role: 'ong',
          email: 'ong@fomezero.org'
        });
      } else if (email === 'doador@silva.com.br' && password === '123456') {
        onLoginSuccess({
          name: 'Supermercado Silva',
          role: 'supermercado',
          email: 'doador@silva.com.br'
        });
      } else if (!isRealSupabase && email && password.length >= 6) {
        onLoginSuccess({
          name: email.split('@')[0].toUpperCase(),
          role: email.includes('ong') ? 'ong' : 'supermercado',
          email: email
        });
      } else {
        setErrorMsg(isRealSupabase
          ? 'Credenciais inválidas. Ajuste suas informações ou cadastre-se!'
          : 'Credenciais inválidas. Ajuste suas informações ou cadastre-se!'
        );
      }


    } else {
      // 1. ATTEMPT REAL SUPABASE REGISTRATION (if configured)
      if (isRealSupabase) {
        try {
          if (!name || !email || !password || !cnpj || !contato) {
            setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
            return;
          }

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                nome: name,
                role: role,
                cnpj: cnpj,
                contato: contato
              }
            }
          });

          if (error) throw error;

          if (data && data.user) {
            // Success! Real trigger on database will automatically register this in public.perfis_usuarios
            onLoginSuccess({
              name: name,
              role: role,
              email: email
            });
            return;
          }
        } catch (err: any) {
          console.error("Erro no cadastro real do Supabase:", err.message);
          setErrorMsg(`Erro no cadastro real: ${err.message || err}. Tentando cadastro local...`);
          return;
        }
      }

      // 2. MOCK REGISTRATION FALLBACK
      if (!name || !email || !password || !cnpj || !contato) {
        setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      onLoginSuccess({
        name: name,
        role: role,
        email: email
      });
    }
  };

  return (
    <div id="auth-viewport" className="min-h-screen w-full max-w-2xl mx-auto bg-white flex flex-col justify-center px-6 py-12 relative overflow-hidden border-x border-outline-variant">

      {/* Background soft blurs for dynamic visual interest */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col items-center text-center space-y-3 z-10 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center shadow-md border border-primary/20">
          <Heart className="w-9 h-9 text-primary fill-current" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Fome Zero</h1>
          <p className="text-xs text-on-surface-variant max-w-xs mt-1 leading-relaxed">
            Plataforma Inteligente de Combate ao Desperdício e Distribuição de Alimentos
          </p>
        </div>
      </div>

      {/* Auth Card Container */}
      <div className="w-full bg-surface-container/40 border border-outline-variant/30 rounded-3xl p-6 md:p-8 shadow-sm backdrop-blur-sm z-10 space-y-6">

        {/* Tab Selector */}
        <div className="flex bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 relative">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${isLogin
                ? 'bg-primary text-[#161e00] shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${!isLogin
                ? 'bg-primary text-[#161e00] shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
              }`}
          >
            Cadastrar-se
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl text-xs font-semibold text-center animate-pulse">
            {errorMsg}
          </div>
        )}

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name, CNPJ and Contato Fields (Sign Up Only) */}
          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Nome da Entidade / Estabelecimento
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 w-4 h-4 text-on-surface-variant/70" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Supermercado Silva, ONG Prato Cheio"
                    className="w-full h-12 bg-white border border-outline-variant rounded-xl pl-11 pr-4 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/40 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  CNPJ
                </label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-4 w-4 h-4 text-on-surface-variant/70" />
                  <input
                    type="text"
                    required
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="Ex: 00.000.000/0001-00"
                    className="w-full h-12 bg-white border border-outline-variant rounded-xl pl-11 pr-4 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/40 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  Contato (Telefone / WhatsApp)
                </label>
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-4 h-4 text-on-surface-variant/70" />
                  <input
                    type="text"
                    required
                    value={contato}
                    onChange={(e) => setContato(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full h-12 bg-white border border-outline-variant rounded-xl pl-11 pr-4 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/40 font-medium"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              E-mail
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 w-4 h-4 text-on-surface-variant/70" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contato@entidade.org"
                className="w-full h-12 bg-white border border-outline-variant rounded-xl pl-11 pr-4 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/40 font-medium"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              Senha
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 w-4 h-4 text-on-surface-variant/70" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="• • • • • •"
                className="w-full h-12 bg-white border border-outline-variant rounded-xl pl-11 pr-4 text-xs text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-on-surface-variant/40 font-medium"
              />
            </div>
          </div>

          {/* Role selector (Sign Up Only) */}
          {!isLogin && (
            <div className="space-y-2 pt-2">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Eu sou uma...
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* NGO Card Button */}
                <button
                  type="button"
                  onClick={() => setRole('ong')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'ong'
                      ? 'bg-primary-container border-primary text-[#161e00] shadow-sm transform scale-[1.02]'
                      : 'bg-white border-outline-variant hover:bg-surface-container-low text-on-surface-variant'
                    }`}
                >
                  <Heart className={`w-7 h-7 mb-1.5 ${role === 'ong' ? 'fill-current text-primary' : 'text-on-surface-variant'}`} />
                  <span className="text-xs font-bold">ONG</span>
                  <span className="text-[9px] text-on-surface-variant/80 mt-0.5 leading-none">Receber Alimentos</span>
                </button>

                {/* Supermarket Card Button */}
                <button
                  type="button"
                  onClick={() => setRole('supermercado')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${role === 'supermercado'
                      ? 'bg-primary-container border-primary text-[#161e00] shadow-sm transform scale-[1.02]'
                      : 'bg-white border-outline-variant hover:bg-surface-container-low text-on-surface-variant'
                    }`}
                >
                  <Building className={`w-7 h-7 mb-1.5 ${role === 'supermercado' ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <span className="text-xs font-bold">Supermercado</span>
                  <span className="text-[9px] text-on-surface-variant/80 mt-0.5 leading-none">Doar Alimentos</span>
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full h-13 bg-primary text-[#161e00] font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-opacity-95 transition-all mt-6 cursor-pointer active:scale-[0.98]"
          >
            <span>{isLogin ? 'Entrar na Plataforma' : 'Criar minha Conta'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Testing Badges Header */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-outline-variant/40"></div>
          <span className="flex-shrink mx-4 text-[9px] text-on-surface-variant font-bold uppercase tracking-widest">
            Acesso Rápido de Teste
          </span>
          <div className="flex-grow border-t border-outline-variant/40"></div>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleQuickLogin('ong')}
            className="h-10 bg-surface-container-low border border-outline-variant/35 rounded-xl text-[10px] font-bold text-on-surface flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Perfil ONG</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('supermercado')}
            className="h-10 bg-surface-container-low border border-outline-variant/35 rounded-xl text-[10px] font-bold text-on-surface flex items-center justify-center gap-1.5 hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Perfil Doador</span>
          </button>
        </div>

      </div>

      {/* Footer Branding */}
      <p className="text-[10px] text-on-surface-variant/60 font-medium text-center mt-8 leading-none">
        Fome Zero Ecossistema Inteligente • 2026
      </p>

    </div>
  );
}
