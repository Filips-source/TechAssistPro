import { pool } from "../config/database.js";
export async function criar(d) {
  const [r] = await pool.query(
    "INSERT INTO contatos(nome,email,telefone,assunto,mensagem) VALUES(?,?,?,?,?)",
    [d.nome, d.email, d.telefone, d.assunto, d.mensagem],
  );
  return { id_contato: r.insertId };
}
export async function listar() {
  const [r] = await pool.query(
    "SELECT * FROM contatos ORDER BY id_contato DESC LIMIT 100",
  );
  return r;
}
