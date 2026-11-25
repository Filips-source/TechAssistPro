import * as Model from "../models/RelatorioModel.js";
import { erro, id, texto } from "../utils/validacao.js";

function exigirEquipe(usuario) {
  if (usuario?.tipo !== "equipe" || !["adm", "desenvolvedor", "funcionario", "supervisor", "suporte"].includes(usuario.perfil))
    throw erro(403, "Somente a equipe pode acessar relatórios técnicos.");
}

function validarDados(dados, parcial = false) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados))
    throw erro(422, "Dados do relatório inválidos.");
  const novo = {};
  for (const [campo, rotulo] of [["diagnostico", "Diagnóstico"], ["descricao_reparo", "Descrição do reparo"]])
    if (!parcial || Object.hasOwn(dados, campo)) novo[campo] = texto(dados[campo], rotulo, 1, 10000);
  if (!parcial || Object.hasOwn(dados, "observacoes")) {
    novo.observacoes = dados.observacoes == null ? null : texto(dados.observacoes, "Observações", 0, 10000) || null;
  }
  if (parcial && !Object.keys(novo).length) throw erro(422, "Informe um campo do relatório para atualizar.");
  return novo;
}

export async function listar(usuario) {
  exigirEquipe(usuario);
  return Model.listar(usuario);
}

export async function buscar(valor, usuario) {
  exigirEquipe(usuario);
  return Model.buscarRelatorioPorId(id(valor), usuario);
}

export async function criarRelatorio(dados, usuario) {
  exigirEquipe(usuario);
  const novo = validarDados(dados);
  novo.id_os = id(dados.id_os);
  return Model.criarRelatorio(novo, usuario);
}

export async function editarRelatorio(valor, dados, usuario) {
  exigirEquipe(usuario);
  const idRelatorio = id(valor);
  const novo = validarDados(dados, true);
  // Autor e OS são definidos na criação; um PATCH não pode trocar esses vínculos.
  if (Object.hasOwn(dados, "id_os") || Object.hasOwn(dados, "id_usuario"))
    throw erro(422, "Não é permitido alterar a OS ou o autor do relatório.");
  return Model.editarRelatorio(idRelatorio, novo, usuario);
}
