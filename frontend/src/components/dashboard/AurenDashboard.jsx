"use client";

import Link from "next/link";
import SupportChat from "./SupportChat";
import { useMemo, useState } from "react";
import { MENU, NOMES_PERFIS, menuDoPerfil, pode } from "../../lib/auren/permissoes";

function Icon({ nome, tamanho = 20 }) {
  const comum = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  const caminhos = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    cpu: <><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4"/></>,
    activity: <path d="M2 12h5l3-7 4 14 3-7h5"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    tool: <><path d="M14.7 6.3a5 5 0 0 0-6.4 6.4l-5.5 5.5a2 2 0 1 0 2.8 2.8l5.5-5.5a5 5 0 0 0 6.4-6.4l-3 3-3-3 3.2-2.8Z"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
    users: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2"/><path d="M17 5a3 3 0 0 1 0 6M17 15a5 5 0 0 1 4 5"/></>,
    chart: <><path d="M4 20V5M4 20h17M8 15l4-5 4 2 4-6"/></>,
    shield: <><path d="M12 2 4 5v6c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 8-3 8-3 10h18c0-2-3-2-3-10"/><path d="M10 21h4"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
    close: <path d="M5 5 19 19M19 5 5 19"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    alert: <><path d="m12 3 10 18H2L12 3Z"/><path d="M12 10v4M12 18h.01"/></>,
    message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 2v-5.5a7.5 7.5 0 1 1 17-4Z"/><path d="M8 11h8M8 14h5"/></>,
    logout: <><path d="M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 16l4-4-4-4M9 12h10"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width={tamanho} height={tamanho} {...comum}>{caminhos[nome] ?? caminhos.grid}</svg>;
}

function ClasseStatus({ valor }) {
  const classe = /crítico|urgente|inativo/i.test(valor) ? "danger" : /atenção|desgaste|pendente|alta/i.test(valor) ? "warning" : /andamento|agendada|média|configuração|sem monitoramento/i.test(valor) ? "info" : "success";
  return <span className={`ad-status ad-${classe}`}><span className="ad-status-dot"/>{valor}</span>;
}

function Nivel({ valor }) {
  const cor = valor < 40 ? "danger" : valor < 75 ? "warning" : "success";
  return <div className="ad-health"><span className={`ad-health-bar ad-${cor}`} style={{ width: `${Math.max(0, Math.min(100, valor))}%` }}/></div>;
}

function Grafico({ valores = [] }) {
  if (!valores.length) return <Vazio mensagem="O backend ainda não fornece o histórico de telemetria."/>;
  const pontos = valores.length > 1 ? valores.map((valor, indice) => `${28 + indice * (622 / (valores.length - 1))},${190 - valor * 1.45}`) : [];
  const linha = pontos.join(" ");
  const area = `28,194 ${linha} 650,194`;
  return (
    <div className="ad-graph">
      <svg role="img" aria-label="Tendência de indicadores de monitoramento ao longo do período" viewBox="0 0 680 220" preserveAspectRatio="none">
        <defs><linearGradient id="aurenGraphFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--red)" stopOpacity=".24"/><stop offset="100%" stopColor="var(--red)" stopOpacity="0"/></linearGradient></defs>
        {[43, 93, 143, 193].map((y) => <line key={y} x1="28" x2="650" y1={y} y2={y} stroke="var(--line)" strokeDasharray="5 7" />)}
        <polygon points={area} fill="url(#aurenGraphFill)"/>
        <polyline points={linha} fill="none" stroke="var(--red)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        {pontos.slice(-1).map((ponto) => { const [cx,cy] = ponto.split(","); return <circle key={ponto} cx={cx} cy={cy} r="5" fill="var(--red)" stroke="var(--panel)" strokeWidth="3"/>; })}
      </svg>
      <div className="ad-graph-axis"><span>01 nov</span><span>03 nov</span><span>05 nov</span><span>07 nov</span><span>09 nov</span><span>Hoje</span></div>
    </div>
  );
}

function SecaoTitulo({ titulo, subtitulo, acao }) {
  return <div className="ad-section-title"><div><h2>{titulo}</h2>{subtitulo && <p>{subtitulo}</p>}</div>{acao}</div>;
}

function Vazio({ mensagem }) {
  return <div className="ad-empty"><Icon nome="search" tamanho={28}/><p>{mensagem}</p></div>;
}

function TabelaOrdens({ ordens, equipamentos, podeEditar, podeAtribuir, funcionarios, onEditar, onAtribuir }) {
  if (!ordens.length) return <Vazio mensagem="Nenhuma ordem de serviço encontrada."/>;
  return <div className="ad-table-wrap"><table className="ad-table"><thead><tr><th>Ordem</th><th>Equipamento / serviço</th><th>Prioridade</th><th>Status</th><th>Data</th>{(podeEditar || podeAtribuir) && <th>Ação</th>}</tr></thead><tbody>{ordens.map((ordem) => {
    const equipamento = equipamentos.find((e) => e.id === ordem.equipamentoId);
    return <tr key={ordem.id}><td className="ad-code">{ordem.codigo}</td><td><strong>{ordem.titulo}</strong><small>{equipamento?.nome ?? `Equipamento #${ordem.equipamentoId}`}</small></td><td><span className={`ad-priority ${ordem.prioridade === "Urgente" || ordem.prioridade === "Alta" ? "is-high" : ""}`}>{ordem.prioridade}</span></td><td><ClasseStatus valor={ordem.status}/></td><td className="ad-nowrap">{ordem.data}</td>{(podeEditar || podeAtribuir) && <td className="ad-actions-cell">{podeEditar && <button type="button" className="ad-text-btn" onClick={() => onEditar(ordem)}>Atualizar</button>}{podeAtribuir && funcionarios.length > 0 && <select className="ad-mini-select" aria-label={`Atribuir técnico à ${ordem.codigo}`} value={ordem.tecnicoId ?? ""} onChange={(evento) => onAtribuir(ordem.id, Number(evento.target.value))}><option value="">Sem técnico</option>{funcionarios.map((funcionario) => <option key={funcionario.id} value={funcionario.id} disabled={!funcionario.ativo}>{funcionario.nome}</option>)}</select>}</td>}</tr>;
  })}</tbody></table></div>;
}

function CartaoEquipamento({ equipamento, onMonitorar }) {
  return <article className="ad-equipment-card"><div className="ad-equip-head"><span className="ad-equip-icon"><Icon nome="cpu" tamanho={22}/></span><ClasseStatus valor={equipamento.status}/></div><div className="ad-equip-code">{equipamento.codigo}</div><h3>{equipamento.nome}</h3><p>{equipamento.local}</p><div className="ad-equip-health-label"><span>Saúde do equipamento</span><strong>{Number.isFinite(equipamento.saude) ? `${equipamento.saude}%` : "Sem dados"}</strong></div>{Number.isFinite(equipamento.saude) && <Nivel valor={equipamento.saude}/>}<div className="ad-equip-foot"><small>Leitura: {equipamento.ultimaLeitura}</small><button type="button" onClick={onMonitorar} className="ad-text-btn">Monitorar <Icon nome="chevron" tamanho={14}/></button></div></article>;
}

export default function AurenDashboard({ usuario, dados, secao, demonstracao, onLogout }) {
  const [ordens, setOrdens] = useState(dados.ordens ?? []);
  const [equipamentos, setEquipamentos] = useState(dados.equipamentos ?? []);
  const [equipamentoLeituraId, setEquipamentoLeituraId] = useState((dados.equipamentos ?? [])[0]?.id ?? null);
  const [funcionarios, setFuncionarios] = useState(dados.funcionarios ?? []);
  const [modal, setModal] = useState(null);
  const [ordemAtiva, setOrdemAtiva] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [busca, setBusca] = useState("");

  const papel = usuario.perfil;
  const podeCriarOrdem = pode(papel, "manutencoes:proprias:criar");
  const podeEditarOrdem = pode(papel, "manutencoes:atribuidas:atualizar") || pode(papel, "manutencoes:todas:atualizar");
  const podeAtribuir = pode(papel, "manutencoes:atribuir");
  const podeCriarFuncionario = pode(papel, "funcionarios:criar");
  const podeAtualizarMetricas = pode(papel, "metricas:atribuidas:atualizar") || pode(papel, "metricas:todas:atualizar");
  const navegacao = useMemo(() => menuDoPerfil(papel), [papel]);
  const equipamentoLeitura = equipamentos.find((item) => item.id === equipamentoLeituraId);
  const pecas = dados.pecas ?? [];
  const alertas = dados.alertas ?? [];
  const tituloSecao = MENU.find((item) => item.secao === secao)?.rotulo ?? "Dashboard";
  const inicial = usuario.nome.trim().charAt(0).toUpperCase();
  const saudacao = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";
  const linkSecao = (destino, perfil = papel) => `/dashboard/${destino === "visao-geral" ? "" : destino}${demonstracao ? `?perfil=${encodeURIComponent(perfil)}` : ""}`;
  const ordensFiltradas = ordens.filter((item) => [item.codigo, item.titulo, item.cliente, item.status].some((valor) => String(valor ?? "").toLowerCase().includes(busca.toLowerCase())));
  const pendentes = ordens.filter((item) => !["Concluída", "Cancelada"].includes(item.status)).length;
  const equipamentosComSaude = equipamentos.filter((item) => Number.isFinite(item.saude));
  const saudeMedia = equipamentosComSaude.length ? `${Math.round(equipamentosComSaude.reduce((soma, item) => soma + item.saude, 0) / equipamentosComSaude.length)}%` : "—";

  function executarDemo(acao) {
    if (!demonstracao) {
      setFeedback("Ação disponível após a conexão dos endpoints autenticados do backend TechAssist.");
      return false;
    }
    acao();
    return true;
  }

  function criarSolicitacao(evento) {
    evento.preventDefault();
    if (!podeCriarOrdem) return;
    const valores = new FormData(evento.currentTarget);
    const equipamentoId = Number(valores.get("equipamentoId"));
    if (!equipamentos.some((item) => item.id === equipamentoId)) return;
    const titulo = String(valores.get("titulo") ?? "").trim();
    if (titulo.length < 5) return;
    executarDemo(() => {
      const id = Math.max(2052, ...ordens.map((item) => item.id)) + 1;
      const nova = { id, codigo: `OS-${id}`, titulo, equipamentoId, clienteId: usuario.id_cliente ?? 101, tecnicoId: null, cliente: usuario.nome, tecnico: "Não atribuído", prioridade: valores.get("prioridade"), status: "Pendente", data: String(valores.get("data") || "A definir"), tipo: "Reparo manual" };
      setOrdens((anteriores) => [nova, ...anteriores]);
      setModal(null);
      setFeedback(`${nova.codigo} criada em modo de demonstração. Nenhum dado foi gravado no banco.`);
    });
  }

  function atualizarOrdem(evento) {
    evento.preventDefault();
    if (!podeEditarOrdem || !ordemAtiva) return;
    const valores = new FormData(evento.currentTarget);
    const novoStatus = String(valores.get("status"));
    executarDemo(() => {
      setOrdens((anteriores) => anteriores.map((item) => item.id === ordemAtiva.id ? { ...item, status: novoStatus } : item));
      setModal(null);
      setFeedback(`${ordemAtiva.codigo} atualizada localmente para “${novoStatus}”.`);
    });
  }

  function atribuirOrdem(id, tecnicoId) {
    if (!podeAtribuir) return;
    executarDemo(() => {
      const tecnico = funcionarios.find((pessoa) => pessoa.id === tecnicoId);
      setOrdens((anteriores) => anteriores.map((item) => item.id === id ? { ...item, tecnicoId, tecnico: tecnico?.nome ?? "Não atribuído" } : item));
      setFeedback(`Responsável da OS-${id} alterado apenas na demonstração.`);
    });
  }

  function registrarLeitura(evento) {
    evento.preventDefault();
    if (!podeAtualizarMetricas || !equipamentoLeitura) return;
    const valores = new FormData(evento.currentTarget);
    const nome = String(valores.get("metrica"));
    const valorNumerico = Number(valores.get("valor"));
    if (!Number.isFinite(valorNumerico) || !equipamentoLeitura.metricas.some((m) => m.nome === nome)) return;
    executarDemo(() => {
      setEquipamentos((anteriores) => anteriores.map((item) => item.id !== equipamentoLeitura.id ? item : { ...item, ultimaLeitura: "Agora (manual)", metricas: item.metricas.map((metrica) => metrica.nome === nome ? { ...metrica, valor: String(valorNumerico).replace(".", ",") } : metrica) }));
      setModal(null);
      setFeedback(`Leitura de “${nome}” registrada localmente. O estado de saúde não foi recalculado.`);
    });
  }

  function criarFuncionario(evento) {
    evento.preventDefault();
    if (!podeCriarFuncionario) return;
    const valores = new FormData(evento.currentTarget);
    const nome = String(valores.get("nome") ?? "").trim();
    const email = String(valores.get("email") ?? "").trim();
    const funcao = String(valores.get("funcao") ?? "").trim();
    if (!nome || !email || !funcao) return;
    executarDemo(() => {
      const id = Math.max(20, ...funcionarios.map((item) => item.id)) + 1;
      setFuncionarios((pessoas) => [...pessoas, { id, nome, email, funcao, ativo: true, servicos: 0 }]);
      setModal(null);
      setFeedback("Funcionário adicionado somente à demonstração, sem criar conta real.");
    });
  }

  const cards = papel === "cliente" ? [
    ["Meus equipamentos", equipamentos.length, "cpu", "Cadastrados na TechAssist"],
    ["Peças monitoradas", pecas.length, "activity", "Componentes acompanhados"],
    ["Serviços em aberto", pendentes, "tool", "Solicitações e preventivas"],
    ["Alertas ativos", alertas.length, "alert", "Necessitam acompanhamento"],
  ] : papel === "funcionario" ? [
    ["Equipamentos atribuídos", equipamentos.length, "cpu", "Sob sua responsabilidade"],
    ["Ordens em aberto", pendentes, "tool", "Serviços da sua agenda"],
    ["Alertas técnicos", alertas.length, "alert", "Equipamentos atribuídos"],
    ["Saúde média", saudeMedia, "activity", "Dos equipamentos acompanhados"],
  ] : [
    ["Equipamentos", equipamentos.length, "cpu", "Total sob monitoramento"],
    ["Ordens em aberto", pendentes, "tool", "Acompanhamento da operação"],
    ["Alertas ativos", alertas.length, "alert", "Monitoramento automático"],
    ["Equipe técnica", funcionarios.filter((pessoa) => pessoa.ativo).length, "users", "Funcionários ativos"],
  ];

  let conteudo;
  if (secao === "visao-geral") {
    conteudo = <>
      <div className="ad-welcome"><div><span className="ad-kicker">GESTÃO INTELIGENTE DE MANUTENÇÃO</span><h2>{saudacao}, {usuario.nome.split(" ")[0]} <span className="ad-wave">✦</span></h2><p>{papel === "cliente" ? "Acompanhe seus equipamentos, receba alertas e solicite serviços com facilidade." : papel === "funcionario" ? "Suas atividades, ordens atribuídas e equipamentos em um só lugar." : "Gerencie a operação, antecipe falhas e mantenha tudo funcionando."}</p></div><div className="ad-welcome-spark"><Icon nome="activity" tamanho={49}/></div></div>
      <div className="ad-kpi-grid">{cards.map(([rotulo, valor, icone, detalhe]) => <article className="ad-kpi" key={rotulo}><div className="ad-kpi-top"><span>{rotulo}</span><span className="ad-kpi-icon"><Icon nome={icone} tamanho={19}/></span></div><strong>{valor}</strong><small>{detalhe}</small></article>)}</div>
      <div className="ad-insight-grid"><section className="ad-panel"><div className="ad-panel-title"><div><h3>Panorama do monitoramento</h3><p>Indicadores das últimas leituras</p></div><span className="ad-live"><span/> Monitoramento híbrido</span></div><Grafico valores={dados.historicoMedicoes ?? []}/></section><section className="ad-panel"><div className="ad-panel-title"><div><h3>Alertas recentes</h3><p>O que merece atenção</p></div><span className="ad-notification-count">{alertas.length}</span></div><div className="ad-alert-list">{alertas.slice(0, 3).map((alerta) => <article key={alerta.id} className="ad-alert-item"><span className={`ad-alert-icon ${alerta.nivel === "Crítico" ? "is-critical" : ""}`}><Icon nome="alert" tamanho={17}/></span><div><strong>{alerta.titulo}</strong><p>{alerta.detalhe}</p><small>{alerta.quando}</small></div></article>)}{!alertas.length && <Vazio mensagem="Nenhum alerta registrado."/>}</div><Link className="ad-panel-link" href={linkSecao("monitoramento")}>Ver monitoramento <Icon nome="arrow" tamanho={16}/></Link></section></div>
      <section className="ad-panel ad-orders-section"><SecaoTitulo titulo="Ordens recentes" subtitulo="Acompanhe as últimas movimentações" acao={<Link href={linkSecao(papel === "cliente" ? "solicitacoes" : "ordens")} className="ad-panel-link">Ver todas <Icon nome="arrow" tamanho={16}/></Link>}/><TabelaOrdens ordens={ordens.slice(0, 4)} equipamentos={equipamentos} podeEditar={false} podeAtribuir={false} funcionarios={[]} /></section>
    </>;
  } else if (secao === "equipamentos") {
    conteudo = <><SecaoTitulo titulo="Equipamentos monitorados" subtitulo="Condição atual e últimas leituras dos ativos disponíveis para seu perfil"/><div className="ad-equipment-grid">{equipamentos.map((equipamento) => <CartaoEquipamento key={equipamento.id} equipamento={equipamento} onMonitorar={() => window.location.assign(linkSecao("monitoramento"))}/>)}</div>{!equipamentos.length && <Vazio mensagem="Nenhum equipamento disponível para este perfil."/>}</>;
  } else if (secao === "monitoramento") {
    conteudo = <><SecaoTitulo titulo="Monitoramento de equipamentos e peças" subtitulo="Métricas configuráveis, condição das peças e alertas de manutenção" acao={<span className="ad-live"><span/> Leituras flexíveis</span>}/><div className="ad-monitor-grid">{equipamentos.map((equipamento) => <section className="ad-panel ad-monitor-card" key={equipamento.id}><div className="ad-panel-title"><div><span className="ad-equip-code">{equipamento.codigo}</span><h3>{equipamento.nome}</h3></div><ClasseStatus valor={equipamento.status}/></div><div className="ad-metric-grid">{equipamento.metricas.map((metrica) => <div className="ad-metric" key={metrica.nome}><small>{metrica.nome}</small><strong>{metrica.valor} <span>{metrica.unidade}</span></strong><Nivel valor={100 - Math.min(100, metrica.percentual)}/></div>)}</div><div className="ad-monitor-foot"><small className="ad-muted">Última leitura: {equipamento.ultimaLeitura}</small>{podeAtualizarMetricas && <button className="ad-text-btn" type="button" onClick={() => { setEquipamentoLeituraId(equipamento.id); setModal("registrar-leitura"); }}>Registrar leitura</button>}</div></section>)}</div><section className="ad-panel ad-orders-section"><SecaoTitulo titulo="Condição das peças" subtitulo="Integridade estimada dos componentes cadastrados"/><div className="ad-parts-grid">{pecas.map((peca) => <div className="ad-part" key={peca.id}><div><strong>{peca.nome}</strong><small>{equipamentos.find((item) => item.id === peca.equipamentoId)?.nome}</small></div><ClasseStatus valor={peca.estado}/><div className="ad-part-progress"><Nivel valor={peca.integridade}/><strong>{peca.integridade}%</strong></div></div>)}</div>{!pecas.length && <Vazio mensagem="Nenhuma peça monitorada."/>}</section></>;
  } else if (secao === "solicitacoes") {
    conteudo = <><div className="ad-page-hero"><div><h2>Precisa de manutenção?</h2><p>Solicite um reparo manual ou acompanhe as preventivas planejadas para os seus equipamentos.</p></div><button type="button" className="ad-primary-btn" onClick={() => demonstracao ? setModal("nova-solicitacao") : window.location.assign("/orcamento")}><Icon nome="plus" tamanho={18}/> Nova solicitação</button></div><section className="ad-panel ad-orders-section"><SecaoTitulo titulo="Minhas solicitações" subtitulo="Histórico e andamento dos serviços"/><TabelaOrdens ordens={ordensFiltradas} equipamentos={equipamentos} podeEditar={false} podeAtribuir={false} funcionarios={[]}/></section></>;
  } else if (secao === "ordens") {
    conteudo = <><SecaoTitulo titulo="Ordens de serviço" subtitulo={papel === "funcionario" ? "Atualize a execução das atividades atribuídas a você" : "Controle prazos, responsáveis e etapas de execução"}/><div className="ad-toolbar"><div className="ad-search"><Icon nome="search" tamanho={18}/><input aria-label="Buscar ordens" placeholder="Buscar por OS, serviço ou status..." value={busca} onChange={(e) => setBusca(e.target.value)}/></div><span className="ad-toolbar-info">{ordensFiltradas.length} ordens</span></div><section className="ad-panel ad-table-panel"><TabelaOrdens ordens={ordensFiltradas} equipamentos={equipamentos} podeEditar={podeEditarOrdem} podeAtribuir={podeAtribuir} funcionarios={funcionarios} onEditar={(ordem) => {setOrdemAtiva(ordem); setModal("editar-ordem");}} onAtribuir={atribuirOrdem}/></section></>;
  } else if (secao === "agenda") {
    conteudo = <><SecaoTitulo titulo="Agenda e histórico" subtitulo="Próximos atendimentos e serviços já realizados"/><div className="ad-agenda-grid"><section className="ad-panel"><h3>Próximos serviços</h3><div className="ad-timeline">{ordens.filter((item) => item.status !== "Concluída").map((ordem) => <div className="ad-time-entry" key={ordem.id}><span className="ad-time-dot"/><div><small>{ordem.data} · {ordem.codigo}</small><strong>{ordem.titulo}</strong><span>{ordem.tecnico || "A definir"}</span></div><ClasseStatus valor={ordem.status}/></div>)}{!pendentes && <Vazio mensagem="Sem serviços agendados."/>}</div></section><section className="ad-panel"><h3>Histórico concluído</h3><div className="ad-timeline">{ordens.filter((item) => item.status === "Concluída").map((ordem) => <div className="ad-time-entry" key={ordem.id}><span className="ad-time-dot is-done"/><div><small>{ordem.data} · {ordem.codigo}</small><strong>{ordem.titulo}</strong><span>{ordem.tipo}</span></div><Icon nome="check" tamanho={20}/></div>)}{!ordens.some((item) => item.status === "Concluída") && <Vazio mensagem="Nenhuma manutenção concluída neste período."/>}</div></section></div></>;
  } else if (secao === "funcionarios") {
    conteudo = <><SecaoTitulo titulo="Gestão de funcionários" subtitulo="Cadastre técnicos, consulte responsabilidades e organize a equipe" acao={<button className="ad-primary-btn" onClick={() => setModal("novo-funcionario")}><Icon nome="plus" tamanho={18}/> Cadastrar funcionário</button>}/><section className="ad-panel ad-table-panel"><div className="ad-table-wrap"><table className="ad-table"><thead><tr><th>Funcionário</th><th>Função</th><th>Status</th><th>Serviços</th><th>Ação</th></tr></thead><tbody>{funcionarios.map((pessoa) => <tr key={pessoa.id}><td><strong>{pessoa.nome}</strong><small>{pessoa.email}</small></td><td>{pessoa.funcao}</td><td><ClasseStatus valor={pessoa.ativo ? "Ativo" : "Inativo"}/></td><td>{pessoa.servicos}</td><td><button type="button" className="ad-text-btn" onClick={() => executarDemo(() => {setFuncionarios((lista) => lista.map((item) => item.id === pessoa.id ? {...item, ativo: !item.ativo} : item)); setFeedback(`Status de ${pessoa.nome} alterado apenas na demonstração.`);})}>{pessoa.ativo ? "Desativar" : "Reativar"}</button></td></tr>)}</tbody></table></div></section></>;
  } else if (secao === "relatorios") {
    conteudo = <><SecaoTitulo titulo="Relatórios operacionais" subtitulo="Indicadores para tomada de decisão e planejamento preventivo"/><div className="ad-kpi-grid ad-report-kpis">{cards.map(([rotulo, valor, icone, detalhe]) => <article key={rotulo} className="ad-kpi"><div className="ad-kpi-top"><span>{rotulo}</span><span className="ad-kpi-icon"><Icon nome={icone} tamanho={18}/></span></div><strong>{valor}</strong><small>{detalhe}</small></article>)}</div><section className="ad-panel ad-orders-section"><h3>Saúde dos equipamentos</h3><div className="ad-report-bars">{equipamentos.map((item) => <div className="ad-report-row" key={item.id}><span>{item.nome}</span>{Number.isFinite(item.saude) ? <><Nivel valor={item.saude}/><strong>{item.saude}%</strong></> : <><span className="ad-muted">Telemetria indisponível</span><strong>—</strong></>}</div>)}</div></section></>;
  } else if (secao === "auditoria") {
    conteudo = <><SecaoTitulo titulo="Trilha de auditoria" subtitulo="Eventos administrativos e técnicos para rastreabilidade"/><section className="ad-panel ad-table-panel"><div className="ad-table-wrap"><table className="ad-table"><thead><tr><th>Evento</th><th>Usuário / origem</th><th>Módulo</th><th>Data</th></tr></thead><tbody>{(dados.auditoria ?? []).map((evento) => <tr key={evento.id}><td><strong>{evento.acao}</strong></td><td>{evento.usuario}</td><td>{evento.modulo}</td><td>{evento.quando}</td></tr>)}</tbody></table></div></section></>;
  } else if (secao === "integracoes") {
    conteudo = <><SecaoTitulo titulo="Integrações e sistema" subtitulo="Visão técnica dos serviços conectados ao ecossistema TechAssist"/><div className="ad-integrations">{(dados.integracoes ?? []).map((item) => <article className="ad-panel ad-integration" key={item.nome}><span className="ad-integration-icon"><Icon nome="settings" tamanho={24}/></span><div><h3>{item.nome}</h3><p>{item.descricao}</p></div><ClasseStatus valor={item.estado}/></article>)}</div><p className="ad-note">As informações exibidas aqui são exemplos; os logs, as integrações e a supervisão real precisam ser fornecidos pelo backend.</p></>;
  } else if (secao === "suporte") {
    conteudo = <SupportChat usuario={usuario} demonstracao={demonstracao}/>;
  } else if (secao === "perfil") {
    conteudo = <><SecaoTitulo titulo="Meu perfil" subtitulo="Informações da sua conta e permissões de acesso"/><section className="ad-panel ad-profile-card"><span className="ad-profile-avatar">{inicial}</span><div><h3>{usuario.nome}</h3><p>{usuario.email}</p><ClasseStatus valor={NOMES_PERFIS[papel]}/><p className="ad-note">Edição de informações pessoais: integrar à rota autenticada do perfil no backend.</p></div></section></>;
  }

  return (
    <div className="auren-dashboard">
      <aside className={`ad-sidebar ${mobileMenu ? "is-open" : ""}`}>
        <div className="ad-brand"><span className="ad-brand-mark"><Icon nome="activity" tamanho={25}/></span><div><strong>TechAssist<span>.</span></strong><small>Suporte e manutenção</small></div></div>
        <div className="ad-sidebar-label">MENU PRINCIPAL</div>
        <nav className="ad-navigation" aria-label="Navegação principal">{navegacao.map((item) => <Link key={item.secao} href={linkSecao(item.secao)} onClick={() => setMobileMenu(false)} className={`ad-nav-link ${secao === item.secao ? "is-active" : ""}`}><Icon nome={item.icone} tamanho={19}/><span>{item.rotulo}</span>{secao === item.secao && <span className="ad-nav-active-dot"/>}</Link>)}</nav>
        <div className="ad-sidebar-bottom"><div className="ad-assistance"><span><Icon nome="shield" tamanho={18}/></span><strong>Manutenção inteligente</strong><p>Dados, pessoas e equipamentos conectados.</p></div><div className="ad-sidebar-profile"><span className="ad-avatar">{inicial}</span><div><strong>{usuario.nome}</strong><small>{NOMES_PERFIS[papel]}</small></div></div></div>
      </aside>
      {mobileMenu && <button className="ad-mobile-overlay" aria-label="Fechar menu" onClick={() => setMobileMenu(false)}/>}
      <div className="ad-main-wrapper"><header className="ad-topbar"><div className="ad-top-left"><button type="button" className="ad-mobile-trigger" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Icon nome="menu"/></button><div className="ad-breadcrumb"><span>Área de trabalho</span><Icon nome="chevron" tamanho={15}/><strong>{tituloSecao}</strong></div></div><div className="ad-top-right"><Link href="/" className="ad-site-link" aria-label="Voltar ao site principal"><Icon nome="arrow" tamanho={16}/><span>Voltar ao site</span></Link><span className="ad-role-tag">{NOMES_PERFIS[papel]}</span><span className="ad-top-separator"/><span className="ad-top-avatar">{inicial}</span>{onLogout && <button type="button" className="ad-logout-btn" onClick={onLogout}>Sair</button>}</div></header>
        <main className="ad-content">{demonstracao && <div className="ad-demo-banner"><span><Icon nome="settings" tamanho={16}/> Modo de demonstração — dados fictícios e ações locais.</span><label>Visualizar perfil <select value={papel} onChange={(evento) => window.location.assign(linkSecao("visao-geral", evento.target.value))}>{Object.keys(NOMES_PERFIS).map((perfil) => <option key={perfil} value={perfil}>{NOMES_PERFIS[perfil]}</option>)}</select></label></div>}{feedback && <div className="ad-feedback" role="status"><Icon nome="check" tamanho={17}/>{feedback}<button type="button" onClick={() => setFeedback("")} aria-label="Fechar aviso"><Icon nome="close" tamanho={16}/></button></div>}{secao !== "visao-geral" && <div className="ad-page-heading"><span className="ad-kicker">TECHASSIST / {tituloSecao.toUpperCase()}</span><h1>{tituloSecao}</h1></div>}{conteudo}<footer className="ad-footer"><span>© 2026 TechAssist Pro · Assistência técnica</span><span>Dashboard multiusuário</span></footer></main>
      </div>
      {modal && <div className="ad-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}><section className="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ad-modal-title"><div className="ad-modal-header"><h2 id="ad-modal-title">{modal === "nova-solicitacao" ? "Nova solicitação de reparo" : modal === "novo-funcionario" ? "Cadastrar funcionário" : modal === "registrar-leitura" ? "Registrar leitura manual" : "Atualizar ordem de serviço"}</h2><button type="button" onClick={() => setModal(null)} aria-label="Fechar"><Icon nome="close"/></button></div>
          {modal === "nova-solicitacao" && <form onSubmit={criarSolicitacao} className="ad-form"><label>Equipamento <select name="equipamentoId" required>{equipamentos.map((item) => <option key={item.id} value={item.id}>{item.codigo} · {item.nome}</option>)}</select></label><label>Descrição do problema <textarea name="titulo" required minLength={5} maxLength={180} placeholder="Descreva o sintoma ou serviço desejado" rows={3}/></label><div className="ad-form-two"><label>Prioridade <select name="prioridade"><option>Baixa</option><option>Média</option><option>Alta</option></select></label><label>Data preferida <input name="data" type="date" required/></label></div><div className="ad-form-footer"><button type="button" className="ad-secondary-btn" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="ad-primary-btn">Solicitar reparo</button></div></form>}
          {modal === "editar-ordem" && <form onSubmit={atualizarOrdem} className="ad-form"><p className="ad-muted">{ordemAtiva?.codigo} · {ordemAtiva?.titulo}</p><label>Etapa atual <select name="status" defaultValue={ordemAtiva?.status}><option>Pendente</option><option>Agendada</option><option>Em andamento</option><option>Concluída</option></select></label><div className="ad-form-footer"><button type="button" className="ad-secondary-btn" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="ad-primary-btn">Salvar atualização</button></div></form>}
          {modal === "registrar-leitura" && equipamentoLeitura && <form onSubmit={registrarLeitura} className="ad-form"><p className="ad-muted">{equipamentoLeitura.codigo} · {equipamentoLeitura.nome}</p><label>Métrica <select name="metrica" required>{equipamentoLeitura.metricas.map((metrica) => <option key={metrica.nome} value={metrica.nome}>{metrica.nome} ({metrica.unidade})</option>)}</select></label><label>Valor medido <input name="valor" type="number" step="any" required placeholder="Ex.: 2.7"/></label><p className="ad-note">Os limites e a condição do equipamento serão recalculados pelo serviço de monitoramento após a integração real.</p><div className="ad-form-footer"><button type="button" className="ad-secondary-btn" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="ad-primary-btn">Registrar leitura</button></div></form>}
          {modal === "novo-funcionario" && <form onSubmit={criarFuncionario} className="ad-form"><label>Nome completo <input name="nome" required minLength={3} placeholder="Nome do funcionário"/></label><label>E-mail corporativo <input name="email" type="email" required placeholder="funcionario@empresa.com"/></label><label>Função <input name="funcao" required placeholder="Ex.: Técnico de manutenção"/></label><p className="ad-note">Em produção, o backend deve gerar o convite de ativação; o administrador não define a senha do funcionário.</p><div className="ad-form-footer"><button type="button" className="ad-secondary-btn" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="ad-primary-btn">Cadastrar funcionário</button></div></form>}
        </section></div>}
    </div>
  );
}
