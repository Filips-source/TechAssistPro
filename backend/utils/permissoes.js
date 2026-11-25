import { erro } from "./validacao.js";

export function administrador(usuario) {
  return usuario?.tipo === "equipe" && ["adm", "desenvolvedor"].includes(usuario.perfil);
}

export function equipeRestrita(usuario) {
  return usuario?.tipo === "equipe" && !administrador(usuario);
}

export function exigirAcessoOrdem(ordem, usuario) {
  if (!usuario || !["cliente", "equipe"].includes(usuario.tipo) || !ordem ||
      (usuario.tipo === "cliente" && Number(ordem.id_cliente) !== Number(usuario.id)) ||
      (equipeRestrita(usuario) && Number(ordem.id_usuario) !== Number(usuario.id))) {
    throw erro(404, "Ordem não encontrada.");
  }
}
