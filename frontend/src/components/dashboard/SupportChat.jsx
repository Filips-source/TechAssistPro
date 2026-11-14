"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, getSession } from "../techassist/api";

const categorias = ["Suporte geral", "Problema técnico", "Ordem de serviço", "Peças e equipamentos", "Outros"];
const nomesStatus = { aberto: "Aguardando atendimento", em_atendimento: "Em atendimento", resolvido: "Resolvido" };
const conversaDemo = {
  id: 9001, clienteId: 101, clienteNome: "Mariana Oliveira", assunto: "Dúvida sobre minha manutenção",
  categoria: "Ordem de serviço", status: "em_atendimento",
  atualizadoEm: "2026-11-12 08:00:00", ultimaMensagem: "Vou verificar a situação do equipamento.",
};
const mensagensDemo = [
  { id: 1, conversaId: 9001, remetenteTipo: "cliente", remetenteNome: "Mariana Oliveira", texto: "Olá! Gostaria de saber como está o andamento da manutenção do meu equipamento.", criadoEm: "2026-11-12 07:58:00" },
  { id: 2, conversaId: 9001, remetenteTipo: "equipe", remetenteNome: "Equipe TechAssist", texto: "Olá, Mariana! Vou verificar a situação do equipamento.", criadoEm: "2026-11-12 08:00:00" },
];

function horario(valor) {
  if (!valor) return "";
  const data = new Date(String(valor).replace(" ", "T"));
  return Number.isNaN(data.getTime()) ? "" : data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function dia(valor) {
  if (!valor) return "";
  const data = new Date(String(valor).replace(" ", "T"));
  return Number.isNaN(data.getTime()) ? "" : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
function avatar(nome) {
  return String(nome || "T").split(/\s+/).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("");
}
function ChatSymbol({ size = 20 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11.3a7.6 7.6 0 0 1-7.6 7.6H7l-4 2v-5.4a7.6 7.6 0 1 1 17-4.2Z"/><path d="M8 10.5h8M8 14h5"/></svg>;
}

export default function SupportChat({ usuario, demonstracao = false }) {
  const agente = ["administrador", "desenvolvedor"].includes(usuario.perfil);
  const [aba, setAba] = useState("conversas");
  const [contatos, setContatos] = useState([]);
  const [carregandoContatos, setCarregandoContatos] = useState(false);
  const [conversas, setConversas] = useState(demonstracao ? [conversaDemo] : []);
  const [selecionadaId, setSelecionadaId] = useState(demonstracao ? conversaDemo.id : null);
  const [mensagens, setMensagens] = useState(demonstracao ? mensagensDemo : []);
  const [mensagensDemoPorConversa, setMensagensDemoPorConversa] = useState({ 9001: mensagensDemo });
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [novo, setNovo] = useState(false);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(!demonstracao);
  const [enviando, setEnviando] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [sinal, setSinal] = useState(0);
  const fimRef = useRef(null);
  const chatRef = useRef(null);
  const ultimaIdRef = useRef(null);

  const recarregarContatos = useCallback(async () => {
    if (!agente || demonstracao) return;
    setCarregandoContatos(true);
    try { setContatos(await api("/contatos")); }
    catch (e) { setErro(e.message); }
    finally { setCarregandoContatos(false); }
  }, [agente, demonstracao]);

  useEffect(() => { if (agente && !demonstracao) recarregarContatos(); }, [agente, demonstracao, recarregarContatos]);

  const recarregarConversas = useCallback(async () => {
    if (demonstracao) return;
    const lista = await api("/suporte/conversas");
    setConversas(lista);
    setSelecionadaId((anterior) => lista.some((item) => item.id === anterior) ? anterior : lista[0]?.id ?? null);
    setCarregando(false);
  }, [demonstracao]);

  useEffect(() => {
    if (demonstracao) return;
    let ativo = true;
    recarregarConversas().catch((e) => {
      if (ativo) { setErro(e.message); setCarregando(false); }
    });
    return () => { ativo = false; };
  }, [recarregarConversas, sinal, demonstracao]);

  useEffect(() => {
    if (!selecionadaId) { setMensagens([]); return; }
    if (demonstracao) { setMensagens(mensagensDemoPorConversa[selecionadaId] ?? []); return; }
    let ativo = true;
    api(`/suporte/conversas/${selecionadaId}/mensagens`).then((lista) => {
      if (ativo) setMensagens(lista);
    }).catch((e) => { if (ativo) setErro(e.message); });
    return () => { ativo = false; };
  }, [selecionadaId, demonstracao, sinal, mensagensDemoPorConversa]);

  useEffect(() => {
    if (demonstracao) return;
    const controller = new AbortController();
    let encerrado = false;
    let espera;
    async function escutar() {
      while (!encerrado) {
        try {
          const token = getSession()?.token;
          if (!token) return;
          const base = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
          // Fetch streaming envia o JWT no cabeçalho; nunca expõe o token na URL.
          const resposta = await fetch(`${base}/suporte/eventos`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
            cache: "no-store", signal: controller.signal,
          });
          if (!resposta.ok || !resposta.body) throw new Error("Canal indisponível");
          setConectado(true);
          const reader = resposta.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          while (!encerrado) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
            let fim;
            while ((fim = buffer.indexOf("\n\n")) >= 0) {
              const evento = buffer.slice(0, fim);
              buffer = buffer.slice(fim + 2);
              if (evento.split("\n").some((linha) => linha.trim() === "event: atualizacao")) {
                setSinal((atual) => atual + 1);
              }
            }
          }
        } catch {
          // Reconexão automática em caso de queda da rede ou reinício da API.
        }
        if (!encerrado) setConectado(false);
        if (encerrado) break;
        await new Promise((resolve) => { espera = setTimeout(resolve, 2500); });
      }
    }
    escutar();
    const fallback = setInterval(() => setSinal((atual) => atual + 1), 15000);
    return () => {
      encerrado = true;
      controller.abort();
      clearInterval(fallback);
      if (espera) clearTimeout(espera);
    };
  }, [demonstracao]);

  useEffect(() => {
    // Acompanha a conversa ao abrir e quando chegam mensagens novas.
    const idUltima = mensagens.at(-1)?.id;
    if (selecionadaId !== ultimaIdRef.current?.conversaId || idUltima !== ultimaIdRef.current?.mensagemId) {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      ultimaIdRef.current = { conversaId: selecionadaId, mensagemId: idUltima };
    }
  }, [mensagens, selecionadaId]);

  const conversa = conversas.find((item) => item.id === selecionadaId) ?? null;
  const filtradas = conversas.filter((item) => {
    const combinaFiltro = filtro === "todas" || item.status === filtro;
    const alvo = `${item.assunto} ${item.clienteNome} ${item.categoria} ${item.ultimaMensagem}`.toLocaleLowerCase("pt-BR");
    return combinaFiltro && alvo.includes(pesquisa.toLocaleLowerCase("pt-BR"));
  });
  const abertas = conversas.filter((item) => item.status !== "resolvido").length;

  async function criarConversa(evento) {
    evento.preventDefault();
    if (agente || enviando) return;
    const form = new FormData(evento.currentTarget);
    const dados = { assunto: String(form.get("assunto") || "").trim(), categoria: String(form.get("categoria") || "Suporte geral"), mensagem: String(form.get("mensagem") || "").trim() };
    if (dados.assunto.length < 4 || dados.mensagem.length < 2) return;
    setEnviando(true); setErro("");
    try {
      if (demonstracao) {
        const item = { ...conversaDemo, id: Date.now(), clienteId: usuario.id, clienteNome: usuario.nome, assunto: dados.assunto, categoria: dados.categoria, status: "aberto", atualizadoEm: new Date().toISOString(), ultimaMensagem: dados.mensagem };
        setMensagensDemoPorConversa((anterior) => ({ ...anterior, [item.id]: [{ id: Date.now(), conversaId: item.id, remetenteTipo: "cliente", remetenteNome: usuario.nome, texto: dados.mensagem, criadoEm: new Date().toISOString() }] }));
        setConversas((anterior) => [item, ...anterior]);
        setSelecionadaId(item.id);
      } else {
        const criada = await api("/suporte/conversas", { method: "POST", body: dados });
        await recarregarConversas();
        setSelecionadaId(criada.id);
        setSinal((atual) => atual + 1);
      }
      setNovo(false);
    } catch (e) { setErro(e.message); }
    finally { setEnviando(false); }
  }

  async function enviarMensagem(evento) {
    evento.preventDefault();
    const conteudo = texto.trim();
    if (!conversa || !conteudo || enviando) return;
    setEnviando(true); setErro("");
    try {
      if (demonstracao) {
        const nova = { id: Date.now(), conversaId: conversa.id, remetenteTipo: agente ? "equipe" : "cliente", remetenteNome: usuario.nome, texto: conteudo, criadoEm: new Date().toISOString() };
        setMensagensDemoPorConversa((anterior) => ({ ...anterior, [conversa.id]: [...(anterior[conversa.id] ?? []), nova] }));
        setConversas((anterior) => anterior.map((item) => item.id === conversa.id ? { ...item, ultimaMensagem: conteudo, status: agente ? "em_atendimento" : "aberto", atualizadoEm: nova.criadoEm } : item));
      } else {
        await api(`/suporte/conversas/${conversa.id}/mensagens`, { method: "POST", body: { mensagem: conteudo } });
        setSinal((atual) => atual + 1);
      }
      setTexto("");
    } catch (e) { setErro(e.message); }
    finally { setEnviando(false); }
  }

  async function mudarStatus(status) {
    if (!agente || !conversa) return;
    setErro("");
    try {
      if (demonstracao) {
        setConversas((anterior) => anterior.map((item) => item.id === conversa.id ? { ...item, status } : item));
      } else {
        await api(`/suporte/conversas/${conversa.id}/status`, { method: "PATCH", body: { status } });
        setSinal((atual) => atual + 1);
      }
    } catch (e) { setErro(e.message); }
  }

  return (
    <div className="support-page">
      <div className="support-hero">
        <div className="support-hero-symbol"><ChatSymbol size={25}/></div>
        <div className="support-hero-copy"><span className="support-overline">CENTRAL DE ATENDIMENTO</span><h2>{agente ? "Conversas com clientes" : "Estamos aqui para ajudar"}</h2><p>{agente ? "Acompanhe solicitações e responda diretamente pelo painel." : "Fale com a equipe TechAssist e acompanhe seu atendimento em um só lugar."}</p></div>
        <div className="support-hero-metric"><strong>{abertas}</strong><span>{agente ? "conversas em aberto" : "atendimentos ativos"}</span></div>
      </div>

      {demonstracao && <div className="support-demo-notice" role="status">Prévia visual: estas mensagens são locais e não chegam ao outro perfil. Para usar o chat ao vivo, inicie o backend com MySQL e configure AUREN_DASHBOARD_DEMO=false.</div>}
      {erro && <div className="support-error" role="alert">{erro}<button type="button" onClick={() => { setErro(""); setSinal((v) => v + 1); }}>Tentar novamente</button></div>}

      {agente && <div className="support-tabs" role="tablist" aria-label="Áreas do suporte"><button role="tab" aria-selected={aba === "conversas"} className={aba === "conversas" ? "is-active" : ""} onClick={() => setAba("conversas")}>Chat ao vivo <span>{abertas}</span></button><button role="tab" aria-selected={aba === "contatos"} className={aba === "contatos" ? "is-active" : ""} onClick={() => setAba("contatos")}>Mensagens do site <span>{contatos.length}</span></button></div>}
      {agente && aba === "contatos" && <section className="support-contact-panel" aria-label="Mensagens do formulário de contato"><div className="support-contact-head"><div><h3>Mensagens recebidas pelo site</h3><p>Solicitações enviadas pelo formulário de contato da TechAssist.</p></div><button type="button" className="support-cancel" onClick={recarregarContatos} disabled={carregandoContatos}>Atualizar</button></div>{carregandoContatos ? <p className="support-list-empty">Carregando mensagens...</p> : !contatos.length ? <p className="support-list-empty">Nenhuma mensagem recebida pelo formulário de contato.</p> : <div className="support-contact-grid">{contatos.map((contato) => <article className="support-contact-card" key={contato.id_contato}><div className="support-contact-card-top"><span className="support-contact-category">{contato.assunto}</span><time>{dia(contato.criado_em)}</time></div><h4>{contato.nome}</h4><p>{contato.mensagem}</p><div className="support-contact-bottom"><span>{contato.email} · {contato.telefone}</span><a href={`mailto:${contato.email}?subject=${encodeURIComponent(`Retorno TechAssist: ${contato.assunto}`)}`}>Responder por e-mail</a></div></article>)}</div>}</section>}
      {(!agente || aba === "conversas") && <div className="support-layout">
        <aside className="support-inbox" aria-label="Conversas de suporte">
          <div className="support-inbox-head"><div><h3>{agente ? "Caixa de entrada" : "Meus atendimentos"}</h3><p>{conversas.length} conversa{conversas.length === 1 ? "" : "s"}</p></div>{!agente && <button type="button" className="support-new-btn" onClick={() => setNovo((valor) => !valor)} aria-label="Iniciar atendimento">+</button>}</div>
          {!agente && <button type="button" className="support-start-link" onClick={() => setNovo((valor) => !valor)}>{novo ? "Fechar nova solicitação" : "+ Iniciar nova conversa"}</button>}
          <div className="support-search"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input aria-label="Buscar conversas" placeholder="Buscar atendimento..." value={pesquisa} onChange={(e) => setPesquisa(e.target.value)}/></div>
          <div className="support-filters" aria-label="Filtrar conversas"><button className={filtro === "todas" ? "is-selected" : ""} onClick={() => setFiltro("todas")}>Todas</button><button className={filtro === "aberto" ? "is-selected" : ""} onClick={() => setFiltro("aberto")}>Abertas</button><button className={filtro === "resolvido" ? "is-selected" : ""} onClick={() => setFiltro("resolvido")}>Resolvidas</button></div>
          <div className="support-conversation-list">
            {carregando && <p className="support-list-empty">Carregando atendimentos...</p>}
            {!carregando && !filtradas.length && <div className="support-list-empty"><ChatSymbol size={24}/><p>Nenhum atendimento encontrado.</p></div>}
            {filtradas.map((item) => <button type="button" key={item.id} className={`support-thread ${item.id === selecionadaId ? "is-selected" : ""}`} onClick={() => { setSelecionadaId(item.id); setNovo(false); setTexto(""); setMensagens([]); }}><span className="support-thread-avatar">{avatar(agente ? item.clienteNome : "TechAssist")}</span><span className="support-thread-copy"><span className="support-thread-top"><strong>{agente ? item.clienteNome : item.assunto}</strong><time>{dia(item.atualizadoEm)}</time></span><span className="support-thread-subject">{agente ? item.assunto : item.categoria}</span><span className="support-thread-preview">{item.ultimaMensagem || "Conversa iniciada"}</span></span><span className={`support-thread-state support-state-${item.status}`} aria-label={nomesStatus[item.status]}/></button>)}
          </div>
          <div className="support-inbox-footer"><span className={`support-connection-dot ${conectado ? "is-online" : ""}`}/><span>{demonstracao ? "Prévia sem sincronização" : conectado ? "Atualizações em tempo real" : "Reconectando ao atendimento..."}</span></div>
        </aside>

        <section className="support-chat" aria-label="Chat de atendimento">
          {novo && !agente ? <div className="support-new-conversation"><div className="support-intro-icon"><ChatSymbol size={27}/></div><h3>Como podemos ajudar?</h3><p>Descreva sua solicitação. Nossa equipe poderá responder por este chat.</p><form className="support-new-form" onSubmit={criarConversa}><label>Assunto<input name="assunto" placeholder="Ex.: Dúvida sobre uma manutenção" minLength={4} maxLength={120} required/></label><label>Categoria<select name="categoria">{categorias.map((categoria) => <option key={categoria}>{categoria}</option>)}</select></label><label>Sua mensagem<textarea name="mensagem" rows={4} placeholder="Conte o que aconteceu e como podemos ajudar..." minLength={2} maxLength={2000} required/></label><div className="support-new-actions"><button type="button" className="support-cancel" onClick={() => setNovo(false)}>Cancelar</button><button className="support-send" type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Iniciar atendimento"}</button></div></form></div>
          : !conversa ? <div className="support-chat-empty"><div className="support-intro-icon"><ChatSymbol size={32}/></div><h3>{agente ? "Selecione uma conversa" : "Seu suporte começa aqui"}</h3><p>{agente ? "Escolha um atendimento à esquerda para visualizar as mensagens e responder." : "Inicie uma conversa para falar diretamente com a equipe TechAssist."}</p>{!agente && <button type="button" className="support-send" onClick={() => setNovo(true)}>Iniciar atendimento</button>}</div>
          : <>
            <div className="support-chat-head"><div className="support-agent-avatar">{avatar(agente ? conversa.clienteNome : "TechAssist Pro")}</div><div className="support-chat-heading"><h3>{agente ? conversa.clienteNome : "Equipe TechAssist"}</h3><p>{conversa.assunto} <span aria-hidden="true">·</span> #{conversa.id}</p></div><div className={`support-status-pill support-pill-${conversa.status}`}><span/>{nomesStatus[conversa.status] ?? conversa.status}</div></div>
            <div className="support-message-area" ref={chatRef} role="log" aria-label="Histórico de mensagens" aria-live="polite" aria-relevant="additions text"><div className="support-chat-date">Histórico do atendimento</div>{!mensagens.length && <p className="support-list-empty">Ainda não há mensagens nesta conversa.</p>}{mensagens.map((mensagem) => {
              const proprio = agente ? mensagem.remetenteTipo === "equipe" : mensagem.remetenteTipo === "cliente";
              return <div className={`support-message-row ${proprio ? "is-own" : ""}`} key={mensagem.id}><span className="support-message-avatar">{avatar(proprio ? usuario.nome : mensagem.remetenteNome)}</span><div className="support-message-content"><span className="support-message-author">{proprio ? "Você" : mensagem.remetenteNome}</span><div className="support-bubble">{mensagem.texto}</div><time>{horario(mensagem.criadoEm)}</time></div></div>;
            })}<div ref={fimRef}/></div>
            <div className="support-composer"><form onSubmit={enviarMensagem}><label htmlFor="support-message-text" className="support-sr-only">Escrever mensagem</label><textarea id="support-message-text" rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} placeholder="Escreva sua mensagem... (Enter para enviar)" maxLength={2000}/><button type="submit" className="support-send support-send-icon" disabled={!texto.trim() || enviando} aria-label="Enviar mensagem"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z"/></svg></button></form><div className="support-composer-bottom"><span>Shift + Enter para quebrar linha · {texto.length}/2000</span>{agente && <select className="support-status-select" aria-label="Alterar status do atendimento" value={conversa.status} onChange={(e) => mudarStatus(e.target.value)}><option value="aberto">Aguardando atendimento</option><option value="em_atendimento">Em atendimento</option><option value="resolvido">Resolvido</option></select>}</div></div>
          </>}
        </section>
      </div>}
    </div>
  );
}
