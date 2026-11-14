-- Executar somente no ambiente local/de testes com banco já existente.
-- Não altera contas existentes nem redefine senhas.
-- Para instalações novas, a conta já está no techassistpro.sql.
-- Remova a conta antes de colocar a aplicação em produção.
USE techassistpro;

-- SOMENTE PARA TESTES LOCAIS: conta de cliente para acesso à dashboard.
-- Senha armazenada exclusivamente como hash bcrypt; nunca em texto puro.
-- Não concede privilégios de equipe/administrador/desenvolvedor.
-- Remova esta conta antes de publicar a aplicação em produção.
-- Caso o e-mail já exista, preserve o usuário e sua senha atuais.
INSERT INTO clientes(nome, email, telefone, senha_hash, status) VALUES
('Cliente Teste AUREN', 'aurenteste@gmail.com', '0000000000',
 '$2b$10$Wb18xhiC6tydTozDgynxH.lgfFLUYt0RSMZb7HI2k4AziOgx4d.Mm', 'ativo')
ON DUPLICATE KEY UPDATE id_cliente=id_cliente;
