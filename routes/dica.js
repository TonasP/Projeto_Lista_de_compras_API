const express = require("express");
const pool = require("../db");
const verificarToken = require("../middlewares/authToken.js");

const router = express.Router();

router.get("/", verificarToken, async (req, res) => {
    const { limit, offset, busca } = req.query;

    try {
        const limitSql = parseInt(limit) || 6; 
        const offsetSql = parseInt(offset) || 0;
        const userId = req.user.id;

        let sqlBase = `
            SELECT *
            FROM public.dicas
            WHERE usuario_id = $1
        `;

        let sqlCount = `
            SELECT COUNT(*) 
            FROM public.dicas 
            WHERE usuario_id = $1
        `;

        
        let params = [userId, limitSql, offsetSql];
      
        let paramsCount = [userId];

       
        if (busca) {
            
            sqlBase += ` AND (titulo ILIKE $4 OR produto_nome ILIKE $4)`;
            
            sqlCount += ` AND (titulo ILIKE $2 OR produto_nome ILIKE $2)`; 

            params.push(`%${busca}%`);
            paramsCount.push(`%${busca}%`);
        }

        
        sqlBase += ` ORDER BY id ASC LIMIT $2 OFFSET $3`;

        const [countResult, dadosResult] = await Promise.all([
            pool.query(sqlCount, paramsCount),
            pool.query(sqlBase, params)
        ]);
        const totalItens = parseInt(countResult.rows[0].count);

        res.status(200).json({
            total: totalItens,
            itens: dadosResult.rows
        });

    } catch (erro) {
        console.error("Erro no GET /dicas:", erro);
        res.status(500).json({
            error: "Não foi possivel listar as dicas",
            detalhes: erro.message
        });
    }
});

router.get("/:id", verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM public.dicas WHERE id = $1 AND usuario_id = $2`, 
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Dica não encontrada" });
        }
        return res.status(200).json(result.rows[0]);
    } catch (erro) {
        res.status(500).json({
            error: "Não foi possível buscar a dica",
            detalhes: erro.message
        });
    }
});

router.post("/", verificarToken, async (req, res) => {
  
    const { titulo, descricao, produto_nome } = req.body;
    try {
        if (!titulo || !descricao || !produto_nome) {
            return res.status(400).json("É necessário preencher todos os dados");
        }
        
        
        const result = await pool.query(
            `INSERT INTO public.dicas (usuario_id, titulo, descricao, produto_nome)
             VALUES ($1, $2, $3, $4) RETURNING *`, 
            [req.user.id, titulo, descricao, produto_nome]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json("Impossivel acessar o item");
        }
        return res.status(200).json(result.rows[0]);
    } catch (erro) {
        res.status(500).json({
            error: "Não foi possivel adicionar a dica",
            message: erro.message
        });
    }
});

router.put("/:id", verificarToken, async (req, res) => {
   
    const { titulo, descricao, produto_nome } = req.body;
    try {
        if (!titulo || !descricao || !produto_nome) {
            return res.status(400).json("É necessário preencher todos os dados");
        }
        
 
        const result = await pool.query(
            `UPDATE public.dicas SET usuario_id=$1, titulo=$2, descricao=$3, produto_nome=$4
             WHERE id = $5 AND usuario_id = $1 RETURNING *`, 
            [req.user.id, titulo, descricao, produto_nome, req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json("Impossivel acessar o item");
        }
        return res.status(200).json(result.rows[0]);

    } catch (erro) {
        res.status(500).json({
            error: "Não foi possivel atualizar a dica",
            message: erro.message
        });
    }
});

router.delete("/:id", verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM public.dicas WHERE id = $1 AND usuario_id = $2 RETURNING *`, 
            [req.params.id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json("Impossivel acessar o item");
        }
        return res.status(200).json(result.rows[0]);
    } catch (erro) {
        res.status(500).json({
            error: "Não foi possivel deletar a dica selecionada",
            detalhes: erro.message
        });
    }
});

module.exports = router;