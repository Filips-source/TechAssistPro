export function identidadeConta(usuario) {
  const tipo = usuario?.tipo || (usuario?.perfil === "cliente" ? "cliente" : "equipe");
  return `${tipo}:${usuario?.id ?? ""}`;
}

export function mensagemPropria(mensagem, usuario) {
  if (!["cliente", "equipe"].includes(mensagem?.remetenteTipo)) return false;
  const id = Number(mensagem?.remetenteId);
  const atual = Number(usuario?.id);
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(atual) || atual < 1) return false;
  return identidadeConta({ tipo: mensagem.remetenteTipo, id }) === identidadeConta(usuario);
}
