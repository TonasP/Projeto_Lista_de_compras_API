const express = require("express");
const pool = require("../db");
const verificarToken = require("../middlewares/authToken.js");

const router = express.Router();

router.get("/", verificarToken, async (req, res) => {
    const { limit, offset, busca} = req.params
    try {
        let limitSql = parseInt(limit) || 15
        let offsetSql = parseInt(offset) || 0

        if (busca){
            const result = await pool.query(`SELECT catalogo.usuario_id as catalogo_usuario, catalogo.nome as produto_nome, catalogo.categoria as produto_categoria, lista.id as lista_id, lista.usuario_id as lista_usuario_id, lista.quantidade as quantidade, lista.status as status, lista.data_atribuicao, lista.data_compra  FROM public.lista
        JOIN public.catalogo on catalogo.id = lista.produto_id
        WHERE catalogo.usuario_id = $1 AND catalogo.nome = $2
        ORDER BY produto_categoria ASC, produto_nome ASC  LIMIT $3 OFFSET $4`, [req.user.id, busca, limitSql, offsetSql])   
        return res.status(200).json(result.rows)  
        }

        const result = await pool.query(`SELECT catalogo.usuario_id as catalogo_usuario, catalogo.nome as produto_nome, catalogo.categoria as produto_categoria, lista.id as lista_id, lista.usuario_id as lista_usuario_id, lista.quantidade as quantidade, lista.status as status, lista.data_atribuicao, lista.data_compra  FROM public.lista
        JOIN public.catalogo on catalogo.id = lista.produto_id
        WHERE catalogo.usuario_id = $1
        ORDER BY produto_categoria ASC, produto_nome ASC  LIMIT $2 OFFSET $3`, [req.user.id, limitSql, offsetSql])
        
        res.status(200).json(result.rows)
    }
    catch (erro) {
        res.status(500).json({
            error: "Não foi possivel listar os produtos",
            detalhes: erro.message
        })
    }
    
})
