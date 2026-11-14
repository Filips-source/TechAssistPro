// EXCLUSIVAMENTE PARA DEMONSTRAÇÃO. NÃO usar como fonte de dados em produção.
export const USUARIOS_DEMO = {
  cliente: { id: 11, id_cliente: 101, nome: "Mariana Oliveira", email: "mariana@exemplo.com", perfil: "cliente" },
  funcionario: { id: 21, nome: "Rafael Lima", email: "rafael@exemplo.com", perfil: "funcionario" },
  administrador: { id: 31, nome: "Carolina Mendes", email: "carolina@exemplo.com", perfil: "administrador" },
  desenvolvedor: { id: 41, nome: "Equipe AUREN", email: "dev@exemplo.com", perfil: "desenvolvedor" },
};

const equipamentos = [
  { id: 1, codigo: "EQ-001", nome: "Compressor industrial", tipo: "Compressor", local: "Unidade A · Produção", clienteId: 101, tecnicoId: 21, status: "Atenção", saude: 72, ultimaLeitura: "Hoje, 08:12", metricas: [{ nome: "Vibração", valor: "2,8", unidade: "mm/s", percentual: 78 }, { nome: "Temperatura", valor: "68", unidade: "°C", percentual: 64 }] },
  { id: 2, codigo: "EQ-002", nome: "Bomba hidráulica", tipo: "Bomba", local: "Unidade A · Bloco 2", clienteId: 101, tecnicoId: 21, status: "Operacional", saude: 94, ultimaLeitura: "Hoje, 08:08", metricas: [{ nome: "Pressão", valor: "6,2", unidade: "bar", percentual: 52 }, { nome: "Temperatura", valor: "41", unidade: "°C", percentual: 41 }] },
  { id: 3, codigo: "EQ-003", nome: "Sistema de refrigeração", tipo: "Refrigeração", local: "Unidade B · Armazenagem", clienteId: 101, tecnicoId: 22, status: "Crítico", saude: 39, ultimaLeitura: "Hoje, 07:59", metricas: [{ nome: "Temperatura", valor: "86", unidade: "°C", percentual: 95 }, { nome: "Consumo", valor: "9,1", unidade: "kW", percentual: 85 }] },
  { id: 4, codigo: "EQ-004", nome: "Esteira transportadora", tipo: "Esteira", local: "Unidade C · Linha 1", clienteId: 102, tecnicoId: 21, status: "Operacional", saude: 91, ultimaLeitura: "Hoje, 08:03", metricas: [{ nome: "Vibração", valor: "1,3", unidade: "mm/s", percentual: 30 }] },
  { id: 5, codigo: "EQ-005", nome: "Gerador auxiliar", tipo: "Gerador", local: "Unidade D · Energia", clienteId: 103, tecnicoId: 23, status: "Atenção", saude: 67, ultimaLeitura: "Hoje, 08:04", metricas: [{ nome: "Temperatura", valor: "73", unidade: "°C", percentual: 74 }] },
];

const pecas = [
  { id: 1, equipamentoId: 1, nome: "Rolamento do eixo", estado: "Desgaste", integridade: 58 },
  { id: 2, equipamentoId: 1, nome: "Correia de transmissão", estado: "Normal", integridade: 92 },
  { id: 3, equipamentoId: 2, nome: "Vedação hidráulica", estado: "Normal", integridade: 96 },
  { id: 4, equipamentoId: 3, nome: "Ventoinha principal", estado: "Crítico", integridade: 26 },
  { id: 5, equipamentoId: 4, nome: "Sensor de rotação", estado: "Normal", integridade: 90 },
  { id: 6, equipamentoId: 5, nome: "Filtro de óleo", estado: "Desgaste", integridade: 64 },
];

const ordens = [
  { id: 2048, codigo: "OS-2048", titulo: "Verificar vibração do compressor", equipamentoId: 1, clienteId: 101, tecnicoId: 21, cliente: "Mariana Oliveira", tecnico: "Rafael Lima", prioridade: "Alta", status: "Em andamento", data: "12 nov 2026", tipo: "Preventiva" },
  { id: 2049, codigo: "OS-2049", titulo: "Troca preventiva de vedação", equipamentoId: 2, clienteId: 101, tecnicoId: 21, cliente: "Mariana Oliveira", tecnico: "Rafael Lima", prioridade: "Baixa", status: "Agendada", data: "13 nov 2026", tipo: "Preventiva" },
  { id: 2050, codigo: "OS-2050", titulo: "Falha na refrigeração", equipamentoId: 3, clienteId: 101, tecnicoId: 22, cliente: "Mariana Oliveira", tecnico: "Fernanda Rocha", prioridade: "Urgente", status: "Pendente", data: "11 nov 2026", tipo: "Reparo manual" },
  { id: 2051, codigo: "OS-2051", titulo: "Inspeção da esteira", equipamentoId: 4, clienteId: 102, tecnicoId: 21, cliente: "Lucas Souza", tecnico: "Rafael Lima", prioridade: "Média", status: "Concluída", data: "08 nov 2026", tipo: "Preventiva" },
  { id: 2052, codigo: "OS-2052", titulo: "Avaliação do gerador", equipamentoId: 5, clienteId: 103, tecnicoId: 23, cliente: "Amanda Silva", tecnico: "Bruno Alves", prioridade: "Média", status: "Agendada", data: "14 nov 2026", tipo: "Preventiva" },
];

const alertas = [
  { id: 1, equipamentoId: 3, titulo: "Temperatura acima do limite", detalhe: "Sistema de refrigeração · 86 °C", nivel: "Crítico", quando: "Há 6 min" },
  { id: 2, equipamentoId: 1, titulo: "Vibração elevada", detalhe: "Compressor industrial · 2,8 mm/s", nivel: "Atenção", quando: "Há 18 min" },
  { id: 3, equipamentoId: 5, titulo: "Filtro próximo da revisão", detalhe: "Gerador auxiliar · Integridade 64%", nivel: "Atenção", quando: "Há 42 min" },
];

const funcionarios = [
  { id: 21, nome: "Rafael Lima", funcao: "Técnico de manutenção", email: "rafael@exemplo.com", ativo: true, servicos: 8 },
  { id: 22, nome: "Fernanda Rocha", funcao: "Especialista em refrigeração", email: "fernanda@exemplo.com", ativo: true, servicos: 6 },
  { id: 23, nome: "Bruno Alves", funcao: "Técnico eletromecânico", email: "bruno@exemplo.com", ativo: false, servicos: 4 },
];

const auditoria = [
  { id: 1, acao: "Ordem OS-2048 atualizada", usuario: "Rafael Lima", quando: "Hoje, 08:10", modulo: "Manutenções" },
  { id: 2, acao: "Alerta de temperatura gerado", usuario: "Motor de alertas", quando: "Hoje, 08:03", modulo: "Monitoramento" },
  { id: 3, acao: "Técnico atribuído à OS-2050", usuario: "Carolina Mendes", quando: "Ontem, 17:25", modulo: "Gestão" },
];

const integracoes = [
  { nome: "Gateway de sensores", descricao: "Coleta automatizada das métricas", estado: "Conectado" },
  { nome: "API de manutenção", descricao: "Sincronização de ordens e agendamentos", estado: "Conectado" },
  { nome: "Notificações por e-mail", descricao: "Alertas e confirmação de agendamento", estado: "Em configuração" },
];

export function dadosDemonstracao(usuario) {
  const papel = usuario.perfil;
  const todos = papel === "administrador" || papel === "desenvolvedor";
  const visiveis = equipamentos.filter((item) => todos || (
    papel === "cliente" ? item.clienteId === usuario.id_cliente : item.tecnicoId === usuario.id
  ));
  const ids = new Set(visiveis.map((item) => item.id));
  const ordensVisiveis = ordens.filter((item) => todos || (
    papel === "cliente" ? item.clienteId === usuario.id_cliente : item.tecnicoId === usuario.id
  ));
  return {
    equipamentos: visiveis,
    pecas: pecas.filter((item) => ids.has(item.equipamentoId)),
    ordens: ordensVisiveis,
    alertas: alertas.filter((item) => ids.has(item.equipamentoId)),
    funcionarios: todos ? funcionarios : [],
    auditoria: papel === "desenvolvedor" ? auditoria : [],
    integracoes: papel === "desenvolvedor" ? integracoes : [],
    historicoMedicoes: [42, 49, 47, 61, 51, 59, 67, 63, 74, 68, 81, 76],
  };
}
