import { test, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";

const admin = { id: 1, tipo: "equipe", perfil: "adm" };
const tecnico = { id: 2, tipo: "equipe", perfil: "funcionario" };
let ordem, relatorio, queries;
const pool = { async query(sql, params = []) {
  queries.push({ sql, params });
  if (sql.startsWith("SELECT id_os")) return [[ordem].filter(Boolean)];
  if (sql.startsWith("SELECT r.*")) return [[relatorio].filter(Boolean)];
  if (sql.startsWith("INSERT")) return [{ insertId: 15 }];
  if (sql.startsWith("UPDATE")) {
    Object.assign(relatorio, { diagnostico: params[0], descricao_reparo: params[1], observacoes: params[2] });
    return [{ affectedRows: 0 }];
  }
  throw new Error("Consulta inesperada: " + sql);
} };
mock.module(new URL("../config/database.js", import.meta.url).href, {
  namedExports: { pool, transacao: async (operacao) => operacao(pool) },
});
const Service = await import("../services/RelatorioService.js");
const Controller = await import("../controllers/RelatorioController.js");
const dados = { id_os: 10, diagnostico: "Fonte defeituosa", descricao_reparo: "Fonte substituída", observacoes: "" };
beforeEach(() => {
  queries = [];
  ordem = { id_os: 10, id_usuario: 2 };
  relatorio = { ...dados, id_relatorio: 15, id_usuario: 2, responsavel_os: 2, observacoes: null };
});

test("criação usa o autor autenticado e trava a OS antes de gravar", async () => {
  const salvo = await Service.criarRelatorio({ ...dados, id_usuario: 999 }, tecnico);
  assert.equal(salvo.id_relatorio, 15);
  assert.equal(salvo.id_usuario, 2);
  assert.match(queries[0].sql, /FOR UPDATE/);
  assert.deepEqual(queries[1].params, [10, 2, dados.diagnostico, dados.descricao_reparo, null]);
});
test("OS inexistente impede inserção", async () => {
  ordem = null;
  await assert.rejects(Service.criarRelatorio(dados, tecnico), { status: 404 });
  assert.equal(queries.length, 1);
});
test("funcionário não cria relatório em OS alheia", async () => {
  ordem.id_usuario = 7;
  await assert.rejects(Service.criarRelatorio(dados, tecnico), { status: 404 });
  assert.equal(queries.length, 1);
});
test("administrador pode registrar relatório em qualquer OS existente", async () => {
  const salvo = await Service.criarRelatorio(dados, admin);
  assert.equal(salvo.id_usuario, 1);
});
test("relatórios rejeitam dados inválidos antes de consultar o banco", async () => {
  for (const entrada of [null, [], {}, { ...dados, id_os: true }, { ...dados, diagnostico: " " }, { ...dados, observacoes: {} }, { ...dados, descricao_reparo: "a".repeat(10001) }])
    await assert.rejects(Service.criarRelatorio(entrada, tecnico), { status: 422 });
  assert.equal(queries.length, 0);
});
test("cliente não pode listar, consultar, criar nem editar relatórios internos", async () => {
  const cliente = { id: 2, tipo: "cliente", perfil: "cliente" };
  for (const operacao of [() => Service.listar(cliente), () => Service.buscar(15, cliente), () => Service.criarRelatorio(dados, cliente), () => Service.editarRelatorio(15, dados, cliente)])
    await assert.rejects(operacao, { status: 403 });
  assert.equal(queries.length, 0);
});
test("listagem restrita exige autoria e atribuição atual, inclusive perfis legados", async () => {
  for (const perfil of ["funcionario", "supervisor", "suporte"]) {
    await Service.listar({ ...tecnico, perfil });
    assert.match(queries.at(-1).sql, /WHERE r.id_usuario = \? AND o.id_usuario = \?/);
    assert.deepEqual(queries.at(-1).params, [2, 2]);
  }
});
test("edição parcial preserva campos omitidos e aceita valores inalterados", async () => {
  const salvo = await Service.editarRelatorio("15", { diagnostico: dados.diagnostico }, tecnico);
  assert.equal(salvo.descricao_reparo, dados.descricao_reparo);
  assert.equal(salvo.observacoes, null);
  assert.match(queries[0].sql, /FOR UPDATE/);
});
test("trocar autor ou OS via PATCH é rejeitado", async () => {
  for (const campo of ["id_os", "id_usuario"])
    await assert.rejects(Service.editarRelatorio(15, { diagnostico: "Teste", [campo]: 7 }, admin), { status: 422 });
  assert.equal(queries.length, 0);
});
test("edição impede alteração de relatório de outro autor", async () => {
  relatorio.id_usuario = 7;
  await assert.rejects(Service.editarRelatorio(15, { diagnostico: "Teste" }, tecnico), { status: 404 });
  assert.equal(queries.length, 1);
});
test("relatório deixa de ser acessível ao técnico após reatribuição da OS", async () => {
  relatorio.responsavel_os = 7;
  await assert.rejects(Service.buscar(15, tecnico), { status: 404 });
  await assert.rejects(Service.editarRelatorio(15, { diagnostico: "Teste" }, tecnico), { status: 404 });
  assert.equal(queries.some(q => q.sql.startsWith("UPDATE")), false);
});
test("administrador edita relatório de outro autor sem mudar autoria", async () => {
  const salvo = await Service.editarRelatorio(15, { observacoes: "Revisado" }, admin);
  assert.equal(salvo.id_usuario, 2);
  assert.equal(salvo.observacoes, "Revisado");
});
test("controller de edição chama o serviço e responde no formato da API", async () => {
  let resposta;
  await Controller.editarRelatorio({ params: { id: "15" }, body: { diagnostico: "Conferido" }, usuario: tecnico },
    { json(valor) { resposta = valor; } }, (e) => { throw e; });
  assert.equal(resposta.sucesso, true);
  assert.equal(resposta.dados.diagnostico, "Conferido");
});
test("relatório inexistente ou PATCH vazio não é tratado como sucesso", async () => {
  await assert.rejects(Service.editarRelatorio(15, {}, tecnico), { status: 422 });
  relatorio = null;
  await assert.rejects(Service.editarRelatorio(15, { diagnostico: "Teste" }, tecnico), { status: 404 });
});
