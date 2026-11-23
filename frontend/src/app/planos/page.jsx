"use client";
import { useState } from "react";
import Link from "next/link";
import "./planos.css";
const PLANOS = [
  { id:"essencial", nome:"Essencial", descricao:"Acompanhamento de equipamentos e reparos.", recursos:["Cadastro de equipamentos","Solicitação de reparo","Histórico de serviços","Suporte pelo chat"] },
  { id:"preventivo", nome:"Preventivo", descricao:"Apresentação de monitoramento preventivo com indicadores.", recursos:["Tudo do Essencial","Monitoramento de métricas","Alertas e histórico de leituras","Acompanhamento preventivo"] },
  { id:"gestao", nome:"Gestão técnica", descricao:"Organização de uma oficina e equipe de manutenção.", recursos:["Tudo do Preventivo","Gestão de equipe e ordens","Ferramentas de bancada","Relatórios operacionais"] }
];
export default function PlanosPage() {
  const [selecionado, setSelecionado] = useState(null);
  const plano = PLANOS.find((p) => p.id === selecionado);
  return <main className="planos-publicos">
    <header className="planos-header"><Link href="/">← Voltar ao TechAssist Pro</Link><strong>TECHASSIST PRO</strong></header>
    <div className="planos-intro"><span>APRESENTAÇÃO DA SOLUÇÃO</span><h1>Conheça os planos</h1><p>Escolha uma proposta para conhecer o fluxo de contratação. Valores e recursos são ilustrativos e não representam ofertas comerciais ativas.</p></div>
    <div className="planos-grid">{PLANOS.map((p) => <article className="plano-card" key={p.id}><h2>{p.nome}</h2><p>{p.descricao}</p><ul>{p.recursos.map((r)=><li key={r}>✓ {r}</li>)}</ul><button type="button" onClick={()=>setSelecionado(p.id)}>Selecionar plano</button></article>)}</div>
    {plano && <div className="plano-overlay" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelecionado(null);}}><section className="plano-dialog" role="dialog" aria-modal="true" aria-labelledby="plano-titulo"><span className="plano-check">✓</span><h2 id="plano-titulo">Simulação de contratação concluída</h2><p>Plano selecionado: <strong>{plano.nome}</strong></p><p>Esta é uma demonstração. <strong>Nenhum pagamento foi realizado, nenhuma cobrança foi gerada e nenhuma assinatura foi ativada.</strong></p><div className="plano-actions"><button type="button" onClick={()=>setSelecionado(null)}>Escolher outro plano</button><Link href="/login">Acessar área do cliente</Link></div></section></div>}
    <footer className="planos-footer">Demonstração acadêmica · Sem cobrança ou contratação real</footer>
  </main>;
}
