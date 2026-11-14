export function carregarAmbiente(arquivo = ".env") {
  try {
    process.loadEnvFile(arquivo);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  const obrigatorios = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_NAME",
    "JWT_SECRET",
  ];
  const ausentes = obrigatorios.filter((nome) => !process.env[nome]?.trim());
  if (ausentes.length)
    throw new Error(`Configure o .env: ${ausentes.join(", ")}`);
  if (process.env.JWT_SECRET.length < 32)
    throw new Error(
      "JWT_SECRET deve ter pelo menos 32 caracteres. Use npm run chave.",
    );
  const porta = Number(process.env.PORT || 3001);
  if (!Number.isInteger(porta) || porta < 1 || porta > 65535)
    throw new Error("PORT inválida.");
  return { porta, ambiente: process.env.NODE_ENV || "development" };
}
