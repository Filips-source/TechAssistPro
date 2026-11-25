-- Aplicar no banco selecionado. Migração aditiva, compatível com a tabela do Drive.
-- Não recria banco, não apaga dados e não altera contas existentes.
CREATE TABLE IF NOT EXISTS relatorios (
  id_relatorio INT AUTO_INCREMENT PRIMARY KEY,
  id_os INT NOT NULL,
  id_usuario INT NULL,
  diagnostico TEXT NOT NULL,
  descricao_reparo TEXT NOT NULL,
  observacoes TEXT NULL,
  data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_os) REFERENCES ordens_servico(id_os),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
