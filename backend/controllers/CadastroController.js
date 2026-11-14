import * as Service from "../services/CadastroService.js";
export function controlador(tipo) {
  return {
    listar: async (req, res, next) => {
      try {
        res.json({ sucesso: true, dados: await Service.listar(tipo) });
      } catch (e) {
        next(e);
      }
    },
    criar: async (req, res, next) => {
      try {
        res
          .status(201)
          .json({ sucesso: true, dados: await Service.criar(tipo, req.body) });
      } catch (e) {
        next(e);
      }
    },
    atualizar: async (req, res, next) => {
      try {
        res.json({
          sucesso: true,
          dados: await Service.atualizar(tipo, req.params.id, req.body),
        });
      } catch (e) {
        next(e);
      }
    },
    excluir: async (req, res, next) => {
      try {
        await Service.excluir(tipo, req.params.id);
        res.status(204).send();
      } catch (e) {
        next(e);
      }
    },
  };
}
