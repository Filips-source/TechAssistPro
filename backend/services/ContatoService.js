import * as Model from "../models/ContatoModel.js";
import { texto, email, telefone, erro } from "../utils/validacao.js";
export async function criar(d = {}) {
  if (d.consentimento !== true)
    throw erro(
      422,
      "É necessário concordar com o uso dos dados para este atendimento.",
    );
  return Model.criar({
    nome: texto(d.nome, "Nome", 3, 120),
    email: email(d.email),
    telefone: telefone(d.telefone),
    assunto: texto(d.assunto, "Assunto", 3, 100),
    mensagem: texto(d.mensagem, "Mensagem", 10, 2000),
  });
}
export const listar = Model.listar;
