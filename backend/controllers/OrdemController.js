import * as S from "../services/OrdemService.js";
// O controller recebe HTTP; o service valida; o model executa SQL.
function acao(operacao, status = 200) {
  return async (req, res, next) => {
    try {
      res.status(status).json({ sucesso: true, dados: await operacao(req) });
    } catch (e) {
      next(e);
    }
  };
}
export const listar = acao((r) => S.listar(r.usuario));
export const buscar = acao((r) => S.buscar(r.params.id, r.usuario));
export const solicitar = acao(
  (r) => S.criarSolicitacao(r.body, r.usuario),
  201,
);
export const criar = acao((r) => S.criar(r.body, r.usuario), 201);
export const atualizar = acao((r) =>
  S.atualizar(r.params.id, r.body, r.usuario),
);
export const orcar = acao((r) => S.orcar(r.params.id, r.body), 201);
export const decidir = acao((r) => S.decidir(r.params.id, r.body, r.usuario));
export const rastrear = acao((r) => S.rastrear(r.body));
export const decidirRastreio = acao((r) => S.decidirRastreio(r.body));
