const express = require("express");
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require('validator');
const crypto = require("crypto");
const transporter = require('../middlewares/emailTransporter.js')
const verificarToken = require("../middlewares/authToken.js");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        cb(null, 'uploads/perfil/'); 
    },
    filename: function (req, file, cb) {
        const extensao = path.extname(file.originalname);
        const nomeUnico = req.user.id + '-' + Date.now() + extensao;
        cb(null, nomeUnico);
    }
});


const upload = multer({ storage: storage });




router.post("/login", async (req, res) => {
    const { usuario, senha, email } = req.body
    if (!senha || (!usuario && !email)) {
        return res.status(400).json({ error: "Informe usuário/email e senha" });
    }
    try {
        const result = await pool.query("SELECT * from usuarios where usuario = $1 or email = $2", [usuario, email])
        if (result.rows.length === 0) {
            return res.status(401).json({ mensagem: "Credenciais inválidas" })
        }
        const user = result.rows[0]
        const correctPassword = await bcrypt.compare(senha, user.senha)

        if (!correctPassword) {
            return res.status(401).json({ mensagem: "Credenciais inválidas" })
        }
        const token = jwt.sign(
            { id: user.id, usuario: user.usuario },
            process.env.JWT_SECRET || "chave_secreta",
            { expiresIn: "1h" }
        )
        res.json({
            mensagem: "Logado com sucesso",
            token: token,
            usuario: { nome: user.usuario, local: user.localizacao, email: user.email }
        });
    }
    catch (erro) {
        res.status(500).json({
            error: "Erro interno ao realizar o login",
            detalhes: erro.message
        })
    }
})

router.get("/me", verificarToken, async (req, res) => {
    try {
        
        const result = await pool.query(
            `SELECT nome, email, foto_perfil FROM public.usuarios WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilizador não encontrado." });
        }

        res.status(200).json(result.rows[0]);

    } catch (erro) {
        console.error("Erro ao buscar dados do utilizador:", erro);
        res.status(500).json({ error: "Erro interno ao buscar o perfil." });
    }
});

router.post("/cadastro", async (req, res) => {
    const { usuario, localizacao, senha, email } = req.body

    if (!usuario || !senha) return res.status(400).json({ error: "Dados incompletos" });
    try {
        const userCheck = await pool.query("SELECT * FROM usuarios where usuario = $1 or email = $2", [usuario, email])
        if (userCheck.rows.length > 0) {
            return res.status(409).json("Este nome de usuário ou email já está cadastrado")
        }
        console.log(senha, usuario, localizacao)
        const saltRounds = 10
        const hash = await bcrypt.hash(senha, saltRounds)

        const newUser = await pool.query(`INSERT INTO public.usuarios(usuario, localizacao, senha, email)VALUES ($1, $2, $3, $4) RETURNING id, usuario, localizacao, email`, [usuario, localizacao, hash, email])
        res.status(200).json({
            mensagem: "Usuario cadastrado com sucesso",
            usuario: newUser.rows[0]
        })
    }
    catch (erro) {
        res.status(500).json({
            error: "Erro ao cadastrar usuário",
            detalhes: erro.message
        })
    }
})
router.post("/esqueci-senha", async (req, res) => {
    const { email } = req.body;

    try {

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ error: "Email inválido" });
        }

        const userCheck = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);

        if (userCheck.rows.length === 0) {

            return res.status(200).json({ message: "Se o email existir, você receberá um link de redefinição." });
        }

        const usuario = userCheck.rows[0];


        const token = crypto.randomInt(0, 1000000).toString().padStart(6, '0')


        const agora = new Date();
        agora.setHours(agora.getHours() + 1);


        await pool.query(
            "UPDATE usuarios SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3",
            [token, agora, usuario.id]
        );


        await transporter.sendMail({
            to: email,
            from: 'no-reply@seuapp.com',
            subject: 'Recuperação de Senha',
            text: `Você esqueceu sua senha? Use este token: ${token}\n\nOu clique no link: http://localhost:3000/resetar-senha/${token}`
        });

        return res.status(200).json({ message: "Se o email existir, você receberá um link de redefinição." });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ error: "Erro ao tentar redefinir senha" });
    }
});
router.post("/resetar-senha", async (req, res) => {
    const { token, novaSenha } = req.body;

    try {
        if (!token || !novaSenha) {
            return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
        }


        const result = await pool.query(
            `SELECT * FROM usuarios 
             WHERE password_reset_token = $1 
             AND password_reset_expires > NOW()`,
            [token]
        );


        if (result.rows.length === 0) {
            return res.status(400).json({ error: "Token inválido ou expirado" });
        }

        const usuario = result.rows[0];


        const saltRounds = 10;
        const hashSenha = await bcrypt.hash(novaSenha, saltRounds);


        await pool.query(
            `UPDATE usuarios 
             SET senha = $1, 
                 password_reset_token = NULL, 
                 password_reset_expires = NULL 
             WHERE id = $2`,
            [hashSenha, usuario.id]
        );

        res.status(200).json({ message: "Senha alterada com sucesso! Agora você pode fazer login." });

    } catch (erro) {
        console.error(erro);
        res.status(500).json({ error: "Erro ao resetar senha" });
    }
});

router.post("/upload-foto", verificarToken, upload.single("foto"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
        }

        const caminhoFoto = `/uploads/perfil/${req.file.filename}`;

        const result = await pool.query(
            `UPDATE public.usuarios SET foto_perfil = $1 WHERE id = $2 RETURNING foto_perfil`,
            [caminhoFoto, req.user.id]
        );

        res.status(200).json({ 
            mensagem: "Foto de perfil atualizada com sucesso!",
            fotoUrl: result.rows[0].foto_perfil 
        });

    } catch (erro) {
        console.error("Erro ao salvar foto:", erro);
        res.status(500).json({ error: "Não foi possível salvar a imagem." });
    }
});


module.exports = router