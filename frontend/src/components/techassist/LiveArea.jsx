"use client";
import React, { useEffect, useState } from "react";
import {
  api,
  getSession,
  setSession,
  setTracking,
  route,
  mapOrder,
  statusList,
} from "./api.js";
import {
  Icon,
  Primary,
  Field,
  Notice,
  PageIntro,
  OrderDetail,
  money,
  date,
} from "./TechAssist.jsx";

export default function LiveArea() {
  const [session, setCurrent] = useState(null),
    [loading, setLoading] = useState(true),
    [register, setRegister] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false),
    [orders, setOrders] = useState([]),
    [detail, setDetail] = useState(null);
  async function refresh(s) {
    if (s?.usuario.tipo === "cliente") setOrders(await api("/ordens"));
  }
  useEffect(() => {
    const saved = getSession();
    if (!saved) {
      setLoading(false);
      return;
    }
    api("/auth/me")
      .then((u) => {
        const next = { ...saved, usuario: u };
        setSession(next);
        setCurrent(next);
        return refresh(next);
      })
      .catch((e) => {
        setError(e.message);
        if (e.status === 401) setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const d = Object.fromEntries(new FormData(e.currentTarget));
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      if (register) {
        if (d.senha !== d.confirmar)
          throw new Error("As senhas precisam ser iguais.");
        await api("/auth/registrar", {
          method: "POST",
          body: {
            nome: d.nome,
            email: d.email,
            telefone: d.telefone,
            senha: d.senha,
          },
        });
        setSuccess("Conta criada. Entre com seu e-mail e senha.");
        setRegister(false);
      } else {
        const s = await api("/auth/login", { method: "POST", body: d });
        setSession(s);
        setCurrent(s);
        window.location.assign("/dashboard");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function logout() {
    setSession(null);
    setCurrent(null);
    setOrders([]);
    setDetail(null);
    setError("");
  }
  async function open(o) {
    setError("");
    try {
      setDetail(mapOrder(await api("/ordens/" + o.id_os)));
    } catch (e) {
      setError(e.message);
    }
  }
  return (
    <>
      <PageIntro
        eyebrow={
          session?.usuario.tipo === "equipe"
            ? "CENTRAL DA EQUIPE"
            : "SUA CENTRAL DE ATENDIMENTO"
        }
        breadcrumb="Área do cliente"
        title={
          <>
            Seu atendimento.
            <br />
            <em>Mais organizado.</em>
          </>
        }
        description="Acesse sua conta para consultar solicitações ou gerenciar os atendimentos da assistência."
      />
      {loading ? (
        <section className="container loading-state">
          Verificando seu acesso...
        </section>
      ) : !session ? (
        <section className="container auth-layout">
          <aside>
            <span className="tag">
              {register ? "CRIE SUA CONTA" : "BEM-VINDO À TECHASSIST"}
            </span>
            <h2>
              {register
                ? "Seu primeiro passo para um atendimento conectado."
                : "Bom ter você por aqui."}
            </h2>
            <p>
              Solicite uma avaliação, consulte suas ordens e aprove o orçamento
              do seu equipamento em um só lugar.
            </p>
            <div className="auth-benefits">
              <span>
                <Icon name="file" />
                Suas ordens de serviço
              </span>
              <span>
                <Icon name="shield" />
                Aprovação do orçamento
              </span>
              <span>
                <Icon name="clock" />
                Histórico do atendimento
              </span>
            </div>
          </aside>
          <div className="form-card auth-card">
            <div className="form-title">
              <h2>
                {register ? "Criar conta de cliente" : "Entrar na sua conta"}
              </h2>
              <span className="mini-icon">
                <Icon name="user" />
              </span>
            </div>
            <form onSubmit={submit} key={register ? "register" : "login"}>
              <div className="form-grid">
                {!register && (
                  <Field label="Tipo de acesso" className="span-2">
                    <select name="tipo" defaultValue="cliente">
                      <option value="cliente">Sou cliente</option>
                      <option value="equipe">Sou da equipe</option>
                    </select>
                  </Field>
                )}
                {register && (
                  <>
                    <Field label="Nome completo" required className="span-2">
                      <input
                        name="nome"
                        autoComplete="name"
                        required
                        minLength={3}
                        maxLength={120}
                        placeholder="Seu nome completo"
                      />
                    </Field>
                    <Field
                      label="Telefone / WhatsApp"
                      required
                      className="span-2"
                    >
                      <input
                        name="telefone"
                        autoComplete="tel"
                        type="tel"
                        required
                        pattern="[+0-9() .-]{10,20}"
                        title="Informe um telefone com DDD."
                        maxLength={20}
                        placeholder="(11) 99999-9999"
                      />
                    </Field>
                  </>
                )}
                <Field label="E-mail" required className="span-2">
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={150}
                    placeholder="voce@exemplo.com"
                  />
                </Field>
                <Field
                  label="Senha"
                  required
                  className="span-2"
                  hint={
                    register
                      ? "8 a 72 caracteres com maiúscula, minúscula, número e símbolo."
                      : null
                  }
                >
                  <input
                    name="senha"
                    type="password"
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    required
                    minLength={register ? 8 : 1}
                    maxLength={72}
                    placeholder="Sua senha"
                  />
                </Field>
                {register && (
                  <Field label="Confirmar senha" required className="span-2">
                    <input
                      name="confirmar"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={72}
                      placeholder="Repita a senha"
                    />
                  </Field>
                )}
              </div>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="success-message" role="status">
                  {success}
                </p>
              )}
              <Primary type="submit" disabled={busy}>
                {busy ? "Aguarde..." : register ? "Criar conta" : "Entrar"}
              </Primary>
              <div className="auth-switch">
                <span>
                  {register
                    ? "Já possui conta?"
                    : "É seu primeiro atendimento?"}
                </span>
                <button
                  className="text-link"
                  type="button"
                  onClick={() => {
                    setRegister(!register);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {register ? "Fazer login" : "Criar conta de cliente"}{" "}
                  <Icon size={15} />
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="container signed-section">
          <div className="signed-header">
            <div>
              <span className="tag">
                {session.usuario.tipo === "equipe"
                  ? session.usuario.perfil
                  : "CLIENTE"}
              </span>
              <h2>Olá, {session.usuario.nome.split(" ")[0]}.</h2>
              <p>{session.usuario.email}</p>
            </div>
            <button className="button secondary" onClick={logout}>
              Sair da conta <Icon name="arrow" size={16} />
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {session.usuario.tipo === "equipe" ? (
            <AdminPanel user={session.usuario} />
          ) : (
            <>
              {detail ? (
                <>
                  <button
                    className="text-link back-orders"
                    onClick={() => setDetail(null)}
                  >
                    ← Voltar para minhas solicitações
                  </button>
                  <OrderDetail
                    order={detail}
                    onUpdate={(next) => {
                      setDetail(next);
                      refresh(session);
                    }}
                    onDecision={async (decisao) =>
                      mapOrder(
                        await api(`/ordens/${detail.dbId}/decisao`, {
                          method: "POST",
                          body: { decisao },
                        }),
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <div className="client-header">
                    <div>
                      <h2>
                        Minhas solicitações{" "}
                        <span className="count-badge">{orders.length}</span>
                      </h2>
                      <p>Consulte o andamento dos seus equipamentos.</p>
                    </div>
                    <Primary href={route("orcamento")}>
                      Nova solicitação
                    </Primary>
                  </div>
                  {orders.length ? (
                    <div className="requests-list">
                      {orders.map((o) => (
                        <article key={o.id_os}>
                          <span className="square-icon">
                            <Icon name="laptop" size={27} />
                          </span>
                          <div className="request-name">
                            <small>{o.codigo_rastreio}</small>
                            <h3>
                              {o.marca} {o.modelo}
                            </h3>
                            <p>
                              {o.servico} ·{" "}
                              {date(o.criado_em.replace(" ", "T"))}
                            </p>
                          </div>
                          <span className="status-pill">{o.status}</span>
                          <button
                            className="button secondary"
                            onClick={() => open(o)}
                          >
                            Ver detalhes <Icon size={16} />
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="client-empty">
                      <Icon name="file" size={45} />
                      <h2>
                        Seu primeiro atendimento
                        <br />
                        começa por aqui.
                      </h2>
                      <p>Você ainda não tem solicitações registradas.</p>
                      <Primary href={route("orcamento")}>
                        Solicitar avaliação
                      </Primary>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      )}
    </>
  );
}
const fieldDefs = {
  clientes: [
    ["nome", "Nome completo", "text", true],
    ["email", "E-mail", "email", true],
    ["telefone", "Telefone", "tel", true],
    ["status", "Status", "select", true, ["ativo", "ausente"]],
  ],
  equipamentos: [
    ["id_cliente", "Cliente", "cliente", true],
    ["nome", "Nome do equipamento", "text", true],
    [
      "tipo",
      "Tipo",
      "select",
      true,
      [
        "notebook",
        "computador",
        "celular",
        "tablet",
        "impressora",
        "monitor",
        "outro",
      ],
    ],
    ["marca", "Marca", "text", true],
    ["modelo", "Modelo", "text", true],
    ["numero_serie", "Número de série", "text"],
    ["observacoes", "Observações", "textarea"],
  ],
  pecas: [
    ["nome", "Nome da peça", "text", true],
    ["descricao", "Descrição", "textarea"],
    ["quantidade", "Quantidade disponível", "number", true],
    ["valor", "Valor unitário (R$)", "decimal", true],
    ["status", "Status", "select", true, ["disponivel", "esgotada", "inativa"]],
  ],
  ordens: [
    ["id_equipamento", "Equipamento", "equipamento", true],
    ["id_usuario", "Técnico responsável", "tecnico"],
    ["servico", "Serviço solicitado", "text", true],
    ["defeito_relatado", "Defeito relatado", "textarea", true],
  ],
};
const tableFields = {
  clientes: ["nome", "email", "telefone", "status"],
  equipamentos: ["nome", "tipo", "marca", "modelo", "id_cliente"],
  pecas: ["nome", "quantidade", "valor", "status"],
  ordens: ["codigo_rastreio", "cliente", "equipamento", "status"],
  contatos: ["nome", "email", "assunto", "mensagem"],
};
function AdminPanel({ user }) {
  const [tab, setTab] = useState("ordens"),
    [rows, setRows] = useState([]),
    [filter, setFilter] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [editing, setEditing] = useState(null),
    [remove, setRemove] = useState(null),
    [detail, setDetail] = useState(null),
    [busy, setBusy] = useState(false),
    [options, setOptions] = useState({
      clientes: [],
      equipamentos: [],
      tecnicos: [],
    });
  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await api("/" + tab);
      setRows(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setRows([]);
    setEditing(null);
    setDetail(null);
    setRemove(null);
    setSuccess("");
    setFilter("");
    load();
  }, [tab]);
  async function openForm(row = {}) {
    setError("");
    try {
      if (tab === "equipamentos") setOptions((o) => ({ ...o, clientes: [] }));
      const result =
        tab === "equipamentos"
          ? { clientes: await api("/clientes") }
          : tab === "ordens"
            ? {
                equipamentos: await api("/equipamentos"),
                tecnicos: await api("/tecnicos"),
              }
            : {};
      setOptions((o) => ({ ...o, ...result }));
      setEditing(row);
    } catch (e) {
      setError(e.message);
    }
  }
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    for (const key of [
      "quantidade",
      "valor",
      "id_cliente",
      "id_equipamento",
      "id_usuario",
    ])
      if (d[key] !== undefined) {
        if (d[key] === "") delete d[key];
        else d[key] = Number(d[key]);
      }
    const key = {
      clientes: "id_cliente",
      equipamentos: "id_equipamento",
      pecas: "id_peca",
      ordens: "id_os",
    }[tab];
    try {
      await api("/" + tab + (editing[key] ? "/" + editing[key] : ""), {
        method: editing[key] ? "PUT" : "POST",
        body: d,
      });
      setEditing(null);
      setSuccess("Registro salvo com sucesso.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function exclude(id) {
    setBusy(true);
    setError("");
    try {
      await api("/" + tab + "/" + id, { method: "DELETE" });
      setRemove(null);
      setSuccess("Registro excluído.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function openOrder(o) {
    setError("");
    try {
      const [order, pecas, tecnicos] = await Promise.all([
        api("/ordens/" + o.id_os),
        api("/pecas"),
        api("/tecnicos"),
      ]);
      setOptions((v) => ({ ...v, pecas, tecnicos }));
      setDetail(order);
    } catch (e) {
      setError(e.message);
    }
  }
  const filtered = rows.filter((r) =>
    tableFields[tab].some((k) =>
      String(r[k] ?? "")
        .toLowerCase()
        .includes(filter.toLowerCase()),
    ),
  );
  const idKey = {
    clientes: "id_cliente",
    equipamentos: "id_equipamento",
    pecas: "id_peca",
    ordens: "id_os",
    contatos: "id_contato",
  }[tab];
  const labels = {
    nome: "Nome",
    email: "E-mail",
    telefone: "Telefone",
    status: "Status",
    tipo: "Tipo",
    marca: "Marca",
    modelo: "Modelo",
    id_cliente: "Cliente (ID)",
    quantidade: "Estoque",
    valor: "Valor",
    codigo_rastreio: "Código",
    cliente: "Cliente",
    equipamento: "Equipamento",
    assunto: "Assunto",
    mensagem: "Mensagem",
  };
  return (
    <div className="admin-panel">
      <div className="admin-tabs" aria-label="Áreas de gestão">
        {[
          ["ordens", "file", "Ordens de serviço"],
          ["clientes", "user", "Clientes"],
          ["equipamentos", "laptop", "Equipamentos"],
          ["pecas", "box", "Peças"],
          ["contatos", "mail", "Contatos"],
        ].map(([key, icon, label]) => (
          <button
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            <Icon name={icon} size={18} />
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}
      {detail ? (
        <>
          <button
            className="text-link back-orders"
            onClick={() => {
              setDetail(null);
              load();
            }}
          >
            ← Voltar para ordens de serviço
          </button>
          <OrderEditor
            order={detail}
            options={options}
            onSaved={(o) => {
              setDetail(o);
              setSuccess("Ordem atualizada.");
            }}
          />
        </>
      ) : (
        <>
          <div className="admin-toolbar">
            <label className="search-input">
              <Icon name="search" size={17} />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar nos registros..."
                aria-label="Buscar registros"
              />
            </label>
            <span>{rows.length} registros · até 200 por lista</span>
            {tab !== "contatos" && (
              <Primary onClick={() => openForm()}>
                {tab === "ordens" ? "Abrir ordem" : "Novo cadastro"}
              </Primary>
            )}
            <button
              className="button secondary"
              onClick={load}
              disabled={loading}
            >
              Atualizar
            </button>
          </div>
          {editing && (
            <section className="form-card admin-form">
              <div className="form-title">
                <h2>{editing[idKey] ? "Editar registro" : "Novo cadastro"}</h2>
                <button
                  className="icon-button"
                  aria-label="Fechar cadastro"
                  onClick={() => setEditing(null)}
                >
                  <Icon name="close" size={19} />
                </button>
              </div>
              <form onSubmit={save}>
                <div className="form-grid">
                  {fieldDefs[tab].map(
                    ([name, label, type, required, values]) => (
                      <Field
                        key={name}
                        label={label}
                        required={required}
                        className={type === "textarea" ? "span-2" : ""}
                      >
                        {type === "select" ? (
                          <select
                            name={name}
                            defaultValue={editing[name] || values[0]}
                            required={required}
                          >
                            {values.map((v) => (
                              <option key={v}>{v}</option>
                            ))}
                          </select>
                        ) : ["cliente", "equipamento", "tecnico"].includes(
                            type,
                          ) ? (
                          <select
                            name={name}
                            required={required}
                            defaultValue={editing[name] || ""}
                          >
                            <option value="">Selecione</option>
                            {(
                              options[
                                type === "cliente"
                                  ? "clientes"
                                  : type === "equipamento"
                                    ? "equipamentos"
                                    : "tecnicos"
                              ] || []
                            ).map((o) => (
                              <option key={o[name]} value={o[name]}>
                                {o.nome}
                                {o.modelo ? " — " + o.modelo : ""}
                              </option>
                            ))}
                          </select>
                        ) : type === "textarea" ? (
                          <textarea
                            name={name}
                            required={required}
                            defaultValue={editing[name] || ""}
                            minLength={
                              name === "defeito_relatado" ? 10 : undefined
                            }
                            maxLength={name === "descricao" ? 500 : 2000}
                            rows={3}
                          />
                        ) : (
                          <input
                            name={name}
                            type={
                              ["number", "decimal"].includes(type)
                                ? "number"
                                : type
                            }
                            min={
                              type === "number" || type === "decimal"
                                ? 0
                                : undefined
                            }
                            step={
                              type === "decimal"
                                ? ".01"
                                : type === "number"
                                  ? 1
                                  : undefined
                            }
                            max={
                              type === "number"
                                ? 100000
                                : type === "decimal"
                                  ? 1000000
                                  : undefined
                            }
                            required={required}
                            defaultValue={editing[name] ?? ""}
                            maxLength={
                              name === "email"
                                ? 150
                                : name === "telefone"
                                  ? 20
                                  : name === "marca"
                                    ? 60
                                    : name === "modelo"
                                      ? 80
                                      : 120
                            }
                            minLength={name === "nome" ? 3 : undefined}
                          />
                        )}
                      </Field>
                    ),
                  )}
                </div>
                <div className="wizard-actions">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => setEditing(null)}
                  >
                    Cancelar
                  </button>
                  <Primary type="submit" disabled={busy}>
                    Salvar cadastro
                  </Primary>
                </div>
              </form>
            </section>
          )}
          {loading ? (
            <div className="loading-state">Carregando registros...</div>
          ) : (
            <div className="management-table">
              <table>
                <thead>
                  <tr>
                    {tableFields[tab].map((f) => (
                      <th key={f}>{labels[f]}</th>
                    ))}
                    {tab !== "contatos" && <th>Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row[idKey]}>
                      {tableFields[tab].map((f) => (
                        <td key={f}>
                          {f === "valor" ? money(Number(row[f])) : row[f]}
                        </td>
                      ))}
                      {tab !== "contatos" && (
                        <td>
                          <div className="table-actions">
                            <button
                              className="text-link"
                              onClick={() =>
                                tab === "ordens"
                                  ? openOrder(row)
                                  : openForm(row)
                              }
                            >
                              {tab === "ordens" ? "Gerenciar" : "Editar"}{" "}
                              <Icon size={13} />
                            </button>
                            {user.perfil === "adm" && tab !== "ordens" && (
                              <button
                                className="icon-button"
                                aria-label={"Excluir " + row.nome}
                                onClick={() => setRemove(row[idKey])}
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            )}
                          </div>
                          {remove === row[idKey] && (
                            <div className="confirmation">
                              <p>
                                Excluir este registro? A ação pode ser bloqueada
                                se houver vínculos.
                              </p>
                              <button
                                className="button primary"
                                disabled={busy}
                                onClick={() => exclude(row[idKey])}
                              >
                                Excluir
                              </button>
                              <button
                                className="button secondary"
                                onClick={() => setRemove(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <div className="table-empty">
                  {filter
                    ? "Nenhum resultado para esta busca."
                    : "Nenhum registro cadastrado."}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
function OrderEditor({ order, options, onSaved }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [success, setSuccess] = useState(""),
    [items, setItems] = useState([]);
  useEffect(() => {
    setItems(
      order.pecas
        ?.filter((p) => p.status !== "devolvida")
        .map((p) => ({ id_peca: p.id_peca, quantidade: p.quantidade })) || [],
    );
    setError("");
    setSuccess("");
  }, [order.id_os]);
  async function save(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    const d = Object.fromEntries(new FormData(e.currentTarget));
    for (const k of ["diagnostico", "reparo_executado", "prazo", "id_usuario"])
      if (!d[k]) delete d[k];
    try {
      onSaved(
        await api("/ordens/" + order.id_os, { method: "PATCH", body: d }),
      );
      setSuccess("Andamento registrado no histórico.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function budget(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    const mao = Number(new FormData(e.currentTarget).get("valor_mao_obra"));
    try {
      onSaved(
        await api("/ordens/" + order.id_os + "/orcamento", {
          method: "POST",
          body: {
            pecas: items.map((p) => ({
              id_peca: Number(p.id_peca),
              quantidade: Number(p.quantidade),
            })),
            valor_mao_obra: mao,
          },
        }),
      );
      setSuccess(
        "Orçamento gerado. Peças reservadas e atendimento aguardando aprovação do cliente.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="order-editor">
      <div className="order-editor-heading">
        <div>
          <span className="tag">{order.codigo_rastreio}</span>
          <h2>
            {order.marca} {order.modelo}
          </h2>
          <p>
            {order.cliente} · {order.email} · {order.telefone}
          </p>
        </div>
        <span className="status-pill">{order.status}</span>
      </div>
      <div className="issue-box">
        <small>DEFEITO RELATADO</small>
        <p>{order.defeito_relatado}</p>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="success-message" role="status">
          {success}
        </p>
      )}
      <div className="editor-grid">
        <section className="form-card">
          <h3>Diagnóstico e andamento</h3>
          <form onSubmit={save} key={order.id_os + "-" + order.status}>
            <div className="form-grid">
              <Field label="Status" required>
                <select name="status" defaultValue={order.status}>
                  {statusList.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Técnico responsável">
                <select name="id_usuario" defaultValue={order.id_usuario || ""}>
                  <option value="">Manter responsável</option>
                  {options.tecnicos.map((t) => (
                    <option key={t.id_usuario} value={t.id_usuario}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Prazo previsto" className="span-2">
                <input
                  name="prazo"
                  type="date"
                  defaultValue={order.prazo || ""}
                />
              </Field>
              <Field label="Diagnóstico técnico" className="span-2">
                <textarea
                  name="diagnostico"
                  rows={4}
                  defaultValue={order.diagnostico || ""}
                  maxLength={2000}
                  placeholder="Informe o resultado da avaliação técnica..."
                />
              </Field>
              <Field label="Reparo executado" className="span-2">
                <textarea
                  name="reparo_executado"
                  rows={3}
                  defaultValue={order.reparo_executado || ""}
                  maxLength={2000}
                  placeholder="Registre o serviço realizado e os testes..."
                />
              </Field>
              <Field label="Observação para o histórico" className="span-2">
                <input
                  name="descricao"
                  maxLength={2000}
                  placeholder="Ex.: iniciado diagnóstico de armazenamento"
                />
              </Field>
            </div>
            <Primary
              type="submit"
              disabled={
                busy || ["entregue", "cancelado"].includes(order.status)
              }
            >
              Atualizar atendimento
            </Primary>
          </form>
        </section>
        <section className="form-card">
          <h3>Peças e orçamento</h3>
          {order.orcamento && (
            <div className="budget-summary">
              <small>ORÇAMENTO {order.orcamento.status.toUpperCase()}</small>
              <strong>{money(Number(order.orcamento.valor_total))}</strong>
              <span>
                Peças: {money(Number(order.orcamento.valor_pecas))} · Mão de
                obra: {money(Number(order.orcamento.valor_mao_obra))}
              </span>
            </div>
          )}
          <form onSubmit={budget}>
            <div className="budget-items">
              {items.map((p, i) => (
                <div key={i}>
                  <Field label="Peça">
                    <select
                      required
                      value={p.id_peca}
                      onChange={(e) =>
                        setItems(
                          items.map((v, j) =>
                            j === i ? { ...v, id_peca: e.target.value } : v,
                          ),
                        )
                      }
                    >
                      <option value="">Selecione</option>
                      {options.pecas.map((piece) => (
                        <option key={piece.id_peca} value={piece.id_peca}>
                          {piece.nome} · {money(Number(piece.valor))}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Qtd.">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      value={p.quantidade}
                      required
                      onChange={(e) =>
                        setItems(
                          items.map((v, j) =>
                            j === i ? { ...v, quantidade: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  </Field>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={"Remover peça " + (i + 1)}
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              className="text-link add-item"
              type="button"
              onClick={() =>
                setItems([...items, { id_peca: "", quantidade: 1 }])
              }
            >
              <Icon name="plus" size={16} />
              Adicionar peça
            </button>
            <Field label="Mão de obra (R$)" required>
              <input
                name="valor_mao_obra"
                type="number"
                min="0"
                max="1000000"
                step=".01"
                defaultValue={order.orcamento?.valor_mao_obra ?? 0}
                required
              />
            </Field>
            <Primary
              type="submit"
              disabled={busy || order.orcamento?.status === "aprovado"}
            >
              Gerar orçamento
            </Primary>
            <Notice>
              Registre o diagnóstico e avance para “em diagnostico” antes de
              gerar o orçamento. O sistema reserva as peças disponíveis e
              devolve o estoque se o cliente recusar.
            </Notice>
          </form>
        </section>
      </div>
      <section className="form-card history-editor">
        <h3>Histórico da ordem</h3>
        <ol className="history-list">
          {[...(order.historico || [])].reverse().map((h) => (
            <li key={h.id_hist}>
              <span>
                <Icon name="clock" size={15} />
              </span>
              <div>
                <small>{date(h.data_atualizacao.replace(" ", "T"))}</small>
                <strong>{h.status}</strong>
                <p>{h.descricao}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
