import { notFound, redirect } from "next/navigation";
import AurenDashboard from "../../../components/dashboard/AurenDashboard";
import DashboardClient from "../../../components/dashboard/DashboardClient";
import { USUARIOS_DEMO, dadosDemonstracao } from "../../../lib/auren/exemplo";
import { podeAcessarSecao, PERFIS } from "../../../lib/auren/permissoes";
import "../dashboard.css";

export const metadata = { title: "Dashboard | TechAssist Pro" };

export default async function DashboardPage({ params, searchParams }) {
  const { secao = [] } = await params;
  const tela = secao[0] ?? "visao-geral";
  // Em desenvolvimento, os dados fictícios permitem abrir a dashboard sem API ou banco.
  // Para testar a integração real localmente, defina AUREN_DASHBOARD_DEMO=false.
  const demonstracao = process.env.NODE_ENV !== "production" && process.env.AUREN_DASHBOARD_DEMO !== "false";

  if (secao.length > 1) notFound();
  if (!demonstracao) return <DashboardClient secao={tela} />;

  const query = await searchParams;
  const perfilDemo = Object.values(PERFIS).includes(query?.perfil) ? query.perfil : PERFIS.CLIENTE;
  const usuario = USUARIOS_DEMO[perfilDemo];

  if (!usuario) redirect("/login");
  if (!podeAcessarSecao(usuario.perfil, tela)) notFound();

  const dados = dadosDemonstracao(usuario);

  return <AurenDashboard usuario={usuario} dados={dados} secao={tela} demonstracao={demonstracao} />;
}
