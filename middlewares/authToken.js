const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
        return res.status(401).json({ error: "Token não fornecido." });
    }

    
    const partes = authHeader.split(" ");

    if (partes.length !== 2) {
        return res.status(401).json({ error: "Erro no formato do token." });
    }

    const token = partes[1];

    try {
        const secret = process.env.JWT_SECRET || "chave_secreta";

       
        const verificado = jwt.verify(token, secret);

        req.user = verificado;
        next();

    } catch (erro) {
        console.log("Tentativa de acesso com token inválido:", erro.message);

        return res.status(403).json({
            error: "Sessão expirada ou token inválido.",
            detalhes: erro.message
        });
    }
};