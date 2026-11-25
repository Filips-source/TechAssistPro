-- Dashboard TechAssist Pro: migração aditiva, segura para dados existentes.
-- Execute no banco MySQL configurado no Coolify, após backup. Não altera Docker.
CREATE TABLE IF NOT EXISTS painel_ferramentas (
  id_ferramenta INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  categoria VARCHAR(60) NOT NULL DEFAULT 'Bancada',
  descricao VARCHAR(500) NULL,
  quantidade INT NOT NULL DEFAULT 0,
  estado ENUM('disponivel','em_uso','manutencao') NOT NULL DEFAULT 'disponivel',
  id_responsavel INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ferramenta_responsavel FOREIGN KEY(id_responsavel) REFERENCES usuarios(id_usuario),
  CONSTRAINT ck_ferramenta_quantidade CHECK (quantidade >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS painel_relatorios (
  id_relatorio INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  tipo ENUM('preventivo','diagnostico','operacional') NOT NULL DEFAULT 'preventivo',
  conteudo TEXT NOT NULL,
  id_autor INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_relatorio_autor FOREIGN KEY (id_autor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS painel_metricas (
  id_metrica INT AUTO_INCREMENT PRIMARY KEY,
  id_equipamento INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  unidade VARCHAR(20) NOT NULL,
  limite_atencao DECIMAL(14,3) NOT NULL,
  limite_critico DECIMAL(14,3) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_metrica_equipo_nome (id_equipamento,nome),
  FOREIGN KEY(id_equipamento) REFERENCES equipamentos(id_equipamento),
  CONSTRAINT ck_limites_metrica CHECK(limite_critico >= limite_atencao)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS painel_leituras (
  id_leitura BIGINT AUTO_INCREMENT PRIMARY KEY,
  id_metrica INT NOT NULL,
  valor DECIMAL(14,3) NOT NULL,
  id_usuario INT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_metrica_data (id_metrica,id_leitura),
  FOREIGN KEY(id_metrica) REFERENCES painel_metricas(id_metrica),
  FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

-- Exemplos para apresentação. Não sobrescrever alterações ou duplicar por reexecução.
INSERT INTO painel_ferramentas (nome,categoria,descricao,quantidade,estado)
SELECT 'Multímetro digital','Diagnóstico','Medição de tensão, corrente e continuidade',2,'disponivel'
WHERE NOT EXISTS(SELECT 1 FROM painel_ferramentas WHERE nome='Multímetro digital');
INSERT INTO painel_ferramentas (nome,categoria,descricao,quantidade,estado)
SELECT 'Kit de chaves de precisão','Desmontagem','Kit para abertura de notebooks e celulares',4,'disponivel'
WHERE NOT EXISTS(SELECT 1 FROM painel_ferramentas WHERE nome='Kit de chaves de precisão');
INSERT INTO painel_ferramentas (nome,categoria,descricao,quantidade,estado)
SELECT 'Estação de solda','Reparo','Soldagem e retrabalho de componentes eletrônicos',1,'disponivel'
WHERE NOT EXISTS(SELECT 1 FROM painel_ferramentas WHERE nome='Estação de solda');
INSERT INTO painel_ferramentas (nome,categoria,descricao,quantidade,estado)
SELECT 'Pulseira antiestática','Segurança','Proteção ESD de componentes sensíveis',5,'disponivel'
WHERE NOT EXISTS(SELECT 1 FROM painel_ferramentas WHERE nome='Pulseira antiestática');
INSERT INTO painel_ferramentas (nome,categoria,descricao,quantidade,estado)
SELECT 'Testador de fonte ATX','Diagnóstico','Diagnóstico de fontes de computadores',1,'disponivel'
WHERE NOT EXISTS(SELECT 1 FROM painel_ferramentas WHERE nome='Testador de fonte ATX');

INSERT INTO painel_relatorios(titulo,tipo,conteudo)
SELECT 'Checklist de manutenção preventiva','preventivo',
'Exemplo para demonstração: inspeção visual, limpeza, conferência de conectores, temperatura e teste de funcionamento. Editar os resultados antes de emitir um laudo real.'
WHERE NOT EXISTS(SELECT 1 FROM painel_relatorios WHERE titulo='Checklist de manutenção preventiva');
INSERT INTO painel_relatorios(titulo,tipo,conteudo)
SELECT 'Relatório de diagnóstico técnico','diagnostico',
'Modelo ilustrativo: registrar sintomas, testes realizados, resultados, peças necessárias e recomendação de reparo. Nenhuma inspeção real foi executada.'
WHERE NOT EXISTS(SELECT 1 FROM painel_relatorios WHERE titulo='Relatório de diagnóstico técnico');

-- Exemplo de métricas é opcional e deve ser adicionado ao equipamento correto via painel.
