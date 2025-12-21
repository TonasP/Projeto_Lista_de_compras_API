const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const router = express.Router();

router.get("/login", async (req,res)=>{
    const {usuario, senha} = req.body
    if (!usuario || !senha) {
        return res.status(400).json({ error: "Informe usuário e senha" });
    }
    try{
        const result = await pool.query("SELECT * from usuarios where usuario = $1",[usuario])
        if(result.rows.length===0){
            return res.status(401).json({mensagem:"Credenciais inválidas"})
        }
        const user = result.rows[0]
        const correctPassword = await bcrypt.compare(senha, user.senha)

        if (!correctPassword){
            return res.status(401).json({mensagem:"Credenciais inválidas"})
        }
        const token = jwt.sign(
            {id:user.id, usuario: user.usuario},
            process.env.JWT_SECRET || "chave_secreta",
            {expiresIn :"24h"}
        )
        res.json({
            mensagem: "Logado com sucesso",
            token: token, 
            usuario: { nome: user.usuario, local: user.localizacao }
        });
    }
    catch(erro){
        res.status(500).json({
            error: "Erro interno ao realizar o login",
            detalhes: erro.message
        })
    }
})
router.post("/cadastro", async (req,res)=>{
    const {usuario, localizacao, senha} = req.body

    if(!usuario || !senha) return res.status(400).json({error: "Dados incompletos"});
    try{
        const userCheck = await pool.query("SELECT * FROM usuarios where usuario = $1", [usuario])
        if (userCheck.rows.length>0){
            return res.status(409).json("Este nome de usuário já está cadastrado")
        }
        console.log(senha, usuario, localizacao)
        const saltRounds = 10
        const hash = await bcrypt.hash(senha, saltRounds)
        
        const newUser = await pool.query(`INSERT INTO public.usuarios(usuario, localizacao, senha)VALUES ($1, $2, $3) RETURNING id, usuario, localizacao`, [usuario, localizacao, hash])
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