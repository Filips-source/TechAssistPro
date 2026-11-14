import express from "express";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import helmet from "helmet";
import cors from "cors";
import { pool } from "./config/database.js";
import { authRouter } from "./routes/AuthRoutes.js";
import { contatoRouter } from "./routes/ContatoRoutes.js";
import { suporteRouter } from "./routes/SuporteRoutes.js";
import { ordemRouter } from "./routes/OrdemRoutes.js";
import { criarRotasCadastro } from "./routes/CadastroRoutes.js";
import * as Ordem from "./controllers/OrdemController.js";
import { autenticar, autorizarEquipe } from "./middlewares/AuthMiddleware.js";
export const app = express();
app.disable("x-powered-by");
app.use(helmet());
const origens = (process.env.CORS_ORIGENS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());
app.use(
  cors({
    origin(origem, cb) {
      if (!origem || origens.includes(origem)) return cb(null, true);
      const e = new Error("Origem não permitida pelo CORS.");
      e.status = 403;
      cb(e);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "64kb" }));
app.get("/api/check", async (_req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.json({ sucesso: true, dados: { api: "ok", banco: "ok" } });
  } catch (e) {
    next(e);
  }
});
// As fotos públicas são gravadas na pasta uploads, fora de node_modules.
app.use("/api/uploads/perfis", express.static(join(dirname(fileURLToPath(import.meta.url)), "uploads", "perfis"), { index: false, fallthrough: false, maxAge: "1d" }));
app.use("/api/auth", authRouter);
app.use("/api/contatos", contatoRouter);
app.use("/api/suporte", suporteRouter);
app.use("/api/ordens", ordemRouter);
for (const tipo of ["clientes", "equipamentos", "pecas"])
  app.use("/api/" + tipo, criarRotasCadastro(tipo));
app.post("/api/solicitacoes", autenticar, Ordem.solicitar);
// Código aleatório de 96 bits + e-mail funciona como credencial de consulta limitada à ordem.
app.post("/api/rastreio", Ordem.rastrear);
app.post("/api/rastreio/decisao", Ordem.decidirRastreio);
app.get(
  "/api/tecnicos",
  autenticar,
  autorizarEquipe,
  async (_req, res, next) => {
    try {
      const [r] = await pool.query(
        "SELECT id_usuario,nome,especialidade FROM usuarios WHERE status='ativo' ORDER BY nome",
      );
      res.json({ sucesso: true, dados: r });
    } catch (e) {
      next(e);
    }
  },
);
app.use((_req, res) =>
  res.status(404).json({ sucesso: false, erro: "Rota não encontrada." }),
);
app.use((e, _req, res, _next) => {
  let status = e.status || 500,
    mensagem = e.message;
  if (e.code === "ER_DUP_ENTRY") {
    status = 409;
    mensagem = "Já existe um registro com esses dados.";
  }
  if (e.code === "ER_NO_REFERENCED_ROW_2") {
    status = 422;
    mensagem = "Cliente, equipamento ou técnico não encontrado.";
  }
  if (e.code === "ER_ROW_IS_REFERENCED_2") {
    status = 409;
    mensagem =
      "Este registro possui vínculos. Altere seu status em vez de excluir.";
  }
  if (e.code === "LIMIT_FILE_SIZE") {
    status = 422;
    mensagem = "A foto deve ter no máximo 2 MB.";
  }
  if (e.code === "LIMIT_UNEXPECTED_FILE" || (e.code || "").startsWith("LIMIT_")) {
    status = 422;
    mensagem = e.code === "LIMIT_FILE_SIZE" ? "A foto deve ter no máximo 2 MB." : "Envie somente uma foto de perfil válida.";
  }
  if (e.type === "entity.parse.failed") {
    status = 400;
    mensagem = "JSON inválido.";
  }
  if (e instanceof TypeError && !e.status) {
    status = 422;
    mensagem = "Confira os dados enviados.";
  }
  if (status >= 500) {
    console.error(e.code || e.message);
    mensagem =
      "Não foi possível concluir a operação. Verifique a conexão com o banco.";
  }
  res.status(status).json({ sucesso: false, erro: mensagem });
});
