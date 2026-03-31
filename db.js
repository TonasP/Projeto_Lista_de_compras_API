require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then(() => console.log("✅ Conectado ao Supabase com sucesso!"))
  .catch(err => console.error("❌ Erro ao conectar no banco:", err.message));

module.exports = pool;