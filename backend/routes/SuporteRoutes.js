import { Router } from "express";
import { autenticar } from "../middlewares/AuthMiddleware.js";
import * as Suporte from "../controllers/SuporteController.js";

export const suporteRouter = Router();
suporteRouter.use(autenticar);
suporteRouter.get("/eventos", Suporte.eventos);
suporteRouter.get("/conversas", Suporte.listar);
suporteRouter.post("/conversas", Suporte.criar);
suporteRouter.get("/conversas/:id/mensagens", Suporte.listarMensagens);
suporteRouter.post("/conversas/:id/mensagens", Suporte.enviar);
suporteRouter.patch("/conversas/:id/status", Suporte.status);
