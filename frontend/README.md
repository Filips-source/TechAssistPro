# Interface TechAssist Pro

Adaptação do projeto `nextjs-senai.zip`, com App Router e componentes React. Consulte `../README.md` para iniciar a API, importar o MySQL e configurar o ambiente.

- `src/app`: páginas Next.js.
- `src/components/techassist/TechAssist.jsx`: componentes de apresentação, contato, solicitação, acompanhamento, cabeçalho e rodapé.
- `src/components/techassist/LiveArea.jsx`: acesso de clientes/equipe e painel de gestão.
- `src/components/techassist/api.js`: `fetch`, token JWT, rotas e conversão das respostas da API.
- `src/app/globals.css`: cores, tipografia e responsividade.
- `src/app/dashboard/[[...secao]]/page.jsx` e `src/components/dashboard`: dashboard responsiva com navegação por perfil; `/area-cliente` abre o painel e `/login` mantém o formulário de acesso.
- Em desenvolvimento (`npm run dev`), `/dashboard` abre por padrão em modo de demonstração local, sem API ou banco, com dados fictícios e ações somente em memória. Defina `AUREN_DASHBOARD_DEMO=false` para testar o fluxo real com sessão e endpoints autenticados `/api/auth/me` e `/api/ordens`. Em produção, a demonstração fica sempre desativada.
- No fluxo real, os dados de telemetria, alertas, peças e indicadores continuam indisponíveis até serem fornecidos por endpoints próprios; a interface os sinaliza em vez de simular valores.
- Para técnicos (`funcionario`), a API limita listagem, consulta e atualização às ordens atribuídas ao próprio usuário. As verificações de autorização devem permanecer no backend, não apenas na interface.

`NEXT_PUBLIC_DEMO_MODE=false` usa a API real para as telas TechAssist. O modo `true` serve somente para a prévia visual sem servidor, com dados locais e avisos explícitos. Nunca use os modos de demonstração para apresentar persistência no MySQL.

A imagem ilustrativa de reparo foi obtida em Unsplash: https://images.unsplash.com/photo-1581092921461-eab62e97a780. Não representa a equipe ou as instalações do projeto.

- `src/components/dashboard/SupportChat.jsx`: central de chat e suporte ao cliente, com SSE autenticado e histórico armazenado na API/MySQL. Leia `../docs/SUPORTE_CHAT.md` para ativar o modo real.
