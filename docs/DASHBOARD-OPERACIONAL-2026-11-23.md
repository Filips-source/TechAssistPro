# Dashboard operacional e suporte — implementação 23/11/2026

## Estado e limites
Esta alteração encontra-se em uma **branch separada**, não implantada. Os dados de exemplos são ilustrativos e a página `/planos` não processa pagamentos, não ativa assinaturas nem altera permissões reais.

### Estrutura
- `frontend/src/components/dashboard/DashboardClient.jsx`: autenticação, identificação do perfil e leitura de ordens + resumo operacional.
- `frontend/src/components/dashboard/AurenDashboard.jsx`: navegação por perfil, agenda, ordens, monitoramento e visualizações.
- `frontend/src/components/dashboard/GestorOperacional.jsx`: formulários e ações de peças, equipamentos, ferramentas, métricas e relatórios.
- `frontend/src/components/dashboard/SupportChat.jsx`: mensagens de suporte; cada bolha fica à direita **somente** se o identificador e o tipo de remetente coincidirem com a conta ativa.
- `backend/controllers/SuporteController.js` + `backend/models/SuporteModel.js`: autenticação, isolamento por proprietário, envio, mensagens e eventos SSE.
- `backend/routes/PainelRoutes.js`: operações autenticadas com verificações de propriedade e privilégios.
- `database/migrations/2026-11-23-dashboard-operacional.sql`: migração aditiva para quatro tabelas e dados fictícios iniciais.
- `frontend/src/app/planos/page.jsx`: simulação transparente de seleção de plano.

## Como aplicar em ambiente de teste
1. Faça **backup** do MySQL do Coolify antes de executar qualquer script.
2. Aplique no banco `techassistpro` a migração `database/migrations/2026-11-23-dashboard-operacional.sql`, sem executar comandos de exclusão/recriação do banco.
3. Faça checkout da branch `feature/dashboard-operacao-chat-planos-20261123` no VS Code e compare com o seu código atual.
4. Configure `AUREN_DASHBOARD_DEMO=false` no processo Next.js em desenvolvimento para exercitar o backend real. A partir desta alteração, a demonstração não é ativada automaticamente.
5. Verifique `NEXT_PUBLIC_API_URL` e as variáveis de conexão MySQL já existentes. **Não modificar arquivos Docker**, configuração Coolify nem variáveis de produção automaticamente.
6. Teste pelo menos um cliente A, cliente B, administrador A e administrador B com contas **distintas**. Confirme que o cliente B não consegue ler nem responder à conversa do A (HTTP 403). No admin B, mensagens do admin A devem aparecer à esquerda; apenas as mensagens do próprio admin B, à direita.
7. Teste adicionar/editar ferramenta, relatório e equipamento; criar métrica e registrar leitura com conta autorizada; editar ordem dentro das transições de status aceitas pelo backend.
8. Revise a apresentação em `/planos`. É apenas demonstração, sem integração com gateway de pagamento.

## Integração e testes
O teste de integração `backend/test/integracao.test.js` passa a aplicar a migração ao banco de teste e validar operações operacionais. Requer MySQL de testes e `backend/.env.test` com nome de banco terminado em `_test`; não execute o script contra o banco do Coolify.
```bash
cd backend
npm run test:integracao
```
```bash
cd frontend
npm run build
```
Os comandos acima **não foram executados nesta revisão**: não há conexão direta ao MySQL de testes nem checkout local de código pelo conector nesta sessão.

## Observações
- A saúde de um equipamento é, por enquanto, um indicador visual derivado dos limites configurados, não um diagnóstico físico certificado. Métricas crescentes são tratadas como piores quanto maiores; para métricas inversas deve-se evoluir o modelo com direção e faixa ideal.
- Estoque de peças existente pode conter registros sem associação a um equipamento. A gestão de estoque não equivale ao monitoramento físico da integridade de cada peça.
- A agenda usa prazos e datas de ordens, não um sistema independente de reservas/slots.
- O controle de permissões no frontend não substitui a validação pelo servidor.
