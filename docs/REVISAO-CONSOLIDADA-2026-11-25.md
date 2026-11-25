# Revisão consolidada — 25/11/2026

Esta versão reúne os módulos da PR #2 com as correções da revisão de 25/11. Os módulos que não estavam na `main` de 19/11 já existiam na branch desta PR e foram preservados: gestão operacional de equipamentos, peças, ferramentas, relatórios, métricas/leituras e página demonstrativa de planos.

## Antes de implantar no Coolify

Aplicar a migração aditiva `database/migrations/2026-11-23-dashboard-operacional.sql` ao banco correto, após backup. Ela cria as quatro tabelas `painel_*` e exemplos de ferramentas/relatórios. Sem essas tabelas, `/api/painel/resumo` falha e o dashboard não carrega. Não executar o SQL de recriação do banco sobre dados reais.

Os arquivos do Docker e as configurações de produção permanecem inalterados. Esta solicitação não realiza merge nem deploy automaticamente.

## Correções incorporadas

- Chat identifica autoria pelo tipo e ID do remetente, inclusive entre administradores distintos; conserva a demonstração com IDs compatíveis com os usuários de exemplo.
- Troca de conta remonta o chat, limpa o rastreio e rejeita respostas atrasadas da sessão anterior. Corrigidos clique na conversa já selecionada e espera de reconexão.
- Orçamentos de OS alheias são bloqueados antes de alterações de estoque, dentro da transação.
- Funcionário não pode trocar responsável da OS; administrador pode remover atribuição explicitamente com `null`.
- Listagens e resumo operacional limitam funcionários e perfis legados restritos às suas atribuições. Criação/edição de cadastros administrativos é reservada a administrador/desenvolvedor; as rotas do painel preservam o cadastro/edição de equipamento pelo cliente proprietário.
- Dashboard usa a API real por padrão, preserva os módulos operacionais e inclui diagnóstico, reparo executado, descrição e prazo na atualização da OS.
- Prazos sem horário não retrocedem um dia no fuso brasileiro. Canceladas não aparecem como próximos serviços.
- Senhas preservam espaços e respeitam o limite de bytes do bcrypt. IDs e porta MySQL recebem validação adicional.
- Ajustes de CSS em busca, chat, modais e navegação móvel.

## Validação realizada

- `npm run test:regressao`: **20 testes aprovados**, com operações SQL simuladas.
- `npm run check`: aprovado.
- `node --check` nos 36 arquivos JS/MJS do back-end: aprovado.
- Conflitos resolvidos e `git diff --check` aprovado.

Esses resultados não são testes E2E. Build do Next.js, MySQL real, login das três contas, persistência, SSE e responsividade visual continuam sem confirmação neste ambiente, que apresentou bloqueio de rede para instalação de dependências. Executar a suíte de integração com banco exclusivo `_test`, o build e os testes de navegador antes de considerar a versão validada para produção.

## Contas

O administrador existente `adminAuren@gmail.com` não foi recriado nem teve sua senha alterada. Nenhuma conta real foi criada durante a revisão.

O script `backend/scripts/validar-contas.mjs` autentica o administrador existente e verifica/cria somente as contas de teste de funcionário e cliente. Informe `TEST_API_URL` (incluindo `/api`) e `TEST_ADMIN_SENHA` em ambiente local. Para contas já existentes, informe os e-mails/senhas em `TEST_FUNCIONARIO_*` e `TEST_CLIENTE_*`; nenhuma senha existente é redefinida.

```text
cd backend
npm run validar-contas
npm run validar-contas -- --fluxos
```

O modo `--fluxos` grava e mantém registros identificados de OS/chat para verificar acesso, atribuição, atualização e SSE. Não substitui a conferência visual de login, logout, troca de conta e layout.

Os relatórios `painel_relatorios` desta PR são relatórios operacionais de título/tipo/conteúdo. Não equivalem ao módulo técnico separado de relatórios vinculados a OS descrito no histórico; esse módulo não foi substituído ou inventado nesta consolidação. A página `/planos` continua apenas demonstrativa, sem cobrança ou assinatura real.
