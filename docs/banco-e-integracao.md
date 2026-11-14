# Integração ao banco de dados AUREN e regras de negócio

## 1. Perfis e autenticação

No backend atual, clientes são registrados na tabela `clientes`. As contas internas ficam em `usuarios` e usam os perfis `adm`, `supervisor`, `suporte`, `funcionario` ou `desenvolvedor`. A conta de desenvolvedor é interna, não pode ser criada pelo cadastro público e recebe acesso privilegiado às rotas de equipe e às rotas administrativas.

O schema de novas instalações já inclui `desenvolvedor` em `database/techassistpro.sql`. Para bancos existentes, faça backup e aplique uma vez `database/migrations/2026-11-10-adicionar-perfil-desenvolvedor.sql` no banco configurado em `DB_NAME`. A migração mantém os valores e contas atuais.

Crie uma conta somente pelo script controlado `backend/scripts/criar-desenvolvedor.js`, com senha forte guardada temporariamente no `backend/.env`; o script grava apenas o hash bcrypt e nunca substitui uma conta existente. Depois, remova a variável de senha do `.env`.

## 2. Aproveitar as nove tabelas existentes

A base projetada anteriormente contempla:

1. `usuarios` — identidade, login, perfil, status.
2. `clientes` — dados pessoais/empresariais do cliente.
3. `equipamentos` — ativos cadastrados e vinculados a clientes.
4. `metricas_equipamento` — configuração dinâmica de métricas de cada equipamento.
5. `leituras_equipamento` — medições automáticas ou manuais.
6. `planos_manutencao` — periodicidade, gatilhos e rotinas preventivas.
7. `alertas` — limites ultrapassados e ocorrências.
8. `manutencoes` — contratação manual, agenda, atribuição, status e execução.
9. `historico_manutencao` — rastreabilidade das mudanças nas ordens.

O dashboard mostra a condição das **peças/componentes internos** de um equipamento, que ainda não estavam em uma tabela específica desse modelo. Para persistir essa parte, proponho duas extensões mínimas:

### `pecas_equipamento`

Campos propostos: `id`, `id_equipamento`, `nome`, `codigo_fabricante` opcional, `estado`, `integridade_pct` (0–100; opcional), `data_instalacao`, `vida_util_estimada`, `ativo`, `created_at`, `updated_at`. Índices: `(id_equipamento, ativo)` e, se houver pesquisa frequente, `(estado, ativo)`.

Se a integridade for derivada de leitura técnica, o cálculo deve ocorrer no serviço de domínio, com referência às métricas existentes; não precisamos duplicar tabelas de leituras para cada peça até que surja esse requisito.

### `pecas_manutencao`

Campos propostos: `id`, `id_manutencao`, `id_peca_equipamento`, `acao` (`inspecao`, `reparo`, `substituicao`), `observacoes`, `quantidade`, `created_at`. Índices: `(id_manutencao)` e `(id_peca_equipamento)`.

Se o negócio precisar controlar **estoque de peças avulsas**, reservar componentes ou compras, será necessário desenhar separadamente `pecas_catalogo`, `estoques` e `movimentacoes_estoque`. Não confundir peça instalada e estoque físico.

## 3. Histórico e auditoria

A tabela `historico_manutencao` cobre o ciclo de vida da ordem, mas o desenvolvedor também precisa inspecionar alterações de usuários, permissões e configurações. Proposta: `auditoria_sistema` com `id`, `id_usuario`, `acao`, `entidade`, `id_entidade`, `dados_anteriores` JSON, `dados_novos` JSON, `criado_em`, `correlation_id`, sem gravar senhas/tokens/dados secretos. Índices: `(entidade, id_entidade, criado_em)`, `(id_usuario, criado_em)`.

## 4. Filtros obrigatórios no backend

- **Cliente:** `equipamentos.id_cliente = id_cliente_da_sessao`; alertas, métricas, peças e ordens devem ser buscados via esse escopo.
- **Funcionário:** `manutencoes.id_funcionario_responsavel = id_usuario_da_sessao` e equipamentos vinculados às ordens/tarefas atribuídas. O nome real da FK dependerá do schema existente.
- **Administrador:** escopo por organização/unidade administrada, quando existir multiempresa, e controle de atribuição com trilha de auditoria.
- **Desenvolvedor:** visibilidade técnica ampla sob controle interno, registro de acesso e proteção especial para ações irreversíveis.

Os filtros devem ocorrer **antes de retornar dados**, não apenas no React. Também devem ser aplicados a cada `POST`, `PATCH`, `DELETE` e `GET /:id`.

## 5. Contrato sugerido para ações futuras

| Método e endpoint | Permissão de domínio | Verificações adicionais |
| --- | --- | --- |
| `POST /manutencoes` | cliente ou desenvolvedor | equipamento próprio; tipo manual; dados validados |
| `PATCH /manutencoes/:id/status` | funcionário, administrador ou desenvolvedor | serviço atribuído ao funcionário; transição válida |
| `PATCH /manutencoes/:id/atribuicao` | administrador ou desenvolvedor | funcionário ativo e compatível com a função |
| `POST /funcionarios` | administrador ou desenvolvedor | e-mail único, geração de convite e senha segura |
| `PATCH /equipamentos/:id` | administrador ou desenvolvedor | não modificar equipamento de outra organização |
| `POST /leituras_equipamento` | funcionário autorizado / serviço de integração | métrica configurada, origem validada, unidades coerentes |
| `GET /auditoria` | desenvolvedor | paginação, limites, dados sensíveis mascarados |

### Exemplos de validação de domínio

```js
// Pseudocódigo Express / MySQL: checagem de permissão E escopo.
router.patch('/manutencoes/:id/status', autenticar, async (req, res) => {
  const { perfil, id } = req.usuario; // dados do servidor, não do body
  if (!['funcionario', 'administrador', 'desenvolvedor'].includes(perfil)) {
    return res.status(403).json({ erro: 'Permissão insuficiente' });
  }
  const manutencao = await buscarManutencao(req.params.id);
  if (!manutencao) return res.sendStatus(404);
  if (perfil === 'funcionario' && manutencao.id_funcionario_responsavel !== id) {
    return res.status(403).json({ erro: 'Ordem não atribuída' });
  }
  if (!transicaoPermitida(manutencao.status, req.body.status)) {
    return res.status(422).json({ erro: 'Transição de status inválida' });
  }
  // Em uma transação: atualizar status + inserir histórico + inserir auditoria.
  return res.json(await atualizarComAuditoria(manutencao, req.body.status, id));
});
```

Adapte os nomes dos campos e middlewares ao backend real. Controles em produção exigem também validação de entrada, limites de requisição, política de sessão e verificação CSRF para cookies.

## 6. Próximo marco de implementação

Integrar primeiro `GET /auth/me` + `GET /dashboard` e comprovar isolamento entre cliente, funcionário e administrador; depois habilitar o `POST /manutencoes`, o ciclo de status e o fluxo de convite de funcionário, todos com testes de autorização. Só então ativar mutações reais no React.
