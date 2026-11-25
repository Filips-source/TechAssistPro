export const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
export const route = (page) =>
  DEMO ? "#" + page : page === "inicio" ? "/" : "/" + page;
export function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("tap-session") || "null");
  } catch {
    return null;
  }
}
export function setSession(value) {
  const anterior = getSession();
  if (value) sessionStorage.setItem("tap-session", JSON.stringify(value));
  else sessionStorage.removeItem("tap-session");
  if (anterior?.token !== value?.token) {
    sessionStorage.removeItem("tap-tracking");
    if (typeof window !== "undefined") window.dispatchEvent(new Event("tap-session-change"));
  }
}
export function getTracking() {
  try {
    return JSON.parse(sessionStorage.getItem("tap-tracking") || "null");
  } catch {
    return null;
  }
}
export function setTracking(order) {
  sessionStorage.setItem(
    "tap-tracking",
    JSON.stringify({ id: order.id, email: order.email }),
  );
}
export async function api(path, { method = "GET", body, signal } = {}) {
  const base = process.env.NEXT_PUBLIC_API_URL || "/api";
  const sessao = getSession();
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  let res;
  try {
    res = await fetch(base.replace(/\/$/, "") + path, {
      method,
      headers: {
        ...(body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(sessao?.token ? { Authorization: "Bearer " + sessao.token } : {}),
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Confira se o back-end está iniciado e se o endereço está configurado.",
    );
  }
  const conferirSessao = () => {
    if (getSession()?.token !== sessao?.token) {
      const erro = new Error("A sessão foi alterada. Recarregue os dados da conta atual.");
      erro.code = "SESSION_CHANGED";
      throw erro;
    }
  };
  conferirSessao();
  if (res.status === 204) return null;
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(
      "A API retornou uma resposta inválida. Confira a configuração do servidor.",
    );
  }
  conferirSessao();
  if (!res.ok) {
    const erro = new Error(
      json.erro || "Não foi possível concluir a operação.",
    );
    erro.status = res.status;
    if (res.status === 401 && path != "/auth/login") setSession(null);
    throw erro;
  }
  return json.dados;
}
export const statusList = [
  "recebido",
  "em diagnostico",
  "aguardando aprovacao",
  "aguardando peca",
  "em reparo",
  "em teste",
  "pronto para retirada",
  "entregue",
  "cancelado",
  "produto armazenado",
];
export function mapOrder(o) {
  const stage =
    {
      recebido: 0,
      "em diagnostico": 1,
      "aguardando aprovacao": 2,
      "aguardando peca": 1,
      "em reparo": 3,
      "em teste": 4,
      "pronto para retirada": 4,
      entregue: 5,
      cancelado: 0,
      "produto armazenado": 0,
    }[o.status] ?? 0;
  const parts = (o.pecas || []).map((p) => ({
    name: p.nome,
    qty: p.quantidade,
    value: Number(p.valor_unitario),
  }));
  if (Number(o.orcamento?.valor_mao_obra) > 0)
    parts.push({
      name: "Mão de obra",
      qty: 1,
      value: Number(o.orcamento.valor_mao_obra),
    });
  return {
    id: o.codigo_rastreio,
    dbId: o.id_os,
    name: o.cliente,
    email: o.email,
    phone: o.telefone,
    type: o.tipo,
    brand: o.marca,
    model: o.modelo,
    serial: o.numero_serie,
    issue: o.defeito_relatado,
    stage,
    statusLabel: o.status,
    service: o.servico,
    created: o.criado_em?.replace(" ", "T"),
    diagnosis: o.diagnostico,
    parts,
    decision: o.orcamento?.status === "pendente" ? null : o.orcamento?.status,
    history: (o.historico || []).map((h) => ({
      title: h.status,
      note: h.descricao,
      date: h.data_atualizacao.replace(" ", "T"),
    })),
    demo: false,
    raw: o,
  };
}
