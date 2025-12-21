const jwt = require("jsonwebtoken")
require("dotenv").config()

function verificarToken(req,res,next){
    const authHeader = req.headers['authorization']

    const token = authHeader && authHeader.split(' ')[1]

    if (!token){
        return res.status(401).json({error: "Acesso negado, Token de autorização não fornecido"})
    }
    try{
        const secret = process.env.JWT_SECRET || "chave_secreta"
        const decoded = jwt.verify(token, secret)

        req.user= decoded
        next()
    }
    catch(erro){
        res.status(500).json({error: "Token expirado ou inválido", detalhes:erro.detalhes})
    }
}
module.exports = verificarToken