import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini client server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("AVISO: GEMINI_API_KEY não está definida nas variáveis de ambiente.");
}

// REST API for intelligent matching algorithm
app.post("/api/match", async (req, res) => {
  const { alimentos, ongs } = req.body;

  if (!alimentos || !ongs) {
    return res.status(400).json({ error: "Parâmetros 'alimentos' e 'ongs' são obrigatórios." });
  }

  // Define dynamic prompt for Gemini
  const prompt = `Você é o Agente de Inteligência Artificial do ecossistema Fome Zero. Sua tarefa essencial é analisar uma lista de inventário crítico ou doações de supermercados e cruzá-los com a fila de necessidades de ONGs cadastradas.

Siga as REGRAS DE NEGÓCIO OBRIGATÓRIAS:
1. Priorizar sempre as ONGs que possuem o maior tempo registrado desde a última doação recebida (valorizado na propriedade 'tempoSemDoacaoDias' de cada ONG).
2. Fazer correspondência APENAS se a ONG tiver uma necessidade cadastrada que combine com o nome ou a categoria do alimento oferecido. Não distribua sobras de alimentos para ONGs que não tenham necessidade desse tipo de alimento cadastrada.
3. Se a necessidade da ONG especificar uma quantidade (ex: "Arroz - 4kg" ou "Pão - 2kg"), você deve alocar apenas essa quantidade solicitada. Se o supermercado oferecer mais quantidade do que o necessário, a doação deve ser fracionada (dividida), e o que sobrar deve permanecer disponível para outras correspondências.
4. Suas respostas devem conter estritamente a lista recomendada de correspondências no formato JSON definido pelo esquema.

Estes são os alimentos disponíveis (doações de supermercados):
${JSON.stringify(alimentos, null, 2)}

Esta é a Fila de ONGs cadastradas com suas respectivas necessidades e tempos desde a última doação:
${JSON.stringify(ongs, null, 2)}

Gere a melhor correspondência possível maximizando o atendimento das ONGs prioritárias (maior tempoSemDoacaoDias) e usando as categorias lógicas adequadas. Retorne o resultado estruturado em uma lista (Array).`;

  try {
    if (!ai) {
      // Fallback response for simulator if API key is not yet set up
      console.log("Servidor em modo simulação (Sem API KEY)");
      const simulatedMatches = simulateMatching(alimentos, ongs);
      return res.json({ matches: simulatedMatches, simulated: true });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é o Agente de IA do Fome Zero. Analise os inventários de supermercados, cruze-os com a fila de necessidades de ONGs priorizando o maior tempo registrado sem doação, e cruze alimentos por categorias lógicas.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              description: "Lista de correspondências inteligentes",
              items: {
                type: Type.OBJECT,
                properties: {
                  nome_ong: {
                    type: Type.STRING,
                    description: "O nome exato da ONG atendida"
                  },
                  motivo_prioridade: {
                    type: Type.STRING,
                    description: "Justificativa detalhada de priorização baseada nas regras de negócio (tempo desde a última doação recebida e correspondência lógica de alimento)."
                  },
                  itens_atendidos: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        alimento_oferecido: {
                          type: Type.STRING,
                          description: "O alimento do supermercado oferecido"
                        },
                        categoria_correspondida: {
                          type: Type.STRING,
                          description: "A categoria lógica correspondida"
                        },
                        quantidade: {
                          type: Type.STRING,
                          description: "A quantidade recomendada a ser recolhida"
                        }
                      },
                      required: ["alimento_oferecido", "categoria_correspondida", "quantidade"]
                    }
                  },
                  nivel_urgencia: {
                    type: Type.STRING,
                    description: "Nível de urgência calculado (Crítico, Alto, Médio, Baixo)"
                  }
                },
                required: ["nome_ong", "motivo_prioridade", "itens_atendidos", "nivel_urgencia"]
              }
            }
          },
          required: ["matches"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Resposta do modelo veio vazia.");
    }

    const parsedData = JSON.parse(textOutput.trim());
    return res.json({ matches: parsedData.matches || parsedData, simulated: false });

  } catch (err: any) {
    console.error("Erro no processamento da IA:", err);
    // Graceful fallback to rich simulation rule engine in case of quota/network limit
    const fallbackMatches = simulateMatching(alimentos, ongs);
    return res.json({
      matches: fallbackMatches,
      simulated: true,
      notice: "Fizemos o cálculo pelo motor local devido a uma pendência temporária na chave de API."
    });
  }
});

// Helper to parse need string and extract quantity, unit, and maximum withdrawal date
function parseNeed(needStr: string) {
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

// Helper rule-engine for matching logic in pure JS/TS
function simulateMatching(alimentos: any[], ongs: any[]): any[] {
  // 1. Sort ONGs by priority: weight of maximum days without donation (tempoSemDoacaoDias)
  const sortedOngs = [...ongs].sort((a, b) => b.tempoSemDoacaoDias - a.tempoSemDoacaoDias);

  const matched: any[] = [];
  
  // Clone food array to track available quantities during allocation
  const tempAlimentos = alimentos.map(a => ({
    ...a,
    quantidadeRestante: typeof a.quantidade === 'number' ? a.quantidade : parseFloat(a.quantidade) || 0
  }));

  for (const ong of sortedOngs) {
    const itemsAtendidos: any[] = [];

    for (const needStr of ong.necessidades) {
      const { name: needName, qty: needQty, maxDate } = parseNeed(needStr);
      const lowerNeedName = needName.toLowerCase();

      for (const alimento of tempAlimentos) {
        if (alimento.status !== 'Pendente') continue;
        if (alimento.quantidadeRestante <= 0) continue;

        // Expiration date validation: food expiration date must be >= NGO's max withdrawal date
        if (maxDate && alimento.validade && alimento.validade < maxDate) continue;

        // Strict mapping check:
        // Match only if the need name matches the food name or food category
        const foodName = alimento.nome.toLowerCase();
        const foodCat = alimento.categoria.toLowerCase();

        const nameMatches = foodName.includes(lowerNeedName) || lowerNeedName.includes(foodName);
        const catMatches = foodCat.includes(lowerNeedName) || lowerNeedName.includes(foodCat);

        if (nameMatches || catMatches) {
          // Determine quantity to allocate
          const qtyToAllocate = needQty !== null 
            ? Math.min(needQty, alimento.quantidadeRestante) 
            : alimento.quantidadeRestante;

          if (qtyToAllocate > 0) {
            alimento.quantidadeRestante -= qtyToAllocate;
            itemsAtendidos.push({
              alimento_oferecido: alimento.nome,
              categoria_correspondida: alimento.categoria,
              quantidade: `${qtyToAllocate} ${alimento.unidade}`,
              id_alimento: alimento.id
            });
          }
        }
      }
    }

    if (itemsAtendidos.length > 0) {
      matched.push({
        nome_ong: ong.nome,
        motivo_prioridade: `ONG Priorizada por possuir maior tempo de espera desde a última doação registrada (${ong.tempoSemDoacaoDias} dias sem doações). Mapeamento lógico realizado para atender as necessidades de: ${ong.necessidades.join(", ")}.`,
        itens_atendidos: itemsAtendidos,
        nivel_urgencia: ong.tempoSemDoacaoDias >= 15 ? "Crítico" : (ong.tempoSemDoacaoDias >= 10 ? "Alto" : "Médio")
      });
    }
  }

  return matched;
}

export { app };

async function startServer() {
  // Vite integration middleware for dev environment mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fome Zero Express server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

