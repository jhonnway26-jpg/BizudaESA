export default async function handler(req, res) {
    // 1. Configuração de CORS e Cabeçalhos
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    // 2. Verificação da Chave de API (Cofre da Vercel)
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        console.error("ERRO: Variável GEMINI_API_KEY não encontrada.");
        return res.status(500).json({ 
            error: 'Erro de Configuração', 
            details: 'A chave API não foi encontrada no servidor Vercel.' 
        });
    }

    // 3. Preparação do Alvo (Google Gemini API)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
        // 4. Tratamento Robusto do Corpo da Requisição
        let bodyPayload = req.body;

        // Caso body seja um Buffer (alguns runtimes da Vercel retornam assim)
        if (Buffer.isBuffer(bodyPayload)) {
            bodyPayload = bodyPayload.toString('utf-8');
        }

        // Se chegou como string, parseia para objeto
        if (typeof bodyPayload === 'string') {
            try {
                bodyPayload = JSON.parse(bodyPayload);
            } catch (e) {
                console.error("Erro ao parsear JSON de entrada:", e);
                return res.status(400).json({ error: 'Dados Inválidos', details: 'O formato do pedido não é um JSON válido.' });
            }
        }

        // Guarda de segurança: body vazio ou inválido
        if (!bodyPayload || typeof bodyPayload !== 'object') {
            console.error("Body inválido ou ausente:", bodyPayload);
            return res.status(400).json({ error: 'Dados Inválidos', details: 'O corpo da requisição está vazio ou em formato inválido.' });
        }

        // 5. Chamada de Combate (Fetch com Timeout simulado)
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyPayload)
        });

        // 6. Análise da Resposta do Google
        const data = await response.json();

        if (!response.ok) {
            console.error("O Google rejeitou o pedido:", data);
            return res.status(response.status).json({
                error: 'O Google recusou a missão',
                details: data.error?.message || 'Erro na API do Google.',
                status: response.status
            });
        }

        // Sucesso: Devolve o Dossier
        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro Crítico no Servidor:", error.message);
        return res.status(500).json({ 
            error: 'Falha Interna no Servidor', 
            details: error.message 
        });
    }
}
