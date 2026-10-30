create database techassistpro;

use techassistpro;

create table clientes(
id_cliente int primary key auto_increment,
nome varchar(50) not null,
email varchar(100) unique,
telefone varchar(50) not null,
senha_hash varchar(255),
imagem varchar(255),
status ENUM('Ativo', 'Inativo') default 'Ativo'
);

create table usuarios(
id_usuario int primary key auto_increment,
nome varchar(100) not null,
email varchar(100) unique,
telefone varchar(20),
senha_hash varchar(255),
imagem varchar(255),
especialidade varchar(100),
tipo_usuario ENUM('Administrador', 'Suporte', 'Supervisor', 'Funcionario') default 'Funcionario',
status ENUM('Ativo', 'Inativo') default 'Ativo'
);

create table equipamentos(
id_equipamento int auto_increment primary key,
id_cliente int not null,
nome varchar(100) not null,
registro varchar(100),
tipo ENUM('Notebook', 'Computador', 'Celular', 'Tablet', 'Impressora', 'Monitor', 'Outro') default 'Outro',
imagem varchar(255),
observacoes text, 
foreign key (id_cliente) references clientes(id_cliente)
);

create table ordens_servicos(
id_os int auto_increment primary key,
id_equipamento int not null,
id_usuario int null,
rastreio varchar(50) unique,
status ENUM('Recebido','Em diagnostico','Aguardando aprovacao','Aguardando peca','Em reparo','Em testes','Pronto para retirada','Entregue','Cancelado', 'Produto Armazenado') default 'Recebido',
diagnostico text,
prazo date,
data_manutencao date,
data_entrega datetime, 
valor decimal(10,2) default 0,
foreign key (id_equipamento) references equipamentos(id_equipamento),
foreign key (id_usuario) references usuarios(id_usuario)
);

create table orcamentos(
id_orcamento int primary key auto_increment,
id_os int not null unique,
valor_pecas decimal(10,2) default 0,
valor_mao_obra decimal(10,2) default 0,
valor_total decimal(10,2) default 0,
status ENUM('Pendente', 'Aprovado', 'Recusado', 'Expirado') default 'Pendente',
data_orcamento datetime default current_timestamp,
foreign key (id_os) references ordens_servicos(id_os)
);

create table pecas(
id_peca int primary key auto_increment,
nome varchar(50) not null,
descricao text,
quantidade int default 0,
valor decimal(10,2) default 0,
status ENUM('Disponivel', 'Esgotada', 'Inativa') default 'Disponivel'
);

create table pecas_utilizadas(
id_pecas_util int primary key auto_increment,
id_os int not null,
id_peca int not null,
quantidade int not null check (quantidade > 0),
status ENUM('Reservada', 'Utilizada', 'Devolvida') default 'Reservada',
foreign key(id_os) references ordens_servicos(id_os),
foreign key(id_peca) references pecas(id_peca)
);

create table historico_servicos(
id_hist int auto_increment primary key,
id_os int not null,
status ENUM('Recebido','Em diagnostico','Aguardando aprovacao','Aguardando peca','Em reparo','Em testes','Pronto para retirada','Entregue','Cancelado', 'Produto Armazenado') default 'Recebido',
descricao text,
data_atualizacao datetime default current_timestamp,
foreign key(id_os) references ordens_servicos(id_os)
);