const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");

const router = express.Router();

router.get("/login", async (req,res)=>{
    const {usuario, senha} = req.body
    try{
        const result = await pool.query("SELECT * from usuarios where usuario = $1",[usuario])
        if(result.rows.length===0){
            return res.status(401).json({mensagem:"Credenciais inválidas"})
        }
        const user = result.rows[0]
        const correctPassword = await bcrypt.compare(senha, user.senha)

        if (!correctPassword){
            return res.status(401).json({mensagem:"A senha está incorreta"})
        }
        res.json({mensagem:"Logado com sucesso"})
    }
    catch(erro){
        res.status(500).json({
            error: "Erro interno ao realizar o login",
            detalhes: erro.message
        })
    }
})
router.get("/:id", async (req,res)=>{
    try{
        const id = parseInt(req.params.id)
        const result = await pool.query("SELECT * FROM usuarios where id = $1", [id])
        res.status(200).json(result.rows)
    }
    catch(erro){
        res.status(500).json({
            error: "Erro ao listar usuário especifico",
            detalhes: erro.message
        })
    }
})
router.post("/cadastro", async (req,res)=>{
    const {usuario, localizacao, senha} = req.body

    try{
        const userCheck = await pool.query("SELECT * FROM usuarios where usuario = $1", [usuario])
        if (userCheck.rows.length>0){
            return res.status(409).json("Este nome de usuário já está cadastrado")
        }
        console.log(senha, usuario, localizacao)
        const saltRounds = 10
        const hash = await bcrypt.hash(senha, saltRounds)
        
        const newUser = await pool.query(`INSERT INTO public.usuarios(usuario, localizacao, senha)VALUES ($1, $2, $3) RETURNING *`, [usuario, localizacao, hash])
        res.status(200).json({
            mensagem:"Usuario cadastrado com sucesso",
            usuario:newUser.rows[0]})
    }
    catch(erro){
        res.status(500).json({
            error: "Erro ao cadastrar usuário",
            detalhes: erro.message
        })
    }
})
module.exports = router