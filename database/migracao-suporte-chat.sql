-- Migração aditiva TechAssist Pro: atendimento por chat, histórico persistente.
-- Aplicar UMA VEZ ao banco existente antes de usar a área de suporte.
USE techassistpro;
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
