// Mesmo mysql2/promise e consultas parametrizadas usados na API de produtos.
import mysql from "mysql2/promise";
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "techassistpro",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 40,
  decimalNumbers: true,
  dateStrings: true,
  charset: "utf8mb4",
});
export const criarPool = () => pool;
export async function transacao(operacao) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
    const resultado = await operacao(conexao);
    await conexao.commit();
    return resultado;
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}
