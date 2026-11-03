import "dotenv/config";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import { clientesRoutes } from "./routes/clientesRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

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

app.use("/api/clientes", clientesRoutes);

app.use("/api/health", healthRoutes);

app.use(errorHandler);

export default app;