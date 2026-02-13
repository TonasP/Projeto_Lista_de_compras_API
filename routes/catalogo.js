const express = require("express");
const pool = require("../db");
const verificarToken = require("../middlewares/authToken.js");

const router = express.Router();


router.get("/", verificarToken, async (req, res) => {
    const { limit, offset, busca } = req.query;

    try {
        const limitSql = parseInt(limit) || 8;
        const offsetSql = parseInt(offset) || 0;
        const userId = req.user.id;

        let sqlBase = `SELECT * FROM public.catalogo WHERE usuario_id = $1`;

        let sqlCount = `SELECT COUNT(*) FROM public.catalogo WHERE usuario_id = $1`;

        const params = [userId, limitSql, offsetSql];
        const paramsCount = [userId];

        if (busca) {
           
            sqlBase += ` AND (nome ILIKE $4 OR categoria ILIKE $4)`; 
            
        
            sqlCount += ` AND (nome ILIKE $2 OR categoria ILIKE $2)`;

            const termo = `%${busca}%`;
            params.push(termo);
            paramsCount.push(termo);
        }

        
        sqlBase += ` ORDER BY categoria ASC, nome ASC LIMIT $2 OFFSET $3`;

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
        console.error("Erro no GET /catalogo:", erro);
        res.status(500).json({
            error: "Erro ao consultar o catálogo",
            detalhes: erro.message
        });
    }
});
router.get("/:id", verificarToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM public.catalogo WHERE id = $1 AND usuario_id = $2",
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item não encontrado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar item" });
    }
});
router.get("/filtro/:categoria", verificarToken, async (req, res) => {
    const { categoria } = req.params;
    try {
        const result = await pool.query(
            "SELECT * FROM public.catalogo WHERE categoria = $1 AND usuario_id = $2",
            [categoria, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Item não encontrado" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar item" });
    }
});

router.post("/", verificarToken, async (req, res) => {
    const { nome, categoria } = req.body
    console.log(nome, categoria)
    try {
        if (!nome || !categoria) {
            return res.status(400).json({ erro: "É necessário preencher todas as informações" })
        }
        const result = await pool.query(`INSERT INTO public.catalogo (usuario_id, nome, categoria) VALUES ($1, $2, $3) returning *`, [req.user.id, nome, categoria])


        res.status(201).json(result.rows[0])
    }
    catch (error) {
        console.error(error)
        res.status(500).json({ erro: "Erro ao adicionar novo item ao catalogo", detalhes: error.message })
    }
})
router.put("/:id", verificarToken, async (req, res) => {
    const { nome, categoria } = req.body
    const { id } = req.params
    try {
        if (!nome || !categoria) {
            return res.status(400).json({ erro: "É necessário preencher todas as informações" })
        }
        const result = await pool.query(`UPDATE public.catalogo SET nome=$2, categoria=$3 WHERE id = $4 AND usuario_id=$1 returning *`, [req.user.id, nome, categoria, id])
        if (result.rowCount === 0) {
            return res.status(404).json({ erro: "Item não encontrado ou não autorizado" })
        }

        res.status(200).json(result.rows[0])

    }
    catch (error) {
        console.error(error)
        res.status(500).json({ erro: "Erro ao atualizar item no catalogo", detalhes: error.message })
    }
})
router.delete("/:id", verificarToken, async (req, res) => {
    const { id } = req.params
    try {

        const result = await pool.query(`DELETE FROM public.catalogo WHERE id = $1 AND usuario_id=$2 returning *`, [id, req.user.id])
        if (result.rowCount === 0) {
            return res.status(404).json({ erro: "Item não encontrado ou não autorizado" })
        }

        res.status(200).json(result.rows[0])

    }
    catch (error) {
        console.error(error)
        res.status(500).json({ erro: "Erro ao deletar item do catalogo", detalhes: error.message })
    }
})

module.exports = router