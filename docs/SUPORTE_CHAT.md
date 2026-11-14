# TechAssist Pro — Suporte com chat em tempo real

O módulo foi criado a partir da área de suporte do projeto de referência Indux, **sem substituir** as páginas e a lógica já existentes na TechAssist Pro. A tela foi redesenhada para a identidade escura/vermelha existente, com fonte Montserrat, mensagens legíveis e layout responsivo.

## Configuração

- **Banco novo:** importar `database/techassistpro.sql` (já inclui `suporte_conversas` e `suporte_mensagens`).
- **Banco existente:** fazer backup e executar `database/migrations/2026-11-12-suporte-chat.sql` uma vez na base `techassistpro`. O script não apaga dados.
- Iniciar MySQL, backend (`cd backend && npm ci && npm run dev`) e frontend (`cd frontend && npm ci && npm run dev`).
- O comando `npm run configurar` na raiz cria `frontend/.env.local` a partir do modelo incluído, com `AUREN_DASHBOARD_DEMO=false` e `NEXT_PUBLIC_DEMO_MODE=false`. A aplicação usa o backend e o chat reais nesse modo. Sem esse arquivo, o Next.js abre a dashboard em demonstração automaticamente em desenvolvimento. Reinicie o Next.js após qualquer alteração nas variáveis, e abra `/login`.
- O chat fica em `http://localhost:3000/dashboard/suporte`. O cliente usa login **Sou cliente**; o administrador usa login **Sou da equipe**. Veja as instruções de criação de administrador no README principal.

## Fluxo

1. Cliente autenticado cria uma conversa com assunto, categoria e mensagem inicial.
2. A API grava em MySQL, identifica o remetente pelo **JWT**, nunca por identificadores enviados pelo navegador.
3. Admin ou desenvolvedor visualiza as conversas, seleciona uma e responde, podendo marcar como **aguardando**, **em atendimento** ou **resolvido**.
4. Administradores também podem consultar a aba **Mensagens do site**, que lê os contatos já existentes em `/api/contatos` e oferece um link de resposta por e-mail; isso não envia e-mails automaticamente.
5. Ao receber uma nova mensagem de cliente numa conversa resolvida, ela volta para **aberto** automaticamente.
6. O endpoint autenticado `GET /api/suporte/eventos` mantém uma conexão **SSE**. Ao publicar uma mensagem, o backend notifica os participantes autorizados, e o cliente atualiza os dados pela API. O JWT é passado no cabeçalho Authorization, **não na URL**.
7. O navegador tenta reconectar o canal automaticamente e faz uma atualização de segurança a cada 15 segundos caso o fluxo SSE esteja indisponível.

## Endpoints

| Método | Endpoint | Autorização |
| --- | --- | --- |
| GET | `/api/suporte/conversas` | Cliente: somente próprias; adm/desenvolvedor: todas |
| POST | `/api/suporte/conversas` | Somente cliente |
| GET | `/api/suporte/conversas/:id/mensagens` | Cliente dono ou adm/desenvolvedor |
| POST | `/api/suporte/conversas/:id/mensagens` | Cliente dono ou adm/desenvolvedor |
| PATCH | `/api/suporte/conversas/:id/status` | Adm/desenvolvedor |
| GET | `/api/suporte/eventos` | Cliente ou adm/desenvolvedor |

Todas as rotas exigem JWT. O servidor valida autorização ao **consultar, escrever e mudar o status**, e os IDs de clientes são obtidos da sessão. Os textos são tratados como texto (React escapa a renderização), com tamanho máximo de 2.000 caracteres. SQL parametrizado. Listagens de conversas limitadas a 100 e histórico recente limitado a 200 mensagens por consulta.

## Arquivos principais

- `frontend/src/components/dashboard/SupportChat.jsx` — interface de caixa de entrada e chat.
- `frontend/src/app/dashboard/dashboard.css` — tipografia, contraste e estilos responsivos.
- `frontend/src/lib/auren/permissoes.js` — item de navegação e permissões por perfil.
- `backend/routes/SuporteRoutes.js` — rotas do chat.
- `backend/controllers/SuporteController.js` — validação, RBAC e broadcast SSE.
- `backend/models/SuporteModel.js` — consultas SQL e transações.
- `database/migrations/2026-11-12-suporte-chat.sql` — migração aditiva.

## Limites e operação

- O broadcast SSE atual usa conexões **em memória numa instância do Node**. Funciona em uma instância do backend; para escalar para múltiplas réplicas, substituir o broadcast por Redis Pub/Sub (ou equivalente). O fallback por consultas busca atualizações mesmo sem um evento SSE.
- O histórico está persistido, mas não há envio de anexos, marcação de mensagens lidas, indicação de atendente realmente online, push quando o usuário está fora do site nem notificações por e-mail.
- No modo demonstração, as conversas são **locais ao navegador** e não são sincronizadas entre perfis nem persistidas. O aviso na tela deixa essa limitação explícita.
- Para testar em dois navegadores distintos: autentique um cliente em um e um administrador no outro, ambos com a API e MySQL ativos e o modo de demonstração desativado. Envie mensagens em ambos e confirme o histórico após recarregar.
- O backend deve ser protegido atrás de HTTPS na implantação; evite registrar tokens JWT ou mensagens sensíveis em logs.
