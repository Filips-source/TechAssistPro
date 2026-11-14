# Verificações realizadas

Data: 30/10/2026.

- Instalação das dependências dos dois arquivos de aula com `npm ci`.
- Compilação de produção do Next.js 16.3.4, React 19.2.8 e Node.js 24.22.1 concluída. As rotas de início, contato, serviços, sobre, orçamento, acompanhamento e área de acesso foram geradas.
- API Express executada com um MySQL 8.0.46 isolado para testes. A suíte `backend/test/integracao.test.js` passou com **13 testes, zero falhas** (inclui o teste principal e 12 cenários).
- Os cenários verificam persistência do contato, bcrypt e JWT, login, papéis de acesso, isolamento entre clientes, abertura transacional de ordens e equipamentos, consultas, orçamento calculado no servidor, reserva/devolução de estoque, aprovação concorrente, bloqueio de orçamento resolvido, conclusão, entrega, histórico, CRUD de peças e CORS.
- Foram verificadas também a recusa de alteração de peça reservada, a preservação do orçamento/estoque quando falta uma peça para substituí-lo e a rejeição de prazo inválido.
- A tela de contato da prévia foi inspecionada visualmente em navegador de desktop. O diagrama do banco foi renderizado e inspecionado.

## Limites da verificação

A navegação visual completa e a revisão em dispositivo móvel não foram concluídas: o navegador de teste bloqueou uma tentativa posterior de reabrir a prévia. O CSS contém adaptações para telas pequenas, mas isso não equivale a um teste em celular real.

O fluxo de integração foi verificado por requisições HTTP à API e consultas ao MySQL. A compilação do front-end passou; a submissão de todos os fluxos pelo navegador ainda deve ser conferida pela equipe no ambiente final.

Docker Compose, XAMPP no Windows, o arquivo `.bat` e o deploy Coolify foram preparados, mas não executados neste ambiente. O teste do banco usou MySQL 8.0.46; a compatibilidade específica com a versão do MariaDB instalada no XAMPP deve ser conferida pelo grupo.

Não houve envio de mensagens a terceiros, push para o repositório do grupo, atualização do deploy anterior ou criação de um quadro real de Trello.
