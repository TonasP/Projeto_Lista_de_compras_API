const express = require("express");
const pool = require("../db");
const verificarToken = require("../middlewares/authToken.js");

const router = express.Router();

router.get("/", verificarToken, async (req, res) => {
    const { limit, offset, busca } = req.query
    
    try {
        let limitSql = parseInt(limit) || 6
        let offsetSql = parseInt(offset) || 0

        if (busca) {
            const result = await pool.query(`SELECT catalogo.usuario_id as catalogo_usuario, catalogo.nome as produto_nome, catalogo.categoria as produto_categoria, lista.id as lista_id, lista.usuario_id as lista_usuario_id, lista.quantidade as quantidade, lista.comentario as comentario, lista.status as status, lista.data_atribuicao, lista.data_compra  FROM public.lista
        JOIN public.catalogo on catalogo.id = lista.produto_id
        WHERE lista.usuario_id = $1 AND lista.nome ILIKE $2
        ORDER BY produto_categoria ASC, produto_nome ASC LIMIT $3 OFFSET $4`, [req.user.id, busca, limitSql, offsetSql])
            return res.status(200).json(result.rows)
        }

        const result = await pool.query(`SELECT catalogo.usuario_id as catalogo_usuario, catalogo.nome as produto_nome, catalogo.categoria as produto_categoria, lista.id as lista_id, lista.usuario_id as lista_usuario_id, lista.quantidade as quantidade, lista.comentario as comentario, lista.status as status, lista.data_atribuicao, lista.data_compra  FROM public.lista
        JOIN public.catalogo on catalogo.id = lista.produto_id
        WHERE lista.usuario_id = $1
        ORDER BY produto_categoria ASC, produto_nome ASC  LIMIT $2 OFFSET $3`, [req.user.id, limitSql, offsetSql])

        return res.status(200).json(result.rows)
    }
    catch (erro) {
        res.status(500).json({
            error: "Não foi possivel listar os produtos",
            detalhes: erro.message
        })
    }

})
router.post("/", verificarToken, async (req, res) => {
    const { produto_id, quantidade, comentario } = req.body
    const status = "pendente"
    if (!comentario){   
        comentario = ''
    }
    let data_atribuicao = new Date()
    if (!produto_id || !quantidade) {
        return res.status(400).json({ erro: "É necessário preencher todas as informações" })
    }
    try {
        const result = await pool.query(`INSERT INTO public.lista(usuario_id, produto_id, quantidade, comentario, status, data_atribuicao)
	    VALUES ($1, $2, $3, $4, $5) returning *;`, [req.user.id, produto_id, quantidade, status, comentario, data_atribuicao])
        res.status(200).json(result.rows[0])
    }
    catch (erro) {
        res.status(500).json({
            error: "Não foi possivel adicionar o produto a lista",
            detalhes: erro.message
        })
    }

})
router.put("/:id", verificarToken, async(req,res)=>{
    const {produto_id, quantidade, status, comentario, data_compra} = req.body
    if (!comentario){   
        comentario = ''
    }
    if (!produto_id || !quantidade || !status || !data_compra ){
        return res.status(400).json({erro: "É necessário preencher todas as informações"})
    }
    try {
        const result = await pool.query(`UPDATE public.lista
	SET produto_id=$1, quantidade=$2, status=$3, data_compra=$4, comentario=$7
	WHERE id = $5 and usuario_id = $6 returning *`,[produto_id, quantidade, status, data_compra, req.params.id, req.user.id, comentario])
    return res.status(200).json(result.rows[0])
    }
    catch(erro){
        res.status(500).json({
            error: "Não foi possivel atualizar o produto selecionado",
            detalhes: erro.message
        })
    }
})
router.delete("/:id", verificarToken, async(req,res)=>{
    try{
        const result = await pool.query(`DELETE FROM public.lista
	WHERE id = $1 and usuario_id = $2 returning *`,[req.params.id, req.user.id])
    return res.status(200).json(result.rows[0])
    }
    catch(erro){
        res.status(500).json({
            error:"Não foi possivel deletar o produto selecionado",
            detalhes: erro.message
        })
    }
})
module.exports = router