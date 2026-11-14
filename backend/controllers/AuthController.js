import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { erro } from "../utils/validacao.js";
import * as AuthService from "../services/AuthService.js";
const diretorioFotos = join(dirname(fileURLToPath(import.meta.url)), "..", "uploads", "perfis");

function identificarExtensao(arquivo) {
  if (!arquivo) return null;
  const b = arquivo.buffer;
  if (arquivo.mimetype === "image/jpeg" && b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ".jpg";
  if (arquivo.mimetype === "image/png" && b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return ".png";
  if (arquivo.mimetype === "image/webp" && b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return ".webp";
  throw erro(422, "Foto inválida: envie uma imagem JPG, PNG ou WebP.");
}

export async function registrar(req, res, next) {
  let fotoSalva = null;
  try {
    const extensao = identificarExtensao(req.file);
    let imagemUrl = null;
    if (extensao) {
      const nome = randomUUID() + extensao;
      await mkdir(diretorioFotos, { recursive: true });
      fotoSalva = join(diretorioFotos, nome);
      await writeFile(fotoSalva, req.file.buffer, { flag: "wx" });
      imagemUrl = "/api/uploads/perfis/" + nome;
    }
    const dados = await AuthService.registrar(req.body, imagemUrl);
    res.status(201).json({ sucesso: true, dados });
  } catch (e) {
    if (fotoSalva) await unlink(fotoSalva).catch(() => {});
    next(e);
  }
}
export async function login(req, res, next) {
  try {
    res.json({ sucesso: true, dados: await AuthService.login(req.body) });
  } catch (e) {
    next(e);
  }
}
export function me(req, res) {
  res.json({
    sucesso: true,
    dados: AuthService.publico(req.usuario.registro, req.usuario.tipo),
  });
}
