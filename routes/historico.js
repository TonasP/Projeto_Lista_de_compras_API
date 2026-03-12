const express = require("express");
const pool = require("../db");
const verificarToken = require("../middlewares/authToken.js");
const router = express.Router();

// Rota 1: Gráfico Principal (Top Produtos Comprados no Período)
router.get("/consumo", verificarToken, async (req, res) => {
    const { tempo } = req.query; // Ex: '1-mes', '6-meses'
    const userId = req.user.id;

    // Lógica para definir o intervalo de tempo no SQL
    let intervaloSql = "1 month"; // Padrão
    if (tempo === 'hoje') intervaloSql = "1 day";
    else if (tempo === '1-semana') intervaloSql = "1 week";
    else if (tempo === '3-semanas') intervaloSql = "3 weeks";
    else if (tempo === '3-meses') intervaloSql = "3 months";
    else if (tempo === '6-meses') intervaloSql = "6 months";
    else if (tempo === '1-ano') intervaloSql = "1 year";

    try {
        const query = `
            SELECT catalogo.nome AS produto_nome, COUNT(lista.id) AS total_vezes_comprado
            FROM public.lista
            JOIN public.catalogo ON catalogo.id = lista.produto_id
            WHERE lista.usuario_id = $1 
              AND lista.status = 'comprado' 
              AND lista.data_compra >= NOW() - INTERVAL '${intervaloSql}'
            GROUP BY catalogo.nome
            ORDER BY total_vezes_comprado DESC
            LIMIT 10; -- Mostra os 10 mais comprados para o gráfico não ficar gigante
        `;
        
        const result = await pool.query(query, [userId]);
        res.status(200).json(result.rows);
    } catch (erro) {
        console.error("Erro estatísticas:", erro);
        res.status(500).json({ error: "Erro ao gerar dados do gráfico" });
    }
});

// Rota 2: Detalhamento do Produto Clicado (Somando as quantidades por unidade)
router.get("/detalhes/:produtoNome", verificarToken, async (req, res) => {
    const { tempo } = req.query;
    const { produtoNome } = req.params;
    const userId = req.user.id;

    let intervaloSql = "1 month";
    if (tempo === 'hoje') intervaloSql = "1 day";
    else if (tempo === '1-semana') intervaloSql = "1 week";
    else if (tempo === '3-semanas') intervaloSql = "3 weeks";
    else if (tempo === '3-meses') intervaloSql = "3 months";
    else if (tempo === '6-meses') intervaloSql = "6 months";
    else if (tempo === '1-ano') intervaloSql = "1 year";

    try {
       
        const query = `
            SELECT lista.quantidade
            FROM public.lista
            JOIN public.catalogo ON catalogo.id = lista.produto_id
            WHERE lista.usuario_id = $1 
              AND lista.status = 'comprado' 
              AND catalogo.nome = $2
              AND lista.data_compra >= NOW() - INTERVAL '${intervaloSql}'
        `;
        
        const result = await pool.query(query, [userId, produtoNome]);

        
        const totaisPorUnidade = {};

        result.rows.forEach(row => {
           
            const qtdString = row.quantidade.toLowerCase().replace(/\s/g, ''); 

            const match = qtdString.match(/^([\d.,]+)([a-z]+)$/);

            if (match) {
              
                let valor = parseFloat(match[1].replace(',', '.')); 
                let unidade = match[2];

                
                if (!totaisPorUnidade[unidade]) {
                    totaisPorUnidade[unidade] = 0;
                }
                
              
                totaisPorUnidade[unidade] += valor;
            } else {
               
                if (!totaisPorUnidade['diversos']) totaisPorUnidade['diversos'] = 0;
                totaisPorUnidade['diversos'] += 1;
            }
        });

       
        const respostaFormatada = Object.keys(totaisPorUnidade).map(uni => ({
            unidade: uni,
            total: parseFloat(totaisPorUnidade[uni].toFixed(2)) 
        }));

       
        respostaFormatada.sort((a, b) => b.total - a.total);

        res.status(200).json(respostaFormatada);
    } catch (erro) {
        console.error("Erro ao processar detalhes:", erro);
        res.status(500).json({ error: "Erro ao buscar detalhes" });
    }
});


module.exports = router;