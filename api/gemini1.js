export default async function handler(req, res) {
    // Bloqueia qualquer requisição que não seja POST (segurança básica)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido na base.' });
    }

    // Puxa a chave camuflada do painel da Vercel
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return res.status(500).json({ error: 'Chave de acesso não configurada na Vercel.' });
    }

    // A URL oficial do Gemini (agora escondida no servidor)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    try {
        // Envia a missão (payload) do frontend direto para o Google
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body) // req.body já vem pronto da Vercel
        });

        // Tenta ler o JSON que o Google devolveu
        const data = await response.json();
        
        if (!response.ok) {
            // Se o Google recusar (ex: chave expirada), devolvemos o erro para o site
            return res.status(response.status).json(data);
        }

        // Devolve o dossiê pronto para o index.html
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Falha de comunicação na rede de inteligência do servidor.' });
    }
}