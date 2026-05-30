import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  ShoppingCart, 
  Store, 
  ShoppingBag, 
  Clock, 
  Sparkles, 
  ArrowLeft,
  Calendar,
  Layers,
  Check,
  PlusCircle,
  X,
  FileText,
  TrendingUp,
  User,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alimento, ColetaAtiva, Ong } from '../types';
import { downloadReportPDF } from '../utils/ReportGenerator';

interface NgoViewProps {
  alimentos: Alimento[];
  onReservar: (alimento: Alimento) => void;
  activeColetas: ColetaAtiva[];
  onFinalizarColeta: (coletaId: string) => void;
  onNavigateToTab: (tab: 'home' | 'retirada' | 'perfil') => void;
  // New auth & state integration props
  user: { name: string; email: string };
  ongs: Ong[];
  matches: any[];
  onUpdateNecessidades: (newNecessidades: string[]) => void;
  activeActorTab: 'ong' | 'relatorios' | 'perfil';
}

export default function NgoView({ 
  alimentos, 
  onReservar, 
  activeColetas, 
  onFinalizarColeta,
  onNavigateToTab,
  user,
  ongs,
  matches,
  onUpdateNecessidades,
  activeActorTab
}: NgoViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColeta, setSelectedColeta] = useState<ColetaAtiva | null>(null);
  
  // Custom states for needs management
  const [newNeed, setNewNeed] = useState('');
  const [showAddNeedForm, setShowAddNeedForm] = useState(false);

  // Find this NGO's record in state to show their active registered needs
  const currentOng = ongs.find(o => o.nome.toLowerCase() === user.name.toLowerCase()) || ongs[0];
  const necessidades = currentOng ? currentOng.necessidades : ['Padaria', 'Frutas'];

  // Filter matches dynamically to show only the ones generated for THIS NGO
  const myMatches = matches.filter(m => m.nome_ong.toLowerCase() === user.name.toLowerCase());

  const handleAddNeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeed.trim()) return;

    if (!necessidades.includes(newNeed.trim())) {
      const updated = [...necessidades, newNeed.trim()];
      onUpdateNecessidades(updated);
    }
    setNewNeed('');
    setShowAddNeedForm(false);
  };

  const handleRemoveNeed = (needToRemove: string) => {
    const updated = necessidades.filter(n => n !== needToRemove);
    onUpdateNecessidades(updated);
  };

  // Generate PDF received report
  const handleExportPDF = () => {
    const reportData = {
      title: `Relatório de Recebidos - ${user.name}`,
      userName: user.name,
      userRole: 'ong' as const,
      userEmail: user.email,
      stats: [
        { label: 'Doações Recebidas', value: `${activeColetas.length + 14} entregas` },
        { label: 'Alimentos Salvos', value: '412 kg' },
        { label: 'Pessoas Alimentadas', value: '824 refeições' }
      ],
      history: [
        {
          date: new Date().toLocaleDateString('pt-BR'),
          item: 'Pães Artesanais',
          quantity: '15 un',
          partner: 'Supermercado Silva',
          status: 'Aguardando Coleta'
        },
        {
          date: '24/05/2026',
          item: 'Caixas de Leite',
          quantity: '48 un',
          partner: 'Express Market',
          status: 'Coletado'
        },
        {
          date: '18/05/2026',
          item: 'Ovos Tipo A',
          quantity: '10 dz',
          partner: 'Mercado do Porto',
          status: 'Coletado'
        }
      ]
    };

    downloadReportPDF(reportData);
  };

  return (
    <div id="ngo-view-container" className="space-y-6">
      <AnimatePresence mode="wait">
        
        {/* TAB 1 & 2: NGO Active Panel (Necessidades e Matches) */}
        {activeActorTab === 'ong' && !selectedColeta && (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Section 1: Registered Food Needs */}
            <div id="needs-management" className="bg-surface-container p-5 rounded-2xl border border-outline-variant/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Minhas Necessidades Cadastradas</h3>
                  <p className="text-[10px] text-on-surface-variant">A IA usa esta lista silenciosamente para buscar doações</p>
                </div>
                <button
                  id="add-need-btn"
                  onClick={() => setShowAddNeedForm(!showAddNeedForm)}
                  className="bg-primary/20 text-[#856404] hover:bg-primary/30 border border-primary/30 p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-primary" />
                  <span>Cadastrar</span>
                </button>
              </div>

              {/* Add Need Form */}
              {showAddNeedForm && (
                <form onSubmit={handleAddNeed} className="flex gap-2 animate-fadeIn bg-white p-3 rounded-xl border border-outline-variant/30">
                  <input
                    type="text"
                    required
                    value={newNeed}
                    onChange={(e) => setNewNeed(e.target.value)}
                    placeholder="Ex: Cesta Básica, Laticínios, Legumes"
                    className="flex-1 h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-xs text-on-surface focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/40"
                  />
                  <button
                    type="submit"
                    className="h-10 bg-primary text-[#161e00] px-4 rounded-lg text-xs font-bold active:scale-95 transition-all cursor-pointer"
                  >
                    Salvar
                  </button>
                </form>
              )}

              {/* Needs Pills List */}
              <div className="flex flex-wrap gap-2 pt-1">
                {necessidades.map((need, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1.5 bg-white border border-outline-variant/40 rounded-full text-xs font-semibold text-on-surface flex items-center gap-1.5"
                  >
                    <span>{need}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNeed(need)}
                      className="w-4 h-4 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                {necessidades.length === 0 && (
                  <p className="text-xs text-on-surface-variant/60 italic py-2">Nenhuma necessidade cadastrada. Clique em Cadastrar!</p>
                )}
              </div>
            </div>

            {/* Section 2: AI Generated Matches */}
            <div id="ai-matches-section" className="space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <h2 className="text-base font-extrabold text-on-surface">Matches de Alimentos da IA</h2>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                  Ativo e Silencioso
                </span>
              </div>

              {/* Matches List */}
              <div className="space-y-4">
                {myMatches.map((match, index) => (
                  <div 
                    key={index} 
                    className="bg-surface-container border-2 border-primary/20 rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden"
                  >
                    {/* Header info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-extrabold text-on-surface flex items-center gap-1.5">
                          <Store className="w-4 h-4 text-primary" />
                          <span>Doação Compatível</span>
                        </h3>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5 font-mono">Status: Recomendado por IA</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        match.nivel_urgencia === 'Crítico' 
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-200/20' 
                          : 'bg-amber-500/10 text-amber-600 border border-amber-200/20'
                      }`}>
                        Urgência: {match.nivel_urgencia}
                      </span>
                    </div>

                    {/* AI explanation motivation */}
                    <p className="text-xs text-on-surface-variant bg-white p-3.5 rounded-xl border border-outline-variant/20 leading-relaxed shadow-sm">
                      {match.motivo_prioridade}
                    </p>

                    {/* Items offered list */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Itens Disponibilizados:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {match.itens_atendidos.map((item: any, keyIdx: number) => {
                          const alOriginal = alimentos.find(a => a.id === item.id_alimento || a.nome === item.alimento_oferecido);
                          const isAlreadyReserved = alOriginal && alOriginal.status === 'Aguardando Coleta';

                          return (
                            <div key={keyIdx} className="bg-white rounded-xl p-3 flex items-center justify-between text-xs border border-outline-variant/30 shadow-sm">
                              <span className="font-bold text-on-surface">{item.alimento_oferecido}</span>
                              <div className="flex items-center gap-3">
                                <span className="bg-surface-container px-2 py-0.5 rounded text-[10px] border border-outline-variant/20 text-on-surface-variant font-semibold">
                                  Cat: {item.categoria_correspondida}
                                </span>
                                <span className="font-extrabold text-primary">{item.quantidade}</span>
                                
                                {alOriginal && alOriginal.status === 'Pendente' ? (
                                  <button
                                    onClick={() => onReservar(alOriginal)}
                                    className="bg-primary text-[#161e00] text-[10px] font-extrabold px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm"
                                  >
                                    Reservar
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                                    <Check className="w-3 h-3" />
                                    Reservado
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {myMatches.length === 0 && (
                  <div className="bg-surface-container p-8 rounded-2xl text-center border border-outline-variant/20">
                    <p className="text-xs text-on-surface-variant italic">
                      Aguardando doações compatíveis com suas necessidades no momento. O cérebro da IA atualizará as correspondências automaticamente.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Bookings (QR Code notification) */}
            {activeColetas.length > 0 && (
              <div id="booking-notification" className="bg-primary-container/20 border border-primary-container/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-on-surface">Você possui {activeColetas.length} retirada(s) pendente(s)</p>
                  <p className="text-[10px] text-on-surface-variant">Apresente o QR Code no mercado para liberar a doação.</p>
                </div>
                <button
                  id="view-coleta-btn"
                  onClick={() => setSelectedColeta(activeColetas[0])}
                  className="bg-primary text-[#161e00] px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Ver QR Code
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 3: QR Code presentation (Single Item detail view) */}
        {activeActorTab === 'ong' && selectedColeta && (
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
                className="p-2.5 bg-surface-container rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-on-surface" />
              </button>
              <div>
                <h3 className="text-base font-bold text-on-surface">Código de Retirada Autorizada</h3>
                <p className="text-[10px] text-on-surface-variant">Apresente ao supermercado no momento da coleta</p>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div id="qr-presentation-card" className="flex flex-col items-center py-8 bg-surface-container rounded-2xl border border-outline-variant/15 shadow-sm">
              <div id="qr-glow-wrapper" className="relative p-6 bg-white rounded-2xl shadow-md mb-4 border border-outline-variant/20">
                <img 
                  id="mock-qr-img"
                  alt="Withdrawal QR Code" 
                  className="w-48 h-48" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQKYl0dYlrhA-a6sWCeaLGSiN2eyk7aDTP7vNw_5aBud8pGXfVD5Uak5hOJoeFsXGfkiSY7RP8QKuvrywFQnI1rMv6330wUrLEWiHse8INBXZ0O_rNIFMRs2uX21NMy_qNTAat53cmqAiGqxP_urRdJVNQJuxt1Pl_38oFSs72LprXihaHd44AZ0Nk8SHrU1L0UEVKcRfMk4A9lkcVgdXCgL99bn-LXD2w8cQfY6jbnLOrH15xye9R8efS_FOlSxgbaiQTE8rC4OQ"
                />
              </div>
              <p className="text-center text-xs font-semibold text-on-surface-variant max-w-[260px] leading-relaxed">
                Este código é de uso exclusivo para a liberação dos alimentos indicados abaixo.
              </p>
            </div>

            {/* Details Card */}
            <div id="qr-details-card" className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20 space-y-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-primary">{selectedColeta.supermercado}</h2>
                  <p className="text-[9px] font-bold text-on-surface-variant tracking-wider uppercase">Pedido #{selectedColeta.pedidoId}</p>
                </div>
                <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-primary-container/20 border border-primary-container/30 text-primary uppercase">
                  Pendente de Validação
                </span>
              </div>

              <div id="qr-items-list" className="space-y-3 pt-2">
                {selectedColeta.itens.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 text-on-surface bg-white p-3 rounded-xl border border-outline-variant/10 shadow-xs">
                    <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-lg">
                      🥖
                    </div>
                    <div>
                      <span className="text-xs font-bold text-primary">{it.quantidade}</span>
                      <span className="text-xs text-on-surface font-semibold ml-1.5">de {it.nome}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div id="qr-date-line" className="pt-4 border-t border-outline-variant/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-on-surface-variant font-medium">Prazo Estimado</span>
                  <span className="font-bold text-on-surface">{selectedColeta.dataRetirada}</span>
                </div>
              </div>
            </div>

            {/* Simulated explanation */}
            <div className="bg-surface-container p-4 rounded-xl text-center border border-outline-variant/10">
              <p className="text-xs text-on-surface-variant/80 font-medium">
                💡 **Logística Real**: Ao chegar no mercado, apresente esta tela. O gerente do supermercado usará o leitor do painel dele para ler seu QR Code e confirmar a liberação.
              </p>
            </div>
          </motion.div>
        )}

        {/* TAB 4: Reports (Geração de PDF) */}
        {activeActorTab === 'relatorios' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-on-surface">Relatórios de Impacto Social</h2>
              <p className="text-xs text-on-surface-variant">Monitore e faça o download dos alimentos recebidos e famílias alimentadas.</p>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/10 space-y-1 shadow-sm">
                <TrendingUp className="w-5 h-5 text-primary" />
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Refeições Providas</p>
                <p className="text-2xl font-black text-primary">824 pratos</p>
              </div>
              <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/10 space-y-1 shadow-sm">
                <Heart className="w-5 h-5 text-primary fill-current" />
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-1">Alimentos Salvos</p>
                <p className="text-2xl font-black text-primary">412 kg</p>
              </div>
            </div>

            {/* Export Card */}
            <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/20 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto border border-primary/20">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-on-surface">Exportar Demonstrativo Oficial</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  Gere um documento PDF assinado contendo os dados consolidados de recebimento e impacto social da sua ONG para fins de prestação de contas.
                </p>
              </div>
              <button
                onClick={handleExportPDF}
                className="w-full max-w-xs h-13 bg-primary text-[#161e00] font-extrabold rounded-xl inline-flex items-center justify-center gap-2 shadow-md hover:bg-opacity-95 transition-all cursor-pointer active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>Baixar Relatório (PDF)</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* TAB 5: Profile Area */}
        {activeActorTab === 'perfil' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-on-surface">Meu Perfil de Voluntariado</h2>
              <p className="text-xs text-on-surface-variant">Gerencie os dados cadastrais da sua instituição parceira.</p>
            </div>

            <div className="bg-surface-container rounded-2xl border border-outline-variant/15 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary">
                  <img 
                    alt="NGO Logo" 
                    className="w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG4-Tz7fVuQ9aVkyeQvEztoGpy6KEX753m-0NGXj4GSGp7ewHfi0DsA_61Dta57L8pIAWjbzQM6MJtJj3IjW5zkZK-uiIyV0R7cthVoKORFSQdj8Mn852XhJ3ef39GftkHySJ_G-v8lB_lSur9Y2lkRfNXrezecDdGskhS3jMsgpX9EyUbUJFC-RIK9Gt2LB8pXIDiWf60SgqSY0Az7jLCS6kwWkXwLTnkTyBJX3SzaSIa3WEBPlGj0aPfcyl2M2tuRV7HWBq_9rc"
                  />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">{user.name}</h3>
                  <span className="text-[10px] bg-primary-container/20 border border-primary/30 text-primary font-bold px-2.5 py-0.5 rounded-full uppercase font-mono">
                    ONG Certificada
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3 text-xs border-t border-outline-variant/10">
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">E-mail de Contato</span>
                  <span className="font-semibold text-on-surface">{user.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Endereço Principal</span>
                  <span className="font-semibold text-on-surface">Rua da Solidariedade, 240</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Status da Conta</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-0.5">
                    <Check className="w-3.5 h-3.5" />
                    Ativa
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
