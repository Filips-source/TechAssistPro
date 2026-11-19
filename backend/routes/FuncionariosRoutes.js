import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../config/database.js";
import { autenticar, autorizarAdmin } from "../middlewares/AuthMiddleware.js";
import { email, erro, id, opcao, texto } from "../utils/validacao.js";

export const funcionariosRouter = Router();
funcionariosRouter.use(autenticar, autorizarAdmin);

const camposPublicos = "id_usuario AS id, nome, email, especialidade AS funcao, status, criado_em AS criadoEm";

funcionariosRouter.get("/", async (_req, res, next) => {
  try {
    const [dados] = await pool.query(
      `SELECT ${camposPublicos} FROM usuarios WHERE perfil='funcionario' ORDER BY nome LIMIT 200`,
    );
    res.json({ sucesso: true, dados: dados.map((u) => ({ ...u, ativo: u.status === "ativo" })) });
  } catch (e) { next(e); }
});

funcionariosRouter.post("/", async (req, res, next) => {
  try {
    const nome = texto(req.body?.nome, "Nome", 3, 120);
    const mail = email(req.body?.email);
    const funcao = texto(req.body?.funcao, "Função", 2, 120);
    const senha = req.body?.senha;
    if (typeof senha !== "string" || senha.length < 8 || senha.length > 72 ||
        !/[a-z]/.test(senha) || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha) || !/[\W_]/.test(senha))
      throw erro(422, "Senha deve ter entre 8 e 72 caracteres, incluindo maiúscula, minúscula, número e símbolo.");
    const hash = await bcrypt.hash(senha, 12);
    const [r] = await pool.query(
      "INSERT INTO usuarios (nome,email,senha_hash,especialidade,perfil,status) VALUES (?,?,?,?,'funcionario','ativo')",
      [nome, mail, hash, funcao],
    );
    const [[usuario]] = await pool.query(
      `SELECT ${camposPublicos} FROM usuarios WHERE id_usuario=?`, [r.insertId],
    );
    res.status(201).json({ sucesso: true, dados: { ...usuario, ativo: true } });
  } catch (e) { next(e); }
});

funcionariosRouter.put("/:id", async (req, res, next) => {
  try {
    const usuarioId = id(req.params.id);
    const nome = texto(req.body?.nome, "Nome", 3, 120);
    const mail = email(req.body?.email);
    const funcao = texto(req.body?.funcao, "Função", 2, 120);
    const status = opcao(req.body?.status, ["ativo", "ausente"], "Status");
    const [r] = await pool.query(
      "UPDATE usuarios SET nome=?,email=?,especialidade=?,status=? WHERE id_usuario=? AND perfil='funcionario'",
      [nome, mail, funcao, status, usuarioId],
    );
    if (!r.affectedRows) throw erro(404, "Funcionário não encontrado.");
    const [[usuario]] = await pool.query(
      `SELECT ${camposPublicos} FROM usuarios WHERE id_usuario=? AND perfil='funcionario'`, [usuarioId],
    );
    res.json({ sucesso: true, dados: { ...usuario, ativo: usuario.status === "ativo" } });
  } catch (e) { next(e); }
});
