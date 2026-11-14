import { carregarAmbiente } from "./config/ambiente.js";
const config = carregarAmbiente();
const { app } = await import("./app.js");
app.listen(config.porta, () =>
  console.log(`TechAssist Pro API: http://localhost:${config.porta}`),
);
