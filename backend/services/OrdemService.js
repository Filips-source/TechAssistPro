import * as Model from "../models/OrdemModel.js";
import {
  texto,
  email,
  id,
  numero,
  opcao,
  erro,
  statusOS,
} from "../utils/validacao.js";
export const listar = Model.listar;
export async function buscar(valor, usuario) {
  const o = await Model.buscar(id(valor));
  if (
    !o ||
    (usuario.tipo === "cliente" && o.id_cliente !== usuario.id) ||
    (usuario.tipo === "equipe" && usuario.perfil === "funcionario" && o.id_usuario !== usuario.id)
  )
    throw erro(404, "Ordem não encontrada.");
  return o;
}
export async function rastrear(d = {}) {
  const o = await Model.buscarRastreio(
    texto(d.codigo, "Código", 5, 50),
    email(d.email),
  );
  if (!o) throw erro(404, "Ordem não encontrada. Confira o código e o e-mail.");
  return Model.semDadosPessoais(o);
}
export async function criarSolicitacao(d, usuario) {
  if (usuario.tipo !== "cliente")
    throw erro(403, "Use uma conta de cliente para solicitar uma avaliação.");
  const novo = {
    tipo: opcao(
      d.tipo,
      [
        "notebook",
        "computador",
        "celular",
        "tablet",
        "impressora",
        "monitor",
        "outro",
      ],
      "Tipo",
    ),
    marca: texto(d.marca, "Marca", 1, 60),
    modelo: texto(d.modelo, "Modelo", 1, 80),
    numero_serie: d.numero_serie
      ? texto(d.numero_serie, "Número de série", 1, 100)
      : null,
    defeito_relatado: texto(
      d.defeito_relatado,
      "Descrição do problema",
      10,
      2000,
    ),
    servico: texto(d.servico || "Diagnóstico e reparo", "Serviço", 3, 120),
  };
  if (d.consentimento !== true)
    throw erro(422, "Confirme o uso dos dados para o atendimento.");
  return Model.criarSolicitacao(novo, usuario);
}
export async function criar(d, usuario) {
  return Model.criar({
    id_equipamento: id(d.id_equipamento),
    id_usuario: d.id_usuario ? id(d.id_usuario) : usuario.id,
    defeito_relatado: texto(
      d.defeito_relatado,
      "Descrição do problema",
      10,
      2000,
    ),
    servico: texto(d.servico || "Diagnóstico e reparo", "Serviço", 3, 120),
  });
}
export async function atualizar(valor, d, usuario) {
  const v = {};
  if (d.status !== undefined) v.status = opcao(d.status, statusOS, "Status");
  for (const campo of ["diagnostico", "reparo_executado", "descricao"])
    if (d[campo] !== undefined) v[campo] = texto(d[campo], campo, 1, 2000);
  if (d.id_usuario) v.id_usuario = id(d.id_usuario);
  if (d.prazo) {
    if (
      typeof d.prazo !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(d.prazo) ||
      !Number.isFinite(new Date(d.prazo + "T00:00:00Z").getTime()) ||
      new Date(d.prazo + "T00:00:00Z").toISOString().slice(0, 10) !== d.prazo
    )
      throw erro(422, "Prazo inválido.");
    v.prazo = d.prazo;
  }
  return Model.atualizar(id(valor), v, usuario);
}
export async function orcar(valor, d) {
  if (!Array.isArray(d.pecas) || d.pecas.length > 50)
    throw erro(422, "Informe uma lista de até 50 peças.");
  const pecas = d.pecas.map((p) => ({
    id_peca: id(p.id_peca),
    quantidade: numero(p.quantidade, "Quantidade", 1, 10000, true),
  }));
  if (new Set(pecas.map((p) => p.id_peca)).size !== pecas.length)
    throw erro(422, "Não repita a mesma peça no orçamento.");
  return Model.criarOrcamento(id(valor), {
    pecas,
    valor_mao_obra: numero(
      d.valor_mao_obra,
      "Valor de mão de obra",
      0,
      1000000,
    ),
  });
}
export async function decidir(valor, d, usuario) {
  const o = await buscar(valor, usuario);
  if (usuario.tipo !== "cliente")
    throw erro(403, "A aprovação deve ser feita pelo cliente.");
  return Model.decidir(
    o.id_os,
    opcao(d.decisao, ["aprovado", "recusado"], "Decisão"),
  );
}
export async function decidirRastreio(d) {
  const o = await Model.buscarRastreio(
    texto(d.codigo, "Código", 5, 50),
    email(d.email),
  );
  if (!o) throw erro(404, "Ordem não encontrada.");
  return Model.semDadosPessoais(
    await Model.decidir(
      o.id_os,
      opcao(d.decisao, ["aprovado", "recusado"], "Decisão"),
    ),
  );
}
