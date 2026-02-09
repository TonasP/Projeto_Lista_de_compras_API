const express = require("express");
const pool = require("../db");
const verificarToken = require("../middlewares/authToken.js");

const router = express.Router();


router.get("/", verificarToken, async (req, res) => {
    const { limit, offset, busca } = req.query
    try {
        const limitSql = parseInt(limit) || 10
        const offsetSql = parseInt(offset) || 0

        const userId = req.user.id;

        if (busca) {
            let result = await pool.query("SELECT * FROM public.catalogo where usuario_id = $1 AND nome ILIKE $4 limit  $2 offset $3", [userId, limitSql, offsetSql, `%${busca}%`])
            return res.status(200).json(result.rows)
        }

        let result = await pool.query("SELECT * FROM public.catalogo where usuario_id = $1 limit  $2 offset $3", [userId, limitSql, offsetSql])

        res.status(200).json(result.rows)
    }
    catch (erro) {
        res.status(500).json({
            error: "Erro ao consultar o servidor",
            detalhes: erro.message
        })
    }
})
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