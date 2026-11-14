-- Executar uma vez em instalações que já possuem a tabela clientes.
-- Antes: backup do banco. Não apaga registros existentes.
USE techassistpro;
ALTER TABLE clientes
  ADD COLUMN tipo_pessoa ENUM('fisica','juridica') NOT NULL DEFAULT 'fisica' AFTER imagem_url,
  ADD COLUMN documento VARCHAR(14) NULL AFTER tipo_pessoa,
  ADD COLUMN nome_razao_social VARCHAR(160) NULL AFTER documento,
  ADD COLUMN endereco VARCHAR(300) NULL AFTER nome_razao_social;
