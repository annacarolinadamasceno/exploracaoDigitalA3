/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Heart, 
  MapPin, 
  Users, 
  Sparkles, 
  User, 
  Calendar,
  Layers,
  Activity,
  Award,
  BookOpen,
  ArrowRightLeft
} from 'lucide-react';
import { Alimento, Ong, ColetaAtiva } from './types';
import NgoView from './components/NgoView';
import SupermarketView from './components/SupermarketView';
import AIMatcher from './components/AIMatcher';

// Mock initial foods
const INITIAL_ALIMENTOS: Alimento[] = [
  {
    id: 'paes',
    nome: 'Pães Artesanais',
    categoria: 'Padaria',
    quantidade: 15,
    unidade: 'un',
    validade: '24/10',
    status: 'Aguardando Coleta',
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
    validade: '30/11',
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
    validade: '22/10',
    status: 'Aguardando Coleta',
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
    validade: '28/10',
    status: 'Pendente',
    tempoExpiraHora: 4,
    doador: 'Supermercado Silva',
    distanciaKm: 1.2,
    tipoIcone: 'nutrition'
  }
];

// Mock priority queue for ONGs
const INITIAL_ONGS: Ong[] = [
  {
    id: 'ong_1',
    nome: 'ONG Mesa Unida',
    necessidades: ['Padaria', 'Frutas'],
    tempoSemDoacaoDias: 20, // Older, highest priority
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

export default function App() {
  const [alimentos, setAlimentos] = useState<Alimento[]>(INITIAL_ALIMENTOS);
  const [ongs] = useState<Ong[]>(INITIAL_ONGS);
  
  // Tab switcher actor states:
  // 'ong' -> Screen 1, Screen 3
  // 'supermercado' -> Screen 2, Screen 4, Screen 5
  // 'ia' -> The mandatory business matching simulation panel
  const [activeActor, setActiveActor] = useState<'ong' | 'supermercado' | 'ia'>('ong');

  // Coletas tracking state
  const [activeColetas, setActiveColetas] = useState<ColetaAtiva[]>([
    {
      id: 'coleta_1',
      aberto: true,
      supermercado: 'Supermercado Alvorada',
      pedidoId: '88291',
      itens: [
        { nome: 'Arroz Integral', quantidade: '2kg', icone: 'shopping_basket' },
        { nome: 'Ovos Mantiqueira', quantidade: '1 Dúzia', icone: 'egg' },
        { nome: 'Cesta de Hortifruti Variada', quantidade: '1 unidade', icone: 'nutrition' }
      ],
      dataRetirada: 'Hoje, às 17h30',
      status: 'Pendente'
    }
  ]);

  // Statistics
  const [atendidosCount, setAtendidosCount] = useState(1200);
  const [coletasCount, setColetasCount] = useState(42);

  // Profile switches
  const handleActorSwitch = (actor: 'ong' | 'supermercado' | 'ia') => {
    setActiveActor(actor);
  };

  // Reserving an item dynamically
  const handleReservarAlimento = (alimento: Alimento) => {
    // 1. Update status to reserved/awaiting
    setAlimentos(prev => prev.map(item => 
      item.id === alimento.id ? { ...item, status: 'Aguardando Coleta' } : item
    ));

    // 2. Add an active coleta
    const newColeta: ColetaAtiva = {
      id: `coleta_${Date.now()}`,
      aberto: true,
      supermercado: alimento.doador || 'Supermercado Parceiro',
      pedidoId: Math.floor(10000 + Math.random() * 90000).toString(),
      itens: [
        { nome: alimento.nome, quantidade: `${alimento.quantidade} ${alimento.unidade}`, icone: 'shopping_basket' }
      ],
      dataRetirada: 'Hoje, às 18h30',
      status: 'Pendente'
    };

    setActiveColetas(prev => [newColeta, ...prev]);
  };

  const handleFinalizarColeta = (coletaId: string) => {
    // 1. Mark coleta completed
    setActiveColetas(prev => prev.filter(c => c.id !== coletaId));

    // 2. Update food items that match this
    setAlimentos(prev => prev.map(item => {
      // simulate converting item status to Coletado
      if (item.status === 'Aguardando Coleta') {
        return { ...item, status: 'Coletado' };
      }
      return item;
    }));

    // 3. Increment counters
    setColetasCount(prev => prev + 1);
    setAtendidosCount(prev => prev + 12);
  };

  // Adding new food supply as supermarket manager
  const handleAddAlimento = (newItem: Omit<Alimento, 'id' | 'status'>) => {
    const fresh: Alimento = {
      ...newItem,
      id: `alimento_${Date.now()}`,
      status: 'Aguardando Coleta',
      tempoExpiraHora: 8,
      doador: 'Mercado do Porto',
      distanciaKm: 0.8
    };

    setAlimentos(prev => [fresh, ...prev]);
  };

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
                src={
                  activeActor === 'ong' 
                    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuAG4-Tz7fVuQ9aVkyeQvEztoGpy6KEX753m-0NGXj4GSGp7ewHfi0DsA_61Dta57L8pIAWjbzQM6MJtJj3IjW5zkZK-uiIyV0R7cthVoKORFSQdj8Mn852XhJ3ef39GftkHySJ_G-v8lB_lSur9Y2lkRfNXrezecDdGskhS3jMsgpX9EyUbUJFC-RIK9Gt2LB8pXIDiWf60SgqSY0Az7jLCS6kwWkXwLTnkTyBJX3SzaSIa3WEBPlGj0aPfcyl2M2tuRV7HWBq_9rc"
                    : "https://lh3.googleusercontent.com/aida-public/AB6AXuC_5dBPr1edcTxfYnubPElQKqIpbWI9KiccpsTlre41qTPATHK7v7n8SrKxg82WYaxGASZ5QXpChJKDTEcpor-xr3Cqsvp3AdQ-Wff8wGiLv1W_deFzW7-REvwYLj8alKefX4SjWVoWdo6Vn8A1WDuH_MEW2IRNf79Qd6ebPY2Iq3Qv3A83Tjx3NvwKBFibmAd4UMiyjf7rtHOF4yE0BxTctPhkZA_BWm84G226IVoYoJZkORpCWlkxKA2AWDHUY1s3vadbdE7qwOw"
                }
              />
            </div>
            <div>
              <h1 className="text-base font-bold text-primary">Fome Zero</h1>
              <p className="text-[10px] text-on-surface-variant font-mono font-bold leading-none uppercase">
                {activeActor === 'ong' ? 'Voluntariado' : activeActor === 'supermercado' ? 'Estabelecimento' : 'Matching de IA'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick actor toggler header badge */}
            <button
              id="header-switch-role-btn"
              onClick={() => handleActorSwitch(activeActor === 'ong' ? 'supermercado' : activeActor === 'supermercado' ? 'ia' : 'ong')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low hover:bg-surface-container-highest transition-colors rounded-full border border-outline-variant/30 text-xs font-semibold text-on-surface cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
              <span>Trocar Perfil</span>
            </button>
            
            <div id="location-badge" className="text-on-surface-variant flex items-center justify-center p-2 rounded-full hover:bg-surface-container-high transition-all pointer-events-none">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
          </div>
        </header>

        {/* Floating Context Info bar */}
        <div id="context-info-bar" className="bg-primary-container/20 border-b border-primary-container/40 px-6 py-2.5 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-primary font-bold">Modo de Análise Ativo</span>
          </div>
          <div className="flex items-center gap-3">
            <span 
              onClick={() => handleActorSwitch('ong')} 
              className={`cursor-pointer transition-all pb-1 ${activeActor === 'ong' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Sou ONG
            </span>
            <span 
              onClick={() => handleActorSwitch('supermercado')} 
              className={`cursor-pointer transition-all pb-1 ${activeActor === 'supermercado' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Sou Doador
            </span>
            <span 
              onClick={() => handleActorSwitch('ia')} 
              className={`cursor-pointer transition-all pb-1 ${activeActor === 'ia' ? 'text-primary border-b-2 border-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Painel IA
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 space-y-6 bg-white">
          {activeActor === 'ong' ? (
            <NgoView 
              alimentos={alimentos}
              onReservar={handleReservarAlimento}
              activeColetas={activeColetas}
              onFinalizarColeta={handleFinalizarColeta}
              onNavigateToTab={(tab) => {
                if (tab === 'home') handleActorSwitch('ong');
              }}
            />
          ) : activeActor === 'supermercado' ? (
            <SupermarketView 
              alimentos={alimentos}
              onAddAlimento={handleAddAlimento}
            />
          ) : (
            <AIMatcher 
              alimentos={alimentos}
              ongs={ongs}
            />
          )}
        </main>

        {/* Permanent Bottom Navigation Bar mimicking Screen flows */}
        <nav id="permanent-bottom-nav" className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-40 flex justify-around items-center px-4 py-3 pb-safe bg-white border-t border-outline-variant/30 rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <button
            id="nav-ong-btn"
            onClick={() => handleActorSwitch('ong')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              activeActor === 'ong' 
                ? 'bg-primary text-[#161e00] font-bold scale-105 px-5' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Ver Matches</span>
          </button>

          <button
            id="nav-matcher-btn"
            onClick={() => handleActorSwitch('ia')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              activeActor === 'ia' 
                ? 'bg-primary text-[#161e00] font-bold scale-105 px-5' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Mapeador IA</span>
          </button>

          <button
            id="nav-supermarket-btn"
            onClick={() => handleActorSwitch('supermercado')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              activeActor === 'supermercado' 
                ? 'bg-primary text-[#161e00] font-bold scale-105 px-5' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Award className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Perfis & Doar</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
