-- TechAssist Pro / Entrega 2. Importar no phpMyAdmin ou MySQL Workbench.
-- Script aditivo: não apaga bancos, tabelas ou registros existentes.
CREATE DATABASE IF NOT EXISTS techassistpro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE techassistpro;
CREATE TABLE IF NOT EXISTS clientes (
 id_cliente INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(120) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE,
 telefone VARCHAR(20) NOT NULL, senha_hash VARCHAR(255) NULL,
 imagem_url VARCHAR(500) NULL,
 tipo_pessoa ENUM('fisica','juridica') NOT NULL DEFAULT 'fisica',
 documento VARCHAR(14) NULL,
 nome_razao_social VARCHAR(160) NULL,
 endereco VARCHAR(300) NULL,
 status ENUM('ativo','ausente') NOT NULL DEFAULT 'ativo',
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS usuarios (
 id_usuario INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(120) NOT NULL, email VARCHAR(150) NOT NULL UNIQUE,
 telefone VARCHAR(20) NULL, senha_hash VARCHAR(255) NOT NULL,
 imagem_url VARCHAR(500) NULL, especialidade VARCHAR(120) NULL,
 perfil ENUM('adm','supervisor','suporte','funcionario','desenvolvedor') NOT NULL DEFAULT 'funcionario',
 status ENUM('ativo','ausente') NOT NULL DEFAULT 'ativo',
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS equipamentos (
 id_equipamento INT AUTO_INCREMENT PRIMARY KEY, id_cliente INT NOT NULL,
 nome VARCHAR(120) NOT NULL,
 tipo ENUM('notebook','computador','celular','tablet','impressora','monitor','outro') NOT NULL DEFAULT 'outro',
 marca VARCHAR(60) NOT NULL, modelo VARCHAR(80) NOT NULL,
 numero_serie VARCHAR(100) NULL, imagem_url VARCHAR(500) NULL, observacoes TEXT NULL,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS ordens_servico (
 id_os INT AUTO_INCREMENT PRIMARY KEY, codigo_rastreio VARCHAR(50) NOT NULL UNIQUE,
 id_equipamento INT NOT NULL, id_usuario INT NULL, rastreio VARCHAR(255) NULL,
 status ENUM('recebido','em diagnostico','aguardando aprovacao','aguardando peca','em reparo','em teste','pronto para retirada','entregue','cancelado','produto armazenado') NOT NULL DEFAULT 'recebido',
 defeito_relatado TEXT NOT NULL, servico VARCHAR(120) NOT NULL DEFAULT 'Diagnóstico e reparo',
 diagnostico TEXT NULL, reparo_executado TEXT NULL, prazo DATE NULL,
 data_manutencao DATETIME NULL, data_entrega DATETIME NULL, valor DECIMAL(12,2) NOT NULL DEFAULT 0,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_equipamento) REFERENCES equipamentos(id_equipamento),
 FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS orcamentos (
 id_orcamento INT AUTO_INCREMENT PRIMARY KEY, id_os INT NOT NULL UNIQUE,
 valor_pecas DECIMAL(12,2) NOT NULL DEFAULT 0, valor_mao_obra DECIMAL(12,2) NOT NULL DEFAULT 0,
 valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
 status ENUM('pendente','aprovado','recusado','expirado') NOT NULL DEFAULT 'pendente',
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_os) REFERENCES ordens_servico(id_os)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS pecas (
 id_peca INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(120) NOT NULL,
 descricao VARCHAR(500) NULL, quantidade INT NOT NULL DEFAULT 0,
 valor DECIMAL(12,2) NOT NULL,
 status ENUM('disponivel','esgotada','inativa') NOT NULL DEFAULT 'disponivel',
 CHECK(quantidade>=0), CHECK(valor>=0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS pecas_utilizadas (
 id_peca_util INT AUTO_INCREMENT PRIMARY KEY, id_os INT NOT NULL, id_peca INT NOT NULL,
 quantidade INT NOT NULL, valor_unitario DECIMAL(12,2) NOT NULL,
 status ENUM('reservada','utilizada','devolvida') NOT NULL DEFAULT 'reservada',
 FOREIGN KEY(id_os) REFERENCES ordens_servico(id_os), FOREIGN KEY(id_peca) REFERENCES pecas(id_peca),
 UNIQUE KEY os_peca(id_os,id_peca), CHECK(quantidade>0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS historico_servico (
 id_hist INT AUTO_INCREMENT PRIMARY KEY, id_os INT NOT NULL,
 status ENUM('recebido','em diagnostico','aguardando aprovacao','aguardando peca','em reparo','em teste','pronto para retirada','entregue','cancelado','produto armazenado') NOT NULL,
 descricao TEXT NOT NULL, data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(id_os) REFERENCES ordens_servico(id_os), INDEX idx_hist_os_data(id_os,data_atualizacao)
) ENGINE=InnoDB;
-- Complemento necessário para persistir a tela de contato.
CREATE TABLE IF NOT EXISTS contatos (
 id_contato INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(120) NOT NULL,
 email VARCHAR(150) NOT NULL, telefone VARCHAR(20) NOT NULL,
 assunto VARCHAR(100) NOT NULL, mensagem TEXT NOT NULL,
 criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
-- Migração aditiva TechAssist Pro: atendimento por chat, histórico persistente.
-- Aplicar UMA VEZ ao banco existente antes de usar a área de suporte.
CREATE TABLE IF NOT EXISTS suporte_conversas (
  id_conversa BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  assunto VARCHAR(120) NOT NULL,
  categoria VARCHAR(60) NOT NULL DEFAULT 'Suporte geral',
  status ENUM('aberto','em_atendimento','resolvido') NOT NULL DEFAULT 'aberto',
  id_atendente INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_suporte_cliente (id_cliente, atualizado_em),
  INDEX idx_suporte_status (status, atualizado_em),
  CONSTRAINT fk_suporte_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
  CONSTRAINT fk_suporte_atendente FOREIGN KEY (id_atendente) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS suporte_mensagens (
  id_mensagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_conversa BIGINT UNSIGNED NOT NULL,
  remetente_tipo ENUM('cliente','equipe') NOT NULL,
  id_remetente INT NOT NULL,
  texto TEXT NOT NULL,
  criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_suporte_mensagens (id_conversa, id_mensagem),
  CONSTRAINT fk_suporte_mensagem_conversa FOREIGN KEY (id_conversa) REFERENCES suporte_conversas(id_conversa)
) ENGINE=InnoDB;

-- Dados fictícios de demonstração; conta de teste bcrypt declarada ao final.
INSERT INTO pecas(id_peca,nome,descricao,quantidade,valor,status) VALUES
(1,'SSD SATA 480 GB','Unidade de armazenamento para demonstração',8,249.90,'disponivel'),
(2,'Memória DDR4 8 GB','Módulo de memória para demonstração',5,129.90,'disponivel'),
(3,'Pasta térmica','Material para manutenção preventiva',12,29.90,'disponivel')
ON DUPLICATE KEY UPDATE id_peca=id_peca;
INSERT INTO clientes(id_cliente,nome,email,telefone) VALUES
(1,'Cliente de exemplo','exemplo@techassist.test','11999990000')
ON DUPLICATE KEY UPDATE id_cliente=id_cliente;
INSERT INTO equipamentos(id_equipamento,id_cliente,nome,tipo,marca,modelo,numero_serie,observacoes) VALUES
(1,1,'Notebook de exemplo','notebook','Dell','Inspiron 15','EXEMPLO-001','Dado fictício para apresentação')
ON DUPLICATE KEY UPDATE id_equipamento=id_equipamento;
INSERT INTO ordens_servico(id_os,codigo_rastreio,id_equipamento,defeito_relatado) VALUES
(1,'EXEMPLO-2026-001',1,'Notebook de exemplo apresenta lentidão ao iniciar o sistema.')
ON DUPLICATE KEY UPDATE id_os=id_os;
INSERT INTO historico_servico(id_hist,id_os,status,descricao) VALUES
(1,1,'recebido','Equipamento fictício cadastrado para demonstração da entrega.')
ON DUPLICATE KEY UPDATE id_hist=id_hist;

-- SOMENTE PARA TESTES LOCAIS: conta de cliente para acesso à dashboard.
-- Senha armazenada exclusivamente como hash bcrypt; nunca em texto puro.
-- Não concede privilégios de equipe/administrador/desenvolvedor.
-- Remova esta conta antes de publicar a aplicação em produção.
-- Caso o e-mail já exista, preserve o usuário e sua senha atuais.
INSERT INTO clientes(nome, email, telefone, senha_hash, status) VALUES
('Cliente Teste AUREN', 'aurenteste@gmail.com', '0000000000',
 '$2b$10$Wb18xhiC6tydTozDgynxH.lgfFLUYt0RSMZb7HI2k4AziOgx4d.Mm', 'ativo')
ON DUPLICATE KEY UPDATE id_cliente=id_cliente;
