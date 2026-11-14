import { randomBytes } from "node:crypto";
import { pool, transacao } from "../config/database.js";
import { erro } from "../utils/validacao.js";
const consulta = `SELECT o.*,e.id_cliente,e.nome AS equipamento,e.tipo,e.marca,e.modelo,e.numero_serie,c.nome AS cliente,c.email,c.telefone,u.nome AS tecnico FROM ordens_servico o JOIN equipamentos e ON e.id_equipamento=o.id_equipamento JOIN clientes c ON c.id_cliente=e.id_cliente LEFT JOIN usuarios u ON u.id_usuario=o.id_usuario`;
async function historico(c, id, status, descricao) {
  await c.query(
    "INSERT INTO historico_servico(id_os,status,descricao) VALUES(?,?,?)",
    [id, status, descricao],
  );
}
export async function listar(usuario) {
  const filtrarCliente = usuario.tipo === "cliente";
  const filtrarTecnico =
    usuario.tipo === "equipe" && usuario.perfil === "funcionario";
  const [r] = await pool.query(
    consulta +
      (filtrarCliente
        ? " WHERE e.id_cliente=?"
        : filtrarTecnico
          ? " WHERE o.id_usuario=?"
          : "") +
      " ORDER BY o.id_os DESC LIMIT 200",
    filtrarCliente || filtrarTecnico ? [usuario.id] : [],
  );
  return r;
}
export async function buscar(id) {
  const [rows] = await pool.query(consulta + " WHERE o.id_os=?", [id]);
  if (!rows.length) return null;
  const o = rows[0];
  const [h] = await pool.query(
    "SELECT * FROM historico_servico WHERE id_os=? ORDER BY id_hist",
    [id],
  );
  const [orc] = await pool.query("SELECT * FROM orcamentos WHERE id_os=?", [
    id,
  ]);
  const [p] = await pool.query(
    "SELECT pu.*,p.nome FROM pecas_utilizadas pu JOIN pecas p ON p.id_peca=pu.id_peca WHERE pu.id_os=?",
    [id],
  );
  return { ...o, historico: h, orcamento: orc[0] || null, pecas: p };
}
export async function buscarRastreio(codigo, email) {
  const [r] = await pool.query(
    "SELECT o.id_os FROM ordens_servico o JOIN equipamentos e ON e.id_equipamento=o.id_equipamento JOIN clientes c ON c.id_cliente=e.id_cliente WHERE o.codigo_rastreio=? AND c.email=?",
    [codigo, email],
  );
  return r[0] ? buscar(r[0].id_os) : null;
}
export function semDadosPessoais(o) {
  const { cliente, email, telefone, id_cliente, ...seguro } = o;
  return seguro;
}
export async function criarSolicitacao(d, usuario) {
  return transacao(async (c) => {
    const [eq] = await c.query(
      "INSERT INTO equipamentos(id_cliente,nome,tipo,marca,modelo,numero_serie,observacoes) VALUES(?,?,?,?,?,?,?)",
      [
        usuario.id,
        `${d.marca} ${d.modelo}`.slice(0, 120),
        d.tipo,
        d.marca,
        d.modelo,
        d.numero_serie,
        d.defeito_relatado,
      ],
    );
    return inserirOrdem(c, {
      ...d,
      id_equipamento: eq.insertId,
      id_usuario: null,
    });
  });
}
async function inserirOrdem(c, d) {
  const codigo = `TAP-${new Date().getFullYear()}-${randomBytes(12).toString("hex").toUpperCase()}`;
  const [r] = await c.query(
    "INSERT INTO ordens_servico(codigo_rastreio,id_equipamento,id_usuario,defeito_relatado,servico) VALUES(?,?,?,?,?)",
    [
      codigo,
      d.id_equipamento,
      d.id_usuario || null,
      d.defeito_relatado,
      d.servico || "Diagnóstico e reparo",
    ],
  );
  await historico(
    c,
    r.insertId,
    "recebido",
    "Solicitação registrada. Aguardando avaliação técnica.",
  );
  return { id_os: r.insertId, codigo_rastreio: codigo };
}
export async function criar(d) {
  return transacao((c) => inserirOrdem(c, d));
}
async function devolverReservas(c, id) {
  const [p] = await c.query(
    "SELECT * FROM pecas_utilizadas WHERE id_os=? AND status='reservada' ORDER BY id_peca FOR UPDATE",
    [id],
  );
  for (const item of p) {
    await c.query(
      "UPDATE pecas SET quantidade=quantidade+?,status=IF(status='inativa','inativa','disponivel') WHERE id_peca=?",
      [item.quantidade, item.id_peca],
    );
  }
  await c.query(
    "UPDATE pecas_utilizadas SET status='devolvida' WHERE id_os=? AND status='reservada'",
    [id],
  );
}
export async function atualizar(id, d, usuario) {
  await transacao(async (c) => {
    const [[o]] = await c.query(
      "SELECT * FROM ordens_servico WHERE id_os=? FOR UPDATE",
      [id],
    );
    if (!o) throw erro(404, "Ordem não encontrada.");
    if (
      usuario.tipo === "equipe" &&
      usuario.perfil === "funcionario" &&
      o.id_usuario !== usuario.id
    )
      throw erro(404, "Ordem não encontrada.");
    if (["entregue", "cancelado"].includes(o.status))
      throw erro(409, "Esta ordem já está encerrada.");
    const [[orc]] = await c.query("SELECT * FROM orcamentos WHERE id_os=?", [
      id,
    ]);
    const status = d.status || o.status;
    const fluxo = {
      recebido: ["em diagnostico", "cancelado", "produto armazenado"],
      "em diagnostico": ["aguardando peca", "cancelado"],
      "aguardando aprovacao": ["pronto para retirada", "cancelado"],
      "aguardando peca": ["em diagnostico", "em reparo", "cancelado"],
      "em reparo": ["em teste", "aguardando peca", "cancelado"],
      "em teste": ["em reparo", "pronto para retirada", "cancelado"],
      "pronto para retirada": ["entregue"],
      "produto armazenado": ["recebido", "cancelado"],
    };
    if (status !== o.status && !fluxo[o.status]?.includes(status))
      throw erro(409, `Transição de ${o.status} para ${status} não permitida.`);
    if (status === "em reparo" && orc?.status !== "aprovado")
      throw erro(409, "É necessário aprovar o orçamento antes do reparo.");
    if (
      o.status === "aguardando aprovacao" &&
      status === "pronto para retirada" &&
      orc?.status !== "recusado"
    )
      throw erro(409, "Resolva o orçamento antes de liberar o equipamento.");
    if (d.id_usuario) {
      const [[tecnico]] = await c.query(
        "SELECT id_usuario FROM usuarios WHERE id_usuario=? AND status='ativo'",
        [d.id_usuario],
      );
      if (!tecnico) throw erro(422, "Técnico não encontrado ou inativo.");
    }
    const diagnostico = d.diagnostico ?? o.diagnostico,
      reparo = d.reparo_executado ?? o.reparo_executado;
    if (
      status === "pronto para retirada" &&
      orc?.status === "aprovado" &&
      (!reparo || reparo.length < 10)
    )
      throw erro(422, "Descreva o reparo executado antes de concluir.");
    if (status === "cancelado") {
      await devolverReservas(c, id);
      await c.query(
        "UPDATE orcamentos SET status='expirado' WHERE id_os=? AND status='pendente'",
        [id],
      );
    }
    await c.query(
      "UPDATE ordens_servico SET status=?,diagnostico=?,reparo_executado=?,prazo=?,id_usuario=?,data_manutencao=IF(?='em reparo',COALESCE(data_manutencao,NOW()),data_manutencao),data_entrega=IF(?='entregue',NOW(),data_entrega) WHERE id_os=?",
      [
        status,
        diagnostico,
        reparo,
        d.prazo ?? o.prazo,
        d.id_usuario ?? o.id_usuario ?? usuario.id,
        status,
        status,
        id,
      ],
    );
    await historico(
      c,
      id,
      status,
      d.descricao || `Atendimento atualizado: ${status}.`,
    );
  });
  return buscar(id);
}
export async function criarOrcamento(id, d) {
  await transacao(async (c) => {
    const [[o]] = await c.query(
      "SELECT * FROM ordens_servico WHERE id_os=? FOR UPDATE",
      [id],
    );
    if (!o) throw erro(404, "Ordem não encontrada.");
    if (
      !["em diagnostico", "aguardando aprovacao", "aguardando peca"].includes(
        o.status,
      )
    )
      throw erro(409, "Faça a avaliação técnica antes de gerar o orçamento.");
    if (!o.diagnostico || o.diagnostico.length < 10)
      throw erro(422, "Registre um diagnóstico com pelo menos 10 caracteres.");
    const [[antigo]] = await c.query(
      "SELECT status FROM orcamentos WHERE id_os=?",
      [id],
    );
    if (antigo?.status === "aprovado")
      throw erro(409, "O orçamento aprovado não pode ser alterado.");
    await devolverReservas(c, id);
    await c.query("DELETE FROM pecas_utilizadas WHERE id_os=?", [id]);
    let centavos = 0;
    for (const item of [...d.pecas].sort((a, b) => a.id_peca - b.id_peca)) {
      const [[p]] = await c.query(
        "SELECT * FROM pecas WHERE id_peca=? FOR UPDATE",
        [item.id_peca],
      );
      if (!p || p.status === "inativa" || p.quantidade < item.quantidade)
        throw erro(409, `Estoque insuficiente para a peça ${item.id_peca}.`);
      const unit = Math.round(Number(p.valor) * 100);
      centavos += unit * item.quantidade;
      await c.query(
        "UPDATE pecas SET status=IF(quantidade-?=0,'esgotada','disponivel'),quantidade=quantidade-? WHERE id_peca=?",
        [item.quantidade, item.quantidade, p.id_peca],
      );
      await c.query(
        "INSERT INTO pecas_utilizadas(id_os,id_peca,quantidade,valor_unitario,status) VALUES(?,?,?,?,'reservada')",
        [id, p.id_peca, item.quantidade, unit / 100],
      );
    }
    const mao = Math.round(d.valor_mao_obra * 100),
      total = (centavos + mao) / 100;
    await c.query(
      "INSERT INTO orcamentos(id_os,valor_pecas,valor_mao_obra,valor_total,status) VALUES(?,?,?,?,'pendente') ON DUPLICATE KEY UPDATE valor_pecas=VALUES(valor_pecas),valor_mao_obra=VALUES(valor_mao_obra),valor_total=VALUES(valor_total),status='pendente'",
      [id, centavos / 100, mao / 100, total],
    );
    await c.query(
      "UPDATE ordens_servico SET status='aguardando aprovacao',valor=? WHERE id_os=?",
      [total, id],
    );
    await historico(
      c,
      id,
      "aguardando aprovacao",
      "Diagnóstico concluído e orçamento disponibilizado. Peças reservadas no estoque.",
    );
  });
  return buscar(id);
}
export async function decidir(id, decisao) {
  await transacao(async (c) => {
    const [[o]] = await c.query(
      "SELECT * FROM ordens_servico WHERE id_os=? FOR UPDATE",
      [id],
    );
    const [[orc]] = await c.query(
      "SELECT * FROM orcamentos WHERE id_os=? FOR UPDATE",
      [id],
    );
    if (!o || !orc) throw erro(404, "Orçamento não encontrado.");
    if (orc.status !== "pendente" || o.status !== "aguardando aprovacao")
      throw erro(
        409,
        "Este orçamento já foi resolvido ou a ordem não está aguardando aprovação.",
      );
    const status =
      decisao === "aprovado" ? "em reparo" : "aguardando aprovacao";
    if (decisao === "recusado") await devolverReservas(c, id);
    else
      await c.query(
        "UPDATE pecas_utilizadas SET status='utilizada' WHERE id_os=? AND status='reservada'",
        [id],
      );
    await c.query("UPDATE orcamentos SET status=? WHERE id_os=?", [
      decisao,
      id,
    ]);
    await c.query(
      "UPDATE ordens_servico SET status=?,data_manutencao=IF(?='aprovado',NOW(),data_manutencao) WHERE id_os=?",
      [status, decisao, id],
    );
    await historico(
      c,
      id,
      status,
      decisao === "aprovado"
        ? "Orçamento aprovado pelo cliente. Reparo iniciado."
        : "Orçamento recusado pelo cliente. Peças devolvidas ao estoque. Aguardando encaminhamento para retirada sem reparo.",
    );
  });
  return buscar(id);
}
