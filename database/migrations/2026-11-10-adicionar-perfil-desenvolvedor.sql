-- Adiciona o perfil interno de desenvolvedor sem alterar contas existentes.
-- Execute uma vez no banco TechAssist Pro já criado.
ALTER TABLE usuarios
  MODIFY COLUMN perfil ENUM(
    'adm',
    'supervisor',
    'suporte',
    'funcionario',
    'desenvolvedor'
  ) NOT NULL DEFAULT 'funcionario';
