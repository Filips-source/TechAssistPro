# Segunda entrega — Projeto Integrador

Prazo informado no enunciado: **13 de novembro de 2026, às 23h59**.

| Exigência | Onde demonstrar |
|---|---|
| Modelagem inicial, com entidades, atributos e relações | `modelagem-banco.svg` e `MODELAGEM.md` |
| Banco implementado com dados de exemplo | Importar `database/techassistpro.sql`; contém cliente, equipamento, ordem, histórico e peças fictícios |
| Cinco telas com navegação funcional | `/`, `/contato`, `/orcamento`, `/acompanhar`, `/area-cliente`; complementos `/servicos`, `/sobre`, `/como-funciona` |
| Integração inicial front-end → back-end → banco | Enviar contato, cadastrar cliente, registrar solicitação, consultar ordens e atualizar orçamento/status |
| Repositório atualizado e contribuições em branches | Código preparado no ZIP. A equipe ainda precisa revisar, enviar ao GitHub e registrar suas contribuições |
| Link do Kanban | Modelo em `KANBAN.md`; a equipe ainda precisa criar/atualizar o quadro e inserir o link real |
| Tecnologias trabalhadas em aula | Next.js/React no front; API Express em camadas, JWT, bcrypt e mysql2 no back |

## Equipe segundo a documentação fornecida

- Matheus Rodrigues — Front-end.
- Igor Bosqueiro — Banco de dados e back-end.
- Igor Matos — Back-end e banco de dados.
- Filipe Dupin — Back-end, liderança e análise.
- Italo — Front-end.

## Roteiro curto para apresentar

1. Mostrar diagrama e tabelas no MySQL.
2. Abrir a navegação entre as cinco telas principais.
3. Enviar uma mensagem de contato e mostrar o registro no banco ou no painel.
4. Cadastrar cliente e equipamento pela solicitação de avaliação.
5. Mostrar a ordem no painel da equipe, registrar diagnóstico e gerar orçamento.
6. Aprovar/recusar como cliente e mostrar o efeito no status e no estoque.
7. Mostrar o histórico até a entrega.
8. Abrir o GitHub e o quadro real de Kanban da equipe.

As funcionalidades essenciais estão implementadas. A prévia online demonstra a interface; para provar persistência e autenticação real, execute o projeto com a API e o MySQL.
