import { createClient } from '@supabase/supabase-js';

// Interface para definir a tipagem do input de doação
export interface DoacaoInput {
  supermercado_id: string | number; // ID único do supermercado doador (UUID ou inteiro)
  item: string;
  quantidade: number;
  data_vencimento: string; // Formato YYYY-MM-DD
}

// Interface para a estrutura de retorno padronizada
export interface DoacaoResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Obtenção robusta das variáveis de ambiente para diferentes frameworks (Vite, Next.js ou Node puro)
const getEnvVariable = (key: string): string => {
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

const supabaseUrl = getEnvVariable('SUPABASE_URL');
const supabaseAnonKey = getEnvVariable('SUPABASE_ANON_KEY');

// Validação em tempo de execução para prevenir erros silenciosos difíceis de depurar
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase URL ou Anon Key não foram encontradas nas variáveis de ambiente.\n' +
    'Certifique-se de configurar as variáveis SUPABASE_URL e SUPABASE_ANON_KEY ' +
    '(ou com os prefixos VITE_ ou NEXT_PUBLIC_ dependendo do seu framework).'
  );
}

// Inicialização do cliente oficial do Supabase
export const supabase = createClient(supabaseUrl || 'https://placeholder-url.supabase.co', supabaseAnonKey || 'placeholder-key');

/**
 * Cadastra uma nova doação de supermercado na tabela 'doacoes_supermercado'.
 * 
 * @param doacao Objeto contendo os dados da doação (supermercado_id, item, quantidade, data_vencimento)
 * @returns Promessa com o resultado padronizado contendo sucesso, dados inseridos ou mensagem de erro
 */
export async function cadastrarDoacao(doacao: DoacaoInput): Promise<DoacaoResult> {
  try {
    // Validação básica dos dados recebidos antes de enviar para o banco
    if (!doacao.supermercado_id || !doacao.item || !doacao.quantidade || !doacao.data_vencimento) {
      return {
        success: false,
        error: 'Todos os campos (supermercado_id, item, quantidade, data_vencimento) são obrigatórios.'
      };
    }

    if (doacao.quantidade <= 0) {
      return {
        success: false,
        error: 'A quantidade de itens doados deve ser maior que zero.'
      };
    }

    const { data, error } = await supabase
      .from('doacoes_supermercado')
      .insert([
        {
          supermercado_id: doacao.supermercado_id,
          item: doacao.item,
          quantidade: doacao.quantidade,
          data_vencimento: doacao.data_vencimento,
        }
      ])
      .select();

    if (error) {
      console.error('Erro de inserção no Supabase:', error.message);
      return {
        success: false,
        error: `Erro no Supabase: ${error.message}`
      };
    }

    return {
      success: true,
      data: data && data.length > 0 ? data[0] : null
    };
  } catch (err: any) {
    console.error('Erro inesperado ao cadastrar doação:', err);
    return {
      success: false,
      error: `Erro inesperado: ${err.message || err}`
    };
  }
}
