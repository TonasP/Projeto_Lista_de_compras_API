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

        let sqlBase = `
            SELECT 
                catalogo.usuario_id as catalogo_usuario, 
                catalogo.nome as produto_nome, 
                catalogo.categoria as produto_categoria, 
                lista.id as lista_id, 
                lista.usuario_id as lista_usuario_id, 
                lista.quantidade as quantidade, 
                lista.comentario as comentario, 
                lista.status as status, 
                lista.data_atribuicao, 
                lista.data_compra 
            FROM public.lista
            JOIN public.catalogo on catalogo.id = lista.produto_id
            WHERE lista.usuario_id = $1 AND lista.status = 'pendente'
        `;

        let sqlCount = `
            SELECT COUNT(*) 
            FROM public.lista 
            JOIN public.catalogo on catalogo.id = lista.produto_id
            WHERE lista.usuario_id = $1 AND lista.status = 'pendente'
        `;

        let params = [userId, limitSql, offsetSql];
        let paramsCount = [userId];

        if (busca) {
 
            sqlBase += ` AND catalogo.nome ILIKE $4`;
            sqlCount += ` AND catalogo.nome ILIKE $2`; 

            params.push(`%${busca}%`);
            paramsCount.push(`%${busca}%`);
        }

        sqlBase += ` ORDER BY catalogo.categoria ASC, catalogo.nome ASC LIMIT $2 OFFSET $3`;

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
        console.error("Erro no GET /lista:", erro);
        res.status(500).json({
            error: "Não foi possivel listar os produtos",
            detalhes: erro.message
        });
    }
});
router.post("/", verificarToken, async (req, res) => {
    const { produto_id, quantidade, comentario } = req.body
    const status = "pendente"

    console.log(req.body)
    
    let data_atribuicao = new Date()
    if (!produto_id || !quantidade) {
        return res.status(400).json({ erro: "É necessário preencher todas as informações" })
    }
    try {
        const result = await pool.query(`INSERT INTO public.lista(usuario_id, produto_id, quantidade, comentario, status, data_atribuicao)
	    VALUES ($1, $2, $3, $4, $5, $6) returning *;`, [req.user.id, produto_id, quantidade,  comentario, status, data_atribuicao])
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
    const { quantidade, status, comentario, data_compra} = req.body
    if (!comentario){   
        comentario = ''
    }
    if (!quantidade || !status || !data_compra ){
        return res.status(400).json({erro: "É necessário preencher todas as informações"})
    }
    try {
        const result = await pool.query(`UPDATE public.lista
	SET quantidade=$1, status=$2, data_compra=$3, comentario=$6
	WHERE id = $4 and usuario_id = $5 returning *`,[quantidade, status, data_compra, req.params.id, req.user.id, comentario])
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