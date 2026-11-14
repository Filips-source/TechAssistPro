import { pool, transacao } from "../config/database.js";
import { erro } from "../utils/validacao.js";
// Tabelas e colunas vêm somente desta lista fixa, nunca do usuário.
const esquemas = {
  clientes: {
    id: "id_cliente",
    campos: ["nome", "email", "telefone", "status"],
    publicos: "id_cliente,nome,email,telefone,status",
  },
  equipamentos: {
    id: "id_equipamento",
    campos: [
      "id_cliente",
      "nome",
      "tipo",
      "marca",
      "modelo",
      "numero_serie",
      "observacoes",
    ],
    publicos: "*",
  },
  pecas: {
    id: "id_peca",
    campos: ["nome", "descricao", "quantidade", "valor", "status"],
    publicos: "*",
  },
};
export async function listar(tipo) {
  const s = esquemas[tipo];
  const [rows] = await pool.query(
    `SELECT ${s.publicos} FROM ${tipo} ORDER BY ${s.id} DESC LIMIT 200`,
  );
  return rows;
}
export async function buscar(tipo, id) {
  const s = esquemas[tipo];
  const [rows] = await pool.query(
    `SELECT ${s.publicos} FROM ${tipo} WHERE ${s.id}=?`,
    [id],
  );
  return rows[0] || null;
}
export async function criar(tipo, dados) {
  const s = esquemas[tipo];
  const [r] = await pool.query(
    `INSERT INTO ${tipo}(${s.campos.join(",")}) VALUES(${s.campos.map(() => "?").join(",")})`,
    s.campos.map((c) => dados[c] ?? null),
  );
  return buscar(tipo, r.insertId);
}
export async function atualizar(tipo, id, dados) {
  const s = esquemas[tipo];
  if (tipo === "pecas")
    return transacao(async (c) => {
      const [[p]] = await c.query(
        "SELECT id_peca FROM pecas WHERE id_peca=? FOR UPDATE",
        [id],
      );
      if (!p) return null;
      const [reservas] = await c.query(
        "SELECT id_peca_util FROM pecas_utilizadas WHERE id_peca=? AND status='reservada' LIMIT 1",
        [id],
      );
      if (reservas.length)
        throw erro(
          409,
          "Esta peça tem reserva em uma ordem. Resolva o orçamento antes de alterar o estoque.",
        );
      await c.query(
        "UPDATE pecas SET nome=?,descricao=?,quantidade=?,valor=?,status=? WHERE id_peca=?",
        [
          dados.nome,
          dados.descricao,
          dados.quantidade,
          dados.valor,
          dados.status,
          id,
        ],
      );
      const [[salva]] = await c.query("SELECT * FROM pecas WHERE id_peca=?", [
        id,
      ]);
      return salva;
    });
  const existente = await buscar(tipo, id);
  if (!existente) return null;
  await pool.query(
    `UPDATE ${tipo} SET ${s.campos.map((c) => c + "=?").join(",")} WHERE ${s.id}=?`,
    [...s.campos.map((c) => dados[c] ?? null), id],
  );
  return buscar(tipo, id);
}
export async function excluir(tipo, id) {
  const s = esquemas[tipo];
  const [r] = await pool.query(`DELETE FROM ${tipo} WHERE ${s.id}=?`, [id]);
  return r.affectedRows > 0;
}
