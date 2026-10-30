import "dotenv/config";
import app from "./app.js";
import { checkDatabaseConnection } from "./config/database.js";


try {
  const conectado = await checkDatabaseConnection();

  if (conectado) {
    console.log(" MySQL conectado com sucesso!");
  }
} catch (erro) {
  console.error("Erro ao conectar ao MySQL:");
  console.error(erro);
}

const port = Number(process.env.PORT || 8080);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
