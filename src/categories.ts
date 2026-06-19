export interface CategoryOption {
  id: string;
  label: string;
  icone: string;
}

export const FOOD_CATEGORIES: CategoryOption[] = [
  { id: 'Padaria e Confeitaria', label: 'Padaria e Confeitaria', icone: '🥖' },
  { id: 'Hortifrúti (Frutas e Verduras)', label: 'Hortifrúti (Frutas e Verduras)', icone: '🍎' },
  { id: 'Laticínios, Ovos e Frios', label: 'Laticínios, Ovos e Frios', icone: '🥛' },
  { id: 'Carnes e Peixes', label: 'Carnes e Peixes', icone: '🥩' },
  { id: 'Bebidas', label: 'Bebidas', icone: '🥤' },
  { id: 'Mercearia e Grãos', label: 'Mercearia e Grãos', icone: '🌾' },
  { id: 'Enlatados e Conservas', label: 'Enlatados e Conservas', icone: '🥫' },
  { id: 'Congelados', label: 'Congelados', icone: '🧊' },
  { id: 'Massas e Molhos', label: 'Massas e Molhos', icone: '🍝' },
  { id: 'Cereais e Matinais', label: 'Cereais e Matinais', icone: '🥣' },
  { id: 'Doces e Biscoitos', label: 'Doces e Biscoitos', icone: '🍪' },
  { id: 'Óleos, Gorduras e Condimentos', label: 'Óleos, Gorduras e Condimentos', icone: '🫙' },
  { id: 'Higiene e Limpeza', label: 'Higiene e Limpeza', icone: '🧴' },
  { id: 'Outros', label: 'Outros', icone: '📦' }
];

export const SYNONYM_GROUPS: Record<string, string[]> = {
  'leite': ['leite', 'leite integral', 'leite desnatado', 'leite semi-desnatado', 'leite em pó', 'leite condensado', 'leite de coco', 'laticínio', 'laticinio', 'laticínios'],
  'refrigerante': ['refrigerante', 'coca', 'coca-cola', 'coca cola', 'fanta', 'fanta laranja', 'fanta uva', 'guaraná', 'pepsi', 'sprite', 'dolly', 'soda'],
  'pão': ['pão', 'pães', 'pão de sal', 'pão francês', 'bisnaguinha', 'pão artesanal', 'baguete', 'biscoito', 'padaria'],
  'arroz': ['arroz', 'arroz integral', 'arroz branco', 'arroz parboilizado', 'arroz arbóreo'],
  'feijão': ['feijão', 'feijão carioca', 'feijão preto', 'feijão corda', 'feijao'],
  'fruta': ['fruta', 'frutas', 'maçã', 'banana', 'laranja', 'uva', 'mamão', 'melancia', 'morango', 'abacaxi', 'limão', 'pêra', 'pêssego', 'salada de frutas'],
  'verdura': ['verdura', 'verduras', 'legume', 'legumes', 'alface', 'couve', 'espinafre', 'repolho', 'tomate', 'cenoura', 'batata', 'cebola', 'alho', 'abobrinha', 'chuchu', 'pimentão'],
  'carne': ['carne', 'carne bovina', 'carne de panela', 'bife', 'frango', 'peixe', 'suíno', 'linguiça', 'salsicha', 'filé', 'peito de frango', 'sobrecoxa', 'porco'],
  'suco': ['suco', 'suco de uva', 'suco de laranja', 'suco de caixinha', 'ades', 'del valle', 'suco natural'],
  'laticínio': ['leite', 'queijo', 'iogurte', 'manteiga', 'nata', 'margarina', 'requeijão', 'creme de leite', 'muçarela', 'mussarela'],
  'bebida': ['refrigerante', 'suco', 'água', 'bebida', 'coca', 'fanta', 'guaraná', 'pepsi', 'sprite', 'agua', 'energético', 'chá', 'cha']
};

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s]/g, '') // remove special characters
    .trim();
}

export function isSemanticMatch(
  foodName: string,
  foodCategory: string,
  needName: string,
  needCategory?: string
): boolean {
  const normFood = normalizeText(foodName);
  const normNeed = normalizeText(needName);
  const normFoodCat = normalizeText(foodCategory);
  const normNeedCat = needCategory ? normalizeText(needCategory) : '';

  // 1. Direct substring compatibility check
  if (normFood.includes(normNeed) || normNeed.includes(normFood)) {
    return true;
  }

  // 2. Category level match
  if (normNeed === normFoodCat) {
    return true;
  }

  // 3. Synonym matching dictionary lookup
  for (const [key, group] of Object.entries(SYNONYM_GROUPS)) {
    const normKey = normalizeText(key);
    const normalizedGroup = group.map(normalizeText);

    const needInGroup = normNeed === normKey || normalizedGroup.includes(normNeed);
    const foodInGroup = normFood.includes(normKey) || normalizedGroup.some(g => normFood.includes(g));

    if (needInGroup && foodInGroup) {
      return true;
    }
  }

  return false;
}

export function parseNeed(needStr: string) {
  let maxDate: string | null = null;
  let cleanStr = needStr;

  // Extract date limit if present (Retirar até: YYYY-MM-DD)
  const dateMatch = needStr.match(/\(Retirar até:\s*([\d-]+)\)/);
  if (dateMatch) {
    maxDate = dateMatch[1].trim();
    cleanStr = needStr.replace(/\s*\(Retirar até:\s*[\d-]+\)/, "").trim();
  }

  const parts = cleanStr.split(" - ");
  let nameAndCat = parts[0].trim();
  let qty: number | null = null;
  let unit: string | null = null;

  if (parts.length >= 2) {
    const qtyStr = parts[1].trim();
    const qtyMatch = qtyStr.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (qtyMatch) {
      qty = parseFloat(qtyMatch[1]);
      unit = qtyMatch[2] ? qtyMatch[2].trim() : null;
    }
  }

  // Extract category between [ ] if present
  let name = nameAndCat;
  let category = '';
  const catMatch = nameAndCat.match(/(.*?)\s*\[(.*?)\]/);
  if (catMatch) {
    name = catMatch[1].trim();
    category = catMatch[2].trim();
  }

  return { name, category, qty, unit, maxDate };
}
