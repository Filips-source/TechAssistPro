import { carregarAmbiente } from "../config/ambiente.js";
carregarAmbiente();
const { pool } = await import("../config/database.js");
const { default: bcrypt } = await import("bcryptjs");

const nome = process.env.DESENVOLVEDOR_NOME?.trim();
const email = process.env.DESENVOLVEDOR_EMAIL?.trim().toLowerCase();
const senha = process.env.DESENVOLVEDOR_SENHA;

if (
  !nome ||
  nome.length < 3 ||
  nome.length > 120 ||
  !email ||
  email.length > 150 ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !senha ||
  senha.length < 12 ||
  senha.length > 72 ||
  !/[a-z]/.test(senha) ||
  !/[A-Z]/.test(senha) ||
  !/[0-9]/.test(senha) ||
  !/[\W_]/.test(senha)
) {
  console.error(
    "Configure DESENVOLVEDOR_NOME, DESENVOLVEDOR_EMAIL e DESENVOLVEDOR_SENHA no .env. A senha deve ter 12 a 72 caracteres, com maiúscula, minúscula, número e símbolo.",
  );
  await pool.end();
  process.exit(1);
}

try {
  await pool.query(
    "INSERT INTO usuarios(nome,email,senha_hash,perfil) VALUES(?,?,?,'desenvolvedor')",
    [nome, email, await bcrypt.hash(senha, 10)],
  );
  console.log(
    `Conta de desenvolvedor criada para ${email}. Remova DESENVOLVEDOR_SENHA do .env.`,
  );
} catch (error) {
  console.error(
    error.code === "ER_DUP_ENTRY"
      ? "E-mail já cadastrado. Nenhuma senha foi alterada."
      : error.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD"
        ? "O banco ainda não aceita o perfil desenvolvedor. Execute a migração SQL primeiro."
        : error.message,
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
