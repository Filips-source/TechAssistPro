import { pool, transacao } from "../config/database.js";

const CONVERSA_SELECT = `
  SELECT c.id_conversa AS id, c.id_cliente AS clienteId, cl.nome AS clienteNome,
         cl.email AS clienteEmail, c.assunto, c.categoria, c.status,
         c.id_atendente AS atendenteId, u.nome AS atendenteNome,
         c.criado_em AS criadoEm, c.atualizado_em AS atualizadoEm,
         (SELECT m.texto FROM suporte_mensagens m
          WHERE m.id_conversa=c.id_conversa ORDER BY m.id_mensagem DESC LIMIT 1) AS ultimaMensagem
  FROM suporte_conversas c
  JOIN clientes cl ON cl.id_cliente=c.id_cliente
  LEFT JOIN usuarios u ON u.id_usuario=c.id_atendente`;

export async function listar(usuario) {
  const equipe = usuario.tipo === "equipe";
  const [linhas] = await pool.query(
    `${CONVERSA_SELECT} ${equipe ? "" : "WHERE c.id_cliente=?"}
     ORDER BY c.atualizado_em DESC, c.id_conversa DESC LIMIT 100`,
    equipe ? [] : [usuario.id],
  );
  return linhas;
}

export async function buscar(id) {
  const [[conversa]] = await pool.query(`${CONVERSA_SELECT} WHERE c.id_conversa=?`, [id]);
  return conversa || null;
}

export async function mensagens(id) {
  const [linhas] = await pool.query(
    `SELECT m.id_mensagem AS id, m.id_conversa AS conversaId,
            m.remetente_tipo AS remetenteTipo, m.id_remetente AS remetenteId,
            COALESCE(cl.nome, u.nome, 'Atendimento') AS remetenteNome,
            m.texto, m.criado_em AS criadoEm
     FROM suporte_mensagens m
     LEFT JOIN clientes cl ON m.remetente_tipo='cliente' AND cl.id_cliente=m.id_remetente
     LEFT JOIN usuarios u ON m.remetente_tipo='equipe' AND u.id_usuario=m.id_remetente
     WHERE m.id_conversa=? ORDER BY m.id_mensagem DESC LIMIT 200`,
    [id],
  );
  return linhas.reverse();
}

export async function criar(usuario, assunto, categoria, texto) {
  const id = await transacao(async (db) => {
    const [resultado] = await db.query(
      `INSERT INTO suporte_conversas (id_cliente, assunto, categoria) VALUES (?,?,?)`,
      [usuario.id, assunto, categoria],
    );
    await db.query(
      `INSERT INTO suporte_mensagens (id_conversa, remetente_tipo, id_remetente, texto)
       VALUES (?, 'cliente', ?, ?)`,
      [resultado.insertId, usuario.id, texto],
    );
    return resultado.insertId;
  });
  return buscar(id);
}

export async function enviar(conversa, usuario, texto) {
  const equipe = usuario.tipo === "equipe";
  const resultado = await transacao(async (db) => {
    const [r] = await db.query(
      `INSERT INTO suporte_mensagens (id_conversa, remetente_tipo, id_remetente, texto)
       VALUES (?,?,?,?)`,
      [conversa.id, equipe ? "equipe" : "cliente", usuario.id, texto],
    );
    await db.query(
      `UPDATE suporte_conversas
       SET status=?, id_atendente=CASE WHEN ? THEN ? ELSE id_atendente END,
           atualizado_em=CURRENT_TIMESTAMP
       WHERE id_conversa=?`,
      [equipe ? "em_atendimento" : "aberto", equipe, usuario.id, conversa.id],
    );
    return r.insertId;
  });
  const [mensagensNovas] = await pool.query(
    `SELECT m.id_mensagem AS id, m.id_conversa AS conversaId,
            m.remetente_tipo AS remetenteTipo, m.id_remetente AS remetenteId,
            COALESCE(cl.nome, u.nome, 'Atendimento') AS remetenteNome,
            m.texto, m.criado_em AS criadoEm
     FROM suporte_mensagens m
     LEFT JOIN clientes cl ON m.remetente_tipo='cliente' AND cl.id_cliente=m.id_remetente
     LEFT JOIN usuarios u ON m.remetente_tipo='equipe' AND u.id_usuario=m.id_remetente
     WHERE m.id_mensagem=?`, [resultado],
  );
  return mensagensNovas[0];
}

export async function atualizarStatus(id, status, atendenteId) {
  await pool.query(
    `UPDATE suporte_conversas SET status=?, id_atendente=COALESCE(id_atendente, ?),
     atualizado_em=CURRENT_TIMESTAMP WHERE id_conversa=?`,
    [status, atendenteId, id],
  );
  return buscar(id);
}
