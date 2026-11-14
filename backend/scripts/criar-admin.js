import { carregarAmbiente } from "../config/ambiente.js";
carregarAmbiente();
const { pool } = await import("../config/database.js");
const { default: bcrypt } = await import("bcryptjs");
const email = process.env.ADMIN_EMAIL,
  senha = process.env.ADMIN_SENHA,
  nome = process.env.ADMIN_NOME || "Administrador";
if (
  !email ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !senha ||
  senha.length < 8 ||
  senha.length > 72 ||
  !/[a-z]/.test(senha) ||
  !/[A-Z]/.test(senha) ||
  !/[0-9]/.test(senha) ||
  !/[\W_]/.test(senha)
) {
  console.error(
    "Configure ADMIN_EMAIL e ADMIN_SENHA no .env (8 a 72 caracteres com maiúscula, minúscula, número e símbolo).",
  );
  process.exit(1);
}
try {
  await pool.query(
    "INSERT INTO usuarios(nome,email,senha_hash,perfil) VALUES(?,?,?,'adm')",
    [nome, email.toLowerCase(), await bcrypt.hash(senha, 10)],
  );
  console.log(
    "Administrador criado. Remova ADMIN_SENHA do .env após o cadastro.",
  );
} catch (e) {
  console.error(
    e.code === "ER_DUP_ENTRY"
      ? "E-mail já cadastrado. Nenhuma senha foi alterada."
      : e.message,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
