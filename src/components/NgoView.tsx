import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  ShoppingCart, 
  Store, 
  ShoppingBag, 
  Clock, 
  Filter, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  ArrowLeft,
  Calendar,
  Layers,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alimento, ColetaAtiva } from '../types';

interface NgoViewProps {
  alimentos: Alimento[];
  onReservar: (alimento: Alimento) => void;
  activeColetas: ColetaAtiva[];
  onFinalizarColeta: (coletaId: string) => void;
  onNavigateToTab: (tab: 'home' | 'retirada' | 'perfil') => void;
}

export default function NgoView({ 
  alimentos, 
  onReservar, 
  activeColetas, 
  onFinalizarColeta,
  onNavigateToTab
}: NgoViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColeta, setSelectedColeta] = useState<ColetaAtiva | null>(null);
  const [qrScanned, setQrScanned] = useState(false);

  // Filter available matches
  const filteredAlimentos = alimentos.filter(item => 
    item.status === 'Pendente' && 
    (item.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.categoria.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Hardcoded or dynamically updated list of matches
  const matchedEstablisments = [
    {
      id: 'Silva',
      nome: 'Supermercado Silva',
      distancia: '1.2km de distância',
      categorias: ['Frutas e Verduras', 'Padaria'],
      icone: ShoppingCart,
      prioritario: true,
      expira: 'Expira em 4h',
      originalItem: alimentos.find(e => e.nome.includes('Pão') || e.id === 'paes') || alimentos[0]
    },
    {
      id: 'Porto',
      nome: 'Mercado do Porto',
      distancia: '0.8km de distância',
      categorias: ['Proteína Animal', 'Laticínios'],
      icone: Store,
      prioritario: true,
      expira: 'Expira em 2h',
      originalItem: alimentos.find(e => e.nome.includes('Ovos') || e.id === 'ovos') || alimentos[1]
    },
    {
      id: 'Express',
      nome: 'Express Market',
      distancia: '3.5km de distância',
      categorias: ['Congelados'],
      icone: ShoppingBag,
      prioritario: false,
      expira: 'Expira em 12h',
      originalItem: alimentos.find(e => e.nome.includes('Leite') || e.id === 'leite') || alimentos[2]
    }
  ];

  const handleOpenColetaDetails = (coleta: ColetaAtiva) => {
    setSelectedColeta(coleta);
    setQrScanned(false);
  };

  const handleSimularLeituraQR = () => {
    setQrScanned(true);
  };

  const handleConfirmarFinalizacao = (coletaId: string) => {
    onFinalizarColeta(coletaId);
    setSelectedColeta(null);
    setQrScanned(false);
  };

  return (
    <div id="ngo-view-root" className="space-y-6">
      <AnimatePresence mode="wait">
        {!selectedColeta ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search inputs */}
            <div id="search-container" className="relative flex items-center">
              <Search className="absolute left-4 text-on-surface-variant w-5 h-5 pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-container border-none h-14 rounded-xl pl-12 pr-4 text-sm text-on-surface focus:ring-2 focus:ring-primary-container transition-all placeholder:text-on-surface-variant/50"
                placeholder="Buscar por tipo de alimento..."
              />
            </div>

            {/* NGO Stats row */}
            <div id="stats-dashboard" className="grid grid-cols-2 gap-4">
              <div id="stat-atendidos" className="bg-surface-container p-4 rounded-xl space-y-1 border-l-4 border-primary-container shadow-sm">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Atendidos</p>
                <p className="text-2xl font-bold text-primary">1.2k</p>
              </div>
              <div id="stat-coletas" className="bg-surface-container p-4 rounded-xl space-y-1 border-l-4 border-secondary shadow-sm">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Coletas</p>
                <p className="text-2xl font-bold text-secondary">42</p>
              </div>
            </div>

            {/* Matches Section Header */}
            <div id="matches-section-header" className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Matches Disponíveis</h2>
              <div className="flex items-center gap-1 text-primary cursor-pointer p-1">
                <span className="text-xs font-semibold">Filtros</span>
                <Filter className="w-4 h-4" />
              </div>
            </div>

            {/* Matches List Grid */}
            <div id="matches-list-grid" className="space-y-4">
              {matchedEstablisments.map((est) => {
                const isItemActive = est.originalItem && est.originalItem.status === 'Pendente';
                const IconComponent = est.icone;

                return (
                  <div
                    key={est.id}
                    id={`match-card-${est.id}`}
                    className={`rounded-xl overflow-hidden border transition-all ${
                      est.prioritario 
                        ? 'bg-surface-container-high border-outline-variant/30 relative' 
                        : 'bg-surface-container border-outline-variant/10 relative'
                    }`}
                  >
                    {est.prioritario && (
                      <div id={`ai-badge-${est.id}`} className="absolute top-4 right-4 bg-primary-container/20 border border-primary-container/40 px-3 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Prioritizado por IA</span>
                      </div>
                    )}

                    <div id={`match-details-${est.id}`} className="p-5 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center border ${
                          est.prioritario 
                            ? 'bg-primary-container/10 text-primary border-primary-container/20' 
                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/10'
                        }`}>
                          <IconComponent className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-on-surface">{est.nome}</h3>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            {est.distancia}
                          </p>
                        </div>
                      </div>

                      <div id={`match-categories-${est.id}`} className="flex flex-wrap gap-2">
                        {est.categorias.map((cat, i) => (
                          <span 
                            key={i} 
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              est.prioritario
                                ? 'bg-surface bg-opacity-40 text-on-surface-variant border-outline-variant/30'
                                : 'bg-surface bg-opacity-20 text-on-surface-variant border-outline-variant/10'
                            }`}
                          >
                            {cat}
                          </span>
                        ))}
                      </div>

                      <div id={`match-footer-${est.id}`} className="flex items-center justify-between pt-2 border-t border-outline-variant/15">
                        <div className={`flex items-center gap-1.5 ${est.prioritario ? 'text-error' : 'text-on-surface-variant'}`}>
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-bold">{est.expira}</span>
                        </div>
                        
                        {isItemActive ? (
                          <button
                            id={`reserve-btn-${est.id}`}
                            onClick={() => onReservar(est.originalItem!)}
                            className="bg-primary-container text-[#161e00] text-xs px-5 py-2.5 rounded-lg font-bold drop-shadow-sm active:scale-95 transition-all text-center cursor-pointer hover:opacity-90"
                          >
                            Reservar para Coleta
                          </button>
                        ) : (
                          <div className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            Reservado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Navigation for Active Bookings/QR */}
              {activeColetas.length > 0 && (
                <div id="booking-notification" className="bg-primary-container/10 border border-primary-container/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-on-surface">Você tem {activeColetas.length} coleta(s) agendada(s)</p>
                    <p className="text-xs text-on-surface-variant">Veja os QR Codes de liberação autorizada.</p>
                  </div>
                  <button
                    id="view-coleta-btn"
                    onClick={() => handleOpenColetaDetails(activeColetas[0])}
                    className="bg-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all"
                  >
                    Ver Código
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="qr-details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header with back */}
            <div id="qr-back-header" className="flex items-center gap-3">
              <button 
                id="back-list-btn"
                onClick={() => setSelectedColeta(null)}
                className="p-2 bg-surface-container rounded-full hover:bg-surface-container-high transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-on-surface" />
              </button>
              <div>
                <h3 className="text-base font-bold text-on-surface">Código de Retirada</h3>
                <p className="text-xs text-on-surface-variant">Apresente no local</p>
              </div>
            </div>

            {/* Screen 3: QR Code presentation */}
            <div id="qr-presentation-card" className="flex flex-col items-center py-6 bg-surface-container rounded-2xl border border-outline-variant/10 shadow-lg">
              <div id="qr-glow-wrapper" className="relative p-6 bg-surface-container rounded-xl shadow-[0_4px_24px_rgba(195,244,0,0.15)] mb-4">
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    id="mock-qr-img"
                    alt="Withdrawal QR Code" 
                    className="w-44 h-44" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQKYl0dYlrhA-a6sWCeaLGSiN2eyk7aDTP7vNw_5aBud8pGXfVD5Uak5hOJoeFsXGfkiSY7RP8QKuvrywFQnI1rMv6330wUrLEWiHse8INBXZ0O_rNIFMRs2uX21NMy_qNTAat53cmqAiGqxP_urRdJVNQJuxt1Pl_38oFSs72LprXihaHd44AZ0Nk8SHrU1L0UEVKcRfMk4A9lkcVgdXCgL99bn-LXD2w8cQfY6jbnLOrH15xye9R8efS_FOlSxgbaiQTE8rC4OQ"
                  />
                </div>
              </div>
              <p className="text-center text-sm text-on-surface-variant max-w-[260px]">
                Apresente este código ao responsável no local
              </p>
            </div>

            {/* Details Card */}
            <div id="qr-details-card" className="bg-surface-container rounded-xl p-5 border border-outline-variant/20 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-primary">{selectedColeta.supermercado}</h2>
                  <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Pedido #{selectedColeta.pedidoId}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border ${
                  selectedColeta.status === 'Pendente' 
                    ? 'bg-primary-container/20 text-primary border-primary-container/30' 
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                  {selectedColeta.status === 'Pendente' ? 'Pendente' : 'Coletado'}
                </span>
              </div>

              <div id="qr-items-list" className="space-y-3 pt-2">
                {selectedColeta.itens.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 text-on-surface">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant text-xs">
                      {it.nome.includes('Pão') ? '🥖' : it.nome.includes('Leite') ? '🥛' : '🥚'}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{it.quantidade}</span>
                      <span className="text-xs text-on-surface-variant ml-1">de {it.nome}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div id="qr-date-line" className="pt-4 border-t border-outline-variant/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">Data da Retirada</span>
                  <span className="text-xs font-bold text-on-surface">{selectedColeta.dataRetirada}</span>
                </div>
              </div>
            </div>

            {/* Action buttons simulated scanning */}
            <div id="qr-actions-container" className="flex flex-col gap-3">
              <button 
                id="simular-leitura-btn"
                onClick={handleSimularLeituraQR}
                className="w-full h-12 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90 rounded-full text-xs font-bold active:scale-95 flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Simular Leitura do QR Code pelo Mercado
              </button>

              <button
                id="finalizar-retirada-btn"
                disabled={!qrScanned}
                onClick={() => handleConfirmarFinalizacao(selectedColeta.id)}
                className={`w-full h-14 rounded-full font-bold flex items-center justify-center gap-2 transition-all ${
                  qrScanned 
                    ? 'bg-primary-container text-[#161e00] active:scale-95 cursor-pointer shadow-md' 
                    : 'bg-surface-container-highest text-on-surface-variant/40 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                Finalizar Retirada
              </button>

              <p className="text-center text-xs text-on-surface-variant mt-1 px-4">
                {qrScanned 
                  ? 'Código lido com sucesso! O botão de retirada foi habilitado.' 
                  : 'O botão será habilitado após a leitura do código pelo estabelecimento.'
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
