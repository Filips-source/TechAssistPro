import TechAssist from "@/components/techassist/TechAssist";

export const metadata = { title: "Entrar ou cadastrar | TechAssist Pro" };

export default function Page() {
  return <TechAssist initialPage="inicio" initialAuthMode="login" />;
}
