import { Router } from "express";
import { pool } from "../config/database.js";
import { autenticar } from "../middlewares/AuthMiddleware.js";
import { criar as criarCadastro, atualizar as atualizarCadastro, excluir as excluirCadastro } from "../services/CadastroService.js";

export const painelRouter = Router();
painelRouter.use(autenticar);

const falha = (status, mensagem) => Object.assign(new Error(mensagem), { status });
const admin = (u) => u.tipo === "equipe" && ["adm", "desenvolvedor"].includes(u.perfil);
const tecnico = (u) => u.tipo === "equipe" && u.perfil === "funcionario";
const inteiro = (v) => {
  const n = Number(v);
  if (!Number.isSafeInteger(n) || n < 1) throw falha(422, "Identificador inválido.");
  return n;
};
const texto = (v, nome, limite = 200, minimo = 1) => {
  if (typeof v !== "string" || v.trim().length < minimo || v.trim().length > limite) {
    throw falha(422, nome + ": informe de " + minimo + " a " + limite + " caracteres.");
  }
  return v.trim();
};
const opcao = (v, valores, nome) => {
  if (!valores.includes(v)) throw falha(422, nome + " inválido.");
  return v;
};
const numero = (v, nome, minimo = 0, maximo = 1e8) => {
  const n = Number(v);
  if (v === "" || v === null || v === undefined || !Number.isFinite(n) || n < minimo || n > maximo) {
    throw falha(422, nome + " inválido.");
  }
  return n;
};
const soAdmin = (req, _res, next) => admin(req.usuario) ? next() : next(falha(403, "Ação exclusiva da administração."));
const asyncRoute = (fn) => async (req, res, next) => {
  try {
    const resultado = await fn(req);
    if (resultado === null) return res.status(204).end();
    res.json({ sucesso: true, dados: resultado });
  } catch (e) { next(e); }
};
const camposEquipamento = ["id_cliente", "nome", "tipo", "marca", "modelo", "numero_serie", "observacoes"];

async function equipamentoAcessivel(u, id, escrita = false) {
  const [[item]] = await pool.query("SELECT id_equipamento,id_cliente FROM equipamentos WHERE id_equipamento=?", [inteiro(id)]);
  if (!item) throw falha(404, "Equipamento não encontrado.");
  if (admin(u)) return item;
  if (u.tipo === "cliente" && item.id_cliente === u.id) return item;
  if (!escrita && tecnico(u)) {
    const [[atribuicao]] = await pool.query("SELECT 1 AS ok FROM ordens_servico WHERE id_equipamento=? AND id_usuario=? LIMIT 1", [item.id_equipamento, u.id]);
    if (atribuicao) return item;
  }
  if (escrita && tecnico(u)) {
    const [[atribuicao]] = await pool.query("SELECT 1 AS ok FROM ordens_servico WHERE id_equipamento=? AND id_usuario=? AND status NOT IN ('entregue','cancelado') LIMIT 1", [item.id_equipamento, u.id]);
    if (atribuicao) return item;
  }
  throw falha(403, "Sem acesso ao equipamento.");
}
function camposAlteraveis(dados, u, original = null) {
  const d = {};
  for (const c of camposEquipamento) if (dados[c] !== undefined) d[c] = dados[c];
  d.id_cliente = admin(u) ? inteiro(d.id_cliente ?? original?.id_cliente) : u.id;
  return d;
}
async function atualizarOuExcluir(tabela, coluna, id, dados, exclusao = false) {
  const [resultado] = exclusao
    ? await pool.query("DELETE FROM " + tabela + " WHERE " + coluna + "=?", [id])
    : await pool.query("UPDATE " + tabela + " SET ? WHERE " + coluna + "=?", [dados, id]);
  if (!resultado.affectedRows) throw falha(404, "Registro não encontrado.");
  return exclusao ? null : (await pool.query("SELECT * FROM " + tabela + " WHERE " + coluna + "=?", [id]))[0][0];
}

// As consultas são isoladas por identidade JWT, inclusive ao alternar clientes no mesmo navegador.
painelRouter.get("/resumo", asyncRoute(async ({ usuario: u }) => {
  const filtro = u.tipo === "cliente" ? "WHERE e.id_cliente=?" :
    tecnico(u) ? "WHERE EXISTS (SELECT 1 FROM ordens_servico os WHERE os.id_equipamento=e.id_equipamento AND os.id_usuario=?)" : "";
  const args = filtro ? [u.id] : [];
  const [equipamentos] = await pool.query(
    "SELECT e.* FROM equipamentos e " + filtro + " ORDER BY e.id_equipamento DESC LIMIT 200", args
  );
  const ids = equipamentos.map((e) => e.id_equipamento);
  const [metricas] = ids.length
    ? await pool.query("SELECT * FROM painel_metricas WHERE id_equipamento IN (?) ORDER BY id_metrica", [ids])
    : [[]];
  const [leituras] = ids.length
    ? await pool.query(
      "SELECT l.* FROM painel_leituras l JOIN painel_metricas m ON m.id_metrica=l.id_metrica WHERE m.id_equipamento IN (?) AND l.id_leitura IN (SELECT MAX(id_leitura) FROM painel_leituras GROUP BY id_metrica) ORDER BY l.id_leitura DESC", [ids]
    )
    : [[]];
  const [ferramentas] = u.tipo === "equipe"
    ? await pool.query("SELECT * FROM painel_ferramentas ORDER BY nome LIMIT 200") : [[]];
  const [relatorios] = admin(u)
    ? await pool.query("SELECT r.*,u.nome AS autor FROM painel_relatorios r LEFT JOIN usuarios u ON u.id_usuario=r.id_autor ORDER BY r.atualizado_em DESC LIMIT 100") : [[]];
  const [pecas] = admin(u)
    ? await pool.query("SELECT * FROM pecas ORDER BY id_peca DESC LIMIT 200") : [[]];
  const [funcionarios] = admin(u)
    ? await pool.query("SELECT id_usuario AS id,nome,especialidade,status FROM usuarios WHERE perfil IN ('funcionario','suporte','supervisor') ORDER BY nome") : [[]];
  return { equipamentos, metricas, leituras, ferramentas, relatorios, pecas, funcionarios };
}));

painelRouter.post("/equipamentos", asyncRoute(async ({ usuario: u, body: d }) => {
  if (tecnico(u)) throw falha(403, "Funcionários não cadastram equipamentos.");
  const dados = camposAlteraveis(d || {}, u);
  // CadastroService verifica tipo, marca, modelo, integridade e referências.
  return criarCadastro("equipamentos", dados);
}));
painelRouter.put("/equipamentos/:id", asyncRoute(async ({ usuario: u, params, body: d }) => {
  const original = await equipamentoAcessivel(u, params.id, true);
  if (tecnico(u)) throw falha(403, "Somente cliente proprietário ou administrador edita equipamentos.");
  const atual = await pool.query("SELECT * FROM equipamentos WHERE id_equipamento=?", [original.id_equipamento]);
  return atualizarCadastro("equipamentos", original.id_equipamento, camposAlteraveis({ ...atual[0][0], ...d }, u, original));
}));
painelRouter.delete("/equipamentos/:id", asyncRoute(async ({ usuario: u, params }) => {
  const item = await equipamentoAcessivel(u, params.id, true);
  if (!admin(u)) throw falha(403, "Apenas administração pode excluir equipamentos. Contate o suporte.");
  await excluirCadastro("equipamentos", item.id_equipamento);
  return null;
}));

painelRouter.post("/ferramentas", soAdmin, asyncRoute(async ({ body: d, usuario: u }) => {
  const [r] = await pool.query(
    "INSERT INTO painel_ferramentas(nome,categoria,descricao,quantidade,estado,id_responsavel) VALUES (?,?,?,?,?,?)",
    [texto(d.nome, "Nome", 120, 2), texto(d.categoria || "Bancada", "Categoria", 60),
      d.descricao ? texto(d.descricao, "Descrição", 500) : null,
      numero(d.quantidade, "Quantidade", 0, 100000), opcao(d.estado || "disponivel", ["disponivel","em_uso","manutencao"], "Estado"), u.id]
  );
  return (await pool.query("SELECT * FROM painel_ferramentas WHERE id_ferramenta=?", [r.insertId]))[0][0];
}));
painelRouter.put("/ferramentas/:id", soAdmin, asyncRoute(async ({ params, body: d }) => {
  return atualizarOuExcluir("painel_ferramentas", "id_ferramenta", inteiro(params.id), {
    nome: texto(d.nome, "Nome", 120, 2), categoria: texto(d.categoria || "Bancada", "Categoria", 60),
    descricao: d.descricao ? texto(d.descricao, "Descrição", 500) : null,
    quantidade: numero(d.quantidade, "Quantidade", 0, 100000),
    estado: opcao(d.estado, ["disponivel","em_uso","manutencao"], "Estado")
  });
}));
painelRouter.delete("/ferramentas/:id", soAdmin, asyncRoute(async ({ params }) =>
  atualizarOuExcluir("painel_ferramentas", "id_ferramenta", inteiro(params.id), null, true)
));

painelRouter.post("/relatorios", soAdmin, asyncRoute(async ({ usuario: u, body: d }) => {
  const [r] = await pool.query(
    "INSERT INTO painel_relatorios(titulo,tipo,conteudo,id_autor) VALUES (?,?,?,?)",
    [texto(d.titulo, "Título", 150, 3), opcao(d.tipo || "preventivo", ["preventivo","diagnostico","operacional"], "Tipo"),
      texto(d.conteudo, "Conteúdo", 10000, 10), u.id]
  );
  return (await pool.query("SELECT * FROM painel_relatorios WHERE id_relatorio=?", [r.insertId]))[0][0];
}));
painelRouter.put("/relatorios/:id", soAdmin, asyncRoute(async ({ params, body: d }) =>
  atualizarOuExcluir("painel_relatorios", "id_relatorio", inteiro(params.id), {
    titulo: texto(d.titulo, "Título", 150, 3),
    tipo: opcao(d.tipo, ["preventivo","diagnostico","operacional"], "Tipo"),
    conteudo: texto(d.conteudo, "Conteúdo", 10000, 10)
  })
));
painelRouter.delete("/relatorios/:id", soAdmin, asyncRoute(async ({ params }) =>
  atualizarOuExcluir("painel_relatorios", "id_relatorio", inteiro(params.id), null, true)
));

painelRouter.post("/metricas", soAdmin, asyncRoute(async ({ body: d, usuario: u }) => {
  const idEquipamento = inteiro(d.id_equipamento);
  await equipamentoAcessivel(u, idEquipamento);
  const [r] = await pool.query(
    "INSERT INTO painel_metricas(id_equipamento,nome,unidade,limite_atencao,limite_critico) VALUES(?,?,?,?,?)",
    [idEquipamento, texto(d.nome, "Métrica", 100, 2), texto(d.unidade, "Unidade", 20),
      numero(d.limite_atencao, "Limite de atenção"), numero(d.limite_critico, "Limite crítico")]
  );
  return (await pool.query("SELECT * FROM painel_metricas WHERE id_metrica=?", [r.insertId]))[0][0];
}));
painelRouter.put("/metricas/:id", soAdmin, asyncRoute(async ({ params, body: d }) => {
  return atualizarOuExcluir("painel_metricas", "id_metrica", inteiro(params.id), {
    nome: texto(d.nome, "Métrica", 100, 2), unidade: texto(d.unidade, "Unidade", 20),
    limite_atencao: numero(d.limite_atencao, "Limite de atenção"),
    limite_critico: numero(d.limite_critico, "Limite crítico")
  });
}));
painelRouter.delete("/metricas/:id", soAdmin, asyncRoute(async ({ params }) =>
  atualizarOuExcluir("painel_metricas", "id_metrica", inteiro(params.id), null, true)
));
painelRouter.post("/leituras", asyncRoute(async ({ usuario: u, body: d }) => {
  if (u.tipo !== "equipe") throw falha(403, "A leitura manual é realizada pela equipe técnica.");
  const idMetrica = inteiro(d.id_metrica);
  const [[metrica]] = await pool.query("SELECT id_equipamento FROM painel_metricas WHERE id_metrica=?", [idMetrica]);
  if (!metrica) throw falha(404, "Métrica não encontrada.");
  await equipamentoAcessivel(u, metrica.id_equipamento, true);
  const valor = numero(d.valor, "Valor medido", -1e8, 1e8);
  const [r] = await pool.query("INSERT INTO painel_leituras(id_metrica,valor,id_usuario) VALUES(?,?,?)", [idMetrica, valor, u.id]);
  return (await pool.query("SELECT * FROM painel_leituras WHERE id_leitura=?", [r.insertId]))[0][0];
}));
