// Usa a API configurada; não cria administrador nem redefine senhas existentes.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

try { process.loadEnvFile(".env.contas"); } catch (erro) { if (erro.code !== "ENOENT") throw erro; }
const base = process.env.TEST_API_URL?.replace(/\/$/, "");
if (!base || !/^https?:\/\//.test(base) || !process.env.TEST_ADMIN_SENHA) {
  console.error("Configure TEST_API_URL (incluindo /api) e TEST_ADMIN_SENHA. A senha do administrador não será alterada.");
  process.exit(1);
}

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const content = await response.text();
  let payload;
  try { payload = content ? JSON.parse(content) : {}; }
  catch { throw new Error(`A API retornou conteúdo inválido: ${path} (${response.status}).`); }
  return { status: response.status, dados: payload.dados, erro: payload.erro };
}
async function ok(path, options, expected = 200) {
  const result = await request(path, options);
  assert.equal(result.status, expected, `${path}: ${result.status} — ${result.erro || "resposta inesperada"}`);
  return result.dados;
}
const login = (email, senha, tipo) => ok("/auth/login", { method: "POST", body: { email, senha, tipo } });

async function garantirConta(admin, tipo, email, senhaConhecida) {
  const plural = tipo === "cliente" ? "clientes" : "funcionarios";
  const lista = await ok(`/gestao-usuarios/${plural}`, { token: admin.token });
  const existente = lista.find((conta) => conta.email.toLowerCase() === email.toLowerCase());
  let senha = senhaConhecida;
  if (existente) {
    if (!senha) throw new Error(`A conta ${email} já existe. Informe TEST_${tipo.toUpperCase()}_SENHA para validá-la; nenhuma senha foi redefinida.`);
  } else {
    senha ||= `Aa1!${randomBytes(18).toString("base64url")}`;
    await ok(`/gestao-usuarios/${plural}`, {
      token: admin.token, method: "POST",
      body: { nome: `Conta de teste ${tipo}`, email, senha, telefone: "11999998888", especialidade: "Testes de manutenção" },
    }, 201);
    // Mostra somente a senha da conta recém-criada, solicitada para os testes.
    console.log(`Conta criada: ${email}\nSenha de teste: ${senha}`);
  }
  const sessao = await login(email, senha, tipo === "cliente" ? "cliente" : "equipe");
  assert.equal(sessao.usuario.perfil, tipo);
  const usuario = await ok("/auth/me", { token: sessao.token });
  assert.equal(usuario.id, sessao.usuario.id);
  assert.equal(usuario.senha_hash, undefined);
  console.log(`Login e sessão validados: ${tipo} (${email}).`);
  return sessao;
}

async function abrirEventos(token) {
  const controller = new AbortController();
  const limite = setTimeout(() => controller.abort(), 20000);
  let reader;
  const fechar = () => { clearTimeout(limite); controller.abort(); reader?.cancel().catch(() => {}); };
  try {
    const response = await fetch(base + "/suporte/eventos", {
      headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" }, signal: controller.signal,
    });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/event-stream/);
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    return {
      fechar,
      async aguardarConversa(id) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) throw new Error("O canal SSE encerrou antes da atualização esperada.");
          buffer += decoder.decode(value, { stream: true }).replaceAll("\r\n", "\n");
          let indice;
          while ((indice = buffer.indexOf("\n\n")) >= 0) {
            const evento = buffer.slice(0, indice);
            buffer = buffer.slice(indice + 2);
            if (!evento.includes("event: atualizacao")) continue;
            const linha = evento.split("\n").find((parte) => parte.startsWith("data:"));
            if (linha && JSON.parse(linha.slice(5)).conversaId === id) return;
          }
        }
      },
    };
  } catch (erro) { fechar(); throw erro; }
}

async function validarFluxos(admin, funcionario, cliente) {
  const marcador = `VALIDACAO-${Date.now()}`;
  const ordem = await ok("/solicitacoes", {
    method: "POST", token: cliente.token,
    body: { tipo: "notebook", marca: "Teste", modelo: marcador, defeito_relatado: "Equipamento fictício para validação de funcionalidades.", consentimento: true },
  }, 201);
  assert.equal((await request(`/ordens/${ordem.id_os}`, { token: funcionario.token })).status, 404);
  assert.equal((await request(`/ordens/${ordem.id_os}/orcamento`, { token: funcionario.token, method: "POST", body: { pecas: [], valor_mao_obra: 0 } })).status, 404);
  await ok(`/ordens/${ordem.id_os}`, { token: admin.token, method: "PATCH", body: { id_usuario: funcionario.usuario.id } });
  assert.equal((await request(`/ordens/${ordem.id_os}`, { token: funcionario.token, method: "PATCH", body: { id_usuario: admin.usuario.id } })).status, 403);
  await ok(`/ordens/${ordem.id_os}`, { token: funcionario.token, method: "PATCH", body: { status: "em diagnostico", diagnostico: "Diagnóstico fictício para validação da persistência." } });
  const persistida = await ok(`/ordens/${ordem.id_os}`, { token: cliente.token });
  assert.equal(persistida.status, "em diagnostico");
  assert.equal(persistida.id_usuario, funcionario.usuario.id);

  const canalAdmin = await abrirEventos(admin.token);
  let canalCliente;
  try {
    const conversa = await ok("/suporte/conversas", { token: cliente.token, method: "POST", body: { assunto: marcador, mensagem: "Mensagem de teste do cliente." } }, 201);
    await canalAdmin.aguardarConversa(conversa.id);
    canalCliente = await abrirEventos(cliente.token);
    await ok(`/suporte/conversas/${conversa.id}/mensagens`, { token: admin.token, method: "POST", body: { mensagem: "Resposta de teste do administrador." } }, 201);
    await canalCliente.aguardarConversa(conversa.id);
    const mensagens = await ok(`/suporte/conversas/${conversa.id}/mensagens`, { token: cliente.token });
    assert.equal(mensagens[0].remetenteTipo, "cliente");
    assert.equal(mensagens[0].remetenteId, cliente.usuario.id);
    assert.equal(mensagens[1].remetenteTipo, "equipe");
    assert.equal(mensagens[1].remetenteId, admin.usuario.id);
    console.log(`API/OS/chat/SSE validados. Registros de teste mantidos: OS ${ordem.id_os}, conversa ${conversa.id}, marcador ${marcador}.`);
  } finally { canalAdmin.fechar(); canalCliente?.fechar(); }
}

try {
  const admin = await login(process.env.TEST_ADMIN_EMAIL || "adminAuren@gmail.com", process.env.TEST_ADMIN_SENHA, "equipe");
  assert.equal(admin.usuario.perfil, "adm", "A conta informada deve ser o administrador existente.");
  console.log("Login do administrador existente validado. Conta e senha preservadas.");
  const funcionario = await garantirConta(admin, "funcionario", process.env.TEST_FUNCIONARIO_EMAIL || "funcionario.teste@exemplo.test", process.env.TEST_FUNCIONARIO_SENHA);
  const cliente = await garantirConta(admin, "cliente", process.env.TEST_CLIENTE_EMAIL || "cliente.teste@exemplo.test", process.env.TEST_CLIENTE_SENHA);
  for (const sessao of [funcionario, cliente]) {
    assert.equal((await request("/gestao-usuarios/clientes", { token: sessao.token })).status, 403);
  }
  assert.equal((await request("/suporte/conversas", { token: funcionario.token })).status, 403);
  assert.equal((await request("/ordens")).status, 401);
  const ordens = await ok("/ordens", { token: cliente.token });
  assert.ok(ordens.every((ordem) => ordem.id_cliente === cliente.usuario.id));
  console.log("Restrições básicas de acesso validadas pela API.");
  if (process.argv.includes("--fluxos")) await validarFluxos(admin, funcionario, cliente);
  else console.log("Use --fluxos para também criar registros identificados de OS/chat e testar persistência e SSE. Os registros serão mantidos.");
  console.log("Validação de API concluída. Interface, logout no navegador e responsividade ainda precisam de teste visual.");
} catch (erro) {
  console.error(`Validação interrompida: ${erro.message}`);
  process.exitCode = 1;
}
