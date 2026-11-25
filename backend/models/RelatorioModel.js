// Módulo de relatórios técnicos do Drive, integrado às regras de acesso da API.
import { pool, transacao } from "../config/database.js";
import { administrador, exigirAcessoOrdem } from "../utils/permissoes.js";
import { erro } from "../utils/validacao.js";

const consulta = `SELECT r.*, o.id_usuario AS responsavel_os, o.codigo_rastreio,
  u.nome AS autor FROM relatorios r
  JOIN ordens_servico o ON o.id_os = r.id_os
  LEFT JOIN usuarios u ON u.id_usuario = r.id_usuario`;

function exigirAcessoRelatorio(relatorio, usuario) {
  if (!relatorio) throw erro(404, "Relatório não encontrado.");
  exigirAcessoOrdem({ id_usuario: relatorio.responsavel_os }, usuario);
  if (!administrador(usuario) && Number(relatorio.id_usuario) !== Number(usuario.id))
    throw erro(404, "Relatório não encontrado.");
}

export async function listar(usuario) {
  const filtro = administrador(usuario) ? "" : " WHERE r.id_usuario = ? AND o.id_usuario = ?";
  const [linhas] = await pool.query(consulta + filtro + " ORDER BY r.data_atualizacao DESC, r.id_relatorio DESC",
    administrador(usuario) ? [] : [usuario.id, usuario.id]);
  return linhas;
}

export async function buscarRelatorioPorId(idRelatorio, usuario) {
  const [linhas] = await pool.query(consulta + " WHERE r.id_relatorio = ?", [idRelatorio]);
  exigirAcessoRelatorio(linhas[0], usuario);
  return linhas[0];
}

export async function criarRelatorio(dados, usuario) {
  return transacao(async (conexao) => {
    const [ordens] = await conexao.query("SELECT id_os, id_usuario FROM ordens_servico WHERE id_os = ? FOR UPDATE", [dados.id_os]);
    exigirAcessoOrdem(ordens[0], usuario);
    const [resultado] = await conexao.query(`INSERT INTO relatorios
      (id_os, id_usuario, diagnostico, descricao_reparo, observacoes) VALUES (?, ?, ?, ?, ?)`,
      [dados.id_os, usuario.id, dados.diagnostico, dados.descricao_reparo, dados.observacoes]);
    return { ...dados, id_usuario: usuario.id, id_relatorio: resultado.insertId };
  });
}

export async function editarRelatorio(idRelatorio, dados, usuario) {
  return transacao(async (conexao) => {
    const [linhas] = await conexao.query(consulta + " WHERE r.id_relatorio = ? FOR UPDATE", [idRelatorio]);
    const atual = linhas[0];
    exigirAcessoRelatorio(atual, usuario);
    const novo = { ...atual, ...dados };
    await conexao.query(`UPDATE relatorios SET diagnostico = ?, descricao_reparo = ?, observacoes = ?
      WHERE id_relatorio = ?`, [novo.diagnostico, novo.descricao_reparo, novo.observacoes, idRelatorio]);
    // Salvar os mesmos valores é sucesso, mesmo quando o driver informa zero alterações.
    const [salvos] = await conexao.query(consulta + " WHERE r.id_relatorio = ?", [idRelatorio]);
    return salvos[0];
  });
}
