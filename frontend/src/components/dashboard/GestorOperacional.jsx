"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../techassist/api";

const CONFIG = {
  ferramentas: {
    titulo: "Ferramentas e materiais de bancada", singular: "Ferramenta", endpoint: "/painel/ferramentas",
    id: "id_ferramenta",
    campos: [
      ["nome","Nome","text",true],["categoria","Categoria","text",true],
      ["descricao","Descrição","textarea",false],["quantidade","Quantidade","number",true],
      ["estado","Estado","select",true,["disponivel","em_uso","manutencao"]]
    ]
  },
  relatorios: {
    titulo: "Modelos e relatórios", singular: "Relatório", endpoint: "/painel/relatorios",
    id: "id_relatorio",
    campos: [["titulo","Título","text",true],["tipo","Tipo","select",true,["preventivo","diagnostico","operacional"]],["conteudo","Conteúdo","textarea",true]]
  },
  equipamentos: {
    titulo: "Cadastro e manutenção de equipamentos", singular: "Equipamento", endpoint: "/painel/equipamentos",
    id: "id_equipamento",
    campos: [
      ["id_cliente","ID do cliente","number",true],
      ["nome","Nome","text",true],
      ["tipo","Tipo","select",true,["notebook","computador","celular","tablet","impressora","monitor","outro"]],
      ["marca","Marca","text",true],["modelo","Modelo","text",true],
      ["numero_serie","Número de série","text",false],["observacoes","Observações","textarea",false]
    ]
  },
  metricas: {
    titulo: "Métricas configuráveis", singular: "Métrica", endpoint: "/painel/metricas",
    id: "id_metrica",
    campos: [
      ["id_equipamento","ID do equipamento","number",true],
      ["nome","Nome da métrica","text",true],
      ["unidade","Unidade","text",true],
      ["limite_atencao","Atenção a partir de","number",true],
      ["limite_critico","Crítico a partir de","number",true]
    ]
  }
};
const legenda = {
  disponivel: "Disponível", em_uso: "Em uso", manutencao: "Em manutenção",
  preventivo: "Preventivo", diagnostico: "Diagnóstico", operacional: "Operacional"
};
const formatar = (valor) => typeof valor === "string" ? (valor.length > 130 ? valor.slice(0, 130) + "…" : valor) : (valor ?? "—");

export default function GestorOperacional({ tipo, usuario, onDadosAlterados }) {
  const conf = CONFIG[tipo];
  const administrador = ["administrador", "desenvolvedor"].includes(usuario.perfil);
  const cliente = usuario.perfil === "cliente";
  const podeEditar = administrador || (tipo === "equipamentos" && cliente);
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [editando, setEditando] = useState(null);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [selecionada, setSelecionada] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resumo = await api("/painel/resumo");
      const lista = resumo?.[tipo] ?? [];
      setDados(lista);
      setErro("");
    } catch (e) { setErro(e.message); }
    finally { setCarregando(false); }
  }, [tipo]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = dados.filter((registro) => Object.values(registro).some((v) => String(v ?? "").toLowerCase().includes(busca.toLowerCase())));
  function abrir(registro = null) { setEditando(registro); setErro(""); setFormAberto(true); }
  async function salvar(evento) {
    evento.preventDefault();
    if (!podeEditar || salvando) return;
    const formulario = new FormData(evento.currentTarget);
    const payload = {};
    for (const [chave, , tipoCampo] of conf.campos) {
      if (chave === "id_cliente" && cliente) continue;
      const bruto = String(formulario.get(chave) ?? "").trim();
      if (tipoCampo === "number") payload[chave] = bruto === "" ? null : Number(bruto);
      else payload[chave] = bruto;
    }
    setSalvando(true); setErro(""); setAviso("");
    try {
      const id = editando?.[conf.id];
      await api(conf.endpoint + (id ? "/" + id : ""), { method: id ? "PUT" : "POST", body: payload });
      setFormAberto(false); setEditando(null); await carregar();
      onDadosAlterados?.();
      setAviso(conf.singular + " salvo(a) no banco com sucesso.");
    } catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  }
  async function excluir(registro) {
    if (!administrador || salvando) return;
    if (!window.confirm("Excluir " + (registro.nome || registro.titulo) + "? A operação pode ser bloqueada caso existam vínculos.")) return;
    setSalvando(true); setErro(""); setAviso("");
    try {
      await api(conf.endpoint + "/" + registro[conf.id], { method: "DELETE" });
      await carregar(); onDadosAlterados?.();
      setAviso("Registro removido com sucesso.");
    } catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  }
  const tituloRegistro = (r) => r.nome || r.titulo || ("Registro #" + r[conf.id]);
  return (
    <div className="ad-operational">
      <div className="ad-section-title">
        <div><h2>{conf.titulo}</h2><p>Dados persistidos no MySQL e associados às permissões da conta.</p></div>
        {podeEditar && <button type="button" className="ad-primary-btn" onClick={() => abrir()}>+ Adicionar {conf.singular.toLowerCase()}</button>}
      </div>
      {erro && <p role="alert" className="ad-operation-error">{erro}</p>}
      {aviso && <p role="status" className="ad-operation-success">{aviso}</p>}
      <div className="ad-toolbar">
        <div className="ad-search"><input aria-label={"Pesquisar " + tipo} placeholder="Pesquisar por nome, status ou descrição…" value={busca} onChange={(e)=>setBusca(e.target.value)}/></div>
        <button type="button" className="ad-secondary-btn" onClick={carregar} disabled={carregando}>Atualizar</button>
      </div>
      {carregando ? <p className="ad-muted">Carregando dados...</p> : !filtrados.length
        ? <p className="ad-muted">{dados.length ? "Nenhum resultado para a busca." : "Nenhum registro cadastrado neste módulo."}</p>
        : <section className="ad-operational-grid">
          {filtrados.map((registro) => <article key={registro[conf.id]} className="ad-panel ad-operational-item">
            <div><strong>{tituloRegistro(registro)}</strong><small>{tipo === "ferramentas" ? (registro.categoria + " · " + (legenda[registro.estado] ?? registro.estado)) : tipo === "relatorios" ? (legenda[registro.tipo] ?? registro.tipo) : tipo === "equipamentos" ? (registro.marca + " · " + registro.modelo) : ("Equipamento #" + registro.id_equipamento + " · " + registro.unidade)}</small></div>
            <p>{formatar(registro.descricao ?? registro.conteudo ?? registro.observacoes ?? (tipo === "metricas" ? ("Atenção: " + registro.limite_atencao + " / Crítico: " + registro.limite_critico) : ("Quantidade: " + registro.quantidade)))}</p>
            {podeEditar && <div className="ad-operation-actions">
              <button type="button" className="ad-secondary-btn" onClick={() => abrir(registro)}>Editar</button>
              {administrador && <button type="button" className="ad-danger-btn" disabled={salvando} onClick={() => excluir(registro)}>Excluir</button>}
            </div>}
            {tipo === "relatorios" && <button type="button" className="ad-text-btn" onClick={() => setSelecionada((atual) => atual === registro[conf.id] ? "" : registro[conf.id])}>{selecionada === registro[conf.id] ? "Ocultar relatório" : "Ler relatório completo"}</button>}
            {tipo === "relatorios" && selecionada === registro[conf.id] && <p className="ad-report-complete">{registro.conteudo}</p>}
          </article>)}
        </section>}
      {formAberto && <div className="ad-modal-backdrop" onMouseDown={(e)=>{if(e.target === e.currentTarget && !salvando) setFormAberto(false);}}>
        <section className="ad-modal" role="dialog" aria-modal="true" aria-labelledby="ad-operation-title">
          <div className="ad-modal-header"><h2 id="ad-operation-title">{editando ? "Editar" : "Adicionar"} {conf.singular.toLowerCase()}</h2><button type="button" onClick={()=>setFormAberto(false)} aria-label="Fechar formulário" disabled={salvando}>×</button></div>
          <form className="ad-form" onSubmit={salvar}>
            {conf.campos.filter(([chave]) => !(chave === "id_cliente" && cliente)).map(([chave, rotulo, tipoCampo, obrigatorio, opcoes]) =>
              <label key={chave}>{rotulo}
                {tipoCampo === "textarea" ? <textarea name={chave} required={obrigatorio} rows={tipo === "relatorios" ? 6 : 3} defaultValue={editando?.[chave] ?? ""}/>
                  : tipoCampo === "select" ? <select name={chave} required={obrigatorio} defaultValue={editando?.[chave] ?? opcoes[0]}>{opcoes.map((o)=><option key={o} value={o}>{legenda[o] ?? o}</option>)}</select>
                  : <input name={chave} type={tipoCampo} step={tipoCampo === "number" ? "any" : undefined} min={tipoCampo === "number" && !chave.startsWith("limite_") ? "0" : undefined} required={obrigatorio} defaultValue={editando?.[chave] ?? ""}/>}
              </label>)}
            {erro && <p role="alert" className="ad-operation-error">{erro}</p>}
            <div className="ad-form-footer"><button type="button" className="ad-secondary-btn" disabled={salvando} onClick={()=>setFormAberto(false)}>Cancelar</button><button type="submit" className="ad-primary-btn" disabled={salvando}>{salvando ? "Salvando..." : "Salvar no banco"}</button></div>
          </form>
        </section>
      </div>}
    </div>
  );
}
