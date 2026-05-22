import React, { useState } from 'react';
import { 
  Heart, 
  Utensils, 
  PlusCircle, 
  X, 
  Calendar, 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle,
  HelpCircle,
  Milk,
  Apple,
  Clock,
  Egg
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alimento } from '../types';

interface SupermarketViewProps {
  alimentos: Alimento[];
  onAddAlimento: (item: Omit<Alimento, 'id' | 'status'>) => void;
}

export default function SupermarketView({ alimentos, onAddAlimento }: SupermarketViewProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Frutas');
  const [validade, setValidade] = useState('');
  const [quantidade, setQuantidade] = useState<number>(0);
  const [unidade, setUnidade] = useState('Quilogramas (kg)');

  const categoryOptions = [
    { id: 'Padaria', label: 'Padaria', icone: '🥖' },
    { id: 'Frutas', label: 'Frutas', icone: '🍎' },
    { id: 'Laticínios', label: 'Laticínios', icone: '🥛' },
    { id: 'Bebidas', label: 'Bebidas', icone: '🥤' },
    { id: 'Enlatados', label: 'Enlatados', icone: '🥫' },
    { id: 'Outros', label: 'Outros', icone: '📦' },
  ];

  const handleOpenDrawer = () => {
    setShowDrawer(true);
    setShowFullForm(false);
  };

  const handleOpenFullForm = () => {
    setShowFullForm(true);
    setShowDrawer(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return;

    onAddAlimento({
      nome,
      categoria,
      validade: validade || 'Hoje',
      quantidade: quantidade || 1,
      unidade: unidade.replace(/\s*\(.*\)/, '').toLowerCase(), // clean unit name
    });

    // Reset fields
    setNome('');
    setValidade('');
    setQuantidade(0);

    // Show Success state
    setShowDrawer(false);
    setShowFullForm(false);
    setShowSuccess(true);
  };

  const handleBackToHome = () => {
    setShowSuccess(false);
  };

  const handleAddAnother = () => {
    setShowSuccess(false);
    setShowFullForm(true);
  };

  return (
    <div id="supermarket-view-root" className="space-y-6">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          /* Screen 5: Success view */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center py-10 space-y-6 justify-center text-center"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center shadow-lg shadow-primary-container/30">
                <CheckCircle className="w-12 h-12 text-[#161e00]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-on-surface">Doação cadastrada com sucesso!</h2>
              <p className="text-sm text-on-surface-variant max-w-sm px-4">
                Sua doação já está disponível para as ONGs parceiras
              </p>
            </div>

            <div className="bg-surface-container w-full max-w-md p-4 rounded-xl flex items-center bg-opacity-70 gap-4 mt-2">
              <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary border border-primary-container/20">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">Impacto Gerado</p>
                <p className="text-base font-bold text-on-surface mt-1">+1 refeição garantida</p>
              </div>
            </div>

            <div className="w-full max-w-md space-y-3 pt-4">
              <button
                id="success-back-home"
                onClick={handleBackToHome}
                className="w-full h-14 bg-primary-container text-[#161e00] text-sm font-bold rounded-xl flex items-center justify-center gap-2 drop-shadow-md active:scale-95 transition-all"
              >
                Voltar para Home
              </button>
              <button
                id="success-add-another"
                onClick={handleAddAnother}
                className="w-full h-14 bg-surface-container border border-outline-variant/30 text-on-surface text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                Cadastrar outro item
              </button>
            </div>
          </motion.div>
        ) : showFullForm ? (
          /* Screen 4: Full page cadastre form */
          <motion.div
            key="full-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFullForm(false)}
                className="p-2 bg-surface-container rounded-full hover:bg-surface-container-high transition-colors"
                type="button"
              >
                <ArrowLeft className="w-5 h-5 text-on-surface" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-on-surface">Cadastrar Alimento</h2>
                <p className="text-xs text-on-surface-variant">Compartilhe o excesso para reduzir a fome.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Nome do Item</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-sm text-on-surface placeholder:text-on-surface-variant/40"
                    placeholder="Ex: Maçãs Gala, Pão Francês"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">Categoria</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoria(cat.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                          categoria === cat.id
                            ? 'bg-primary-container border-2 border-primary text-[#161e00] shadow-sm transform scale-[1.03]'
                            : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        <span className="text-2xl mb-1">{cat.icone}</span>
                        <span className="text-xs font-semibold">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Quantidade</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantidade || ''}
                      onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                      className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-sm text-on-surface"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Unidade</label>
                    <select
                      value={unidade}
                      onChange={(e) => setUnidade(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-sm text-on-surface"
                    >
                      <option>Quilogramas (kg)</option>
                      <option>Unidades (un)</option>
                      <option>Litros (l)</option>
                      <option>Caixas</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Data de Validade</label>
                  <input
                    type="date"
                    required
                    value={validade}
                    onChange={(e) => setValidade(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-sm text-on-surface"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-14 bg-primary-container text-[#161e00] font-bold rounded-xl flex items-center justify-center gap-2 drop-shadow-md active:scale-95 transition-all mt-4 cursor-pointer"
                >
                  <Heart className="w-5 h-5" />
                  Cadastrar Doação
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conservation Tip */}
              <div className="relative h-44 rounded-xl overflow-hidden shadow-sm">
                <img 
                  alt="Fresh Produce" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCY6J2VzV58DyJDnpcxENVg4h2LYgtL6vg3WD9ZhTSj-GaTtuM27opQhHlrQS9OAzCF4arb2-oU5cjozw2Md5rfxa3aMoIT_2_VSL3pzPNiSrMItOC_CciHLWgHk4oTzZlBbwAd-cIF6Vhrz0-k-Z1iy16BOmnYFnJrGw_i5zTy3uUYV6Q_4KGT9Cv5wjTdzo5h76W2Zqx_ObtAGjG4PTClemdyWjFSEyuRwfOdn3r2dDhUIGc-0bmhMdmnop9i5C_9uZR6-tmEw1k"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-white text-sm font-bold">Dica de Conservação</h3>
                  <p className="text-white/80 text-xs mt-0.5">Frutas frescas duram 20% mais se mantidas em locais arejados.</p>
                </div>
              </div>

              {/* Goal Progress */}
              <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/10 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-on-surface">Meta Semanal</span>
                  <span className="text-xs font-bold text-primary">75%</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden my-3">
                  <div className="h-full bg-primary-container rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-xs text-on-surface-variant text-center">Faltam 45kg para atingir a meta de doação!</p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Screen 2: Monthly Impact dashboard & Donation drawer opener */
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Monthly Impact Section */}
            <div id="monthly-impact-section" className="space-y-3">
              <h2 className="text-lg font-bold text-on-surface">Impacto Mensal</h2>
              <div id="metrics-grid" className="grid grid-cols-2 gap-4">
                {/* Total Donated */}
                <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/10 space-y-1">
                  <Heart className="w-5 h-5 text-primary fill-current" />
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Doado</p>
                  <p className="text-2xl font-bold text-primary">1.240 kg</p>
                </div>
                {/* Meals Provided */}
                <div className="bg-surface-container p-5 rounded-xl border border-outline-variant/10 space-y-1">
                  <Utensils className="w-5 h-5 text-primary" />
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Refeições Geradas</p>
                  <p className="text-2xl font-bold text-primary">~2.480</p>
                </div>
              </div>
            </div>

            {/* Main Action buttons */}
            <div id="main-supermarket-actions" className="grid grid-cols-1 gap-3">
              <button
                id="novo-item-col-btn"
                onClick={handleOpenDrawer}
                className="w-full h-14 bg-primary-fixed text-[#161e00] font-bold rounded-xl flex items-center justify-center gap-2 drop-shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                Novo Item para Doação
              </button>

              <button
                id="full-form-cadastre-btn"
                onClick={handleOpenFullForm}
                className="w-full h-14 bg-surface-container border border-outline-variant/30 text-on-surface font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Award className="w-5 h-5 text-primary" />
                Cadastrar Doação Completa (Bento)
              </button>
            </div>

            {/* Overlay drawer layout modal context */}
            <AnimatePresence>
              {showDrawer && (
                <>
                  <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setShowDrawer(false)} />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto rounded-t-2xl bg-surface-container-high border-t border-outline-variant/30 p-6 z-50 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-2">
                      <h3 className="text-lg font-bold text-on-surface">Registrar Alimento</h3>
                      <button 
                        onClick={() => setShowDrawer(false)}
                        className="p-1.5 bg-surface-container hover:bg-surface-container-high rounded-full"
                      >
                        <X className="w-4 h-4 text-on-surface" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Nome do Alimento</label>
                        <input
                          type="text"
                          required
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-sm text-on-surface"
                          placeholder="Ex: Arroz Integral, Pães, Maçãs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Validade</label>
                          <input
                            type="date"
                            required
                            value={validade}
                            onChange={(e) => setValidade(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-surface-container-low border-none focus:ring-2 focus:ring-primary text-sm text-on-surface"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Quantidade</label>
                          <div className="flex bg-surface-container-low rounded-xl overflow-hidden">
                            <input
                              type="number"
                              required
                              min="1"
                              value={quantidade || ''}
                              onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                              className="w-full h-12 px-4 bg-transparent border-none focus:ring-0 text-sm text-on-surface"
                              placeholder="0"
                            />
                            <select
                              value={unidade}
                              onChange={(e) => setUnidade(e.target.value)}
                              className="px-3 bg-transparent border-none text-xs text-on-surface font-semibold focus:ring-0"
                            >
                              <option>kg</option>
                              <option>un</option>
                              <option>l</option>
                              <option>dz</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleOpenFullForm}
                          className="w-1/3 h-12 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-on-surface text-xs font-bold rounded-lg transition-all"
                        >
                          Modo Avançado
                        </button>
                        <button
                          type="submit"
                          className="flex-1 h-12 bg-primary-container text-[#161e00] text-xs font-bold rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Confirmar Registro
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Active Donations List */}
            <div id="active-donations-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-on-surface">Minhas Doações Ativas</h2>
                <span className="text-xs font-bold text-primary cursor-pointer hover:underline">Ver Tudo ({alimentos.length})</span>
              </div>

              <div className="space-y-3">
                {alimentos.map((item) => {
                  let icon = '📦';
                  if (item.categoria.toLowerCase() === 'padaria') icon = '🥖';
                  else if (item.categoria.toLowerCase() === 'frutas') icon = '🍎';
                  else if (item.categoria.toLowerCase() === 'laticínios') icon = '🥛';
                  else if (item.categoria.toLowerCase() === 'proteína animal') icon = '🥚';
                  else if (item.categoria.toLowerCase() === 'bebidas') icon = '🥤';
                  else if (item.categoria.toLowerCase() === 'enlatados') icon = '🥫';

                  return (
                    <div
                      key={item.id}
                      className="bg-surface-container p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-2xl">
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{item.nome}</p>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                            Qtd: {item.quantidade} {item.unidade} • Venc: {item.validade}
                          </p>
                        </div>
                      </div>

                      <div>
                        {item.status === 'Aguardando Coleta' ? (
                          <span className="px-2.5 py-1 rounded-full bg-primary-container/15 border border-primary/20 text-[10px] font-bold text-primary uppercase">
                            Aguardando Coleta
                          </span>
                        ) : item.status === 'Coletado' ? (
                          <span className="px-2.5 py-1 rounded-full bg-surface-container-highest border border-outline-variant/30 text-[10px] font-bold text-on-surface-variant uppercase">
                            Coletado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-yellow-500/15 border border-yellow-500/20 text-[10px] font-bold text-yellow-600 uppercase">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
