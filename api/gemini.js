export default async function handler(req, res) {
    // Configuração de CORS para permitir que o seu site fale com o servidor
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde a verificações do navegador
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    // 1. Verificação da Chave (Removendo espaços)
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'Configuração Incompleta', 
            details: 'A variável GEMINI_API_KEY não foi encontrada na Vercel.' 
        });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        // 2. Tratamento do corpo da requisição (Evita erro 500 de JSON mal formado)
        let bodyPayload;
        if (typeof req.body === 'string') {
            try {
                bodyPayload = JSON.parse(req.body);
            } catch (e) {
                return res.status(400).json({ error: 'JSON Inválido', details: 'O corpo enviado não é um JSON válido.' });
            }
        } else {
            bodyPayload = req.body;
        }

        // 3. Chamada à API do Google usando fetch nativo (Node 18+)
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: 'Erro na API do Google',
                details: data.error?.message || 'Erro desconhecido.'
            });
        }

        // Sucesso total
        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro no Handler:", error);
        return res.status(500).json({ 
            error: 'Falha Interna no Servidor', 
            details: error.message 
        });
    }
}
