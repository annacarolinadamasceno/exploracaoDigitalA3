/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MapPin, 
  Sparkles, 
  LogOut,
  Calendar,
  Layers,
  Award,
  PlusCircle,
  FileText,
  UserCheck,
  Loader2
} from 'lucide-react';
import { Alimento, Ong, ColetaAtiva, TransacaoHistorico } from './types';
import NgoView from './components/NgoView';
import SupermarketView from './components/SupermarketView';
import AuthView from './components/AuthView';
import {
  fetchAlimentos,
  seedAlimentos,
  insertAlimento,
  updateAlimentoStatus,
  updateAlimentoQuantidade,
  fetchColetasAtivas,
  insertColeta,
  deleteColeta,
  fetchHistorico,
  insertTransacao,
  loadOngsFromStorage,
  saveOngsToStorage,
  getSessionUserId,
} from './supabaseClient';

// Mock initial foods
const INITIAL_ALIMENTOS: Alimento[] = [
  {
    id: 'paes',
    nome: 'Pães Artesanais',
    categoria: 'Padaria',
    quantidade: 15,
    unidade: 'un',
    validade: '2026-06-02',
    status: 'Pendente',
    tempoExpiraHora: 4,
    doador: 'Supermercado Silva',
    distanciaKm: 1.2,
    tipoIcone: 'bakery_dining'
  },
  {
    id: 'leite',
    nome: 'Caixas de Leite',
    categoria: 'Laticínios',
    quantidade: 48,
    unidade: 'un',
    validade: '2026-06-15',
    status: 'Coletado',
    tempoExpiraHora: 12,
    doador: 'Express Market',
    distanciaKm: 3.5,
    tipoIcone: 'nutrition'
  },
  {
    id: 'ovos',
    nome: 'Ovos Tipo A',
    categoria: 'Proteína Animal',
    quantidade: 10,
    unidade: 'dz',
    validade: '2026-06-05',
    status: 'Pendente',
    tempoExpiraHora: 2,
    doador: 'Mercado do Porto',
    distanciaKm: 0.8,
    tipoIcone: 'egg'
  },
  {
    id: 'silva_frutas',
    nome: 'Frutas da Cesta Estação',
    categoria: 'Frutas',
    quantidade: 20,
    unidade: 'kg',
    validade: '2026-06-01',
    status: 'Pendente',
    tempoExpiraHora: 4,
    doador: 'Supermercado Silva',
    distanciaKm: 1.2,
    tipoIcone: 'nutrition'
  }
];

// Mock initial ONGs and needs
const INITIAL_ONGS: Ong[] = [
  {
    id: 'ong_1',
    nome: 'ONG Mesa Unida',
    necessidades: ['Padaria', 'Frutas'],
    tempoSemDoacaoDias: 20, // Oldest, highest priority
    ultimaDoacao: '02/05/2026',
    nivelUrgencia: 'Crítico',
    tempoSegundosSimulado: 1728000,
    endereco: '1.2km de distância'
  },
  {
    id: 'ong_2',
    nome: 'ONG Lar da Esperança',
    necessidades: ['Proteína Animal', 'Laticínios'],
    tempoSemDoacaoDias: 15,
    ultimaDoacao: '07/05/2026',
    nivelUrgencia: 'Crítico',
    tempoSegundosSimulado: 1296000,
    endereco: '0.8km de distância'
  },
  {
    id: 'ong_3',
    nome: 'ONG Anjos Urbanos',
    necessidades: ['Congelados'],
    tempoSemDoacaoDias: 8,
    ultimaDoacao: '14/05/2026',
    nivelUrgencia: 'Alto',
    tempoSegundosSimulado: 691200,
    endereco: '3.5km de distância'
  }
];

// Helper to parse need string and extract quantity, unit, and maximum withdrawal date locally
function parseNeedLocal(needStr: string) {
  let maxDate: string | null = null;
  let cleanStr = needStr;
  const dateMatch = needStr.match(/\(Retirar até:\s*([\d-]+)\)/);
  if (dateMatch) {
    maxDate = dateMatch[1].trim();
    cleanStr = needStr.replace(/\s*\(Retirar até:\s*[\d-]+\)/, "").trim();
  }

  const parts = cleanStr.split(" - ");
  if (parts.length >= 2) {
    const name = parts[0].trim();
    const qtyStr = parts[1].trim();
    const qtyMatch = qtyStr.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
    if (qtyMatch) {
      const qty = parseFloat(qtyMatch[1]);
      const unit = qtyMatch[2] ? qtyMatch[2].trim() : null;
      return { name, qty, unit, maxDate };
    }
    return { name, qty: null, unit: null, maxDate };
  }

  return { name: cleanStr.trim(), qty: null, unit: null, maxDate };
}

// Silent matching algorithm that mimics backend API structure locally
function simulateMatchingLocal(alimentosList: Alimento[], ongsList: Ong[]): any[] {
  const sortedOngs = [...ongsList].sort((a, b) => b.tempoSemDoacaoDias - a.tempoSemDoacaoDias);
  const results: any[] = [];
  
  // Clone food array to track available quantities during allocation
  const tempAlimentos = alimentosList.map(a => ({
    ...a,
    quantidadeRestante: a.quantidade
  }));

  for (const ong of sortedOngs) {
    const items: any[] = [];

    for (const needStr of ong.necessidades) {
      const { name: needName, qty: needQty, maxDate } = parseNeedLocal(needStr);
      const lowerNeedName = needName.toLowerCase();

      for (const item of tempAlimentos) {
        if (item.status !== 'Pendente') continue;
        if (item.quantidadeRestante <= 0) continue;

        // Expiration date validation: food expiration date must be >= NGO's max withdrawal date
        if (maxDate && item.validade && item.validade < maxDate) continue;

        const foodName = item.nome.toLowerCase();
        const foodCat = item.categoria.toLowerCase();

        const nameMatches = foodName.includes(lowerNeedName) || lowerNeedName.includes(foodName);
        const catMatches = foodCat.includes(lowerNeedName) || lowerNeedName.includes(foodCat);

        if (nameMatches || catMatches) {
          const qtyToAllocate = needQty !== null 
            ? Math.min(needQty, item.quantidadeRestante) 
            : item.quantidadeRestante;

          if (qtyToAllocate > 0) {
            item.quantidadeRestante -= qtyToAllocate;
            items.push({
              alimento_oferecido: item.nome,
              categoria_correspondida: item.categoria,
              quantidade: `${qtyToAllocate} ${item.unidade}`,
              id_alimento: item.id
            });
          }
        }
      }
    }

    if (items.length > 0) {
      results.push({
        nome_ong: ong.nome,
        motivo_prioridade: `ONG Priorizada por IA por possuir o maior tempo de espera desde a última doação registrada (${ong.tempoSemDoacaoDias} dias sem doações). Mapeamento lógico realizado para atender as necessidades de: ${ong.necessidades.join(", ")}.`,
        itens_atendidos: items,
        nivel_urgencia: ong.tempoSemDoacaoDias >= 15 ? 'Crítico' : (ong.tempoSemDoacaoDias >= 10 ? 'Alto' : 'Médio')
      });
    }
  }

  return results;
}

export default function App() {
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [ongs, setOngs] = useState<Ong[]>([]);
  const [user, setUser] = useState<{ name: string; role: 'ong' | 'supermercado'; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab switcher active state
  const [activeActor, setActiveActor] = useState<'ong' | 'supermercado' | 'relatorios' | 'perfil'>('ong');
  
  // Invisible AI Matching results state computed in background
  const [matches, setMatches] = useState<any[]>([]);

  // Coletas tracking state
  const [activeColetas, setActiveColetas] = useState<ColetaAtiva[]>([]);

  // Transaction history state
  const [historico, setHistorico] = useState<TransacaoHistorico[]>([]);

  // ---------------------------------------------------------------------------
  // Initial data load from Supabase on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadAllData() {
      setLoading(true);
      try {
        // Parallel fetch of all persistent data
        const [alimentosData, coletasData, historicoData] = await Promise.all([
          fetchAlimentos(),
          fetchColetasAtivas(),
          fetchHistorico(),
        ]);

        // Alimentos: seed DB if empty
        if (alimentosData.length === 0) {
          const seeded = await seedAlimentos(INITIAL_ALIMENTOS);
          setAlimentos(seeded);
        } else {
          setAlimentos(alimentosData);
        }

        setActiveColetas(coletasData);
        setHistorico(historicoData);

        // ONGs: load from localStorage, seed if empty
        const storedOngs = loadOngsFromStorage<Ong>();
        if (storedOngs.length === 0) {
          setOngs(INITIAL_ONGS);
          saveOngsToStorage(INITIAL_ONGS);
        } else {
          setOngs(storedOngs);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do Supabase:', err);
        // Fallback para dados locais se o banco falhar
        setAlimentos(INITIAL_ALIMENTOS);
        setOngs(INITIAL_ONGS);
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, []);

  // Recalculate matches silently whenever food inventory or needs change
  const recalculateMatchesSilently = async (currentAlimentos: Alimento[], currentOngs: Ong[]) => {
    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alimentos: currentAlimentos, ongs: currentOngs }),
      });
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches);
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback local matching
      const fallback = simulateMatchingLocal(currentAlimentos, currentOngs);
      setMatches(fallback);
    }
  };

  useEffect(() => {
    recalculateMatchesSilently(alimentos, ongs);
  }, [alimentos, ongs]);

  const handleLogin = (loggedInUser: { name: string; role: 'ong' | 'supermercado'; email: string }) => {
    setUser(loggedInUser);
    
    if (loggedInUser.role === 'ong') {
      setActiveActor('ong');
      // If ONG doesn't exist in localStorage, add it
      setOngs(prev => {
        if (prev.some(o => o.nome.toLowerCase() === loggedInUser.name.toLowerCase())) return prev;
        const newOng: Ong = {
          id: `ong_${Date.now()}`,
          nome: loggedInUser.name,
          necessidades: ['Padaria', 'Frutas'],
          tempoSemDoacaoDias: 12,
          ultimaDoacao: '15/05/2026',
          nivelUrgencia: 'Alto',
          tempoSegundosSimulado: 1036800,
          endereco: 'Localizada no Centro'
        };
        const updated = [newOng, ...prev];
        saveOngsToStorage(updated); // persist new ONG to localStorage
        return updated;
      });
    } else {
      setActiveActor('supermercado');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  // NGO reserves an item from active matches list
  const handleReservarAlimento = async (alimento: Alimento, quantidadeReservada?: number) => {
    const qtyToReserve = quantidadeReservada !== undefined ? quantidadeReservada : alimento.quantidade;
    const isSplit = qtyToReserve < alimento.quantidade;

    const ongName = user ? user.name : 'ONG';
    let reservedId = alimento.id;

    if (isSplit) {
      // Reduce original in DB
      const newQty = alimento.quantidade - qtyToReserve;
      await updateAlimentoQuantidade(alimento.id, newQty);

      // Insert the reserved portion into DB
      const reservedData = await insertAlimento(
        { ...alimento, quantidade: qtyToReserve, status: 'Aguardando Coleta' },
        getSessionUserId(alimento.doador || 'seed')
      );
      reservedId = reservedData?.id || `alimento_res_${Date.now()}`;

      // Update local state
      setAlimentos(prev => {
        const remaining: Alimento = { ...alimento, quantidade: newQty };
        const reserved: Alimento = {
          ...alimento,
          id: reservedId,
          quantidade: qtyToReserve,
          status: 'Aguardando Coleta'
        };
        return prev
          .map(item => item.id === alimento.id ? remaining : item)
          .concat(reserved);
      });
    } else {
      // Full reservation
      await updateAlimentoStatus(alimento.id, 'Aguardando Coleta');
      setAlimentos(prev =>
        prev.map(item => item.id === alimento.id ? { ...item, status: 'Aguardando Coleta' } : item)
      );
    }

    const newColeta: ColetaAtiva = {
      id: `coleta_${Date.now()}`,
      aberto: true,
      supermercado: alimento.doador || 'Supermercado Silva',
      pedidoId: Math.floor(10000 + Math.random() * 90000).toString(),
      itens: [
        { nome: alimento.nome, quantidade: `${qtyToReserve} ${alimento.unidade}`, icone: 'shopping_basket' }
      ],
      dataRetirada: 'Hoje, às 18h30',
      status: 'Pendente',
      id_alimento: reservedId,
      nomeOng: ongName
    };

    await insertColeta(newColeta);
    setActiveColetas(prev => [newColeta, ...prev]);
  };

  // Supermarket confirms collection of active coleta and records transaction
  const handleFinalizarColeta = async (coletaId: string) => {
    const targetColeta = activeColetas.find(c => c.id === coletaId);
    if (!targetColeta) return;

    // Remove coleta from DB
    await deleteColeta(coletaId);
    setActiveColetas(prev => prev.filter(c => c.id !== coletaId));

    // Update food status to Coletado in DB
    const alimentoId = targetColeta.id_alimento;
    if (alimentoId) {
      await updateAlimentoStatus(alimentoId, 'Coletado');
    }
    const itemNames = targetColeta.itens.map(i => i.nome.toLowerCase());
    setAlimentos(prev => prev.map(item => {
      if (item.id === alimentoId || itemNames.some(n => item.nome.toLowerCase().includes(n))) {
        return { ...item, status: 'Coletado' };
      }
      return item;
    }));

    // Insert transactions in DB
    const newTransacoes: TransacaoHistorico[] = targetColeta.itens.map(it => ({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dataRegistro: new Date().toISOString(),
      item: it.nome,
      quantidade: it.quantidade,
      supermercado: targetColeta.supermercado,
      ong: targetColeta.nomeOng || 'ONG',
      status: 'Concluída' as const,
      pedidoId: targetColeta.pedidoId
    }));
    await Promise.all(newTransacoes.map(tx => insertTransacao(tx)));
    setHistorico(prev => [...newTransacoes, ...prev]);
  };

  // Reverts pending coleta, returns food items to pool and records cancellation
  const handleCancelarColeta = async (coletaId: string) => {
    const targetColeta = activeColetas.find(c => c.id === coletaId);
    if (!targetColeta) return;

    // Remove coleta from DB
    await deleteColeta(coletaId);
    setActiveColetas(prev => prev.filter(c => c.id !== coletaId));

    // Revert alimento status back to Pendente in DB
    const alimentoId = targetColeta.id_alimento;
    if (alimentoId) {
      await updateAlimentoStatus(alimentoId, 'Pendente');
    }
    setAlimentos(prev => prev.map(item => {
      const matchesColetaItem = targetColeta.itens.some(it => it.nome === item.nome) && item.doador === targetColeta.supermercado;
      const shouldRevert =
        (alimentoId && item.id === alimentoId) ||
        (!alimentoId && matchesColetaItem && item.status === 'Aguardando Coleta');
      return shouldRevert ? { ...item, status: 'Pendente' } : item;
    }));

    // Insert cancellation in DB
    const cancelTransacoes: TransacaoHistorico[] = targetColeta.itens.map(it => ({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      dataRegistro: new Date().toISOString(),
      item: it.nome,
      quantidade: it.quantidade,
      supermercado: targetColeta.supermercado,
      ong: targetColeta.nomeOng || 'ONG',
      status: 'Cancelada' as const,
      pedidoId: targetColeta.pedidoId
    }));
    await Promise.all(cancelTransacoes.map(tx => insertTransacao(tx)));
    setHistorico(prev => [...cancelTransacoes, ...prev]);
  };

  // Adding new food supply as supermarket manager — persists to Supabase
  const handleAddAlimento = async (newItem: Omit<Alimento, 'id' | 'status'>) => {
    const supermercadoId = user ? getSessionUserId(user.name) : '11111111-1111-4111-8111-111111111111';
    const withMeta: Omit<Alimento, 'id'> = {
      ...newItem,
      status: 'Pendente',
      tempoExpiraHora: 8,
      doador: user ? user.name : 'Supermercado Silva',
      distanciaKm: 1.2
    };

    const saved = await insertAlimento(withMeta, supermercadoId);
    if (saved) {
      setAlimentos(prev => [saved, ...prev]);
    } else {
      // Fallback local if DB fails
      const fallback: Alimento = { ...withMeta, id: `alimento_${Date.now()}` };
      setAlimentos(prev => [fallback, ...prev]);
    }
  };

  // NGO updates/registers their needs list — persists to localStorage
  const handleUpdateNecessidades = (newNecessidades: string[]) => {
    if (!user) return;
    setOngs(prev => {
      const updated = prev.map(ong => {
        if (ong.nome.toLowerCase() === user.name.toLowerCase()) {
          return { ...ong, necessidades: newNecessidades };
        }
        return ong;
      });
      saveOngsToStorage(updated); // persist
      return updated;
    });
  };

  // If user is not logged in, render AuthView
  if (!user) {
    return <AuthView onLoginSuccess={handleLogin} />;
  }

  // Loading screen while fetching Supabase data
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center shadow-lg">
          <Heart className="w-8 h-8 text-primary fill-current" />
        </div>
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm font-semibold text-on-surface-variant">Carregando dados do sistema...</p>
      </div>
    );
  }

  // Profile icon mapping
  const profileAvatarUrl = user.role === 'ong' 
    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAG4-Tz7fVuQ9aVkyeQvEztoGpy6KEX753m-0NGXj4GSGp7ewHfi0DsA_61Dta57L8pIAWjbzQM6MJtJj3IjW5zkZK-uiIyV0R7cthVoKORFSQdj8Mn852XhJ3ef39GftkHySJ_G-v8lB_lSur9Y2lkRfNXrezecDdGskhS3jMsgpX9EyUbUJFC-RIK9Gt2LB8pXIDiWf60SgqSY0Az7jLCS6kwWkXwLTnkTyBJX3SzaSIa3WEBPlGj0aPfcyl2M2tuRV7HWBq_9rc"
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuC_5dBPr1edcTxfYnubPElQKqIpbWI9KiccpsTlre41qTPATHK7v7n8SrKxg82WYaxGASZ5QXpChJKDTEcpor-xr3Cqsvp3AdQ-Wff8wGiLv1W_deFzW7-REvwYLj8alKefX4SjWVoWdo6Vn8A1WDuH_MEW2IRNf79Qd6ebPY2Iq3Qv3A83Tjx3NvwKBFibmAd4UMiyjf7rtHOF4yE0BxTctPhkZA_BWm84G226IVoYoJZkORpCWlkxKA2AWDHUY1s3vadbdE7qwOw";

  return (
    <div id="app-viewport" className="min-h-screen bg-[#f3f4f6] text-on-surface flex flex-col items-center">
      {/* Container wrapper mimicking clean mobile bento proportions */}
      <div id="mobile-container-frame" className="w-full max-w-2xl bg-white min-h-screen shadow-lg relative flex flex-col pb-32 border-x border-outline-variant">
        
        {/* Top AppBar */}
        <header id="main-topbar" className="sticky top-0 w-full z-40 flex justify-between items-center px-6 h-18 bg-white border-b border-outline-variant/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
              <img 
                id="avatar-image"
                alt="Profile Avatar" 
                className="w-full h-full object-cover" 
                src={profileAvatarUrl}
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-primary">Fome Zero</h1>
              <p className="text-[10px] text-on-surface-variant font-mono font-bold leading-none uppercase">
                {user.role === 'ong' ? 'ONG / Voluntário' : 'Supermercado / Doador'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-on-surface px-3 py-1.5 bg-surface-container-low rounded-xl border border-outline-variant/15 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-primary" />
              <span className="max-w-[120px] truncate">{user.name}</span>
            </div>
            
            <button
              id="header-logout-btn"
              onClick={handleLogout}
              className="flex items-center justify-center p-2.5 bg-rose-50 hover:bg-rose-100/80 transition-colors rounded-full border border-rose-200 text-rose-600 cursor-pointer"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Floating Context Info bar */}
        <div id="context-info-bar" className="bg-primary-container/20 border-b border-primary-container/40 px-6 py-2.5 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-primary font-bold">Autenticado com Sucesso</span>
          </div>
          <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
            {user.role === 'ong' ? 'Painel de Voluntariado' : 'Painel Doador'}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6 bg-white">
          {user.role === 'ong' ? (
            <NgoView 
              alimentos={alimentos}
              onReservar={handleReservarAlimento}
              activeColetas={activeColetas}
              onFinalizarColeta={handleFinalizarColeta}
              onCancelarColeta={handleCancelarColeta}
              onNavigateToTab={(tab) => {
                if (tab === 'home') setActiveActor('ong');
                else if (tab === 'retirada') setActiveActor('ong');
              }}
              user={user}
              ongs={ongs}
              matches={matches}
              onUpdateNecessidades={handleUpdateNecessidades}
              activeActorTab={activeActor}
              historico={historico}
            />
          ) : (
            <SupermarketView 
              alimentos={alimentos}
              onAddAlimento={handleAddAlimento}
              user={user}
              activeColetas={activeColetas}
              onFinalizarColeta={handleFinalizarColeta}
              matches={matches}
              activeActorTab={activeActor}
              historico={historico}
            />
          )}
        </main>

        {/* Permanent Bottom Navigation Bar based on user role */}
        <nav id="permanent-bottom-nav" className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-40 flex justify-around items-center px-4 py-3 pb-safe bg-white border-t border-outline-variant/30 rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          {user.role === 'ong' ? (
            <>
              <button
                id="nav-ong-necessidades"
                onClick={() => setActiveActor('ong')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  activeActor === 'ong' 
                    ? 'bg-primary text-[#161e00] font-bold scale-105 px-5' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Layers className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Necessidades & Matches</span>
              </button>

              <button
                id="nav-ong-relatorios"
                onClick={() => setActiveActor('relatorios')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  activeActor === 'relatorios' 
                    ? 'bg-primary text-[#161e00] font-bold scale-105 px-5' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <FileText className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Relatório PDF</span>
              </button>
            </>
          ) : (
            <>
              <button
                id="nav-supermarket-doar"
                onClick={() => setActiveActor('supermercado')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  activeActor === 'supermercado' 
                    ? 'bg-primary text-[#161e00] font-bold scale-105 px-5' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <PlusCircle className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Doar & Produtos</span>
              </button>

              <button
                id="nav-supermarket-relatorios"
                onClick={() => setActiveActor('relatorios')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                  activeActor === 'relatorios' 
                    ? 'bg-primary text-[#161e00] font-bold scale-105 px-5' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <FileText className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Relatório PDF</span>
              </button>
            </>
          )}

          <button
            id="nav-profile-btn"
            onClick={() => setActiveActor('perfil')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              activeActor === 'perfil' 
                ? 'bg-primary text-[#161e00] font-bold scale-105 px-5' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Award className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Perfil</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
