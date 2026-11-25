// Executa regras reais com banco simulado. Não é teste E2E/MySQL.
import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { validarSenha } from "../utils/senha.js";
import { id } from "../utils/validacao.js";
import { exigirAcessoOrdem } from "../utils/permissoes.js";
import { carregarAmbiente } from "../config/ambiente.js";
import { mensagemPropria } from "../../frontend/src/lib/auren/chat.mjs";
import { formatarData } from "../../frontend/src/lib/auren/datas.mjs";

const admin = { id: 1, tipo: "equipe", perfil: "adm" };
const funcionario = { id: 2, tipo: "equipe", perfil: "funcionario" };
const cliente = { id: 1, tipo: "cliente", perfil: "cliente" };
let ordem = { id_os: 10, id_usuario: 3, status: "em diagnostico", diagnostico: "Diagnóstico de teste", prazo: null };
const queries = [];
const pool = {
  async query(sql, params) {
    queries.push({ sql, params });
    if (sql.startsWith("SELECT * FROM ordens_servico")) return [[{ ...ordem }]];
    if (sql.startsWith("SELECT o.*")) return [[{ ...ordem, id_cliente: 1 }]];
    return [[]];
  },
};
mock.module(new URL("../config/database.js", import.meta.url).href, {
  namedExports: { pool, transacao: async (operation) => operation(pool) },
});
const Model = await import("../models/OrdemModel.js");
const Service = await import("../services/OrdemService.js");
const Cadastro = await import("../models/CadastroModel.js");

test("chat diferencia cliente e equipe mesmo com o mesmo ID", () => {
  const mensagem = { remetenteTipo: "cliente", remetenteId: 1 };
  assert.equal(mensagemPropria(mensagem, cliente), true);
  assert.equal(mensagemPropria(mensagem, admin), false);
});
test("chat diferencia dois administradores e dois clientes", () => {
  assert.equal(mensagemPropria({ remetenteTipo: "equipe", remetenteId: 99 }, admin), false);
  assert.equal(mensagemPropria({ remetenteTipo: "cliente", remetenteId: 99 }, cliente), false);
  assert.equal(mensagemPropria({ remetenteTipo: "equipe", remetenteId: "1" }, admin), true);
});
test("mensagem sem remetente não assume autoria", () => {
  assert.equal(mensagemPropria({ remetenteTipo: "equipe" }, admin), false);
  assert.equal(mensagemPropria({ remetenteId: 1 }, admin), false);
});
test("senha mantém espaços e rejeita truncamento UTF-8 do bcrypt", () => {
  const senha = " Aa12345! ";
  assert.equal(validarSenha(senha), senha);
  assert.equal(validarSenha(senha, { forte: false }), senha);
  assert.throws(() => validarSenha("Aa1!" + "é".repeat(35)), { status: 422 });
  assert.equal(validarSenha("Aa1!" + "a".repeat(68)).length, 72);
});
test("IDs inválidos não são convertidos em IDs de registros", () => {
  for (const value of [true, [1], {}, null, "", 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => id(value), { status: 422 });
  assert.equal(id("12"), 12);
});
test("cliente somente acessa a própria ordem", () => {
  assert.doesNotThrow(() => exigirAcessoOrdem({ id_cliente: 1 }, cliente));
  assert.throws(() => exigirAcessoOrdem({ id_cliente: 2 }, cliente), { status: 404 });
});
test("funcionário e perfis legados precisam de atribuição", () => {
  for (const perfil of ["funcionario", "suporte", "supervisor"]) {
    assert.throws(() => exigirAcessoOrdem({ id_usuario: 3 }, { ...funcionario, perfil }), { status: 404 });
    assert.doesNotThrow(() => exigirAcessoOrdem({ id_usuario: 2 }, { ...funcionario, perfil }));
  }
});
test("administrador e desenvolvedor acessam ordens da equipe", () => {
  assert.doesNotThrow(() => exigirAcessoOrdem(ordem, admin));
  assert.doesNotThrow(() => exigirAcessoOrdem(ordem, { ...admin, perfil: "desenvolvedor" }));
});
test("orçamento alheio é bloqueado após leitura com trava e antes de alterar estoque", async () => {
  queries.length = 0;
  await assert.rejects(Service.orcar(10, { pecas: [], valor_mao_obra: 0 }, funcionario), { status: 404 });
  assert.equal(queries.length, 1);
  assert.match(queries[0].sql, /FOR UPDATE/);
});
test("atualização de OS alheia é bloqueada antes de gravar", async () => {
  queries.length = 0;
  await assert.rejects(Model.atualizar(10, { diagnostico: "Outro diagnóstico" }, funcionario), { status: 404 });
  assert.equal(queries.length, 1);
});
test("funcionário não pode atribuir ou remover responsável", async () => {
  queries.length = 0;
  for (const tecnico of [null, 1])
    await assert.rejects(Service.atualizar(10, { id_usuario: tecnico }, funcionario), { status: 403 });
  assert.equal(queries.length, 0);
});
test("administrador remove atribuição com null sem atribuir a si mesmo", async () => {
  queries.length = 0;
  await Service.atualizar(10, { id_usuario: null }, admin);
  const update = queries.find(({ sql }) => sql.startsWith("UPDATE ordens_servico SET"));
  assert.equal(update.params[4], null);
});
test("listagem do funcionário filtra por responsável", async () => {
  queries.length = 0;
  await Model.listar(funcionario);
  assert.match(queries[0].sql, /WHERE o.id_usuario=\?/);
  assert.deepEqual(queries[0].params, [2]);
});
test("clientes e equipamentos da equipe restrita são filtrados por OS", async () => {
  queries.length = 0;
  await Cadastro.listar("clientes", funcionario);
  await Cadastro.listar("equipamentos", funcionario);
  for (const query of queries) {
    assert.match(query.sql, /WHERE EXISTS/);
    assert.deepEqual(query.params, [2]);
  }
});
test("configuração rejeita porta inválida do MySQL", () => {
  const keys = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME", "JWT_SECRET", "PORT"];
  const old = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    Object.assign(process.env, { DB_HOST: "localhost", DB_PORT: "65536", DB_USER: "teste", DB_NAME: "teste", JWT_SECRET: "x".repeat(32), PORT: "3001" });
    assert.throws(() => carregarAmbiente(".env.inexistente-para-teste"), /DB_PORT/);
    process.env.DB_PORT = "3306";
    assert.equal(carregarAmbiente(".env.inexistente-para-teste").porta, 3001);
  } finally {
    for (const key of keys) if (old[key] === undefined) delete process.env[key]; else process.env[key] = old[key];
  }
});

test("prazo não retrocede um dia no fuso brasileiro", () => {
  const anterior = process.env.TZ;
  try {
    process.env.TZ = "America/Sao_Paulo";
    assert.equal(formatarData("2026-11-25"), "25/11/2026");
    assert.equal(formatarData("2026-11-25 14:30:00"), "25/11/2026");
    assert.equal(formatarData(null), "A definir");
  } finally {
    if (anterior === undefined) delete process.env.TZ; else process.env.TZ = anterior;
  }
});
