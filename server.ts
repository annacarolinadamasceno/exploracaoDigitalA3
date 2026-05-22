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
2. Fazer a correspondência exata ou por categoria lógica de alimentos (Ex: se um supermercado oferece 'Iogurte', você pode cruzar com uma ONG que necessita de 'Laticínios'. Se oferece 'Pão', cruze com 'Padaria' ou 'Cereais', etc.).
3. Suas respostas devem conter estritamente a lista recomendada de correspondências no formato JSON definido pelo esquema.

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
          type: Type.ARRAY,
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
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Resposta do modelo veio vazia.");
    }

    const parsedData = JSON.parse(textOutput.trim());
    return res.json({ matches: parsedData, simulated: false });

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

// Helper rule-engine for matching logic in pure JS/TS
function simulateMatching(alimentos: any[], ongs: any[]): any[] {
  // 1. Sort ONGs by weight of maximum days without donation (tempoSemDoacaoDias)
  const sortedOngs = [...ongs].sort((a, b) => b.tempoSemDoacaoDias - a.tempoSemDoacaoDias);

  const matched: any[] = [];
  const allocatedAlimentos = new Set();

  for (const ong of sortedOngs) {
    const itemsAtendidos: any[] = [];
    
    // Check match logical categories
    for (const alimento of alimentos) {
      if (allocatedAlimentos.has(alimento.id)) continue;

      let categoryMatches = false;
      let matchedCategory = "";

      // Exact match or logical relation mappings
      const foodName = alimento.nome.toLowerCase();
      const foodCat = alimento.categoria.toLowerCase();

      for (const req of ong.necessidades) {
        const requirement = req.toLowerCase();

        // Standard mapping categories
        if (
          foodName.includes(requirement) ||
          foodCat.includes(requirement) ||
          requirement.includes(foodCat) ||
          (foodCat === "padaria" && requirement.includes("cereais")) ||
          (foodCat === "laticínios" && (foodName.includes("iogurte") || foodName.includes("leite") || requirement.includes("laticínios"))) ||
          (foodCat === "frutas" && (foodName.includes("maçã") || requirement.includes("vegetais") || requirement.includes("frutas"))) ||
          (foodCat === "proteína animal" && (foodName.includes("ovos") || foodName.includes("carne") || foodName.includes("frango") || requirement.includes("proteína")))
        ) {
          categoryMatches = true;
          matchedCategory = req;
          break;
        }
      }

      if (categoryMatches) {
        itemsAtendidos.push({
          alimento_oferecido: alimento.nome,
          categoria_correspondida: matchedCategory || alimento.categoria,
          quantidade: `${alimento.quantidade} ${alimento.unidade}`
        });
        // Allocate so others don't duplicate
        allocatedAlimentos.add(alimento.id);
      }
    }

    if (itemsAtendidos.length > 0) {
      matched.push({
        nome_ong: ong.nome,
        motivo_prioridade: `ONG Priorizada por possuir maior tempo de espera desde a última doação registrada (${ong.tempoSemDoacaoDias} dias sem doações, última recebida em ${ong.ultimaDoacao}). Mapeamento lógico realizado para atender as necessidades de: ${ong.necessidades.join(", ")}.`,
        itens_atendidos: itemsAtendidos,
        nivel_urgencia: ong.tempoSemDoacaoDias >= 15 ? "Crítico" : (ong.tempoSemDoacaoDias >= 10 ? "Alto" : "Médio")
      });
    }
  }

  // Handle leftovers to ensure all donations have a match
  for (const alimento of alimentos) {
    if (allocatedAlimentos.add(alimento.id)) {
      // Find any ONG that accepts "Outros" or has less restriction
      const bestFittingOng = sortedOngs[0]; // oldest waiting ONG gets leftovers
      if (bestFittingOng) {
        // Find if this ONG already has an entry in matches
        let existingMatch = matched.find(m => m.nome_ong === bestFittingOng.nome);
        if (!existingMatch) {
          existingMatch = {
            nome_ong: bestFittingOng.nome,
            motivo_prioridade: `Atendimento emergencial de item remanescente. ONG está na fila há ${bestFittingOng.tempoSemDoacaoDias} dias.`,
            itens_atendidos: [],
            nivel_urgencia: "Crítico"
          };
          matched.push(existingMatch);
        }
        existingMatch.itens_atendidos.push({
          alimento_oferecido: alimento.nome,
          categoria_correspondida: alimento.categoria,
          quantidade: `${alimento.quantidade} ${alimento.unidade}`
        });
      }
    }
  }

  return matched;
}

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

startServer();
