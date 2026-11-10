import "dotenv/config";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import healthRoutes from "./routes/healthRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { autenticar, autorizarEscrita } from "./middlewares/authMiddleware.js";
import { authRoutes } from "./routes/authRoutes.js";
import { clientesRoutes } from "./routes/clientesRoutes.js";
import { equipamentoRoutes } from "./routes/equipamentoRoutes.js";
import { usuariosRoutes } from "./routes/usuariosRoutes.js";
import { ordemServicoRoutes } from "./routes/ordemServicoRoutes.js";
import { orcamentoRoutes } from "./routes/orcamentoRoutes.js";
import { pecaRoutes } from "./routes/pecaRoutes.js";
import { pecaUtilizadaRoutes } from "./routes/pecaUtilizadaRoutes.js";
import { historicoRoutes } from "./routes/historicoRoutes.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  }),
);

app.use(express.json());

app.get("/", (request, response) => {
  response.json({
    message: "API do projeto TechAssistPro",
  });
});


app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);


app.use("/api/clientes", autenticar, clientesRoutes);
app.use("/api/equipamentos", autenticar, equipamentoRoutes);
app.use("/api/ordens-servicos", autenticar, ordemServicoRoutes);
app.use("/api/orcamentos", autenticar, orcamentoRoutes);
app.use("/api/pecas-utilizadas", autenticar, pecaUtilizadaRoutes);


app.use("/api/usuarios", autenticar, autorizarEscrita("Administrador"), usuariosRoutes);

app.use("/api/pecas", autenticar, autorizarEscrita("Administrador", "Supervisor"), pecaRoutes);

app.use(
  "/api/historico",
  (request, response, next) =>
    request.path.startsWith("/rastreio/") ? next() : autenticar(request, response, next),
  historicoRoutes,
);

app.use((request, response) => {
  response.status(404).json({
    sucesso: false,
    mensagem: "Rota não encontrada",
  });
});

app.use(errorHandler);

export default app;