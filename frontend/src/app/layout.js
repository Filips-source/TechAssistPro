import "./globals.css";
export const metadata = {
  title: "TechAssist Pro",
  description:
    "Gestão de assistência técnica, contato, orçamento e acompanhamento de reparos.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
