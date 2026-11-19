"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../techassist/api";

const TIPOS = {
  funcionarios: { titulo: "Funcionários", singular: "funcionário" },
  clientes: { titulo: "Clientes", singular: "cliente" },
};
const vazio = {
  nome: "", email: "", telefone: "", senha: "", especialidade: "",
  tipo_pessoa: "fisica", documento: "", nome_razao_social: "", endereco: "",
};

function Olho({ aberto }) {
  return aberto
    ? <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 9 4 10 7a13 13 0 0 1-3.2 4.4M6.2 6.2C4.2 7.6 2.7 9.7 2 12c1 3 5 7 10 7a10 10 0 0 0 4.4-1"/></svg>
    : <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
}

export default function GestaoUsuarios({ demonstracao = false, dadosIniciais = [] }) {
  const [listas, setListas] = useState({ funcionarios: [], clientes: [] });
  const [carregando, setCarregando] = useState(!demonstracao);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState("funcionarios");
  const [visao, setVisao] = useState("lista");
  const [selecionado, setSelecionado] = useState(null);
  const [campos, setCampos] = useState(vazio);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    if (demonstracao) {
      setListas({
        funcionarios: dadosIniciais.map((p) => ({
          ...p, id: p.id, especialidade: p.funcao || "",
          status: p.ativo ? "ativo" : "ausente"
        })),
        clientes: []
      });
      setCarregando(false);
      return;
    }
    setCarregando(true);
    try {
      const [funcionarios, clientes] = await Promise.all([
        api("/gestao-usuarios/funcionarios"),
        api("/gestao-usuarios/clientes"),
      ]);
      setListas({ funcionarios, clientes });
      setErro("");
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  }, [demonstracao, dadosIniciais]);

  useEffect(() => { carregar(); }, [carregar]);

  function fechar() {
    if (salvando) return;
    setAberto(false);
    setMostrarSenha(false);
    setSelecionado(null);
  }

  function abrirLista(aba = "funcionarios") {
    setTipo(aba);
    setVisao("lista");
    setSelecionado(null);
    setBusca("");
    setErro("");
    setAberto(true);
  }

  function abrirFormulario(aba, registro = null) {
    setTipo(aba);
    setSelecionado(registro);
    setCampos(registro
      ? { ...vazio, ...registro, senha: "", especialidade: registro.especialidade || "" }
      : { ...vazio });
    setMostrarSenha(false);
    setErro("");
    setVisao("form");
    setAberto(true);
  }

  function campo(nome, valor) {
    setCampos((anterior) => ({ ...anterior, [nome]: valor }));
  }

  function validarSenha(senha) {
    return senha.length >= 8 && senha.length <= 72 &&
      /[a-z]/.test(senha) && /[A-Z]/.test(senha) &&
      /[0-9]/.test(senha) && /[\W_]/.test(senha);
  }

  async function salvar(evento) {
    evento.preventDefault();
    if (salvando) return;
    if (demonstracao) {
      setErro("Modo demonstração: o cadastro real precisa de uma sessão administrativa.");
      return;
    }
    if (!selecionado && !validarSenha(campos.senha)) {
      setErro("Senha de 8 a 72 caracteres com maiúscula, minúscula, número e símbolo.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const path = "/gestao-usuarios/" + tipo;
      const payload = { ...campos };
      delete payload.id;
      delete payload.status;
      delete payload.criado_em;
      delete payload.servicos;
      if (selecionado) delete payload.senha;
      await api(selecionado ? path + "/" + selecionado.id : path, {
        method: selecionado ? "PUT" : "POST",
        body: payload,
      });
      await carregar();
      setAviso(selecionado ? "Dados atualizados com sucesso." : "Conta criada com sucesso.");
      setVisao("lista");
      setSelecionado(null);
      setMostrarSenha(false);
    } catch (e) {
      setErro(e.message || "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatus(registro) {
    if (demonstracao) { setErro("Alterações não são gravadas na demonstração."); return; }
    const novo = registro.status === "ativo" ? "ausente" : "ativo";
    if (!window.confirm((novo === "ativo" ? "Reativar" : "Desativar") + " o acesso de " + registro.nome + "?")) return;
    setSalvando(true);
    setErro("");
    try {
      await api("/gestao-usuarios/" + tipo + "/" + registro.id + "/status", {
        method: "PATCH",
        body: { status: novo }
      });
      await carregar();
      setAviso("Status alterado com sucesso.");
    } catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  }

  async function trocarSenha() {
    if (!selecionado || salvando) return;
    if (demonstracao) { setErro("Alterações não são gravadas na demonstração."); return; }
    if (!validarSenha(campos.senha)) {
      setErro("A nova senha precisa de 8 a 72 caracteres, com maiúscula, minúscula, número e símbolo.");
      return;
    }
    if (!window.confirm("Redefinir a senha de " + selecionado.nome + "? A senha anterior deixará de funcionar.")) return;
    setSalvando(true);
    setErro("");
    try {
      await api("/gestao-usuarios/" + tipo + "/" + selecionado.id + "/senha", {
        method: "PATCH", body: { senha: campos.senha },
      });
      campo("senha", "");
      setMostrarSenha(false);
      setAviso("Senha redefinida com sucesso.");
    } catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  }

  const pessoas = (listas[tipo] || []).filter((p) =>
    [p.nome, p.email, p.especialidade, p.telefone].some((v) =>
      String(v || "").toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR"))
    )
  );
  const funcionarios = listas.funcionarios || [];

  return (
    <>
      <div className="ad-section-title ad-users-heading">
        <div>
          <h2>Gestão de funcionários</h2>
          <p>Cadastre técnicos, consulte responsabilidades e organize a equipe.</p>
        </div>
        <div className="ad-users-actions">
          <button type="button" className="ad-secondary-btn" onClick={() => abrirLista("funcionarios")}>Gerenciar usuários</button>
          <button type="button" className="ad-primary-btn" onClick={() => abrirFormulario("funcionarios")}>+ Cadastrar funcionário</button>
        </div>
      </div>
      {aviso && <p role="status" className="ad-users-success">{aviso}</p>}
      {erro && !aberto && <p role="alert" className="ad-users-error">{erro}</p>}
      <section className="ad-panel ad-table-panel">
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Funcionário</th><th>Função</th><th>Status</th><th>Serviços</th><th>Ação</th></tr></thead>
            <tbody>
              {funcionarios.map((p) => <tr key={p.id}>
                <td><strong>{p.nome}</strong><small>{p.email}</small></td>
                <td>{p.especialidade || "Não informada"}</td>
                <td>{p.status === "ativo" ? "Ativo" : "Inativo"}</td>
                <td>{p.servicos ?? 0}</td>
                <td><button type="button" className="ad-text-btn" onClick={() => abrirFormulario("funcionarios", p)}>Editar</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {carregando && <p className="ad-users-empty">Carregando funcionários...</p>}
        {!carregando && !funcionarios.length && <p className="ad-users-empty">Nenhum funcionário cadastrado.</p>}
      </section>

      {aberto && <div className="ad-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) fechar(); }}>
        <section className="ad-modal ad-users-modal" role="dialog" aria-modal="true" aria-labelledby="ad-modal-title">
          <div className="ad-modal-header">
            <div>
              <h2 id="ad-modal-title">{visao === "lista" ? "Gestão de usuários" : selecionado ? "Editar " + TIPOS[tipo].singular : "Cadastrar " + TIPOS[tipo].singular}</h2>
              <p className="ad-users-subtitle">Clientes e funcionários · TechAssist Pro</p>
            </div>
            <button type="button" onClick={fechar} aria-label="Fechar modal">×</button>
          </div>
          <div className="ad-users-tabs" role="group" aria-label="Tipo de usuário">
            {Object.entries(TIPOS).map(([chave, item]) =>
              <button type="button" key={chave} className={tipo === chave ? "active" : ""} onClick={() => { setTipo(chave); setVisao("lista"); setErro(""); setBusca(""); }}>
                {item.titulo}
              </button>
            )}
          </div>
          {erro && <p className="ad-users-error" role="alert">{erro}</p>}
          {visao === "lista" ? <>
            <div className="ad-users-toolbar">
              <input aria-label="Pesquisar usuários" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar nome ou e-mail..." />
              <button type="button" className="ad-primary-btn" onClick={() => abrirFormulario(tipo)}>+ Novo {TIPOS[tipo].singular}</button>
            </div>
            <div className="ad-users-list">
              {pessoas.map((p) => <div className="ad-users-item" key={p.id}>
                <div><strong>{p.nome}</strong><small>{p.email} · {p.status === "ativo" ? "Ativo" : "Inativo"}</small></div>
                <div className="ad-users-item-actions">
                  <button type="button" className="ad-secondary-btn" disabled={salvando} onClick={() => abrirFormulario(tipo, p)}>Editar</button>
                  <button type="button" className="ad-users-status-btn" disabled={salvando} onClick={() => alterarStatus(p)}>{p.status === "ativo" ? "Desativar" : "Reativar"}</button>
                </div>
              </div>)}
              {!pessoas.length && <p className="ad-users-empty">{carregando ? "Carregando..." : "Nenhum usuário encontrado."}</p>}
            </div>
          </> : <form className="ad-form" onSubmit={salvar}>
            <div className="ad-form-two">
              <label>Nome completo<input required minLength={3} maxLength={120} value={campos.nome} onChange={(e) => campo("nome", e.target.value)} /></label>
              <label>E-mail<input type="email" required maxLength={150} value={campos.email} onChange={(e) => campo("email", e.target.value)} /></label>
              <label>Telefone{tipo === "clientes" ? " *" : ""}<input required={tipo === "clientes"} maxLength={20} value={campos.telefone || ""} onChange={(e) => campo("telefone", e.target.value)} /></label>
              {tipo === "funcionarios"
                ? <label>Especialidade<input maxLength={120} value={campos.especialidade || ""} onChange={(e) => campo("especialidade", e.target.value)} placeholder="Ex.: Técnico de manutenção" /></label>
                : <label>Tipo de pessoa<select value={campos.tipo_pessoa} onChange={(e) => campo("tipo_pessoa", e.target.value)}><option value="fisica">Pessoa física</option><option value="juridica">Pessoa jurídica</option></select></label>}
              {tipo === "clientes" && <>
                <label>CPF/CNPJ (opcional)<input maxLength={18} value={campos.documento || ""} onChange={(e) => campo("documento", e.target.value)} /></label>
                {campos.tipo_pessoa === "juridica" && <label>Razão social<input required maxLength={160} value={campos.nome_razao_social || ""} onChange={(e) => campo("nome_razao_social", e.target.value)} /></label>}
                <label>Endereço (opcional)<input maxLength={300} value={campos.endereco || ""} onChange={(e) => campo("endereco", e.target.value)} /></label>
              </>}
            </div>
            <div className="ad-users-password-section">
              <strong>{selecionado ? "Redefinir senha" : "Definir senha de acesso"}</strong>
              <p className="ad-note">{selecionado
                ? "A senha atual está protegida e não pode ser exibida. O ícone mostra somente a nova senha digitada."
                : "A senha será armazenada com hash bcrypt, nunca em texto puro."}</p>
              <label>{selecionado ? "Nova senha (opcional)" : "Senha inicial"}
                <span className="ad-users-password">
                  <input type={mostrarSenha ? "text" : "password"} autoComplete="new-password"
                    required={!selecionado} minLength={8} maxLength={72}
                    value={campos.senha} onChange={(e) => campo("senha", e.target.value)}
                    placeholder={selecionado ? "Digite para redefinir" : "Maiúscula, minúscula, número e símbolo"}/>
                  <button type="button" aria-label={mostrarSenha ? "Ocultar nova senha" : "Mostrar nova senha"} onClick={() => setMostrarSenha((v) => !v)}>
                    <Olho aberto={mostrarSenha}/>
                  </button>
                </span>
              </label>
              {selecionado && <button type="button" disabled={salvando || !campos.senha} className="ad-secondary-btn" onClick={trocarSenha}>Redefinir senha agora</button>}
            </div>
            <div className="ad-form-footer">
              <button type="button" className="ad-secondary-btn" disabled={salvando} onClick={() => { setVisao("lista"); setErro(""); }}>Voltar</button>
              <button type="submit" className="ad-primary-btn" disabled={salvando}>{salvando ? "Salvando..." : selecionado ? "Salvar alterações" : "Cadastrar usuário"}</button>
            </div>
          </form>}
        </section>
      </div>}
    </>
  );
}
