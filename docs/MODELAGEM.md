# Modelagem do banco

A modelagem segue a documentação “TechAssist Pro — Organização Inicial do Projeto - Auren”. O diagrama está em `modelagem-banco.svg` e o SQL em `../database/techassistpro.sql`.

| Entidade | Chave primária | Relacionamento |
|---|---|---|
| clientes | id_cliente | 1 cliente → N equipamentos |
| usuarios | id_usuario | 1 técnico → N ordens; responsável pode ser definido depois da entrada |
| equipamentos | id_equipamento | 1 equipamento → N ordens |
| ordens_servico | id_os | 1 ordem → 0 ou 1 orçamento atual; 1 ordem → N históricos |
| orcamentos | id_orcamento | id_os único para simplificar a segunda entrega |
| pecas | id_peca | N peças ↔ N ordens, por pecas_utilizadas |
| pecas_utilizadas | id_peca_util | referência à ordem e à peça; uma linha por peça em cada ordem |
| historico_servico | id_hist | eventos da ordem, preservados após a entrega |
| contatos | id_contato | mensagens recebidas pelo formulário, independentes de conta |

Foram mantidos os nomes de campos e os status previstos na documentação. Os complementos necessários são `numero_serie`, `defeito_relatado`, `servico`, `reparo_executado`, `data_entrega`, datas de criação e `valor_unitario` no vínculo da peça. O valor unitário guarda o preço usado no orçamento, mesmo que o cadastro da peça seja atualizado depois.

`quantidade` em `pecas` representa o estoque disponível. Gerar orçamento reserva e reduz essa quantidade; recusar ou cancelar antes do consumo devolve a reserva. Aprovar marca as peças como utilizadas e inicia o reparo. A ordem, o estoque, o orçamento e o histórico são alterados em transações com bloqueio de linhas.

`clientes.senha_hash` aceita nulo para clientes cadastrados pela equipe sem conta de acesso. O cadastro público cria uma conta nova de cliente com hash bcrypt; não assume a titularidade de um cadastro existente pelo e-mail. Recuperação de senha/convite para clientes cadastrados pela equipe não faz parte desta entrega.

`imagem_url`, `especialidade` e `rastreio` permanecem previstos no banco. Upload de arquivos e gestão completa de funcionários não são funcionalidades concluídas nesta etapa. Os exemplos não possuem senhas públicas fixas.

O esquema é voltado a uma instalação nova. `CREATE TABLE IF NOT EXISTS` não converte um esquema antigo que tenha outras colunas ou tipos. Use um banco novo ou prepare uma migração específica antes de importar sobre uma versão anterior.
