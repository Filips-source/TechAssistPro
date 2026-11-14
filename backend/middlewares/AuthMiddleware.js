import jwt from "jsonwebtoken";
import * as UsuarioModel from "../models/UsuarioModel.js";
export async function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || "").split(" ");
  if (tipo !== "Bearer" || !token)
    return res
      .status(401)
      .json({ sucesso: false, erro: "Token de autenticação ausente." });
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!["cliente", "equipe"].includes(p.tipo)) throw Error();
    const u = await UsuarioModel.buscarPorId(Number(p.sub), p.tipo);
    if (!u || u.status !== "ativo") throw Error();
    req.usuario = {
      id: Number(p.sub),
      tipo: p.tipo,
      perfil: p.tipo === "equipe" ? u.perfil : "cliente",
      registro: u,
    };
    return next();
  } catch (e) {
    if (e.code) return next(e);
    return res
      .status(401)
      .json({ sucesso: false, erro: "Token inválido ou expirado." });
  }
}
export function autorizarPerfis(...perfis) {
  return (req, res, next) => {
    if (!req.usuario)
      return res
        .status(401)
        .json({ sucesso: false, erro: "Autenticação necessária." });
    if (req.usuario.tipo !== "equipe" || !perfis.includes(req.usuario.perfil))
      return res
        .status(403)
        .json({
          sucesso: false,
          erro: "Você não tem permissão para acessar este recurso.",
        });
    next();
  };
}
export const autorizarEquipe = autorizarPerfis(
  "adm",
  "supervisor",
  "suporte",
  "funcionario",
  "desenvolvedor",
);
export const autorizarAdmin = autorizarPerfis("adm", "desenvolvedor");
