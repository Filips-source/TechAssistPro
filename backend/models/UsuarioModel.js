import { pool } from "../config/database.js";
// Cadastro público cria CLIENTE. Funcionários são criados pelo administrador.
export async function buscarPorEmail(email, tipo = "cliente") {
  const tabela = tipo === "equipe" ? "usuarios" : "clientes";
  const [linhas] = await pool.query(`SELECT * FROM ${tabela} WHERE email=?`, [
    email,
  ]);
  return linhas[0] || null;
}
export async function buscarPorId(id, tipo = "cliente") {
  const tabela = tipo === "equipe" ? "usuarios" : "clientes";
  const coluna = tipo === "equipe" ? "id_usuario" : "id_cliente";
  const [linhas] = await pool.query(
    `SELECT * FROM ${tabela} WHERE ${coluna}=?`,
    [id],
  );
  return linhas[0] || null;
}
export async function criar({ nome, email, telefone, senhaHash, imagemUrl = null, tipoPessoa = "fisica", documento = null, razaoSocial = null, endereco = null }) {
  const [r] = await pool.query(
    "INSERT INTO clientes(nome,email,telefone,senha_hash,imagem_url,tipo_pessoa,documento,nome_razao_social,endereco) VALUES(?,?,?,?,?,?,?,?,?)",
    [nome, email, telefone, senhaHash, imagemUrl, tipoPessoa, documento, razaoSocial, endereco],
  );
  return {
    id: r.insertId,
    nome,
    email,
    telefone,
    imagem_url: imagemUrl,
    tipo_pessoa: tipoPessoa,
    nome_razao_social: razaoSocial,
    endereco,
    tipo: "cliente",
    perfil: "cliente",
  };
}
