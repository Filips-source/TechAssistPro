import bcrypt from "bcryptjs";
import { pool } from "../config/database.js";
import * as AuthService from "./AuthService.js";
import { erro, texto, email, telefone, opcao, id as validarId } from "../utils/validacao.js";

function tipoValido(tipo) {
  return opcao(tipo, ["cliente", "funcionario"], "Tipo de usuário");
}

function senhaForte(senha) {
  if (typeof senha !== "string" || senha.length < 8 || senha.length > 72 ||
      !/[a-z]/.test(senha) || !/[A-Z]/.test(senha) ||
      !/[0-9]/.test(senha) || !/[\W_]/.test(senha)) {
    throw erro(422, "A senha deve ter de 8 a 72 caracteres com maiúscula, minúscula, número e símbolo.");
  }
  return senha;
}

function dadosCliente(dados) {
  const nome = texto(dados.nome, "Nome", 3, 120);
  const tipoPessoa = opcao(dados.tipo_pessoa || "fisica", ["fisica", "juridica"], "Tipo de pessoa");
  const documento = String(dados.documento || "").replace(/\D/g, "");
  if (documento && documento.length !== (tipoPessoa === "fisica" ? 11 : 14)) {
    throw erro(422, "Documento deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ).");
  }
  return {
    nome,
    email: email(dados.email),
    telefone: telefone(dados.telefone),
    tipo_pessoa: tipoPessoa,
    documento: documento || null,
    nome_razao_social: tipoPessoa === "juridica"
      ? texto(dados.nome_razao_social, "Razão social", 2, 160)
      : nome,
    endereco: dados.endereco ? texto(dados.endereco, "Endereço", 1, 300) : null,
  };
}

function dadosFuncionario(dados) {
  return {
    nome: texto(dados.nome, "Nome", 3, 120),
    email: email(dados.email),
    telefone: dados.telefone ? telefone(dados.telefone) : null,
    especialidade: dados.especialidade ? texto(dados.especialidade, "Especialidade", 2, 120) : null,
  };
}

export async function listar(tipo) {
  tipoValido(tipo);
  if (tipo === "cliente") {
    const [linhas] = await pool.execute(
      "SELECT id_cliente AS id,nome,email,telefone,tipo_pessoa,documento,nome_razao_social,endereco,status,criado_em FROM clientes ORDER BY id_cliente DESC LIMIT 200"
    );
    return linhas;
  }
  const [linhas] = await pool.execute(
    "SELECT u.id_usuario AS id,u.nome,u.email,u.telefone,u.especialidade,u.status,u.criado_em, " +
    "(SELECT COUNT(*) FROM ordens_servico os WHERE os.id_usuario=u.id_usuario) AS servicos " +
    "FROM usuarios u WHERE u.perfil='funcionario' ORDER BY u.id_usuario DESC LIMIT 200"
  );
  return linhas;
}

async function buscar(tipo, id) {
  const numero = validarId(id);
  const sql = tipo === "cliente"
    ? "SELECT id_cliente AS id,nome,email,telefone,tipo_pessoa,documento,nome_razao_social,endereco,status,criado_em FROM clientes WHERE id_cliente=?"
    : "SELECT id_usuario AS id,nome,email,telefone,especialidade,status,criado_em FROM usuarios WHERE id_usuario=? AND perfil='funcionario'";
  const [linhas] = await pool.execute(sql, [numero]);
  if (!linhas.length) throw erro(404, "Usuário não encontrado.");
  return linhas[0];
}

export async function criar(tipo, dados = {}) {
  tipoValido(tipo);
  const senha = senhaForte(dados.senha);
  if (tipo === "cliente") {
    const cliente = dadosCliente(dados);
    await AuthService.registrar({ ...cliente, senha });
    const [linhas] = await pool.execute(
      "SELECT id_cliente AS id,nome,email,telefone,tipo_pessoa,documento,nome_razao_social,endereco,status,criado_em FROM clientes WHERE email=?",
      [cliente.email]
    );
    return linhas[0];
  }

  const funcionario = dadosFuncionario(dados);
  const hash = await bcrypt.hash(senha, 10);
  try {
    const [resultado] = await pool.execute(
      "INSERT INTO usuarios(nome,email,telefone,especialidade,senha_hash,perfil,status) VALUES(?,?,?,?,?,'funcionario','ativo')",
      [funcionario.nome, funcionario.email, funcionario.telefone, funcionario.especialidade, hash]
    );
    return buscar(tipo, resultado.insertId);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw erro(409, "E-mail já cadastrado.");
    throw e;
  }
}

export async function atualizar(tipo, id, dados = {}) {
  tipoValido(tipo);
  await buscar(tipo, id);
  try {
    if (tipo === "cliente") {
      const c = dadosCliente(dados);
      await pool.execute(
        "UPDATE clientes SET nome=?,email=?,telefone=?,tipo_pessoa=?,documento=?,nome_razao_social=?,endereco=? WHERE id_cliente=?",
        [c.nome, c.email, c.telefone, c.tipo_pessoa, c.documento, c.nome_razao_social, c.endereco, validarId(id)]
      );
    } else {
      const f = dadosFuncionario(dados);
      await pool.execute(
        "UPDATE usuarios SET nome=?,email=?,telefone=?,especialidade=? WHERE id_usuario=? AND perfil='funcionario'",
        [f.nome, f.email, f.telefone, f.especialidade, validarId(id)]
      );
    }
    return buscar(tipo, id);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw erro(409, "E-mail já cadastrado.");
    throw e;
  }
}

export async function definirStatus(tipo, id, status) {
  tipoValido(tipo);
  const valor = opcao(status, ["ativo", "ausente"], "Status");
  await buscar(tipo, id);
  const tabela = tipo === "cliente" ? "clientes" : "usuarios";
  const coluna = tipo === "cliente" ? "id_cliente" : "id_usuario";
  const filtro = tipo === "cliente" ? "" : " AND perfil='funcionario'";
  await pool.execute(
    "UPDATE " + tabela + " SET status=? WHERE " + coluna + "=?" + filtro,
    [valor, validarId(id)]
  );
  return buscar(tipo, id);
}

export async function redefinirSenha(tipo, id, senha) {
  tipoValido(tipo);
  await buscar(tipo, id);
  const hash = await bcrypt.hash(senhaForte(senha), 10);
  const tabela = tipo === "cliente" ? "clientes" : "usuarios";
  const coluna = tipo === "cliente" ? "id_cliente" : "id_usuario";
  const filtro = tipo === "cliente" ? "" : " AND perfil='funcionario'";
  await pool.execute(
    "UPDATE " + tabela + " SET senha_hash=? WHERE " + coluna + "=?" + filtro,
    [hash, validarId(id)]
  );
  return { sucesso: true };
}
