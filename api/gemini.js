export default async function handler(req, res) {
    // 1. Configuração CORS (Essencial para comunicação com o seu site)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde rapidamente a pré-verificações do navegador
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // Bloqueia se não for um envio de dados
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    // 2. Chave do Groq (Atenção: precisa criar esta variável na Vercel)
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
        console.error("FALHA DE COMBUSTÍVEL: Chave GROQ_API_KEY não encontrada.");
        return res.status(500).json({ 
            error: 'Erro de Configuração', 
            details: 'A chave GROQ_API_KEY não está configurada nas Environment Variables da Vercel.' 
        });
    }

    // Endpoint oficial da API do Groq
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    try {
        // 3. Lê o que o seu site enviou
        let bodyPayload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        
        let userMessage = "Gere um dossiê com base nestes dados.";
        
        // Extrai a mensagem do formato original do Gemini (que o seu index.html ainda usa)
        if (bodyPayload.contents?.[0]?.parts?.[0]?.text) {
            userMessage = bodyPayload.contents[0].parts[0].text;
        } else if (bodyPayload.prompt) {
             userMessage = bodyPayload.prompt;
        }

        // 4. Converte o pedido para o formato que o Groq entende (LLaMA 3)
        const groqBody = {
            model: "llama-3.3-70b-versatile", // Modelo ultra-rápido da Meta
            messages: [
                {
                    role: "system",
                    content: "Você é um sargento instrutor experiente. Forneça respostas diretas, organizadas e com tom militar. Responda em Português."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ],
            temperature: 0.7
        };

        // 5. Envia o ataque tático ao servidor do Groq
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(groqBody)
        });

        const data = await response.json();

        // Verifica se a cota do Groq estourou (muito raro de acontecer)
        if (response.status === 429) {
             return res.status(429).json({ error: "Cota limite do Groq atingida temporariamente."});
        }

        if (!response.ok) {
            console.error("Erro no Groq:", data);
            return res.status(response.status).json({
                error: 'A IA recusou a missão',
                details: data.error?.message || 'Erro na API do Groq.'
            });
        }

        // 6. Conversão de Camuflagem
        // Converte a resposta do Groq de volta para o formato Gemini para o seu site funcionar sem alterações
        const respostaConvertida = {
            candidates: [
                {
                    content: {
                        parts: [
                            {
                                text: data.choices[0].message.content
                            }
                        ]
                    }
                }
            ]
        };

        return res.status(200).json(respostaConvertida);

    } catch (error) {
        console.error("Erro interno do servidor:", error);
        return res.status(500).json({ error: 'Falha Interna no Servidor', details: error.message });
    }
}
