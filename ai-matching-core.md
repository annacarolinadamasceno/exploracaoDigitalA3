# Motor de Matching Inteligente - Projeto Fome Zero
*Data da Validação: 22/05/2026*

## 1. Configuração do Cérebro (Google AI Studio)
O algoritmo de recomendação e cruzamento de dados foi validado utilizando o modelo **Gemini 3.5 Flash** no Google AI Studio, operando como o motor agêntico do sistema.

## 2. Instruções do Sistema (System Instructions)
"Você é o Agente de Inteligência Artificial do ecossistema Fome Zero. Sua função exclusiva é analisar listas de inventário crítico enviados por supermercados e cruzá-los com a fila de necessidades de ONGs cadastradas.
Regras de Negócio OBRIGATÓRIAS:
1. Priorizar sempre as ONGs que possuem o maior tempo registrado desde a última doação recebida.
2. Fazer a correspondência exata ou por categoria lógica de alimentos.
3. Suas respostas finais devem ser estritamente em formato JSON estruturado."

## 3. Teste de Sucesso de Entrada (JSON)
```json
{
  "supermercado_oferta": [
    {"item": "Leite Integral", "quantidade": "100 caixas", "vencimento": "2 dias"}
  ],
  "ongs_cadastradas": [
    {"nome": "ONG Amigos do Bairro", "necessidade": "Laticínios", "dias_sem_doacao": 15},
    {"nome": "Ação Esperança", "necessidade": "Leite", "dias_sem_doacao": 3}
  ]
}