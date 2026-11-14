"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AurenDashboard from "./AurenDashboard";
import { api, getSession, setSession } from "../techassist/api";
import { podeAcessarSecao } from "../../lib/auren/permissoes";

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

function formatarData(valor) {
  if (!valor) return "A definir";
  const data = new Date(String(valor).replace(" ", "T"));
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString("pt-BR");
}

function converterDados(ordensApi) {
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
      data: formatarData(item.prazo || item.data_manutencao || item.criado_em),
      tipo: item.servico || "Manutenção",
    };
  });

  return {
    ordens,
    equipamentos: [...equipamentos.values()],
    pecas: [],
    alertas: [],
    funcionarios: [],
    auditoria: [],
    integracoes: [],
    historicoMedicoes: [],
  };
}

export default function DashboardClient({ secao }) {
  const router = useRouter();
  const [estado, setEstado] = useState({ carregando: true, usuario: null, dados: null, erro: "" });

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
        const ordensApi = await api("/ordens");
        const dados = converterDados(ordensApi ?? []);
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
  }, [router]);

  if (estado.carregando) {
    return <main className="auren-dashboard auren-error-screen"><div className="error-card"><h1>Carregando sua dashboard</h1><p>Validando seu acesso e buscando os dados da conta.</p></div></main>;
  }

  if (estado.erro) {
    return <main className="auren-dashboard auren-error-screen"><div className="error-card"><h1>Não foi possível carregar a dashboard</h1><p>{estado.erro}</p><p>Confira a API, a sessão e a disponibilidade dos endpoints autenticados de usuário e ordens.</p><div className="error-actions"><button type="button" onClick={() => window.location.reload()}>Tentar novamente</button><a href="/login">Voltar ao acesso</a></div></div></main>;
  }

  if (!podeAcessarSecao(estado.usuario.perfil, secao)) {
    return <main className="auren-dashboard auren-error-screen"><div className="error-card"><h1>Seção indisponível</h1><p>Seu perfil não tem permissão para acessar esta seção.</p><a href="/dashboard">Ir para visão geral</a></div></main>;
  }

  return <AurenDashboard usuario={estado.usuario} dados={estado.dados} secao={secao} demonstracao={false} onLogout={() => { setSession(null); router.replace("/login"); }} />;
}