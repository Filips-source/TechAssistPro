import * as Service from "../services/RelatorioService.js";

export async function listar(req, res, next) {
  try { res.json({ sucesso: true, dados: await Service.listar(req.usuario) }); }
  catch (erro) { next(erro); }
}

export async function buscar(req, res, next) {
  try { res.json({ sucesso: true, dados: await Service.buscar(req.params.id, req.usuario) }); }
  catch (erro) { next(erro); }
}

export async function adicionarRelatorio(req, res, next) {
  try {
    const dados = await Service.criarRelatorio(req.body, req.usuario);
    res.status(201).json({ sucesso: true, mensagem: "Relatório criado com sucesso.", id_relatorio: dados.id_relatorio, dados });
  } catch (erro) { next(erro); }
}

export async function editarRelatorio(req, res, next) {
  try {
    const dados = await Service.editarRelatorio(req.params.id, req.body, req.usuario);
    res.json({ sucesso: true, mensagem: "Relatório atualizado com sucesso.", atualizado: true, dados });
  } catch (erro) { next(erro); }
}
