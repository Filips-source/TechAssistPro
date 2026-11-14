export function erro(status, mensagem) {
  const e = new Error(mensagem);
  e.status = status;
  return e;
}
export function texto(valor, nome, min = 1, max = 2000) {
  if (
    typeof valor !== "string" ||
    valor.trim().length < min ||
    valor.trim().length > max
  )
    throw erro(422, `${nome}: informe de ${min} a ${max} caracteres.`);
  return valor.trim();
}
export function email(valor) {
  const e = texto(valor, "E-mail", 5, 150).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    throw erro(422, "Informe um e-mail válido.");
  return e;
}
export function telefone(valor) {
  const v = texto(valor, "Telefone", 10, 20);
  if (!/^[+0-9() .-]+$/.test(v) || v.replace(/\D/g, "").length < 10)
    throw erro(422, "Informe telefone válido com DDD.");
  return v;
}
export function id(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < 1)
    throw erro(422, "ID deve ser um inteiro positivo.");
  return n;
}
export function numero(valor, nome, min = 0, max = 1000000, inteiro = false) {
  if (
    typeof valor === "boolean" ||
    valor === null ||
    String(valor).trim() === ""
  )
    throw erro(422, `${nome} inválido.`);
  const n = Number(valor);
  if (
    !Number.isFinite(n) ||
    n < min ||
    n > max ||
    (inteiro && !Number.isInteger(n))
  )
    throw erro(422, `${nome} inválido.`);
  return n;
}
export function opcao(valor, opcoes, nome) {
  if (!opcoes.includes(valor)) throw erro(422, `${nome} inválido.`);
  return valor;
}
export const statusOS = [
  "recebido",
  "em diagnostico",
  "aguardando aprovacao",
  "aguardando peca",
  "em reparo",
  "em teste",
  "pronto para retirada",
  "entregue",
  "cancelado",
  "produto armazenado",
];
