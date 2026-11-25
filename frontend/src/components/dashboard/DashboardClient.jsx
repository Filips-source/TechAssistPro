"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AurenDashboard from "./AurenDashboard";
import { api, getSession, setSession } from "../techassist/api";
import { podeAcessarSecao } from "../../lib/auren/permissoes";
import { formatarData } from "../../lib/auren/datas.mjs";

const PERFIS_API = {
  cliente: "cliente",
  adm: "administrador",
  supervisor: "funcionario",
  suporte: "funcionario",
  funcionario: "funcionario",
  desenvolvedor: "desenvolvedor",
};

const ROTULOS_STATUS = {
  recebido: "Recebido",
  "em diagnostico": "Em diagnóstico",
  "aguardando aprovacao": "Aguardando aprovação",
  "aguardando peca": "Aguardando peça",
  "em reparo": "Em reparo",
  "em teste": "Em teste",
  "pronto para retirada": "Pronto para retirada",
  entregue: "Concluída",
  cancelado: "Cancelada",
  "produto armazenado": "Produto armazenado",
};

function converterDados(ordensApi, painel = {}) {
  const equipamentos = new Map();
  const ordens = ordensApi.map((item) => {
    const equipamentoId = item.id_equipamento;
    if (equipamentoId && !equipamentos.has(equipamentoId)) {
      const nome = item.equipamento || [item.marca, item.modelo].filter(Boolean).join(" ") || "Equipamento";
      equipamentos.set(equipamentoId, {
        id: equipamentoId,
        codigo: `EQ-${String(equipamentoId).padStart(3, "0")}`,
        nome,
        local: item.numero_serie ? `Série ${item.numero_serie}` : "Local não informado",
        status: "Sem monitoramento",
        saude: null,
        ultimaLeitura: "Telemetria indisponível",
        metricas: [],
      });
    }
    const status = String(item.status || "recebido").toLowerCase();
    return {
      id: item.id_os,
      codigo: item.codigo_rastreio || `OS-${item.id_os}`,
      titulo: item.defeito_relatado || item.servico || "Atendimento técnico",
      equipamentoId,
      clienteId: item.id_cliente,
      tecnicoId: item.id_usuario,
      cliente: item.cliente || "Cliente",
      tecnico: item.tecnico || "Não atribuído",
      prioridade: "Média",
      status: ROTULOS_STATUS[status] || status,
      statusApi: status,
      diagnostico: item.diagnostico || "",
      reparo_executado: item.reparo_executado || "",
      prazo: item.prazo?.slice(0, 10) || "",
      data: formatarData(item.prazo || item.data_manutencao || item.criado_em),
      tipo: item.servico || "Manutenção",
    };
  });

  for (const equipamento of painel.equipamentos ?? []) {
    const id = equipamento.id_equipamento;
    const metricas = (painel.metricas ?? []).filter((m) => Number(m.id_equipamento) === Number(id)).map((m) => {
      const leitura = (painel.leituras ?? []).find((l) => Number(l.id_metrica) === Number(m.id_metrica));
      const valor = leitura ? Number(leitura.valor) : null;
      const atencao = Number(m.limite_atencao);
      const critico = Number(m.limite_critico);
      return {
        id: m.id_metrica, nome: m.nome, unidade: m.unidade,
        valor: valor === null ? "—" : String(valor).replace(".", ","),
        percentual: valor === null || critico <= 0 ? 0 : Math.max(0, Math.min(100, valor / critico * 100)),
        critico: valor !== null && valor >= critico,
        alerta: valor !== null && valor >= atencao
      };
    });
    const avisos = metricas.filter((m) => m.alerta);
    const saude = metricas.some((m) => m.valor !== "—")
      ? Math.max(0, 100 - Math.round(metricas.reduce((max, m) => Math.max(max, m.percentual), 0)))
      : null;
    equipamentos.set(id, {
      id, codigo: "EQ-" + String(id).padStart(3, "0"),
      nome: equipamento.nome, local: equipamento.numero_serie ? "Série " + equipamento.numero_serie : equipamento.marca + " " + equipamento.modelo,
      status: avisos.some((m) => m.critico) ? "Crítico" : avisos.length ? "Atenção" : metricas.some((m) => m.valor !== "—") ? "Normal" : "Sem monitoramento",
      saude, ultimaLeitura: metricas.some((m) => m.valor !== "—") ? "Registrada no banco" : "Sem leitura",
      metricas
    });
  }
  const idsEquipamentos = new Set(equipamentos.keys());
  return {
    ordens,
    equipamentos: [...equipamentos.values()],
    pecas: (painel.pecas ?? []).map((p) => ({
      id: p.id_peca, nome: p.nome, equipamentoId: null, estado: p.status === "inativa" ? "Inativa" : p.status === "esgotada" ? "Esgotada" : "Disponível",
      integridade: p.status === "disponivel" ? 100 : 0, quantidade: p.quantidade
    })),

    alertas: [],
    funcionarios: (painel.funcionarios ?? []).map((f) => ({ id:f.id, nome:f.nome, ativo:f.status === "ativo" })),
    auditoria: [],
    integracoes: [],
    historicoMedicoes: [],
  };
}

export default function DashboardClient({ secao }) {
  const router = useRouter();
  const [revisao, setRevisao] = useState(0);
  const [estado, setEstado] = useState({ carregando: true, usuario: null, dados: null, erro: "" });

  useEffect(() => {
    const atualizarSessao = () => {
      setEstado({ carregando: true, usuario: null, dados: null, erro: "" });
      setRevisao((valor) => valor + 1);
    };
    window.addEventListener("tap-session-change", atualizarSessao);
    return () => window.removeEventListener("tap-session-change", atualizarSessao);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const sessao = getSession();
      if (!sessao?.token) {
        router.replace("/login");
        return;
      }

      try {
        const usuarioApi = await api("/auth/me");
        const perfil = PERFIS_API[usuarioApi?.perfil] ?? (usuarioApi?.tipo === "cliente" ? "cliente" : null);
        if (!perfil || !usuarioApi?.id || !usuarioApi?.nome) {
          throw new Error("Seu perfil não está habilitado para a dashboard.");
        }

        const usuario = { ...usuarioApi, perfil };
        const [ordensApi, painel] = await Promise.all([api("/ordens"), api("/painel/resumo")]);
        const dados = converterDados(ordensApi ?? [], painel ?? {});
        if (ativo) {
          setSession({ ...sessao, usuario: usuarioApi });
          setEstado({ carregando: false, usuario, dados: dados ?? {}, erro: "" });
        }
      } catch (erro) {
        if (!ativo) return;
        if (erro.status === 401) {
          setSession(null);
          router.replace("/login");
          return;
        }
        setEstado({ carregando: false, usuario: null, dados: null, erro: erro.message });
      }
    }

    carregar();
    return () => { ativo = false; };
  }, [router, revisao]);

  if (estado.carregando) {
    return <main className="auren-dashboard auren-error-screen"><div className="error-card"><h1>Carregando sua dashboard</h1><p>Validando seu acesso e buscando os dados da conta.</p></div></main>;
  }

  if (estado.erro) {
    return <main className="auren-dashboard auren-error-screen"><div className="error-card"><h1>Não foi possível carregar a dashboard</h1><p>{estado.erro}</p><p>Confira a API, a sessão e a disponibilidade dos endpoints autenticados de usuário e ordens.</p><div className="error-actions"><button type="button" onClick={() => window.location.reload()}>Tentar novamente</button><a href="/login">Voltar ao acesso</a></div></div></main>;
  }

  if (!podeAcessarSecao(estado.usuario.perfil, secao)) {
    return <main className="auren-dashboard auren-error-screen"><div className="error-card"><h1>Seção indisponível</h1><p>Seu perfil não tem permissão para acessar esta seção.</p><a href="/dashboard">Ir para visão geral</a></div></main>;
  }

  return <AurenDashboard key={`${estado.usuario.tipo}:${estado.usuario.id}`} usuario={estado.usuario} dados={estado.dados} secao={secao} demonstracao={false} onLogout={() => { setSession(null); router.replace("/login"); }} />;
}
