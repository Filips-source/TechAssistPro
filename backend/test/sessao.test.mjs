import { test } from "node:test";
import assert from "node:assert/strict";
const storage = new Map();
globalThis.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
globalThis.window = new EventTarget();
const { api, setSession, getSession } = await import("../../frontend/src/components/techassist/api.js");

test("trocar conta apaga rastreio e notifica o dashboard", () => {
  let events = 0;
  const listener = () => events++;
  window.addEventListener("tap-session-change", listener);
  try {
    setSession({ token: "a" });
    storage.set("tap-tracking", "rastreio-antigo");
    setSession({ token: "b" });
    assert.equal(storage.has("tap-tracking"), false);
    setSession({ token: "b", usuario: { nome: "Atualizado" } });
    assert.equal(events, 2);
  } finally { window.removeEventListener("tap-session-change", listener); }
});
test("resposta de sessão anterior não substitui dados da nova conta", async () => {
  const original = globalThis.fetch;
  let complete;
  try {
    setSession({ token: "a" });
    globalThis.fetch = () => new Promise((resolve) => { complete = resolve; });
    const pending = api("/ordens");
    setSession({ token: "b" });
    complete(new Response(JSON.stringify({ dados: ["dados da conta A"] }), { status: 200 }));
    await assert.rejects(pending, { code: "SESSION_CHANGED" });
  } finally { globalThis.fetch = original; }
});
test("401 de uma requisição antiga não encerra a nova sessão", async () => {
  const original = globalThis.fetch;
  let complete;
  try {
    setSession({ token: "a" });
    globalThis.fetch = () => new Promise((resolve) => { complete = resolve; });
    const pending = api("/auth/me");
    setSession({ token: "b" });
    complete(new Response(JSON.stringify({ erro: "Expirou" }), { status: 401 }));
    await assert.rejects(pending, { code: "SESSION_CHANGED" });
    assert.equal(getSession().token, "b");
  } finally { globalThis.fetch = original; }
});
test("401 da sessão atual encerra a sessão", async () => {
  const original = globalThis.fetch;
  try {
    setSession({ token: "atual" });
    globalThis.fetch = async () => new Response(JSON.stringify({ erro: "Expirou" }), { status: 401 });
    await assert.rejects(api("/auth/me"), { status: 401 });
    assert.equal(getSession(), null);
  } finally { globalThis.fetch = original; }
});
