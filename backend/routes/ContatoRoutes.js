import { Router } from "express";
import * as C from "../controllers/ContatoController.js";
import { autenticar, autorizarEquipe } from "../middlewares/AuthMiddleware.js";
export const contatoRouter = Router();
contatoRouter.post("/", C.criar);
contatoRouter.get("/", autenticar, autorizarEquipe, C.listar);
