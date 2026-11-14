"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "../techassist/api";
import "./modal.css";

const cadastroInicial = {
  nome: "",
  email: "",
  telefone: "",
  tipo_pessoa: "fisica",
  documento: "",
  nome_razao_social: "",
  endereco: "",
  senha: "",
  confirmarSenha: "",
};

const ICONES = {
  escudo: <><path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 11 3 3 5-5"/></>,
  calendario: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 10h18M8 15h3"/></>,
  reparo: <><path d="M14 6a5 5 0 0 0-6 6L3 17a2.8 2.8 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-4 3-3-3 3-4Z"/></>,
};

function Icone({ nome }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONES[nome]}</svg>;
}

function Campo({ label, id, children, hint }) {
  return <div className="authm-field"><label htmlFor={id}>{label}</label>{children}{hint && <small>{hint}</small>}</div>;
}

export default function AuthModal({ onClose, onAuthenticated, initialMode = "login" }) {
  const [modo, setModo] = useState(initialMode === "cadastro" ? "cadastro" : "login");
  const [dados, setDados] = useState(cadastroInicial);
  const [login, setLogin] = useState({ email: "", senha: "", tipo: "cliente" });
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const dialogRef = useRef(null);
  const formAreaRef = useRef(null);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focoAnterior = document.activeElement;
    dialogRef.current?.focus();
    function tecla(evento) {
      if (evento.key === "Escape") onClose?.();
      if (evento.key === "Tab" && dialogRef.current) {
        const focaveis = [...dialogRef.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled])')]
          .filter((elemento) => elemento.getClientRects().length > 0);
        if (!focaveis.length) return;
        if (evento.shiftKey && document.activeElement === focaveis[0]) {
          evento.preventDefault();
          focaveis[focaveis.length - 1].focus();
        } else if (!evento.shiftKey && document.activeElement === focaveis[focaveis.length - 1]) {
          evento.preventDefault();
          focaveis[0].focus();
        }
      }
    }
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", tecla);
      if (focoAnterior?.isConnected) focoAnterior.focus();
    };
  }, [onClose]);

  useEffect(() => () => { if (previewFoto) URL.revokeObjectURL(previewFoto); }, [previewFoto]);

  function trocarModo(novoModo) {
    formAreaRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setModo(novoModo);
    setErro("");
    setSucesso("");
  }

  function atualizarCampo(evento) {
    const { name, value } = evento.target;
    setDados((antigo) => ({
      ...antigo,
      [name]: value,
      ...(name === "nome" && antigo.tipo_pessoa === "fisica" ? { nome_razao_social: value } : {}),
      ...(name === "tipo_pessoa" ? { documento: "", nome_razao_social: value === "fisica" ? antigo.nome : "" } : {}),
    }));
  }

  function selecionarFoto(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) {
      setFotoPerfil(null);
      setPreviewFoto(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type) || arquivo.size > 2 * 1024 * 1024) {
      evento.target.value = "";
      setFotoPerfil(null);
      setPreviewFoto(null);
      setErro("A foto deve ser JPG, PNG ou WebP, com no máximo 2 MB.");
      return;
    }
    setErro("");
    setFotoPerfil(arquivo);
    setPreviewFoto(URL.createObjectURL(arquivo));
  }

  async function handleCadastro(evento) {
    evento.preventDefault();
    if (carregando) return;
    setErro("");
    setSucesso("");
    if (dados.senha !== dados.confirmarSenha) {
      setErro("As senhas não correspondem.");
      return;
    }
    if (dados.senha.length < 8 || dados.senha.length > 72 || !/[a-z]/.test(dados.senha) || !/[A-Z]/.test(dados.senha) || !/[0-9]/.test(dados.senha) || !/[\W_]/.test(dados.senha)) {
      setErro("A senha deve ter de 8 a 72 caracteres, com maiúscula, minúscula, número e símbolo.");
      return;
    }
    const documento = dados.documento.replace(/\D/g, "");
    if (documento && documento.length !== (dados.tipo_pessoa === "fisica" ? 11 : 14)) {
      setErro("Informe um CPF com 11 dígitos ou um CNPJ com 14 dígitos.");
      return;
    }
    const formulario = new FormData();
    Object.entries({
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      telefone: dados.telefone.trim(),
      senha: dados.senha,
      tipo_pessoa: dados.tipo_pessoa,
      documento,
      nome_razao_social: dados.tipo_pessoa === "juridica" ? dados.nome_razao_social.trim() : dados.nome.trim(),
      endereco: dados.endereco.trim(),
    }).forEach(([campo, valor]) => formulario.append(campo, valor));
    if (fotoPerfil) formulario.append("foto_perfil", fotoPerfil);
    setCarregando(true);
    try {
      await api("/auth/registrar", { method: "POST", body: formulario });
      setLogin((anterior) => ({ ...anterior, email: dados.email.trim().toLowerCase() }));
      setDados(cadastroInicial);
      setFotoPerfil(null);
      setPreviewFoto(null);
      formAreaRef.current?.scrollTo({ top: 0, behavior: "instant" });
      setModo("login");
      setSucesso("Conta criada com sucesso. Entre com suas credenciais.");
    } catch (falha) {
      setErro(falha.message || "Não foi possível criar sua conta.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleLogin(evento) {
    evento.preventDefault();
    if (carregando) return;
    setCarregando(true);
    setErro("");
    setSucesso("");
    try {
      const sessao = await api("/auth/login", {
        method: "POST",
        body: { email: login.email.trim().toLowerCase(), senha: login.senha, tipo: login.tipo },
      });
      onAuthenticated?.(sessao);
    } catch (falha) {
      setErro(falha.message || "Não foi possível entrar na sua conta.");
    } finally {
      setCarregando(false);
    }
  }

  const cadastro = modo === "cadastro";
  return (
    <div className="authm-overlay" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) onClose?.(); }}>
      <section className="authm-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="authm-title">
        <aside className="authm-brand">
          <div className="authm-mark"><span className="authm-brand-icon">✳</span><span><strong>TechAssist</strong><b>PRO</b><small>ASSISTÊNCIA & TECNOLOGIA</small></span></div>
          <div className="authm-brand-body">
            <span className="authm-overline">SUA CENTRAL DIGITAL</span>
            <h2>Seu equipamento em boas mãos<span>.</span></h2>
            <p>Acompanhe cada etapa do reparo, agende atendimentos e receba atualizações em um único lugar.</p>
            <div className="authm-benefits"><div><Icone nome="reparo"/> Acompanhamento de reparos</div><div><Icone nome="calendario"/> Histórico e agendamentos</div><div><Icone nome="escudo"/> Acesso protegido</div></div>
          </div>
          <span className="authm-brand-footer">TECHASSIST PRO · PROJETO AUREN</span>
        </aside>
        <div className="authm-form-area" ref={formAreaRef}>
          <button type="button" className="authm-close" aria-label="Fechar janela" onClick={onClose}>×</button>
          <div className="authm-form-inner">
            <span className="authm-eyebrow">{cadastro ? "CRIE SUA CONTA" : "BEM-VINDO DE VOLTA"}</span>
            <h2 id="authm-title">{cadastro ? "Cadastre-se" : "Acesse sua conta"}<span>.</span></h2>
            <p className="authm-subtitle">{cadastro ? "Preencha os dados para começar a utilizar a TechAssist Pro." : "Entre para acompanhar serviços e acessar sua dashboard."}</p>
            <div className="authm-tabs" role="group" aria-label="Alternar entre login e cadastro">
              <button type="button" className={!cadastro ? "active" : ""} aria-pressed={!cadastro} onClick={() => trocarModo("login")}>Entrar</button>
              <button type="button" className={cadastro ? "active" : ""} aria-pressed={cadastro} onClick={() => trocarModo("cadastro")}>Criar conta</button>
            </div>
            {erro && <div className="authm-alert authm-alert-error" role="alert">{erro}</div>}
            {sucesso && <div className="authm-alert authm-alert-success" role="status">{sucesso}</div>}
            {cadastro ? (
              <form onSubmit={handleCadastro} className="authm-form" key="cadastro">
                <div className="authm-photo-row">
                  <div className="authm-avatar" aria-label="Prévia da foto de perfil">{previewFoto ? <img src={previewFoto} alt="Foto de perfil selecionada"/> : <span aria-hidden="true">◉</span>}</div>
                  <Campo label="Foto de perfil (opcional)" id="authm-foto" hint="JPG, PNG ou WebP · até 2 MB"><input id="authm-foto" type="file" accept="image/jpeg,image/png,image/webp" onChange={selecionarFoto}/></Campo>
                </div>
                <div className="authm-grid">
                  <Campo label="Tipo de pessoa" id="authm-tipo"><select id="authm-tipo" name="tipo_pessoa" value={dados.tipo_pessoa} onChange={atualizarCampo}><option value="fisica">Pessoa física</option><option value="juridica">Pessoa jurídica</option></select></Campo>
                  <Campo label={dados.tipo_pessoa === "fisica" ? "Nome completo" : "Nome do responsável"} id="authm-nome"><input id="authm-nome" name="nome" autoComplete="name" value={dados.nome} onChange={atualizarCampo} minLength={3} maxLength={120} required placeholder="Seu nome"/></Campo>
                  {dados.tipo_pessoa === "juridica" && <Campo label="Razão social" id="authm-razao"><input id="authm-razao" name="nome_razao_social" value={dados.nome_razao_social} onChange={atualizarCampo} maxLength={160} required placeholder="Nome da empresa"/></Campo>}
                  <Campo label={dados.tipo_pessoa === "fisica" ? "CPF (opcional)" : "CNPJ (opcional)"} id="authm-doc"><input id="authm-doc" name="documento" value={dados.documento} onChange={atualizarCampo} inputMode="numeric" maxLength={dados.tipo_pessoa === "fisica" ? 14 : 18} placeholder={dados.tipo_pessoa === "fisica" ? "000.000.000-00" : "00.000.000/0000-00"}/></Campo>
                  <Campo label="E-mail" id="authm-email"><input id="authm-email" name="email" type="email" autoComplete="email" value={dados.email} onChange={atualizarCampo} maxLength={150} required placeholder="voce@exemplo.com"/></Campo>
                  <Campo label="Telefone / WhatsApp" id="authm-telefone"><input id="authm-telefone" name="telefone" type="tel" autoComplete="tel" value={dados.telefone} onChange={atualizarCampo} maxLength={20} required placeholder="(11) 99999-9999"/></Campo>
                  <Campo label="Endereço (opcional)" id="authm-endereco"><input id="authm-endereco" name="endereco" value={dados.endereco} onChange={atualizarCampo} maxLength={300} placeholder="Rua, número, cidade"/></Campo>
                  <Campo label="Senha" id="authm-senha"><input id="authm-senha" name="senha" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={dados.senha} onChange={atualizarCampo} placeholder="Crie uma senha forte"/></Campo>
                  <Campo label="Confirmar senha" id="authm-conf"><input id="authm-conf" name="confirmarSenha" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={dados.confirmarSenha} onChange={atualizarCampo} placeholder="Repita sua senha"/></Campo>
                </div>
                <small className="authm-hint">Use de 8 a 72 caracteres com maiúscula, minúscula, número e símbolo.</small>
                <button className="authm-submit" type="submit" disabled={carregando}>{carregando ? "Criando conta..." : "Criar minha conta"} <span aria-hidden="true">→</span></button>
                <p className="authm-legal">Ao se cadastrar, consulte nossa <Link href="/termos" target="_blank" rel="noopener noreferrer">Política de Privacidade</Link>.</p>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="authm-form" key="login">
                <Campo label="Tipo de acesso" id="authm-acesso"><select id="authm-acesso" value={login.tipo} onChange={(evento) => setLogin((antigo) => ({ ...antigo, tipo: evento.target.value }))}><option value="cliente">Sou cliente</option><option value="equipe">Sou da equipe (funcionário, adm. ou desenvolvedor)</option></select></Campo>
                <Campo label="E-mail" id="authm-login-email"><input id="authm-login-email" type="email" required autoComplete="username" maxLength={150} placeholder="voce@exemplo.com" value={login.email} onChange={(evento) => setLogin((antigo) => ({ ...antigo, email: evento.target.value }))}/></Campo>
                <Campo label="Senha" id="authm-login-senha"><input id="authm-login-senha" type="password" required autoComplete="current-password" placeholder="Sua senha" value={login.senha} onChange={(evento) => setLogin((antigo) => ({ ...antigo, senha: evento.target.value }))}/></Campo>
                <button className="authm-submit" type="submit" disabled={carregando}>{carregando ? "Entrando..." : "Entrar na minha conta"} <span aria-hidden="true">→</span></button>
                <p className="authm-legal">Ao utilizar a plataforma, consulte nossa <Link href="/termos" target="_blank" rel="noopener noreferrer">Política de Privacidade</Link>.</p>
              </form>
            )}
            <p className="authm-bottom">{cadastro ? "Já tem uma conta?" : "Primeira vez por aqui?"} <button type="button" onClick={() => trocarModo(cadastro ? "login" : "cadastro")}>{cadastro ? "Fazer login" : "Criar conta"}</button></p>
          </div>
        </div>
      </section>
    </div>
  );
}
