# Revisão consolidada — 25/11/2026

Reúne os módulos operacionais da PR #2, as correções de sessão/chat/permissões, o módulo de relatórios técnicos do Drive e os ajustes de legibilidade do CSS fornecido pelo usuário. Arquivos Docker e conta administrativa existente preservados.

## Comparação e escolha das versões

| Parte | Decisão |
| --- | --- |
| Dashboard, autenticação e chat | Manter a base consolidada do GitHub: possui gestão real de usuários, upload de foto, AuthModal e CRUD operacional. O Drive não inclui parte desses recursos e ainda usa demonstração local para funcionários. |
| Relatórios técnicos por OS | Aproveitar arquitetura, campos e tabela `relatorios` do Drive, corrigindo referência ausente ao serviço de edição e completando listagem, consulta, autorização e interface. |
| Relatórios operacionais | Preservar `painel_relatorios` (título/tipo/conteúdo) separadamente do relatório técnico de diagnóstico/reparo por OS. |
| CSS público | Incorporar os ajustes enviados por texto para rótulos da revisão e ícone de sucesso. Complementar fontes de textos, links e botões públicos, preservando menu/login. Usar escopo `.techassist-site` para não aumentar fontes do dashboard. Ajustar fundo da revisão para contraste com texto branco. |

## Antes de implantar no Coolify

Após backup, aplicar no banco correto, nesta ordem:

1. `database/migrations/2026-11-23-dashboard-operacional.sql` — quatro tabelas `painel_*` e exemplos. Sem elas, o resumo e o dashboard falham.
2. `database/migrations/2026-11-25-relatorios-tecnicos.sql` — tabela `relatorios`, compatível com a definição do Drive; preserva tabela e registros existentes.

Não executar o SQL de recriação do banco em produção. A tabela também foi acrescentada a `database/techassistpro.sql` para instalações novas e testes. Se a tabela existente divergir da definição do Drive, conferir sua estrutura antes de implantar.

Se o Coolify fizer deploy automático ao atualizar a main, aplicar as migrações antes do merge. Esta revisão não executou migrações, merge ou deploy.

## Relatórios técnicos

- API autenticada: `GET /api/relatorios`, `GET /api/relatorios/:id`, `POST /api/relatorios` e `PATCH /api/relatorios/:id`.
- Diagnóstico, descrição do reparo, observações e vínculo com OS; autor obtido da sessão, sem confiar no ID enviado pelo cliente.
- Administrador/desenvolvedor acessa os relatórios da equipe. Funcionário e perfis legados restritos acessam somente relatórios próprios em OS atualmente atribuídas a eles. Cliente não acessa relatórios internos.
- Gravações verificam autorização dentro de transação com bloqueio de linha. PATCH preserva campos omitidos e não troca autor/OS; salvar valores iguais é sucesso.
- A seção Relatórios permite adicionar, ler e editar relatórios técnicos. Os modelos operacionais permanecem disponíveis à administração. Não foi acrescentada exclusão de histórico técnico.

## Correções preservadas e complementares

- Chat identifica autoria pelo tipo e ID; troca de conta limpa dados anteriores e rejeita respostas atrasadas. Corrigidos clique na conversa selecionada e reconexão.
- Orçamento alheio é bloqueado antes de alterar estoque. Funcionário não troca responsável da OS; administrador pode remover atribuição com null.
- Cadastros administrativos exigem administrador/desenvolvedor; listagens restritas filtram por atribuição e clientes gerenciam somente seus equipamentos.
- Dashboard usa API real por padrão, atualiza status/diagnóstico/reparo/prazo e recarrega dados após alterar equipamentos, métricas e estoque.
- Corrigida mistura de operadores `||` e `??` sem parênteses em GestorOperacional, que impediria a compilação.
- Datas sem horário não retrocedem um dia; canceladas não aparecem como próximos serviços.
- Senhas preservam espaços e respeitam limite de bytes do bcrypt. Validações adicionais de ID e porta MySQL.
- Ajustes móveis de busca, chat, modais, relatórios e tipografia pública. Planos continuam demonstrativos, sem cobrança ou assinatura real.

## Validação e limites

- `npm run test:regressao`: **34 testes aprovados**, incluindo 14 de relatórios, com SQL simulado.
- `npm run check` e verificação de sintaxe de todos os arquivos JS/MJS do backend: aprovados.
- Análise sintática e transformação JSX com TypeScript 6.0.3 do ambiente: **29 arquivos do frontend sem erros**; não equivale ao build Next.js.
- `git diff --check`: aprovado. Arquivos Docker comparados sem alteração.

A instalação de dependências foi bloqueada por falha de rede. Build Next.js, MySQL real, login das três contas, persistência, SSE e responsividade visual não foram confirmados. Antes da produção, executar build, suíte de integração em banco exclusivo `_test` e testes de navegador com cliente, funcionário e administrador.

Conferir: envio/resposta no chat, logout/troca de conta, bloqueio de relatórios alheios, criação/edição de relatório próprio, gestão administrativa, equipamento/métrica aparecendo no monitoramento e layout em celular/tablet/desktop.

## Contas de teste

O administrador `adminAuren@gmail.com` não foi recriado nem teve a senha alterada. Nenhuma conta real foi criada nesta revisão.

`backend/scripts/validar-contas.mjs` autentica o administrador existente e verifica/cria somente cliente e funcionário de teste. Informar `TEST_API_URL` (com `/api`) e `TEST_ADMIN_SENHA` em ambiente local. Para contas existentes, usar `TEST_FUNCIONARIO_*` e `TEST_CLIENTE_*`; senhas existentes não são redefinidas.

```text
cd backend
npm run validar-contas
npm run validar-contas -- --fluxos
```

O modo `--fluxos` grava e mantém registros identificados de OS/chat para verificar acesso, atribuição, atualização e SSE. Não substitui testes visuais nem a conferência dos relatórios técnicos.
