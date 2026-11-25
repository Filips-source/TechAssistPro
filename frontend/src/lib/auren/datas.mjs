export function formatarData(valor) {
  if (!valor) return "A definir";
  const texto = String(valor);
  // DATE do MySQL é uma data de calendário, não meia-noite UTC.
  const data = new Date(/^\d{4}-\d{2}-\d{2}$/.test(texto)
    ? `${texto}T00:00:00`
    : texto.replace(" ", "T"));
  return Number.isNaN(data.getTime()) ? texto : data.toLocaleDateString("pt-BR");
}
