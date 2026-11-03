import "dotenv/config";

import cors from "cors";
import express from "express";
import helmet from "helmet";

import { clientesRoutes } from "./routes/clientesRoutes.js";

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

export default app;