import { headers } from "next/headers";
import { PERFIS } from "./permissoes";

// Contrato com o backend: GET {AUREN_API_URL}/auth/me deve verificar o cookie
// HttpOnly de sessão, ler o perfil ATUAL do banco e devolver o usuário ativo.
// GET {AUREN_API_URL}/dashboard deve retornar dados já filtrados no servidor.
function baseApi() {
  return process.env.AUREN_API_URL?.replace(/\/$/, "");
}

async function requisicaoAutenticada(caminho) {
  const base = baseApi();
  if (!base) return null;
  const cabecalhos = await headers();
  try {
    return await fetch(`${base}${caminho}`, {
      headers: { Cookie: cabecalhos.get("cookie") ?? "", Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return null;
  }
}

export async function obterUsuarioAutenticado() {
  const resposta = await requisicaoAutenticada("/auth/me");
  if (!resposta?.ok) return null;
  try {
    const payload = await resposta.json();
    const usuario = payload.usuario ?? payload.user ?? payload;
    if (!Object.values(PERFIS).includes(usuario?.perfil)) return null;
    if (usuario.status && usuario.status !== "ativo") return null;
    if (!usuario.id || !usuario.nome) return null;
    return {
      id: usuario.id,
      id_cliente: usuario.id_cliente ?? usuario.cliente?.id ?? null,
      nome: usuario.nome,
      email: usuario.email ?? "",
      perfil: usuario.perfil,
    };
  } catch {
    return null;
  }
}

export async function obterDadosReais() {
  const resposta = await requisicaoAutenticada("/dashboard");
  if (!resposta?.ok) throw new Error("Não foi possível carregar os dados da dashboard. Confira o backend e as permissões.");
  const dados = await resposta.json();
  return dados.dados ?? dados;
}
