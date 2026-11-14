# API TechAssist Pro

Base local: `http://localhost:3001/api`. A interface Next usa `/api` e encaminha as chamadas para o Express. Formato de resposta: `{ "sucesso": true, "dados": ... }` ou `{ "sucesso": false, "erro": "..." }`.

A organização segue a API de produtos das aulas: `routes` define endpoints e middlewares; `controllers` responde HTTP; `services` valida e aplica regras; `models` consulta MySQL com parâmetros `?`; `config` define ambiente e pool.

## Autenticação

`POST /auth/registrar` cria **cliente**. Corpo:

```json
{"nome":"Cliente de Teste","email":"cliente@exemplo.test","telefone":"11999990000","senha":"SenhaForte123!"}
```

A senha acima é apenas um exemplo para uma conta de teste criada pelo próprio grupo; não existe conta pronta com essa senha.

`POST /auth/login`:

```json
{"email":"cliente@exemplo.test","senha":"SenhaForte123!","tipo":"cliente"}
```

Use `tipo: "equipe"` para contas de `usuarios`. A resposta contém `dados.token`. Envie `Authorization: Bearer <token>` nas rotas protegidas. O token expira em 2 horas; usuários inativos são rejeitados. `GET /auth/me` retorna a sessão atual sem senha ou hash.

Os perfis de equipe suportados são `adm`, `supervisor`, `suporte`, `funcionario` e `desenvolvedor`. O perfil `desenvolvedor` é provisionado somente pela operação interna `npm run criar-desenvolvedor`; não existe cadastro público de equipe. Ele pode acessar as rotas de equipe e as operações atualmente restritas a `adm`.

| Recurso | Método e rota | Acesso |
|---|---|---|
| Saúde da API e banco | GET /check | Público |
| Registrar contato | POST /contatos | Público, com consentimento |
| Consultar mensagens | GET /contatos | Equipe |
| Clientes | GET/POST /clientes; PUT /clientes/:id | Equipe |
| Equipamentos | GET/POST /equipamentos; PUT /equipamentos/:id | Equipe |
| Peças | GET/POST /pecas; PUT /pecas/:id | Equipe |
| Excluir cadastro | DELETE /clientes/:id, /equipamentos/:id, /pecas/:id | `adm` ou `desenvolvedor`; vínculos impedem exclusão |
| Técnicos disponíveis | GET /tecnicos | Equipe |
| Criar solicitação com equipamento | POST /solicitacoes | Cliente autenticado |
| Listar ordens | GET /ordens | Cliente: somente próprias; equipe: todas |
| Detalhar ordem | GET /ordens/:id | Cliente proprietário ou equipe |
| Abrir ordem para equipamento existente | POST /ordens | Equipe |
| Diagnóstico, prazo, técnico e status | PATCH /ordens/:id | Equipe |
| Gerar orçamento e reservar peças | POST /ordens/:id/orcamento | Equipe |
| Aprovar/recusar orçamento | POST /ordens/:id/decisao | Cliente proprietário |
| Consultar pelo código e e-mail | POST /rastreio | Credencial limitada à ordem |
| Aprovar/recusar pelo rastreio | POST /rastreio/decisao | Mesmo código aleatório e e-mail |

A consulta pública pelo código não retorna nome, e-mail nem telefone do cliente. O código tem 96 bits aleatórios; não é um número sequencial. Deve ser guardado como informação de acesso ao atendimento. Não publique códigos reais em prints de apresentação.

## Exemplos de operações

Contato:

```json
{"nome":"Contato Teste","email":"teste@exemplo.test","telefone":"11999990000","assunto":"Dúvida sobre reparo","mensagem":"Meu equipamento não está iniciando corretamente.","consentimento":true}
```

Solicitação (Bearer de cliente):

```json
{"tipo":"notebook","marca":"Dell","modelo":"Inspiron 15","numero_serie":"TESTE-001","servico":"Diagnóstico e reparo","defeito_relatado":"O notebook não inicia o sistema operacional.","consentimento":true}
```

Diagnóstico (Bearer da equipe):

```json
{"status":"em diagnostico","diagnostico":"Falha no SSD. Necessária substituição do armazenamento.","descricao":"Avaliação técnica concluída."}
```

Orçamento (Bearer da equipe; a peça precisa existir e ter estoque):

```json
{"pecas":[{"id_peca":1,"quantidade":1}],"valor_mao_obra":95}
```

O valor das peças é obtido no banco, sem confiar em preços enviados pelo navegador. Decisão:

```json
{"decisao":"aprovado"}
```

Rastreio:

```json
{"codigo":"codigo-fornecido-na-abertura","email":"cliente@exemplo.test"}
```

Rastreio com decisão acrescenta `"decisao":"aprovado"` ou `"recusado"`.

## Respostas esperadas

- 200: consulta ou atualização; 201: cadastro; 204: exclusão concluída.
- 400: JSON inválido; 401: sem token/token inválido; 403: perfil sem permissão.
- 404: registro inexistente ou ordem de outro cliente; 409: conflito de fluxo, duplicidade, estoque ou vínculo.
- 422: dados inválidos; 500: falha interna, sem expor SQL ou credenciais na resposta.

Ordens não possuem exclusão física: o encerramento usa `entregue` ou `cancelado` e preserva o histórico.
