// Requer um banco exclusivo terminado em _test. Nunca aponta para dados de uso real.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
process.loadEnvFile(".env.test");
const dbName = process.env.DB_NAME;
assert.match(
  dbName,
  /^[a-zA-Z0-9_]+_test$/,
  "Use um DB_NAME exclusivo terminado em _test.",
);
const conexao = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS || "",
  multipleStatements: true,
});
await conexao.query(
  (await readFile("../database/techassistpro.sql", "utf8")).replaceAll(
    "techassistpro",
    dbName,
  ),
);
await conexao.end();
const { app } = await import("../app.js");
const { pool } = await import("../config/database.js");
const servidor = app.listen(0, "127.0.0.1");
await new Promise((resolve) => servidor.once("listening", resolve));
const base = `http://127.0.0.1:${servidor.address().port}/api`;
const suffix = randomUUID().slice(0, 8),
  senha = "Aa9!" + randomUUID();
const [inseridaA] = await pool.query("INSERT INTO pecas(nome,quantidade,valor) VALUES(?,8,249.90)",['SSD do teste '+suffix]);
const [inseridaB] = await pool.query("INSERT INTO pecas(nome,quantidade,valor) VALUES(?,5,129.90)",['Memória do teste '+suffix]);
const pecaA=inseridaA.insertId,pecaB=inseridaB.insertId;
let tokenCliente, tokenOutro, tokenAdmin, tokenDesenvolvedor, ordem, ordemRecusa;
async function request(
  path,
  { method = "GET", body, token, headers = {} } = {},
) {
  const r = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  return {
    status: r.status,
    body: text ? JSON.parse(text) : null,
    headers: r.headers,
  };
}
const eq = {
  tipo: "notebook",
  marca: "Dell",
  modelo: "Inspiron teste",
  numero_serie: "TESTE-" + suffix,
  servico: "Diagnóstico e reparo",
  defeito_relatado: "O notebook não inicia corretamente desde ontem.",
  consentimento: true,
};
await test("TechAssist Pro: HTTP + Express + JWT + MySQL", async (t) => {
  t.after(async () => {
    await new Promise((resolve) => servidor.close(resolve));
    await pool.end();
  });
  await t.test(
    "banco importado, health check e cabeçalhos seguros",
    async () => {
      const r = await request("/check");
      assert.equal(r.status, 200);
      assert.equal(r.body.dados.banco, "ok");
      assert.equal(r.headers.get("x-powered-by"), null);
      assert.ok(r.headers.get("x-content-type-options"));
    },
  );
  await t.test("contato validado e persistido no MySQL", async () => {
    const r = await request("/contatos", {
      method: "POST",
      body: {
        nome: "Contato Teste",
        email: `contato-${suffix}@exemplo.test`,
        telefone: "11999998888",
        assunto: "Teste de atendimento",
        mensagem: "Preciso de ajuda com meu equipamento de teste.",
        consentimento: true,
      },
    });
    assert.equal(r.status, 201);
    const [[linha]] = await pool.query(
      "SELECT mensagem FROM contatos WHERE id_contato=?",
      [r.body.dados.id_contato],
    );
    assert.match(linha.mensagem, /equipamento de teste/);
    assert.equal(
      (await request("/contatos", { method: "POST", body: { nome: "A" } }))
        .status,
      422,
    );
  });
  await t.test(
    "cadastro de cliente, bcrypt, duplicidade e login JWT",
    async () => {
      for (const [nome, key] of [
        ["Cliente Teste", "a"],
        ["Outro Cliente", "b"],
      ]) {
        const email = `${key}-${suffix}@exemplo.test`;
        const r = await request("/auth/registrar", {
          method: "POST",
          body: {
            nome,
            email,
            telefone: "11999998888",
            senha,
            perfil: "adm",
            tipo: "equipe",
          },
        });
        assert.equal(r.status, 201);
        assert.equal(r.body.dados.tipo, "cliente");
        assert.equal(r.body.dados.senha_hash, undefined);
        const [[db]] = await pool.query(
          "SELECT senha_hash FROM clientes WHERE email=?",
          [email],
        );
        assert.notEqual(db.senha_hash, senha);
        assert.ok(await bcrypt.compare(senha, db.senha_hash));
        const login = await request("/auth/login", {
          method: "POST",
          body: { email, senha, tipo: "cliente" },
        });
        assert.equal(login.status, 200);
        if (key === "a") tokenCliente = login.body.dados.token;
        else tokenOutro = login.body.dados.token;
      }
      assert.equal(
        (
          await request("/auth/registrar", {
            method: "POST",
            body: {
              nome: "Cliente Teste",
              email: `a-${suffix}@exemplo.test`,
              telefone: "11999998888",
              senha,
            },
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/auth/login", {
            method: "POST",
            body: { email: `a-${suffix}@exemplo.test`, senha: "errada" },
          })
        ).status,
        401,
      );
    },
  );
  await t.test(
    "RBAC: token ausente, cliente bloqueado na gestão e conta de equipe",
    async () => {
      assert.equal((await request("/clientes")).status, 401);
      assert.equal(
        (await request("/clientes", { token: tokenCliente })).status,
        403,
      );
      assert.equal(
        (await request("/clientes", { token: "invalido" })).status,
        401,
      );
      const hash = await bcrypt.hash(senha, 10);
      await pool.query(
        "INSERT INTO usuarios(nome,email,senha_hash,perfil) VALUES(?,?,?,'adm')",
        ["Admin Teste", `adm-${suffix}@exemplo.test`, hash],
      );
      const r = await request("/auth/login", {
        method: "POST",
        body: { email: `adm-${suffix}@exemplo.test`, senha, tipo: "equipe" },
      });
      assert.equal(r.status, 200);
      tokenAdmin = r.body.dados.token;
      const lista = await request("/clientes", { token: tokenAdmin });
      assert.equal(lista.status, 200);
      assert.ok(lista.body.dados.every((c) => !("senha_hash" in c)));

      await pool.query(
        "INSERT INTO usuarios(nome,email,senha_hash,perfil) VALUES(?,?,?,'desenvolvedor')",
        ["Desenvolvedor Teste", `dev-${suffix}@exemplo.test`, hash],
      );
      const loginDev = await request("/auth/login", {
        method: "POST",
        body: { email: `dev-${suffix}@exemplo.test`, senha, tipo: "equipe" },
      });
      assert.equal(loginDev.status, 200);
      assert.equal(loginDev.body.dados.usuario.perfil, "desenvolvedor");
      tokenDesenvolvedor = loginDev.body.dados.token;
      assert.equal((await request("/clientes", { token: tokenDesenvolvedor })).status, 200);

      const [clienteTemporario] = await pool.query(
        "INSERT INTO clientes(nome,email,telefone) VALUES(?,?,?)",
        ["Registro de autorização", `delete-${suffix}@exemplo.test`, "11999998888"],
      );
      assert.equal(
        (await request(`/clientes/${clienteTemporario.insertId}`, {
          method: "DELETE",
          token: tokenDesenvolvedor,
        })).status,
        204,
      );
    },
  );
  await t.test("chat de suporte: persistência, isolamento e permissões", async () => {
    assert.equal((await request("/suporte/conversas")).status, 401);
    assert.equal((await request("/suporte/conversas", { token: "invalido" })).status, 401);
    const criada = await request("/suporte/conversas", {
      method: "POST", token: tokenCliente,
      body: { assunto: "Problema com reparo", categoria: "Ordem de serviço", mensagem: "Olá, preciso de uma atualização do reparo." },
    });
    assert.equal(criada.status, 201);
    const conversaId = criada.body.dados.id;
    assert.ok(conversaId > 0);
    assert.equal((await request("/suporte/conversas", { token: tokenCliente })).body.dados[0].id, conversaId);
    assert.ok(!(await request("/suporte/conversas", { token: tokenOutro })).body.dados.some((c) => c.id === conversaId));
    assert.equal((await request(`/suporte/conversas/${conversaId}/mensagens`, { token: tokenOutro })).status, 403);
    assert.equal((await request(`/suporte/conversas/${conversaId}/mensagens`, { token: tokenAdmin })).status, 200);
    assert.equal((await request("/suporte/conversas", { method: "POST", token: tokenAdmin,
      body: { assunto: "Invasão", mensagem: "Não deveria criar" } })).status, 403);
    const resposta = await request(`/suporte/conversas/${conversaId}/mensagens`, {
      method: "POST", token: tokenAdmin, body: { mensagem: "Olá, já estamos verificando!" },
    });
    assert.equal(resposta.status, 201);
    assert.equal(resposta.body.dados.remetenteTipo, "equipe");
    const retorno = await request(`/suporte/conversas/${conversaId}/mensagens`, { token: tokenCliente });
    assert.equal(retorno.status, 200);
    assert.equal(retorno.body.dados.length, 2);
    assert.equal(retorno.body.dados[1].texto, "Olá, já estamos verificando!");
    const fechar = await request(`/suporte/conversas/${conversaId}/status`, {
      method: "PATCH", token: tokenAdmin, body: { status: "resolvido" },
    });
    assert.equal(fechar.status, 200);
    assert.equal(fechar.body.dados.status, "resolvido");
    assert.equal((await request(`/suporte/conversas/${conversaId}/status`, {
      method: "PATCH", token: tokenCliente, body: { status: "resolvido" },
    })).status, 403);
    const reabrir = await request(`/suporte/conversas/${conversaId}/mensagens`, {
      method: "POST", token: tokenCliente, body: { mensagem: "Tenho outra dúvida." },
    });
    assert.equal(reabrir.status, 201);
    const detalhes = (await request("/suporte/conversas", { token: tokenAdmin })).body.dados;
    assert.equal(detalhes.find((c) => c.id === conversaId).status, "aberto");
    assert.equal((await request(`/suporte/conversas/${conversaId}/mensagens`, {
      method: "POST", token: tokenCliente, body: { mensagem: "" },
    })).status, 422);
  });
  await t.test(
    "abertura transacional de equipamento + ordem + histórico",
    async () => {
      const r = await request("/solicitacoes", {
        method: "POST",
        token: tokenCliente,
        body: eq,
      });
      assert.equal(r.status, 201);
      assert.match(r.body.dados.codigo_rastreio, /^TAP-\d{4}-[A-F0-9]{24}$/);
      ordem = r.body.dados;
      const d = await request("/ordens/" + ordem.id_os, {
        token: tokenCliente,
      });
      assert.equal(d.body.dados.historico.length, 1);
      assert.equal(d.body.dados.marca, "Dell");
      const own = await request("/ordens", { token: tokenCliente });
      assert.ok(
        own.body.dados.every((o) => o.email === `a-${suffix}@exemplo.test`),
      );
    },
  );
  await t.test(
    "isolamento entre clientes e consulta pública limitada à ordem",
    async () => {
      assert.equal(
        (await request("/ordens/" + ordem.id_os, { token: tokenOutro })).status,
        404,
      );
      assert.equal(
        (
          await request("/ordens/" + ordem.id_os + "/decisao", {
            method: "POST",
            token: tokenOutro,
            body: { decisao: "aprovado" },
          })
        ).status,
        404,
      );
      const r = await request("/rastreio", {
        method: "POST",
        body: {
          codigo: ordem.codigo_rastreio,
          email: `a-${suffix}@exemplo.test`,
        },
      });
      assert.equal(r.status, 200);
      assert.equal(r.body.dados.email, undefined);
      assert.equal(r.body.dados.telefone, undefined);
      assert.equal(r.body.dados.cliente, undefined);
      assert.equal(
        (
          await request("/rastreio", {
            method: "POST",
            body: {
              codigo: ordem.codigo_rastreio,
              email: `b-${suffix}@exemplo.test`,
            },
          })
        ).status,
        404,
      );
    },
  );
  await t.test(
    "diagnóstico, orçamento calculado no servidor e reserva de estoque",
    async () => {
      assert.equal(
        (
          await request("/ordens/" + ordem.id_os, {
            method: "PATCH",
            token: tokenAdmin,
            body: { status: "em reparo" },
          })
        ).status,
        409,
      );
      const r = await request("/ordens/" + ordem.id_os, {
        method: "PATCH",
        token: tokenAdmin,
        body: {
          status: "em diagnostico",
          diagnostico: "Falha na unidade de armazenamento. Substituir o SSD.",
        },
      });
      assert.equal(r.status, 200);
      const [[before]] = await pool.query(
        "SELECT quantidade FROM pecas WHERE id_peca=?", [pecaA],
      );
      const orc = await request("/ordens/" + ordem.id_os + "/orcamento", {
        method: "POST",
        token: tokenAdmin,
        body: {
          pecas: [{ id_peca: pecaA, quantidade: 2 }],
          valor_mao_obra: 100,
          valor_total: 0,
        },
      });
      assert.equal(orc.status, 201);
      assert.equal(Number(orc.body.dados.orcamento.valor_total), 599.8);
      const [[after]] = await pool.query(
        "SELECT quantidade FROM pecas WHERE id_peca=?", [pecaA],
      );
      assert.equal(after.quantidade, before.quantidade - 2);
      assert.equal((await request('/pecas/'+pecaA,{method:'PUT',token:tokenAdmin,body:{nome:'Peça com reserva',quantidade:99,valor:1}})).status,409);
      assert.equal((await request('/ordens/'+ordem.id_os+'/orcamento',{method:'POST',token:tokenAdmin,body:{pecas:[{id_peca:pecaA,quantidade:9999}],valor_mao_obra:0}})).status,409);
      const [[estoqueAposRollback]]=await pool.query('SELECT quantidade FROM pecas WHERE id_peca=?',[pecaA]);
      assert.equal(estoqueAposRollback.quantidade,after.quantidade);
      const [[orcAposRollback]]=await pool.query('SELECT valor_total FROM orcamentos WHERE id_os=?',[ordem.id_os]);
      assert.equal(Number(orcAposRollback.valor_total),599.8);
      assert.equal((await request('/ordens/'+ordem.id_os,{method:'PATCH',token:tokenAdmin,body:{prazo:'2026-99-99'}})).status,422);
    },
  );
  await t.test(
    "aprovação concorrente executada uma única vez e bloqueio de edição do orçamento",
    async () => {
      const resultados = await Promise.all(
        [1, 2].map(() =>
          request("/ordens/" + ordem.id_os + "/decisao", {
            method: "POST",
            token: tokenCliente,
            body: { decisao: "aprovado" },
          }),
        ),
      );
      assert.deepEqual(resultados.map((r) => r.status).sort(), [200, 409]);
      const r = await request("/ordens/" + ordem.id_os, {
        token: tokenCliente,
      });
      assert.equal(r.body.dados.status, "em reparo");
      assert.ok(r.body.dados.pecas.every((p) => p.status === "utilizada"));
      assert.equal(
        (
          await request("/ordens/" + ordem.id_os + "/orcamento", {
            method: "POST",
            token: tokenAdmin,
            body: { pecas: [], valor_mao_obra: 0 },
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    "testes, reparo executado, conclusão e entrega preservam histórico",
    async () => {
      assert.equal(
        (
          await request("/ordens/" + ordem.id_os, {
            method: "PATCH",
            token: tokenAdmin,
            body: { status: "em teste" },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request("/ordens/" + ordem.id_os, {
            method: "PATCH",
            token: tokenAdmin,
            body: { status: "pronto para retirada" },
          })
        ).status,
        422,
      );
      assert.equal(
        (
          await request("/ordens/" + ordem.id_os, {
            method: "PATCH",
            token: tokenAdmin,
            body: {
              status: "pronto para retirada",
              reparo_executado:
                "SSD substituído e testes de inicialização concluídos.",
            },
          })
        ).status,
        200,
      );
      const r = await request("/ordens/" + ordem.id_os, {
        method: "PATCH",
        token: tokenAdmin,
        body: { status: "entregue" },
      });
      assert.equal(r.status, 200);
      assert.ok(r.body.dados.data_entrega);
      assert.ok(r.body.dados.historico.length >= 7);
      assert.equal(
        (
          await request("/ordens/" + ordem.id_os, {
            method: "PATCH",
            token: tokenAdmin,
            body: { status: "recebido" },
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    "orçamento recusado devolve estoque e permite entrega sem reparo",
    async () => {
      const r = await request("/solicitacoes", {
        method: "POST",
        token: tokenCliente,
        body: eq,
      });
      ordemRecusa = r.body.dados;
      await request("/ordens/" + ordemRecusa.id_os, {
        method: "PATCH",
        token: tokenAdmin,
        body: {
          status: "em diagnostico",
          diagnostico: "Necessária troca do módulo de memória para concluir.",
        },
      });
      const [[before]] = await pool.query(
        "SELECT quantidade FROM pecas WHERE id_peca=?", [pecaB],
      );
      assert.equal(
        (
          await request("/ordens/" + ordemRecusa.id_os + "/orcamento", {
            method: "POST",
            token: tokenAdmin,
            body: {
              pecas: [{ id_peca: pecaB, quantidade: 1 }],
              valor_mao_obra: 50,
            },
          })
        ).status,
        201,
      );
      const recusa = await request("/rastreio/decisao", {
        method: "POST",
        body: {
          codigo: ordemRecusa.codigo_rastreio,
          email: `a-${suffix}@exemplo.test`,
          decisao: "recusado",
        },
      });
      assert.equal(recusa.status, 200);
      assert.equal(recusa.body.dados.orcamento.status, "recusado");
      const [[after]] = await pool.query(
        "SELECT quantidade FROM pecas WHERE id_peca=?", [pecaB],
      );
      assert.equal(after.quantidade, before.quantidade);
      assert.equal(
        (
          await request("/ordens/" + ordemRecusa.id_os, {
            method: "PATCH",
            token: tokenAdmin,
            body: { status: "em reparo" },
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/ordens/" + ordemRecusa.id_os, {
            method: "PATCH",
            token: tokenAdmin,
            body: { status: "pronto para retirada" },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request("/ordens/" + ordemRecusa.id_os, {
            method: "PATCH",
            token: tokenAdmin,
            body: { status: "entregue" },
          })
        ).status,
        200,
      );
    },
  );
  await t.test(
    "CRUD de peças com administrador e bloqueio por vínculo",
    async () => {
      const p = {
        nome: "Peça Teste " + suffix,
        descricao: "Peça sem vínculos para testar CRUD.",
        quantidade: 3,
        valor: 12.45,
        status: "disponivel",
      };
      const r = await request("/pecas", {
        method: "POST",
        token: tokenAdmin,
        body: p,
      });
      assert.equal(r.status, 201);
      const id = r.body.dados.id_peca;
      assert.equal(
        (
          await request("/pecas/" + id, {
            method: "PUT",
            token: tokenAdmin,
            body: { ...p, valor: 20 },
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await request("/pecas/" + id, {
            method: "DELETE",
            token: tokenCliente,
          })
        ).status,
        403,
      );
      assert.equal(
        (await request("/pecas/" + id, { method: "DELETE", token: tokenAdmin }))
          .status,
        204,
      );
      assert.equal(
        (await request("/pecas/"+pecaA, { method: "DELETE", token: tokenAdmin }))
          .status,
        409,
      );
    },
  );
  await t.test(
    "CORS permite preflight da origem configurada e bloqueia outra origem",
    async () => {
      const r = await request("/pecas", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:3000",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Authorization,Content-Type",
        },
      });
      assert.equal(r.status, 204);
      assert.equal(
        r.headers.get("access-control-allow-origin"),
        "http://localhost:3000",
      );
      assert.equal(
        (
          await request("/check", {
            headers: { Origin: "https://nao-permitido.test" },
          })
        ).status,
        403,
      );
    },
  );
});
