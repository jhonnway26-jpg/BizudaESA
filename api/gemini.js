export default async function handler(req, res) {
    // Cabeçalhos de Segurança e CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    // 1. Puxa a chave e remove qualquer espaço em branco acidental (muito comum)
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        console.error("ERRO: Chave GEMINI_API_KEY não encontrada no ambiente Vercel.");
        return res.status(500).json({ 
            error: 'Erro de Configuração', 
            details: 'A chave de API não foi encontrada no servidor. Verifique as Environment Variables na Vercel.' 
        });
    }

    // Usando a URL de geração de conteúdo (v1beta ou v1 são aceitas)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        // 2. Garante que o corpo da requisição está correto
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro da API do Google:", data);
            return res.status(response.status).json({
                error: 'O Google recusou a requisição',
                details: data.error?.message || 'Erro desconhecido na API do Google.',
                status: response.status
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("Erro interno no servidor da Vercel:", error);
        return res.status(500).json({ 
            error: 'Falha interna no servidor', 
            details: error.message 
        });
    }
}
