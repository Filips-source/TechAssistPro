import { erro } from "./validacao.js";

export function validarSenha(senha, { forte = true } = {}) {
  // bcrypt limita a entrada a 72 bytes. Não remover espaços da senha.
  if (typeof senha !== "string" || senha.length < (forte ? 8 : 1) ||
      Buffer.byteLength(senha, "utf8") > 72 ||
      (forte && (!/[a-z]/.test(senha) || !/[A-Z]/.test(senha) ||
        !/[0-9]/.test(senha) || !/[\W_]/.test(senha)))) {
    throw erro(422, forte
      ? "Senha com pelo menos 8 caracteres, maiúscula, minúscula, número e símbolo, limitada a 72 bytes."
      : "Informe uma senha válida de até 72 bytes.");
  }
  return senha;
}
