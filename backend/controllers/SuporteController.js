import * as Suporte from "../models/SuporteModel.js";

const observadores = new Set();
const perfisAtendentes = new Set(["adm", "desenvolvedor"]);
const erro = (status, message) => Object.assign(new Error(message), { status });
const atendente = (usuario) => usuario.tipo === "equipe" && perfisAtendentes.has(usuario.perfil);

function textoValido(valor, campo, maximo, minimo = 1) {
  if (typeof valor !== "string" || valor.trim().length < minimo || valor.trim().length > maximo)
    throw erro(422, `${campo} deve ter de ${minimo} a ${maximo} caracteres.`);
  return valor.trim();
}
function idValido(valor) {
  const id = Number(valor);
  if (!Number.isSafeInteger(id) || id <= 0) throw erro(422, "Conversa inválida.");
  return id;
}
async function acessivel(req) {
  if (req.usuario.tipo === "equipe" && !atendente(req.usuario))
    throw erro(403, "Seu perfil não pode acessar o suporte.");
  const conversa = await Suporte.buscar(idValido(req.params.id));
  if (!conversa) throw erro(404, "Conversa não encontrada.");
  if (!atendente(req.usuario) && conversa.clienteId !== req.usuario.id)
    throw erro(403, "Você não tem acesso a esta conversa.");
  return conversa;
}
function emitir(conversa) {
  const dados = `event: atualizacao\ndata: ${JSON.stringify({ conversaId: conversa.id })}\n\n`;
  for (const ouvinte of observadores) {
    if (ouvinte.usuario.tipo === "cliente" && ouvinte.usuario.id !== conversa.clienteId) continue;
    try { ouvinte.res.write(dados); } catch { observadores.delete(ouvinte); }
  }
}

export async function listar(req, res, next) {
  try {
    if (req.usuario.tipo === "equipe" && !atendente(req.usuario))
      throw erro(403, "Seu perfil não pode acessar o suporte.");
    res.json({ sucesso: true, dados: await Suporte.listar(req.usuario) });
  } catch (e) { next(e); }
}
export async function criar(req, res, next) {
  try {
    if (req.usuario.tipo !== "cliente") throw erro(403, "Somente clientes podem iniciar conversas.");
    const assunto = textoValido(req.body?.assunto, "Assunto", 120, 4);
    const categoria = textoValido(req.body?.categoria || "Suporte geral", "Categoria", 60);
    const mensagem = textoValido(req.body?.mensagem, "Mensagem", 2000, 2);
    const conversa = await Suporte.criar(req.usuario, assunto, categoria, mensagem);
    emitir(conversa);
    res.status(201).json({ sucesso: true, dados: conversa });
  } catch (e) { next(e); }
}
export async function listarMensagens(req, res, next) {
  try {
    const conversa = await acessivel(req);
    res.json({ sucesso: true, dados: await Suporte.mensagens(conversa.id) });
  } catch (e) { next(e); }
}
export async function enviar(req, res, next) {
  try {
    const conversa = await acessivel(req);
    const mensagem = textoValido(req.body?.mensagem, "Mensagem", 2000);
    const resultado = await Suporte.enviar(conversa, req.usuario, mensagem);
    emitir(conversa);
    res.status(201).json({ sucesso: true, dados: resultado });
  } catch (e) { next(e); }
}
export async function status(req, res, next) {
  try {
    if (!atendente(req.usuario)) throw erro(403, "Somente administradores podem alterar o status.");
    const conversa = await acessivel(req);
    const novoStatus = req.body?.status;
    if (!["aberto", "em_atendimento", "resolvido"].includes(novoStatus))
      throw erro(422, "Status de atendimento inválido.");
    const atualizada = await Suporte.atualizarStatus(conversa.id, novoStatus, req.usuario.id);
    emitir(atualizada);
    res.json({ sucesso: true, dados: atualizada });
  } catch (e) { next(e); }
}
export function eventos(req, res) {
  if (req.usuario.tipo === "equipe" && !atendente(req.usuario))
    return res.status(403).json({ sucesso: false, erro: "Seu perfil não pode acessar o suporte." });
  res.status(200).set({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write('event: conectado\ndata: {}\n\n');
  const ouvinte = { usuario: { id: req.usuario.id, tipo: req.usuario.tipo }, res };
  observadores.add(ouvinte);
  // Força nova autenticação periodicamente (inclusive após expiração do JWT).
  const limiteSessao = setTimeout(() => res.end(), 10 * 60 * 1000);
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { limpar(); }
  }, 20000);
  function limpar() {
    clearInterval(heartbeat);
    clearTimeout(limiteSessao);
    observadores.delete(ouvinte);
  }
  res.on("close", limpar);
}
