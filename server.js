const cors = require('cors');
const express = require("express");
require("dotenv").config();


const usuarioRouter = require("./routes/usuario.js")
const catalogoRouter = require("./routes/catalogo.js")
const listaRouter = require("./routes/lista.js")
const dicasRouter = require("./routes/dica.js")
const historicoRouter = require("./routes/historico.js")

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'));

app.use("/usuario", usuarioRouter)
app.use("/catalogo", catalogoRouter)
app.use("/lista", listaRouter)
app.use("/dicas", dicasRouter)
app.use("/historico", historicoRouter)

//rota de ping para manter o servidor ativo
app.use("/ping", (res,req)=>{
    res.status(200).json("Servidor pingado com sucesso")
})


const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log("Servidor rodando em http://127.0.0.1:3000")
})