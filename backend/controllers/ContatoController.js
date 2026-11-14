import * as Service from "../services/ContatoService.js";
export async function criar(req, res, next) {
  try {
    res
      .status(201)
      .json({ sucesso: true, dados: await Service.criar(req.body) });
  } catch (e) {
    next(e);
  }
}
export async function listar(req, res, next) {
  try {
    res.json({ sucesso: true, dados: await Service.listar() });
  } catch (e) {
    next(e);
  }
}
