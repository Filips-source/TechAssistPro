# TechAssist Pro — Segunda entrega

Sistema de gestão de assistência técnica com telas em Next.js, API Node.js/Express e banco MySQL. A interface mantém as cores vermelha, preta e branca já presentes na TechAssist Pro.

O **front-end parte de `nextjs-senai.zip`**: App Router, páginas, componentes React, CSS, formulários, `useState`, `useEffect` e `fetch`. O **back-end parte de `api-produtos-3md-2026s2.zip`**: rotas → controllers → services → models, `mysql2/promise`, SQL parametrizado, validações, bcrypt, JWT, Helmet, CORS e controle de acesso. Não usa ORM nem troca de banco.

## Rodar no Windows com XAMPP

É necessário Node.js 22 ou superior e MySQL/MariaDB disponível. O Node.js executa o front-end e a API; o XAMPP fornece o MySQL. **Não coloque o projeto em `htdocs` e não tente abrir os arquivos JSX diretamente.**

1. Extraia o ZIP e abra a pasta `TechAssistPro_Entrega2` no VS Code.
2. No XAMPP, inicie **MySQL**. Para usar o phpMyAdmin, inicie também o Apache.
3. No phpMyAdmin, abra **Importar** e selecione `database/techassistpro.sql`. O arquivo cria o banco `techassistpro`, tabelas e dados fictícios. Não apaga bancos existentes. Use um banco novo para esta versão: não é uma migração de versões anteriores do projeto.
4. No terminal, na raiz do projeto:

```sh
npm run configurar
```

Esse comando cria os arquivos de configuração (incluindo `frontend/.env.local`) e uma chave JWT aleatória, sem sobrescrever configurações existentes. O modelo da interface já contém `AUREN_DASHBOARD_DEMO=false` para o chat real. Em `backend/.env`, confira o MySQL. O padrão local é `127.0.0.1`, porta `3306`, usuário `root` e senha vazia. Se o XAMPP usar outra porta ou senha, ajuste esses campos.

5. Abra um terminal para a API:

```sh
cd backend
npm ci
npm run dev
```

6. Abra outro terminal para a interface:

```sh
cd frontend
npm ci
npm run dev
```

7. Acesse **http://localhost:3000**. A API fica em **http://localhost:3001/api/check**. O retorno deve indicar `api: ok` e `banco: ok`.

Depois da configuração inicial, também é possível executar `INICIAR_WINDOWS.bat`. Ele instala dependências ausentes e abre os dois terminais. O MySQL precisa estar ligado e o SQL importado.

### Abrir a dashboard sem banco de dados

Para apenas visualizar a dashboard AUREN, inicie somente o front-end (`cd frontend`, `npm ci` e `npm run dev`) e acesse **http://localhost:3000/dashboard**. Em desenvolvimento, a demonstração local é ativada por padrão e não exige API, login ou MySQL; os dados são fictícios e as alterações não são persistidas. Para voltar a validar o fluxo real com banco, defina `AUREN_DASHBOARD_DEMO=false` no ambiente do front-end e reinicie o Next.js. Em produção, a demonstração permanece desativada.

### Entrar com o cliente de teste AUREN

Este pacote inclui uma conta **somente de cliente**, para experimentar o login e a dashboard sem criar uma conta manualmente. O e-mail é `aurenteste@gmail.com`; use a senha de teste definida para este pacote. A senha está gravada no SQL como **hash bcrypt**, não como texto puro. O telefone `0000000000` é um valor fictício para satisfazer a coluna obrigatória.

- **Banco novo:** importe `database/techassistpro.sql` normalmente, depois inicie a API e a interface.
- **Banco já criado:** importe apenas `database/migrations/2026-11-10-criar-cliente-teste.sql` pelo phpMyAdmin (selecionando o banco `techassistpro`), ou execute esse SQL no MySQL. Apenas substituir arquivos do projeto **não grava** um novo usuário no banco persistente.
- **Login:** visite `http://localhost:3000/login`, mantenha **Sou cliente**, informe o e-mail e a senha e clique em **Entrar**. O sistema redireciona para `/dashboard`.

A inserção é idempotente: se o e-mail já estiver cadastrado, a senha existente **não é substituída**. **Não publique esta conta com senha de demonstração em um ambiente de produção**. Para removê-la após os testes, execute `DELETE FROM clientes WHERE email='aurenteste@gmail.com';` somente se não houver registros vinculados (nesse caso, siga as regras de exclusão de clientes do seu sistema).

### Criar o administrador

Não há senha administrativa padrão no código. Acrescente temporariamente estas variáveis ao `backend/.env`, usando um e-mail e uma senha escolhidos para o projeto:

```dotenv
ADMIN_NOME=Administrador
ADMIN_EMAIL=seu-email@exemplo.com
ADMIN_SENHA=coloque-aqui-uma-senha-forte
```

A senha deve ter de 8 a 72 caracteres, com maiúscula, minúscula, número e símbolo. Na pasta `backend`, execute:

```sh
npm run criar-admin
```

O comando cria uma conta de equipe com perfil `adm`; não substitui senhas de contas existentes. Remova `ADMIN_SENHA` do `.env` após concluir. Na tela **Área do cliente**, escolha **Sou da equipe** para entrar como administrador.

### Criar uma conta de desenvolvedor

O perfil `desenvolvedor` é reservado para contas internas confiáveis e tem acesso privilegiado, inclusive às rotas restritas a `adm`. Nunca o habilite no cadastro público.

- Em uma instalação nova, importe o SQL atualizado de `database/techassistpro.sql`.
- Em um banco já existente, faça backup e execute uma vez `database/migrations/2026-11-10-adicionar-perfil-desenvolvedor.sql` no schema indicado por `DB_NAME` no `backend/.env`.
- No `backend/.env` local, configure `DESENVOLVEDOR_NOME`, `DESENVOLVEDOR_EMAIL` e `DESENVOLVEDOR_SENHA`. A senha precisa ter de 12 a 72 caracteres, com maiúscula, minúscula, número e símbolo. Não a envie por chat nem a versione.
- No terminal integrado do VS Code, execute `npm run criar-desenvolvedor` com o diretório atual em `backend`.
- Após sucesso, remova `DESENVOLVEDOR_SENHA` do `.env`. O script não altera contas existentes; se o e-mail já estiver cadastrado, ele informa o conflito.

O login da equipe continua na **Área do cliente** com a opção **Sou da equipe**; após autenticar, a dashboard recebe o perfil `desenvolvedor`. O cadastro público cria somente clientes. Os papéis de equipe são `adm`, `supervisor`, `suporte`, `funcionario` e `desenvolvedor`; exclusões de cadastros ficam disponíveis para `adm` e desenvolvedor. A criação de outros funcionários pela interface ainda não está implementada.

## Suporte ao cliente e chat ao vivo

O dashboard agora inclui **Suporte / Chat**, inspirado no módulo de suporte do Indux e adaptado ao visual da TechAssist Pro. Clientes iniciam conversas; administradores e desenvolvedores recebem, respondem e alteram o status. O histórico fica no MySQL e novas mensagens são notificadas por SSE autenticado, com reconexão. A tipografia dos cards foi ajustada para **Montserrat**, fontes ligeiramente maiores e melhor contraste no tema escuro.

- **Banco novo:** o script `database/techassistpro.sql` já contém as duas tabelas necessárias.
- **Banco existente:** faça backup e aplique `database/migrations/2026-11-12-suporte-chat.sql` no MySQL sem apagar as tabelas existentes.
- **Chat real:** inicie API + MySQL + frontend e defina `AUREN_DASHBOARD_DEMO=false` no ambiente do frontend **antes** de iniciar o Next.js; faça login nas duas contas em navegadores/sessões diferentes e visite `/dashboard/suporte`.
- **Visualização sem API:** a dashboard em modo de demonstração apresenta uma prévia local do chat, claramente indicada como **não sincronizada**.

Detalhes de rotas, autorização, arquitetura SSE e limitações: `docs/SUPORTE_CHAT.md`.

## Testar a integração na apresentação

1. Abra **Contato**, preencha os dados e envie a mensagem. Ela é salva em `contatos`; o painel da equipe permite consultá-la. Não há envio automático de e-mail ou WhatsApp.
2. Em **Área do cliente**, crie uma conta, faça login como cliente e abra **Solicitar orçamento**.
3. Informe os dados do equipamento e o defeito. Ao confirmar, a API grava equipamento, ordem e histórico na mesma transação. Guarde o código de rastreio.
4. Entre como equipe e abra **Ordens de serviço → Gerenciar**. Informe o diagnóstico, altere o status para `em diagnostico` e salve.
5. Adicione peças e mão de obra e gere o orçamento. Os valores são calculados no servidor e as peças são reservadas no estoque.
6. Entre como cliente, abra a ordem e veja **Diagnóstico e peças**. Aprove ou recuse o orçamento. Também é possível consultar pelo código e e-mail em **Acompanhar reparo**. Trate o código de rastreio como informação de acesso à ordem.
7. Se aprovado, o fluxo avança para `em reparo`. Pela equipe, avance para `em teste`, descreva o reparo executado, marque `pronto para retirada` e depois `entregue`. O histórico é preservado.
8. Se recusado, as peças reservadas voltam ao estoque. A equipe pode marcar `pronto para retirada` e registrar a entrega sem reparo. O sistema não deixa iniciar reparo sem aprovação.

**Cinco telas principais:** início, contato, solicitação de orçamento, acompanhamento e área de acesso/gestão. Também inclui serviços, sobre e como funciona. O painel tem clientes, equipamentos, peças, ordens e mensagens de contato.

## Arquivos para a entrega

- `database/techassistpro.sql`: banco completo com chaves e dados fictícios.
- `docs/modelagem-banco.svg`: diagrama das entidades, atributos e relacionamentos.
- `docs/MODELAGEM.md`: justificativas e ajustes da modelagem.
- `docs/API.md`: rotas, exemplos e permissões.
- `docs/SEGUNDA_ENTREGA.md`: relação com os itens solicitados pelo professor.
- `docs/KANBAN.md`: quadro de tarefas para a equipe atualizar no Trello.
- `docs/VALIDACAO.md`: verificações realizadas e limitações de teste.

Os arquivos `.env`, senhas em texto puro, `node_modules` e `.next` não acompanham o ZIP. As dependências são reinstaladas com `npm ci`.

## GitHub e Coolify

A versão foi preparada para copiar para o repositório do grupo. Não foi enviada para `Filips-source/TechAssistPro` nem atualizou o deploy anterior.

Crie uma branch para revisar a integração, substitua os arquivos do projeto por esta versão e teste antes de fazer merge. Preserve os arquivos `.env` somente no ambiente local/servidor. A equipe deve registrar suas próprias contribuições e tarefas; os nomes na documentação não representam commits feitos por essas pessoas.

O `docker-compose.yml` é uma opção de execução com MySQL, API e Next.js. Depois de `npm run configurar`, execute `docker compose up --build`. Ele usa volume persistente e senhas aleatórias criadas no `.env` da raiz. Não exponha o MySQL. No Coolify, configure o serviço `frontend` na porta `3000`; a API é acessada pelo Next em `/api`. O destino interno da API é configurado na compilação por `API_INTERNAL_URL`. O Compose foi preparado, mas não foi executado neste ambiente.

## Testes automatizados

Na pasta `frontend`: `npm run build`.

Na pasta `backend`, copie `.env.test.example` para `.env.test`, configure MySQL e uma chave JWT e mantenha **DB_NAME terminado em `_test`**. Esse banco é exclusivo de testes e recebe dados fictícios. Execute `npm run test:integracao`. O teste recusa nomes sem o sufixo de proteção. Não use o banco da aplicação.

A prévia online é uma demonstração visual com dados locais; o funcionamento real da API e do MySQL está neste projeto, ao executá-lo pelas instruções acima.

## Modal integrado de acesso e política de privacidade (13/11/2026)

- Na página inicial, **Área do cliente** abre um único modal com abas de **login** e **cadastro**. O mesmo modal é exibido por `/login`, inclusive quando a dashboard encaminha quem não tem sessão. `/area-cliente` continua acessível como endereço de compatibilidade e redireciona a `/login`.
- O login suporta **cliente** e **equipe**; a autenticação usa a API original (`POST /api/auth/login`) e mantém o token de sessão utilizado pela dashboard. O cadastro público só permite clientes (`POST /api/auth/registrar`).
- O cadastro inclui pessoa física/jurídica, CPF/CNPJ opcional, razão social, endereço, senha forte e foto opcional de até 2 MB (JPG/PNG/WebP). A imagem é validada e armazenada no servidor (`backend/uploads/perfis/`), e sua URL fica em `clientes.imagem_url`.
- A página `/termos` preserva o texto enviado para a Auren e adota as cores/tipografia do TechAssist Pro. O link está disponível nos dois formulários.
- **Banco novo:** `database/techassistpro.sql` já inclui os campos extras. **Banco existente:** após backup, execute uma vez `database/migrations/2026-11-13-cadastro-completo.sql` no MySQL Workbench/phpMyAdmin. Não reaplique a migração depois de concluída. Se a base tiver outro nome, ajuste `USE techassistpro` para o banco correto.
- As fotos locais ficam em `backend/uploads/` (ignorado pelo Git). No Docker Compose, o volume `profile_uploads` preserva as imagens entre recriações dos contêineres. Em hospedagens externas, configure armazenamento persistente nessa pasta para não perder fotos em deploys.
- O modal foi refeito em CSS isolado, sem adicionar Bootstrap à aplicação. As demais rotas, dashboards e o módulo de chat foram mantidos.
