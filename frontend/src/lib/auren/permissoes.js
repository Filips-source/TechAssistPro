// AUREN: autorização central para a navegação e para ações. O backend DEVE
// repetir essas verificações e validar a posse/atribuição do registro.
export const PERFIS = Object.freeze({
  CLIENTE: "cliente",
  FUNCIONARIO: "funcionario",
  ADMINISTRADOR: "administrador",
  DESENVOLVEDOR: "desenvolvedor",
});

export const PERMISSOES = Object.freeze({
  cliente: [
    "dashboard:visualizar", "equipamentos:proprios:ler", "pecas:proprias:ler",
    "metricas:proprias:ler", "manutencoes:proprias:ler",
    "manutencoes:proprias:criar", "agenda:propria:ler", "perfil:editar", "suporte:conversar",
  ],
  funcionario: [
    "dashboard:visualizar", "equipamentos:atribuidos:ler", "pecas:atribuidas:ler",
    "metricas:atribuidas:ler", "metricas:atribuidas:atualizar",
    "manutencoes:atribuidas:ler", "manutencoes:atribuidas:atualizar",
    "agenda:propria:ler", "historico:proprio:ler", "perfil:editar",
  ],
  administrador: [
    "dashboard:visualizar", "equipamentos:todos:ler", "equipamentos:gerenciar",
    "pecas:todas:ler", "metricas:todas:ler", "metricas:todas:atualizar",
    "manutencoes:todas:ler", "manutencoes:todas:atualizar",
    "manutencoes:atribuir", "agenda:toda:ler", "funcionarios:gerenciar",
    "funcionarios:criar", "relatorios:visualizar", "alertas:gerenciar", "perfil:editar", "suporte:atender",
  ],
  desenvolvedor: ["*"],
});

export function pode(perfil, permissao) {
  const acessos = PERMISSOES[perfil] ?? [];
  return acessos.includes("*") || acessos.includes(permissao);
}

export const MENU = [
  { secao: "visao-geral", rotulo: "Visão geral", icone: "grid", permissao: "dashboard:visualizar" },
  { secao: "equipamentos", rotulo: "Equipamentos", icone: "cpu", permissoes: ["equipamentos:proprios:ler", "equipamentos:atribuidos:ler", "equipamentos:todos:ler"] },
  { secao: "monitoramento", rotulo: "Monitoramento", icone: "activity", permissoes: ["metricas:proprias:ler", "metricas:atribuidas:ler", "metricas:todas:ler"] },
  { secao: "solicitacoes", rotulo: "Solicitar reparo", icone: "plus", permissoes: ["manutencoes:proprias:criar"] },
  { secao: "ordens", rotulo: "Ordens de serviço", icone: "tool", permissoes: ["manutencoes:atribuidas:ler", "manutencoes:todas:ler"] },
  { secao: "agenda", rotulo: "Agenda e histórico", icone: "calendar", permissoes: ["agenda:propria:ler", "agenda:toda:ler"] },
  { secao: "funcionarios", rotulo: "Funcionários", icone: "users", permissao: "funcionarios:gerenciar" },
  { secao: "relatorios", rotulo: "Relatórios", icone: "chart", permissao: "relatorios:visualizar" },
  { secao: "auditoria", rotulo: "Auditoria", icone: "shield", apenas: ["desenvolvedor"] },
  { secao: "integracoes", rotulo: "Integrações", icone: "settings", apenas: ["desenvolvedor"] },
  { secao: "suporte", rotulo: "Suporte / Chat", icone: "message", permissoes: ["suporte:conversar", "suporte:atender"] },
  { secao: "perfil", rotulo: "Meu perfil", icone: "user", permissao: "perfil:editar" },
];

export function podeAcessarSecao(perfil, secao) {
  const item = MENU.find((opcao) => opcao.secao === secao);
  if (!item) return false;
  if (item.apenas) return item.apenas.includes(perfil);
  if (item.permissao) return pode(perfil, item.permissao);
  return item.permissoes?.some((permissao) => pode(perfil, permissao)) ?? false;
}

export function menuDoPerfil(perfil) {
  return MENU.filter((item) => podeAcessarSecao(perfil, item.secao));
}

export const NOMES_PERFIS = {
  cliente: "Cliente",
  funcionario: "Funcionário",
  administrador: "Administrador",
  desenvolvedor: "Desenvolvedor",
};
