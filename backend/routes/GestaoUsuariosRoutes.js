import { Router } from "express";
import { autenticar, autorizarAdmin } from "../middlewares/AuthMiddleware.js";
import * as Service from "../services/GestaoUsuariosService.js";

export const gestaoUsuariosRouter = Router();
gestaoUsuariosRouter.use(autenticar, autorizarAdmin);

const tipos = { clientes: "cliente", funcionarios: "funcionario" };
function tipo(req) {
  const valor = tipos[req.params.tipo];
  if (!valor) {
    const erro = new Error("Tipo de usuário inválido.");
    erro.status = 404;
    throw erro;
  }
  return valor;
}
const tratar = (funcao) => async (req, res, next) => {
  try {
    await funcao(req, res);
  } catch (erro) {
    next(erro);
  }
};

gestaoUsuariosRouter.get("/:tipo", tratar(async (req, res) => {
  res.json({ sucesso: true, dados: await Service.listar(tipo(req)) });
}));
gestaoUsuariosRouter.post("/:tipo", tratar(async (req, res) => {
  res.status(201).json({ sucesso: true, dados: await Service.criar(tipo(req), req.body) });
}));
gestaoUsuariosRouter.put("/:tipo/:id", tratar(async (req, res) => {
  res.json({ sucesso: true, dados: await Service.atualizar(tipo(req), req.params.id, req.body) });
}));
gestaoUsuariosRouter.patch("/:tipo/:id/status", tratar(async (req, res) => {
  res.json({ sucesso: true, dados: await Service.definirStatus(tipo(req), req.params.id, req.body.status) });
}));
gestaoUsuariosRouter.patch("/:tipo/:id/senha", tratar(async (req, res) => {
  res.json({ sucesso: true, dados: await Service.redefinirSenha(tipo(req), req.params.id, req.body.senha) });
}));
