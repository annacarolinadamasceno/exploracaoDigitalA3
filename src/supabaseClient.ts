import { createClient } from '@supabase/supabase-js';
import { Alimento, ColetaAtiva, TransacaoHistorico } from './types';

// ---------------------------------------------------------------------------
// Env setup (Vite / Next.js / Node)
// ---------------------------------------------------------------------------
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key]!;
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`]!;
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env[`VITE_${key}`]) return import.meta.env[`VITE_${key}`];
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL ou Anon Key não encontradas nas variáveis de ambiente.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ---------------------------------------------------------------------------
// UUIDs fixos para supermercados do seed (demo sem auth real)
// ---------------------------------------------------------------------------
const SEED_MARKET_IDS: Record<string, string> = {
  'supermercado silva': '11111111-1111-4111-8111-111111111111',
  'express market':     '22222222-2222-4222-8222-222222222222',
  'mercado do porto':   '33333333-3333-4333-8333-333333333333',
};

/** Gera/recupera um UUID de sessão para o usuário logado (sem auth real). */
export function getSessionUserId(userName: string): string {
  const lowerName = userName.toLowerCase();
  if (SEED_MARKET_IDS[lowerName]) return SEED_MARKET_IDS[lowerName];

  const key = `fomezero_session_${lowerName.replace(/\s+/g, '_')}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// Row type definitions (banco → TypeScript)
// ---------------------------------------------------------------------------
interface AlimentoRow {
  id: string;
  item: string;
  categoria: string | null;
  quantidade: string;
  unidade: string | null;
  data_vencimento: string;
  status: string;
  tempo_expira_hora: number | null;
  doador_nome: string | null;
  distancia_km: number | null;
  tipo_icone: string | null;
  supermercado_id: string | null;
}

interface ColetaRow {
  id: string;
  aberto: boolean;
  supermercado: string;
  pedido_id: string;
  itens: { nome: string; quantidade: string; icone: string }[];
  data_retirada: string;
  status: string;
  id_alimento: string | null;
  nome_ong: string | null;
}

interface TransacaoRow {
  id: string;
  created_at: string;
  item: string;
  quantidade: string;
  supermercado: string;
  ong: string;
  status: string;
  pedido_id: string;
}

// ---------------------------------------------------------------------------
// Mappers row ↔ tipo do app
// ---------------------------------------------------------------------------
function rowToAlimento(row: AlimentoRow): Alimento {
  return {
    id: row.id,
    nome: row.item,
    categoria: row.categoria || 'Outros',
    quantidade: parseFloat(row.quantidade) || 0,
    unidade: row.unidade || 'un',
    validade: row.data_vencimento || '',
    status: (row.status as Alimento['status']) || 'Pendente',
    tempoExpiraHora: row.tempo_expira_hora ?? undefined,
    doador: row.doador_nome ?? undefined,
    distanciaKm: row.distancia_km ?? undefined,
    tipoIcone: (row.tipo_icone as Alimento['tipoIcone']) ?? undefined,
  };
}

function alimentoToInsertRow(a: Alimento, supermercadoId: string) {
  return {
    item: a.nome,
    categoria: a.categoria,
    quantidade: String(a.quantidade),
    unidade: a.unidade,
    data_vencimento: a.validade || new Date().toISOString().split('T')[0],
    status: a.status,
    tempo_expira_hora: a.tempoExpiraHora ?? null,
    doador_nome: a.doador ?? null,
    distancia_km: a.distanciaKm ?? null,
    tipo_icone: a.tipoIcone ?? null,
    supermercado_id: supermercadoId,
  };
}

function rowToColeta(row: ColetaRow): ColetaAtiva {
  return {
    id: row.id,
    aberto: row.aberto,
    supermercado: row.supermercado,
    pedidoId: row.pedido_id,
    itens: Array.isArray(row.itens) ? row.itens : [],
    dataRetirada: row.data_retirada,
    status: (row.status as ColetaAtiva['status']) || 'Pendente',
    id_alimento: row.id_alimento ?? undefined,
    nomeOng: row.nome_ong ?? undefined,
  };
}

function coletaToInsertRow(c: ColetaAtiva) {
  return {
    id: c.id,
    aberto: c.aberto,
    supermercado: c.supermercado,
    pedido_id: c.pedidoId,
    itens: c.itens,
    data_retirada: c.dataRetirada,
    status: c.status,
    id_alimento: c.id_alimento ?? null,
    nome_ong: c.nomeOng ?? null,
  };
}

function rowToTransacao(row: TransacaoRow): TransacaoHistorico {
  return {
    id: row.id,
    dataRegistro: row.created_at,
    item: row.item,
    quantidade: row.quantidade,
    supermercado: row.supermercado,
    ong: row.ong,
    status: (row.status as TransacaoHistorico['status']) || 'Concluída',
    pedidoId: row.pedido_id,
  };
}

// ---------------------------------------------------------------------------
// CRUD — Alimentos (doacoes_supermercado)
// ---------------------------------------------------------------------------

/** Busca todos os alimentos do banco. */
export async function fetchAlimentos(): Promise<Alimento[]> {
  const { data, error } = await supabase
    .from('doacoes_supermercado')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('fetchAlimentos error:', error.message);
    return [];
  }
  return (data as AlimentoRow[]).map(rowToAlimento);
}

/** Insere um novo alimento e retorna o objeto com o ID gerado pelo banco. */
export async function insertAlimento(
  alimento: Omit<Alimento, 'id'>,
  supermercadoId: string
): Promise<Alimento | null> {
  const row = alimentoToInsertRow({ ...alimento, id: '' }, supermercadoId);
  const { data, error } = await supabase
    .from('doacoes_supermercado')
    .insert([row])
    .select()
    .single();

  if (error) {
    console.error('insertAlimento error:', error.message);
    return null;
  }
  return rowToAlimento(data as AlimentoRow);
}

/** Insere um conjunto de alimentos de seed (retorna os objetos com IDs do banco). */
export async function seedAlimentos(
  alimentos: Alimento[],
  defaultSupermercadoId = '11111111-1111-4111-8111-111111111111'
): Promise<Alimento[]> {
  const rows = alimentos.map(a =>
    alimentoToInsertRow(
      a,
      SEED_MARKET_IDS[a.doador?.toLowerCase() || ''] || defaultSupermercadoId
    )
  );
  const { data, error } = await supabase
    .from('doacoes_supermercado')
    .insert(rows)
    .select();

  if (error) {
    console.error('seedAlimentos error:', error.message);
    return alimentos; // retorna os originais como fallback
  }
  return (data as AlimentoRow[]).map(rowToAlimento);
}

/** Atualiza o status de um alimento. */
export async function updateAlimentoStatus(
  id: string,
  status: Alimento['status']
): Promise<void> {
  const { error } = await supabase
    .from('doacoes_supermercado')
    .update({ status })
    .eq('id', id);

  if (error) console.error('updateAlimentoStatus error:', error.message);
}

/** Atualiza a quantidade de um alimento. */
export async function updateAlimentoQuantidade(
  id: string,
  quantidade: number
): Promise<void> {
  const { error } = await supabase
    .from('doacoes_supermercado')
    .update({ quantidade: String(quantidade) })
    .eq('id', id);

  if (error) console.error('updateAlimentoQuantidade error:', error.message);
}

// ---------------------------------------------------------------------------
// CRUD — Coletas Ativas (coletas_ativas)
// ---------------------------------------------------------------------------

/** Busca todas as coletas ativas do banco. */
export async function fetchColetasAtivas(): Promise<ColetaAtiva[]> {
  const { data, error } = await supabase
    .from('coletas_ativas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchColetasAtivas error:', error.message);
    return [];
  }
  return (data as ColetaRow[]).map(rowToColeta);
}

/** Insere uma nova coleta ativa. */
export async function insertColeta(coleta: ColetaAtiva): Promise<void> {
  const { error } = await supabase
    .from('coletas_ativas')
    .insert([coletaToInsertRow(coleta)]);

  if (error) console.error('insertColeta error:', error.message);
}

/** Remove uma coleta ativa pelo ID. */
export async function deleteColeta(id: string): Promise<void> {
  const { error } = await supabase
    .from('coletas_ativas')
    .delete()
    .eq('id', id);

  if (error) console.error('deleteColeta error:', error.message);
}

// ---------------------------------------------------------------------------
// CRUD — Histórico de Transações (transacoes_historico)
// ---------------------------------------------------------------------------

/** Busca todo o histórico de transações do banco. */
export async function fetchHistorico(): Promise<TransacaoHistorico[]> {
  const { data, error } = await supabase
    .from('transacoes_historico')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchHistorico error:', error.message);
    return [];
  }
  return (data as TransacaoRow[]).map(rowToTransacao);
}

/** Insere uma nova transação no histórico. */
export async function insertTransacao(tx: TransacaoHistorico): Promise<void> {
  const { error } = await supabase
    .from('transacoes_historico')
    .insert([{
      item: tx.item,
      quantidade: tx.quantidade,
      supermercado: tx.supermercado,
      ong: tx.ong,
      status: tx.status,
      pedido_id: tx.pedidoId,
    }]);

  if (error) console.error('insertTransacao error:', error.message);
}

// ---------------------------------------------------------------------------
// ONGs — localStorage (evita FK constraints com auth.users)
// ---------------------------------------------------------------------------
const ONG_STORAGE_KEY = 'fomezero_ongs_v1';

export function loadOngsFromStorage<T>(): T[] {
  try {
    const raw = localStorage.getItem(ONG_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as T[];
  } catch {}
  return [];
}

export function saveOngsToStorage<T>(ongs: T[]): void {
  try {
    localStorage.setItem(ONG_STORAGE_KEY, JSON.stringify(ongs));
  } catch (e) {
    console.error('saveOngsToStorage error:', e);
  }
}

// ---------------------------------------------------------------------------
// Legacy — mantida para compatibilidade
// ---------------------------------------------------------------------------
export interface DoacaoInput {
  supermercado_id: string | number;
  item: string;
  quantidade: number;
  data_vencimento: string;
}

export interface DoacaoResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function cadastrarDoacao(doacao: DoacaoInput): Promise<DoacaoResult> {
  try {
    if (!doacao.supermercado_id || !doacao.item || !doacao.quantidade || !doacao.data_vencimento) {
      return { success: false, error: 'Todos os campos são obrigatórios.' };
    }
    if (doacao.quantidade <= 0) {
      return { success: false, error: 'A quantidade deve ser maior que zero.' };
    }
    const { data, error } = await supabase
      .from('doacoes_supermercado')
      .insert([{
        supermercado_id: doacao.supermercado_id,
        item: doacao.item,
        quantidade: String(doacao.quantidade),
        data_vencimento: doacao.data_vencimento,
      }])
      .select();

    if (error) return { success: false, error: `Erro no Supabase: ${error.message}` };
    return { success: true, data: data && data.length > 0 ? data[0] : null };
  } catch (err: any) {
    return { success: false, error: `Erro inesperado: ${err.message || err}` };
  }
}
