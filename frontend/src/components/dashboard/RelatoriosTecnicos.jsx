"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../techassist/api";
import { formatarData } from "../../lib/auren/datas.mjs";

export default function RelatoriosTecnicos({ ordens }) {
  const [relatorios, setRelatorios] = useState([]);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [formulario, setFormulario] = useState(null);
  const [revisao, setRevisao] = useState(0);
  const atualizar = useCallback(() => setRevisao((valor) => valor + 1), []);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    api("/relatorios").then((dados) => {
      if (ativo) { setRelatorios(dados); setErro(""); }
    }).catch((e) => { if (ativo) setErro(e.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [revisao]);

  useEffect(() => {
    if (!formulario || salvando) return;
    function fechar(evento) { if (evento.key === "Escape") setFormulario(null); }
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [formulario, salvando]);

  async function salvar(evento) {
    evento.preventDefault();
    if (salvando) return;
    const campos = new FormData(evento.currentTarget);
    const dados = Object.fromEntries(["diagnostico", "descricao_reparo", "observacoes"].map((campo) => [campo, campos.get(campo)]));
    const id = formulario.id_relatorio;
    if (!id) dados.id_os = Number(campos.get("id_os"));
    setSalvando(true); setErro(""); setAviso("");
    try {
      await api("/relatorios" + (id ? "/" + id : ""), { method: id ? "PATCH" : "POST", body: dados });
      setFormulario(null); setAviso("Relatório técnico salvo."); atualizar();
    } catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  }

  return <section className="ad-operational ad-technical-reports">
    <div className="ad-section-title">
      <div><h2>Relatórios técnicos por OS</h2><p>Registre o diagnóstico, o reparo e as observações de cada atendimento.</p></div>
      <button className="ad-primary-btn" type="button" disabled={!ordens.length} onClick={() => { setFormulario({}); setErro(""); }}>+ Adicionar relatório técnico</button>
    </div>
    {erro && <p className="ad-operation-error" role="alert">{erro}</p>}
    {aviso && <p className="ad-operation-success" role="status">{aviso}</p>}
    {!ordens.length && <p className="ad-muted">É necessário ter uma ordem de serviço disponível para registrar um relatório.</p>}
    <button type="button" className="ad-secondary-btn" onClick={atualizar} disabled={carregando}>Atualizar relatórios</button>
    {carregando ? <p className="ad-muted">Carregando relatórios...</p> : relatorios.length ? <div className="ad-operational-grid">
      {relatorios.map((relatorio) => <article className="ad-panel ad-operational-item" key={relatorio.id_relatorio}>
        <strong>Relatório #{relatorio.id_relatorio} · OS #{relatorio.id_os}</strong>
        <small>{relatorio.autor || "Equipe técnica"} · {formatarData(relatorio.data_atualizacao)}</small>
        <p className="ad-report-complete">{relatorio.diagnostico}</p>
        <details><summary>Ler reparo e observações</summary>
          <p className="ad-report-complete"><strong>Reparo:</strong> {relatorio.descricao_reparo}</p>
          <p className="ad-report-complete"><strong>Observações:</strong> {relatorio.observacoes || "Não informadas."}</p>
        </details>
        <button type="button" className="ad-secondary-btn" onClick={() => { setFormulario(relatorio); setErro(""); }}>Editar relatório</button>
      </article>)}
    </div> : <p className="ad-muted">Nenhum relatório técnico disponível.</p>}
    {formulario && <div className="ad-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !salvando) setFormulario(null); }}>
      <section className="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ad-technical-title">
        <div className="ad-modal-header"><h2 id="ad-technical-title">{formulario.id_relatorio ? "Editar" : "Adicionar"} relatório técnico</h2><button type="button" aria-label="Fechar relatório" disabled={salvando} onClick={() => setFormulario(null)}>×</button></div>
        <form className="ad-form" onSubmit={salvar}>
          {formulario.id_relatorio ? <p className="ad-muted">Ordem de serviço #{formulario.id_os}</p> : <label>Ordem de serviço<select name="id_os" required autoFocus defaultValue=""><option value="" disabled>Selecione a ordem</option>{ordens.map((ordem) => <option key={ordem.id} value={ordem.id}>OS #{ordem.id} · {ordem.titulo}</option>)}</select></label>}
          <label>Diagnóstico<textarea name="diagnostico" required maxLength={10000} rows={3} defaultValue={formulario.diagnostico || ""} autoFocus={!!formulario.id_relatorio}/></label>
          <label>Descrição do reparo<textarea name="descricao_reparo" required maxLength={10000} rows={4} defaultValue={formulario.descricao_reparo || ""}/></label>
          <label>Observações<textarea name="observacoes" maxLength={10000} rows={3} defaultValue={formulario.observacoes || ""}/></label>
          {erro && <p className="ad-operation-error" role="alert">{erro}</p>}
          <div className="ad-form-footer"><button type="button" className="ad-secondary-btn" disabled={salvando} onClick={() => setFormulario(null)}>Cancelar</button><button type="submit" className="ad-primary-btn" disabled={salvando}>{salvando ? "Salvando..." : "Salvar relatório"}</button></div>
        </form>
      </section>
    </div>}
  </section>;
}
