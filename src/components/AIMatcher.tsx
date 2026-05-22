import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  FileJson,
  Database,
  Search,
  Check,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alimento, Ong, MatchResult } from '../types';

interface AIMatcherProps {
  alimentos: Alimento[];
  ongs: Ong[];
}

export default function AIMatcher({ alimentos, ongs }: AIMatcherProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusStep, setStatusStep] = useState('Pronto para analisar');

  // Trigger matches via server AI routing
  const handleTriggerMatching = async () => {
    setLoading(true);
    setErrorMsg('');
    setMatches(null);
    setStatusStep('Iniciando análise de inventário...');

    try {
      // Simulate multiple loading statuses for smooth AI experience
      setTimeout(() => setStatusStep('Filtrando ONGs prioritárias (maior tempo sem doação)...'), 800);
      setTimeout(() => setStatusStep('Mapeando categorias de alimentos e compatibilidades...'), 1600);
      setTimeout(() => setStatusStep('Chamando modelo Gemini para consolidação...'), 2400);

      const response = await fetch('/api/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alimentos, ongs }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar as correspondências do servidor.');
      }

      const data = await response.json();
      
      setTimeout(() => {
        setMatches(data.matches);
        setLoading(false);
      }, 3200);

    } catch (err: any) {
      console.error(err);
      setErrorMsg('Falha na conexão de IA. Usando processamento local emergencial de Fome Zero...');
      
      // Fallback matching manual
      const fallback = simulateMatchingLocal(alimentos, ongs);
      setTimeout(() => {
        setMatches(fallback);
        setLoading(false);
      }, 3200);
    }
  };

  const simulateMatchingLocal = (alimentosList: Alimento[], ongsList: Ong[]): MatchResult[] => {
    // Exact logical fallbacks
    const sortedOngs = [...ongsList].sort((a, b) => b.tempoSemDoacaoDias - a.tempoSemDoacaoDias);
    const results: MatchResult[] = [];
    const usedAlimentos = new Set<string>();

    for (const ong of sortedOngs) {
      const items: any[] = [];
      for (const al in alimentosList) {
        const item = alimentosList[al];
        if (usedAlimentos.has(item.id)) continue;

        let ok = false;
        ong.necessidades.forEach(req => {
          if (
            item.categoria.toLowerCase().includes(req.toLowerCase()) ||
            req.toLowerCase().includes(item.categoria.toLowerCase()) ||
            item.nome.toLowerCase().includes(req.toLowerCase())
          ) {
            ok = true;
          }
        });

        if (ok) {
          items.push({
            alimento_oferecido: item.nome,
            categoria_correspondida: item.categoria,
            quantidade: `${item.quantidade} ${item.unidade}`
          });
          usedAlimentos.add(item.id);
        }
      }

      if (items.length > 0) {
        results.push({
          nome_ong: ong.nome,
          motivo_prioridade: `ONG Priorizada devido ao elevado tempo sem doação recebida (${ong.tempoSemDoacaoDias} dias). Última recebida em: ${ong.ultimaDoacao}. Mapeamento lógico compatível com: ${ong.necessidades.join(', ')}.`,
          itens_atendidos: items,
          nivel_urgencia: ong.tempoSemDoacaoDias >= 15 ? 'Crítico' : 'Alto'
        });
      }
    }

    return results;
  };

  return (
    <div id="ai-matcher-root" className="space-y-6">
      {/* Introduction Card */}
      <div id="ai-agent-intro" className="bg-gradient-to-r from-primary-container/20 to-primary/5 border border-primary-container/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-on-surface">Agente de IA do Ecossistema Fome Zero</h2>
        </div>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          Eu analiso de forma automatizada e inteligente as listas de inventário crítico ou doações vindas de estabelecimentos cadastrados, e cruzo-as com a fila de necessidades das ONGs registradas.
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-semibold text-primary">
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4" />
            <span>Priorização por Dias de Espera</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4" />
            <span>Mapeamento lógico de alimentos</span>
          </div>
        </div>
      </div>

      {/* State Input Queue view */}
      <div id="input-queues-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NGO Queue */}
        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10 space-y-3">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Fila de ONGs ativas ({ongs.length})</span>
            <span className="text-[10px] bg-primary-container/20 border border-primary/20 text-on-surface px-2 py-0.5 rounded-full font-bold">Urgência</span>
          </div>
          <div id="ngo-queue-list" className="space-y-2.5 max-h-[180px] overflow-flow overflow-y-auto">
            {ongs.map(ong => (
              <div key={ong.id} className="bg-surface bg-opacity-30 border border-outline-variant/10 p-2.5 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-on-surface">{ong.nome}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Esperando há: <span className="text-primary font-bold">{ong.tempoSemDoacaoDias} dias</span></p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  ong.nivelUrgencia === 'Crítico' 
                    ? 'bg-rose-500/10 text-rose-500' 
                    : 'bg-yellow-500/10 text-yellow-600'
                }`}>
                  {ong.nivelUrgencia}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Supermarket inputs list */}
        <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/10 space-y-3">
          <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Inventário de Alimentos ({alimentos.length})</span>
            <span className="text-[10px] text-on-surface-variant font-bold">Estado</span>
          </div>
          <div id="alimentos-inventory" className="space-y-2.5 max-h-[180px] overflow-y-auto">
            {alimentos.map(item => (
              <div key={item.id} className="bg-surface bg-opacity-30 border border-outline-variant/10 p-2.5 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-on-surface">{item.nome}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Qtd: {item.quantidade} {item.unidade} • Cat: {item.categoria}</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Matching button trigger */}
      <div id="action-trigger-ai" className="flex flex-col gap-3">
        <button
          id="run-ai-match-btn"
          disabled={loading}
          onClick={handleTriggerMatching}
          className="w-full h-14 bg-primary text-background font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg drop-shadow-sm active:scale-95 transition-all cursor-pointer hover:bg-opacity-90"
        >
          <Sparkles className="w-5 h-5 text-background animate-pulse" />
          {loading ? 'Analisando e Cruzando...' : 'Analisar e Executar Correspondência por IA'}
        </button>

        {loading && (
          <div id="ai-loading-stepper" className="space-y-2 bg-surface-container/50 border border-outline-variant/10 p-4 rounded-xl text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-xs text-on-surface-variant animate-pulse font-medium">{statusStep}</p>
          </div>
        )}
      </div>

      {/* AI Matching Results parsed output */}
      <AnimatePresence>
        {matches && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/15 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-on-surface">Resultado da Análise Cruzada</h3>
              </div>
              <button
                id="toggle-json-view-btn"
                onClick={() => setShowJson(!showJson)}
                className="text-xs text-primary font-bold flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant/20 hover:bg-surface-container-high"
              >
                <FileJson className="w-4 h-4" />
                {showJson ? 'Ver Lista Gráfica' : 'Ver JSON Estruturado'}
              </button>
            </div>

            {hasWarningNotice(ongs, alimentos) && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-orange-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Existem ONGs críticas necessitando de laticínios/padaria. A prioridade foi concedida por IA às de maior tempo sem doação.</span>
              </div>
            )}

            {showJson ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface-container-high rounded-xl p-4 border border-outline-variant/30 relative"
              >
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded text-[10px] font-mono font-bold text-primary">
                  <Database className="w-3.5 h-3.5" />
                  <span>OUTPUT JSON MANDATÓRIO</span>
                </div>
                <pre id="json-structured-output" className="text-[10px] font-mono text-on-surface p-1 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-tight">
                  {JSON.stringify(matches, null, 2)}
                </pre>
              </motion.div>
            ) : (
              <div id="graphical-matches-list" className="space-y-3">
                {matches.map((match, idx) => (
                  <div key={idx} className="bg-surface-container p-5 rounded-xl border border-outline-variant/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-on-surface">{match.nome_ong}</h4>
                        <span className="text-[10px] text-primary font-bold font-mono">STATUS: Prioridade Confirmada</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        match.nivel_urgencia === 'Crítico' 
                          ? 'bg-rose-500/15 text-rose-500' 
                          : 'bg-amber-500/15 text-yellow-500'
                      }`}>
                        Urgência: {match.nivel_urgencia}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-lg border border-outline-variant/10">
                      {match.motivo_prioridade}
                    </p>

                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Itens Mapeados aos Supermercados:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {match.itens_atendidos.map((item, keyIdx) => (
                          <div key={keyIdx} className="bg-surface bg-opacity-40 rounded-lg p-2.5 flex items-center justify-between text-xs border border-outline-variant/5">
                            <span className="font-semibold text-on-surface">{item.alimento_oferecido}</span>
                            <div className="flex items-center gap-2">
                              <span className="bg-surface-container-high px-2 py-0.5 rounded text-[10px] border border-outline-variant/25 text-on-surface-variant">
                                Cat: {item.categoria_correspondida}
                              </span>
                              <span className="font-bold text-primary">{item.quantidade}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function hasWarningNotice(ongs: Ong[], alimentos: Alimento[]): boolean {
  const criticalNgo = ongs.some(o => o.nivelUrgencia === 'Crítico');
  const availableDons = alimentos.some(a => a.status === 'Pendente');
  return criticalNgo && availableDons;
}
