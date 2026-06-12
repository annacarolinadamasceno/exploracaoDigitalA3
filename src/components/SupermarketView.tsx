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
  Clock,
  Check,
  FileText,
  Camera,
  Store,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alimento, ColetaAtiva, TransacaoHistorico } from '../types';
import { downloadReportPDF } from '../utils/ReportGenerator';

interface SupermarketViewProps {
  alimentos: Alimento[];
  onAddAlimento: (item: Omit<Alimento, 'id' | 'status'>) => void;
  // Auth and new tab state integration props
  user: { name: string; email: string };
  activeColetas: ColetaAtiva[];
  onFinalizarColeta: (coletaId: string) => void;
  matches: any[];
  activeActorTab: 'supermercado' | 'relatorios' | 'perfil';
  historico: TransacaoHistorico[];
}

export default function SupermarketView({
  alimentos,
  onAddAlimento,
  user,
  activeColetas,
  onFinalizarColeta,
  matches,
  activeActorTab,
  historico
}: SupermarketViewProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // QR Code Scanner Simulation states
  const [activeScanningColeta, setActiveScanningColeta] = useState<ColetaAtiva | null>(null);
  const [qrScanned, setQrScanned] = useState(false);
  const [isScanningAnimation, setIsScanningAnimation] = useState(false);

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

  // Filter food inventory to show only the ones registered by THIS Supermarket
  const myAlimentos = alimentos.filter(a => !a.doador || a.doador.toLowerCase() === user.name.toLowerCase());

  // Filter scheduled collections for this supermarket
  const myColetas = activeColetas.filter(c => !c.supermercado || c.supermercado.toLowerCase() === user.name.toLowerCase());

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

  // Simulating QR Code Scanning action
  const handleOpenScanner = (coleta: ColetaAtiva) => {
    setActiveScanningColeta(coleta);
    setQrScanned(false);
    setIsScanningAnimation(false);
  };

  const handleSimularLeituraQR = () => {
    setIsScanningAnimation(true);
    setTimeout(() => {
      setIsScanningAnimation(false);
      setQrScanned(true);
    }, 1500);
  };

  const handleConfirmarColeta = (coletaId: string) => {
    onFinalizarColeta(coletaId);
    setActiveScanningColeta(null);
    setQrScanned(false);
  };

  // Generate PDF donation report from real transaction history
  const handleExportPDF = () => {
    const myHistorico = historico.filter(tx => tx.supermercado.toLowerCase() === user.name.toLowerCase());
    const concluidas = myHistorico.filter(tx => tx.status === 'Concluída');
    const totalItens = concluidas.length;
    const reportData = {
      title: `Relatório de Doações - ${user.name}`,
      userName: user.name,
      userRole: 'supermercado' as const,
      userEmail: user.email,
      stats: [
        { label: 'Total de Doações Concluídas', value: `${totalItens} entregas` },
        { label: 'Cancelamentos', value: `${myHistorico.length - totalItens}` },
        { label: 'ONGs Beneficiadas', value: `${new Set(concluidas.map(tx => tx.ong)).size}` }
      ],
      history: myHistorico.map(tx => ({
        date: new Date(tx.dataRegistro).toLocaleDateString('pt-BR'),
        item: tx.item,
        quantity: tx.quantidade,
        partner: tx.ong,
        status: tx.status
      }))
    };
    downloadReportPDF(reportData);
  };

  return (
    <div id="supermarket-view-root" className="space-y-6">
      <AnimatePresence mode="wait">

        {/* Screen 5: Success Form view */}
        {showSuccess && (
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
                O cérebro de IA processará a distribuição para a melhor ONG compatível no background.
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
                className="w-full h-14 bg-primary-container text-[#161e00] text-sm font-bold rounded-xl flex items-center justify-center gap-2 drop-shadow-md active:scale-95 transition-all cursor-pointer"
              >
                Voltar para Home
              </button>
              <button
                id="success-add-another"
                onClick={handleAddAnother}
                className="w-full h-14 bg-surface-container border border-outline-variant/30 text-on-surface text-sm font-bold rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                Cadastrar outro item
              </button>
            </div>
          </motion.div>
        )}

        {/* Screen 4: Full page cadastre form */}
        {showFullForm && !showSuccess && (
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
                className="p-2 bg-surface-container rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
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
              <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20 space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Nome do Item</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-white border border-outline-variant focus:ring-2 focus:ring-primary text-sm text-on-surface placeholder:text-on-surface-variant/40"
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
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-pointer ${categoria === cat.id
                          ? 'bg-primary-container border-2 border-primary text-[#161e00] shadow-sm transform scale-[1.03]'
                          : 'bg-white border-outline-variant/30 hover:bg-surface-container text-on-surface-variant'
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
                      className="w-full h-12 px-4 rounded-xl bg-white border border-outline-variant focus:ring-2 focus:ring-primary text-sm text-on-surface"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Unidade</label>
                    <select
                      value={unidade}
                      onChange={(e) => setUnidade(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-white border border-outline-variant focus:ring-2 focus:ring-primary text-sm text-on-surface"
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
                    className="w-full h-12 px-4 rounded-xl bg-white border border-outline-variant focus:ring-2 focus:ring-primary text-sm text-on-surface"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-14 bg-primary text-[#161e00] font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all mt-4 cursor-pointer"
                >
                  <Heart className="w-5 h-5 fill-current" />
                  <span>Cadastrar Doação</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Screen 2: Main Supermarket View (Doar & Retiradas) */}
        {activeActorTab === 'supermercado' && !showFullForm && !showSuccess && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                id="novo-item-col-btn"
                onClick={handleOpenFullForm}
                className="w-full h-14 bg-primary text-[#161e00] font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Formulário de Nova Doação</span>
              </button>
            </div>

            {/* Active Donations Drawer overlay */}
            <AnimatePresence>
              {showDrawer && (
                <>
                  <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs" onClick={() => setShowDrawer(false)} />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto rounded-t-3xl bg-white border-t border-outline-variant p-6 z-50 space-y-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
                      <h3 className="text-lg font-bold text-on-surface">Registrar Alimento</h3>
                      <button
                        onClick={() => setShowDrawer(false)}
                        className="p-1.5 bg-surface-container hover:bg-surface-container-high rounded-full cursor-pointer"
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
                          className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/20 focus:ring-2 focus:ring-primary text-sm text-on-surface"
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
                            className="w-full h-12 px-4 rounded-xl bg-surface-container border border-outline-variant/20 focus:ring-2 focus:ring-primary text-sm text-on-surface"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Quantidade</label>
                          <div className="flex bg-surface-container border border-outline-variant/20 rounded-xl overflow-hidden">
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
                          className="w-1/3 h-12 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Avançado
                        </button>
                        <button
                          type="submit"
                          className="flex-1 h-12 bg-primary text-[#161e00] text-xs font-extrabold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Confirmar Registro
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Scheduled Coletas matches area (scanner confirm) */}
            <div id="scheduled-withdrawals" className="space-y-4 bg-surface-container p-5 rounded-2xl border border-outline-variant/10 shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1">
                    <Store className="w-4 h-4 text-primary" />
                    <span>Retiradas Agendadas (Matches)</span>
                  </h3>
                  <p className="text-[10px] text-on-surface-variant">Confirme a entrega lendo o QR Code apresentado pela ONG</p>
                </div>
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase">
                  Scanner
                </span>
              </div>

              <div className="space-y-3 max-h-[220px] overflow-y-auto">
                {myColetas.map((coleta) => (
                  <div
                    key={coleta.id}
                    className="bg-white border border-outline-variant/30 p-4 rounded-xl flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <p className="text-xs font-bold text-primary">{coleta.supermercado}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">
                        Itens: <span className="font-semibold">{coleta.itens.map(i => `${i.quantidade} de ${i.nome}`).join(', ')}</span>
                      </p>
                      <p className="text-[9px] font-mono text-on-surface-variant/80 uppercase mt-0.5 leading-none">Pedido #{coleta.pedidoId}</p>
                    </div>
                    <button
                      onClick={() => handleOpenScanner(coleta)}
                      className="bg-primary text-[#161e00] text-[10px] font-extrabold px-3 py-2 rounded-lg active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Validar QR</span>
                    </button>
                  </div>
                ))}
                {myColetas.length === 0 && (
                  <p className="text-xs text-on-surface-variant/65 italic py-4 text-center">Nenhuma ONG agendada para coleta neste momento.</p>
                )}
              </div>
            </div>

            {/* QR Scanner Simulator Modal overlay */}
            <AnimatePresence>
              {activeScanningColeta && (
                <>
                  <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-xs" onClick={() => setActiveScanningColeta(null)} />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl border border-outline-variant p-6 z-55 space-y-6 shadow-2xl"
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                      <div>
                        <h3 className="text-base font-bold text-on-surface">Validar QR Code de Retirada</h3>
                        <p className="text-[10px] text-on-surface-variant">ONG: {activeScanningColeta.supermercado} • Pedido #{activeScanningColeta.pedidoId}</p>
                      </div>
                      <button
                        onClick={() => setActiveScanningColeta(null)}
                        className="p-1 bg-surface-container hover:bg-surface-container-high rounded-full cursor-pointer"
                      >
                        <X className="w-4 h-4 text-on-surface" />
                      </button>
                    </div>

                    {/* Camera simulation box */}
                    <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-4 border-outline-variant">
                      {isScanningAnimation ? (
                        <div className="absolute inset-x-0 h-1 bg-primary animate-scanLine top-0"></div>
                      ) : null}

                      {qrScanned ? (
                        <div className="text-center space-y-2 z-10 animate-scaleUp">
                          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
                          <p className="text-sm font-bold text-white uppercase tracking-wider">Leitura Efetuada!</p>
                        </div>
                      ) : (
                        <div className="text-center space-y-2 z-10 p-4">
                          <Camera className={`w-12 h-12 text-white/50 mx-auto ${isScanningAnimation ? 'animate-pulse' : ''}`} />
                          <p className="text-xs text-white/70 leading-relaxed font-semibold">
                            {isScanningAnimation ? 'Verificando assinatura digital...' : 'Aponte o leitor para o QR Code da ONG'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons simulated scan */}
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={handleSimularLeituraQR}
                        disabled={qrScanned || isScanningAnimation}
                        className="w-full h-11 bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 rounded-xl text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4 text-primary" />
                        Simular Scanner Automático (Câmera)
                      </button>

                      <button
                        onClick={() => handleConfirmarColeta(activeScanningColeta.id)}
                        disabled={!qrScanned}
                        className={`w-full h-13 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${qrScanned
                          ? 'bg-primary text-[#161e00] cursor-pointer shadow-md active:scale-95'
                          : 'bg-surface-container-highest text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/10'
                          }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Confirmar Entrega de Alimentos
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Registered Active Supplies List */}
            <div id="active-donations-section" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-on-surface">Minhas Doações Cadastradas</h2>
                <span className="text-xs font-bold text-primary cursor-pointer hover:underline">Ver Tudo ({myAlimentos.length})</span>
              </div>

              <div className="space-y-3">
                {myAlimentos.map((item) => {
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
                        <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-2xl border border-outline-variant/20 shadow-xs">
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
                          <span className="px-2.5 py-1 rounded-full bg-primary-container/20 border border-primary/30 text-[10px] font-bold text-primary uppercase whitespace-nowrap">
                            Aguardando Coleta
                          </span>
                        ) : item.status === 'Coletado' ? (
                          <span className="px-2.5 py-1 rounded-full bg-surface-container-highest border border-outline-variant/30 text-[10px] font-bold text-on-surface-variant uppercase whitespace-nowrap">
                            Coletado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-600 uppercase whitespace-nowrap">
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

        {/* TAB 3: Relatórios Doador (Export PDF) */}
        {activeActorTab === 'relatorios' && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-on-surface">Relatórios de Impacto Doador</h2>
              <p className="text-xs text-on-surface-variant">Acompanhe o impacto sustentável das suas doações e baixe o certificado.</p>
            </div>

            {/* Dashboard metrics from real data */}
            {(() => {
              const myHistorico = historico.filter(tx => tx.supermercado.toLowerCase() === user.name.toLowerCase());
              const concluidas = myHistorico.filter(tx => tx.status === 'Concluída');
              const ongsBeneficiadas = new Set(concluidas.map(tx => tx.ong)).size;
              return (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/10 space-y-1 shadow-sm">
                    <Heart className="w-4 h-4 text-primary fill-current" />
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">Concluídas</p>
                    <p className="text-xl font-black text-primary">{concluidas.length}</p>
                  </div>
                  <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/10 space-y-1 shadow-sm">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">Total</p>
                    <p className="text-xl font-black text-primary">{myHistorico.length}</p>
                  </div>
                  <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/10 space-y-1 shadow-sm">
                    <Award className="w-4 h-4 text-primary" />
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mt-1">ONGs</p>
                    <p className="text-xl font-black text-primary">{ongsBeneficiadas}</p>
                  </div>
                </div>
              );
            })()}

            {/* Transaction History Table */}
            <div className="bg-surface-container rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/15">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Histórico de Transações</h3>
                <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase">
                  {historico.filter(tx => tx.supermercado.toLowerCase() === user.name.toLowerCase()).length} registros
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface-container-high">
                      <th className="text-left px-4 py-2.5 font-bold text-on-surface-variant uppercase text-[9px] tracking-wider">Data</th>
                      <th className="text-left px-4 py-2.5 font-bold text-on-surface-variant uppercase text-[9px] tracking-wider">Item Doado</th>
                      <th className="text-left px-4 py-2.5 font-bold text-on-surface-variant uppercase text-[9px] tracking-wider">Qtd</th>
                      <th className="text-left px-4 py-2.5 font-bold text-on-surface-variant uppercase text-[9px] tracking-wider">ONG</th>
                      <th className="text-right px-4 py-2.5 font-bold text-on-surface-variant uppercase text-[9px] tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico
                      .filter(tx => tx.supermercado.toLowerCase() === user.name.toLowerCase())
                      .map(tx => (
                        <tr key={tx.id} className="border-t border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                          <td className="px-4 py-3 text-on-surface-variant">{new Date(tx.dataRegistro).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3 font-semibold text-on-surface">{tx.item}</td>
                          <td className="px-4 py-3 font-bold text-primary">{tx.quantidade}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{tx.ong}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              tx.status === 'Concluída'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-200/50'
                                : 'bg-rose-500/10 text-rose-600 border border-rose-200/50'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    }
                    {historico.filter(tx => tx.supermercado.toLowerCase() === user.name.toLowerCase()).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-xs text-on-surface-variant/60 italic">
                          Nenhuma doação registrada ainda. Confirme as entregas para gerar o histórico!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Export Card */}
            <div className="bg-surface-container p-6 rounded-3xl border border-outline-variant/20 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mx-auto border border-primary/20">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-on-surface">Baixar Demonstrativo Oficial</h3>
                <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                  Gere e baixe seu demonstrativo formal de impacto social e ambiental para relatórios ESG corporativos e isenção fiscal de descarte.
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

        {/* TAB 4: Profile Section */}
        {activeActorTab === 'perfil' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-on-surface">Meu Estabelecimento</h2>
              <p className="text-xs text-on-surface-variant">Gerencie os dados cadastrais da sua empresa doadora.</p>
            </div>

            <div className="bg-surface-container rounded-2xl border border-outline-variant/15 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary bg-primary-container flex items-center justify-center text-3xl">
                  🏢
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-on-surface">{user.name}</h3>
                  <span className="text-[10px] bg-primary-container/20 border border-primary/30 text-primary font-bold px-2.5 py-0.5 rounded-full uppercase font-mono">
                    Doador Certificado Fome Zero
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3 text-xs border-t border-outline-variant/10">
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Razão Social / Identificação</span>
                  <span className="font-semibold text-on-surface">{user.name} S/A</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">E-mail Principal</span>
                  <span className="font-semibold text-on-surface">{user.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Endereço Comercial</span>
                  <span className="font-semibold text-on-surface">Avenida das Nações Unidas, 1852</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-on-surface-variant">Status da Parceria</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-0.5">
                    <Check className="w-3.5 h-3.5" />
                    Parceiro Ouro
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
