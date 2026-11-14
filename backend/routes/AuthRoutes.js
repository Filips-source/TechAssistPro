import multer from "multer";
import { Router } from "express";
import * as Auth from "../controllers/AuthController.js";
import { autenticar } from "../middlewares/AuthMiddleware.js";
export const authRouter = Router();
const uploadPerfil = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 12 },
  fileFilter(_req, arquivo, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.mimetype)) {
      const erro = new Error("A foto deve ser JPG, PNG ou WebP.");
      erro.status = 422;
      return callback(erro);
    }
    callback(null, true);
  },
});
authRouter.post("/registrar", uploadPerfil.single("foto_perfil"), Auth.registrar);
authRouter.post("/login", Auth.login);
authRouter.get("/me", autenticar, Auth.me);
