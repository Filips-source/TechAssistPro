import { Router } from "express";
import * as Relatorio from "../controllers/RelatorioController.js";
import { autenticar, autorizarEquipe } from "../middlewares/AuthMiddleware.js";

export const relatorioRouter = Router();
relatorioRouter.use(autenticar, autorizarEquipe);
relatorioRouter.get("/", Relatorio.listar);
relatorioRouter.get("/:id", Relatorio.buscar);
relatorioRouter.post("/", Relatorio.adicionarRelatorio);
relatorioRouter.patch("/:id", Relatorio.editarRelatorio);
