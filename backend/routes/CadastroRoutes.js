import { Router } from "express";
import { controlador } from "../controllers/CadastroController.js";
import {
  autenticar,
  autorizarEquipe,
  autorizarAdmin,
} from "../middlewares/AuthMiddleware.js";
export function criarRotasCadastro(tipo) {
  const r = Router(),
    c = controlador(tipo);
  r.use(autenticar, autorizarEquipe);
  r.get("/", c.listar);
  r.post("/", c.criar);
  r.put("/:id", c.atualizar);
  r.delete("/:id", autorizarAdmin, c.excluir);
  return r;
}
