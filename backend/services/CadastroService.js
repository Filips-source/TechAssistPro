import * as Model from "../models/CadastroModel.js";
import {
  texto,
  email,
  telefone,
  id,
  numero,
  opcao,
  erro,
} from "../utils/validacao.js";
function validar(tipo, d) {
  if (tipo === "clientes")
    return {
      nome: texto(d.nome, "Nome", 3, 120),
      email: email(d.email),
      telefone: telefone(d.telefone),
      status: opcao(d.status || "ativo", ["ativo", "ausente"], "Status"),
    };
  if (tipo === "equipamentos")
    return {
      id_cliente: id(d.id_cliente),
      nome: texto(d.nome, "Nome", 2, 120),
      tipo: opcao(
        d.tipo || "outro",
        [
          "notebook",
          "computador",
          "celular",
          "tablet",
          "impressora",
          "monitor",
          "outro",
        ],
        "Tipo",
      ),
      marca: texto(d.marca, "Marca", 1, 60),
      modelo: texto(d.modelo, "Modelo", 1, 80),
      numero_serie: d.numero_serie
        ? texto(d.numero_serie, "Número de série", 1, 100)
        : null,
      observacoes: d.observacoes
        ? texto(d.observacoes, "Observações", 1, 2000)
        : null,
    };
  const quantidade = numero(d.quantidade, "Quantidade", 0, 100000, true),
    valor = numero(d.valor, "Valor", 0, 1000000);
  return {
    nome: texto(d.nome, "Nome", 2, 120),
    descricao: d.descricao ? texto(d.descricao, "Descrição", 1, 500) : null,
    quantidade,
    valor,
    status:
      d.status === "inativa"
        ? "inativa"
        : quantidade === 0
          ? "esgotada"
          : "disponivel",
  };
}
export const listar = (tipo) => Model.listar(tipo);
export async function criar(tipo, dados) {
  return Model.criar(tipo, validar(tipo, dados));
}
export async function atualizar(tipo, valor, dados) {
  const n = id(valor);
  const r = await Model.atualizar(tipo, n, validar(tipo, dados));
  if (!r) throw erro(404, "Registro não encontrado.");
  return r;
}
export async function excluir(tipo, valor) {
  if (!(await Model.excluir(tipo, id(valor))))
    throw erro(404, "Registro não encontrado.");
}
