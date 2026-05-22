export interface Alimento {
  id: string;
  nome: string;
  categoria: 'Padaria' | 'Frutas' | 'Laticínios' | 'Bebidas' | 'Enlatados' | 'Outros' | string;
  quantidade: number;
  unidade: string;
  validade: string;
  status: 'Aguardando Coleta' | 'Coletado' | 'Pendente';
  tempoExpiraHora?: number;
  doador?: string;
  distanciaKm?: number;
  tipoIcone?: 'shopping_cart' | 'storefront' | 'local_mall' | 'bakery_dining' | 'nutrition' | 'egg' | 'liquor' | 'inventory_2' | 'add_circle';
}

export interface Ong {
  id: string;
  nome: string;
  necessidades: string[];
  tempoSemDoacaoDias: number;
  ultimaDoacao: string;
  nivelUrgencia: 'Crítico' | 'Alto' | 'Médio' | 'Baixo' | string;
  tempoSegundosSimulado: number;
  endereco: string;
}

export interface MatchResult {
  nome_ong: string;
  motivo_prioridade: string;
  itens_atendidos: {
    alimento_oferecido: string;
    categoria_correspondida: string;
    quantidade: string;
  }[];
  nivel_urgencia: string;
}

export interface ColetaAtiva {
  id: string;
  aberto: boolean;
  supermercado: string;
  pedidoId: string;
  itens: { nome: string; quantidade: string; icone: string }[];
  dataRetirada: string;
  status: 'Pendente' | 'Concluída';
}
