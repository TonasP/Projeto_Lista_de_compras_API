const express = require("express");
require("dotenv").config();
const cors = require('cors');

const usuarioRouter = require("./routes/usuario.js")

const app = express()
app.use(cors())
app.use(express.json())

app.use("/usuario", usuarioRouter)

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log("Servidor rodando em http://127.0.0.1:3000")
})