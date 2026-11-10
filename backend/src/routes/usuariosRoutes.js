import express from 'express';
import {pool} from '../config/database.js';
import bcrypt from "bcrypt";

export const usuariosRoutes = express.Router();

const TIPOS_VALIDOS = ['Administrador', 'Suporte', 'Supervisor', 'Funcionario'];
const STATUS_VALIDOS = ['Ativo', 'Inativo'];
const SALT_ROUNDS = 10;
const SENHA_MINIMA = 6;

const COLUNAS_PUBLICAS = `id_usuario, nome, email, telefone, imagem, especialidade, tipo_usuario, status`;

usuariosRoutes.get("/", async (req, res)=>{
    try{
        const {tipo_usuario, status} = req.query;
        const condicoes = [];
        const parametros = [];

        if(tipo_usuario){
            if(!TIPOS_VALIDOS.includes(tipo_usuario)){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "Tipo de usuário inválido"
                });
            }
            condicoes.push("tipo_usuario = ?");
            parametros.push(tipo_usuario);
        }
        if(status){
            if(!STATUS_VALIDOS.includes(status)){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "Status inválido"
                });
            }
            condicoes.push("status = ?");
            parametros.push(status);
        }

        const where = condicoes.length ? `where ${condicoes.join(" and ")}` : "";

        const [usuarios] = await pool.query(
            `select ${COLUNAS_PUBLICAS} from usuarios
            ${where}
            order by id_usuario desc`, parametros
        );
        return res.status(200).json({
            sucesso:true,
            total: usuarios.length,
            dados: usuarios
        });
    } catch(erro){
        console.error("Erro ao listar usuarios", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao listar usuarios"
        });
    }
});

usuariosRoutes.get("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        const [usuarios] = await pool.query(
            `select ${COLUNAS_PUBLICAS} from usuarios
            where id_usuario = ?`, [id]
        );
        if(usuarios.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem:"Usuario nao encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            dados: usuarios[0]
        });
    } catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao buscar usuario"
        });
    }
});

usuariosRoutes.post("/", async(req, res)=>{
    try{
        const {nome, email, telefone, senha, imagem, especialidade, tipo_usuario} = req.body;

        if(!nome || !nome.trim() || !telefone || !telefone.trim()){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Nome e telefone são obrigatórios"
            });
        }
        if(nome.trim().length > 100 || (email && email.trim().length > 100) || telefone.trim().length > 20){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Nome e email aceitam até 100 caracteres e o telefone até 20"
            });
        }
        if(!senha || typeof senha !== "string" || senha.length < SENHA_MINIMA){
            return res.status(400).json({
                sucesso:false,
                mensagem:`A senha é obrigatória e deve ter no mínimo ${SENHA_MINIMA} caracteres`
            });
        }
        if(tipo_usuario && !TIPOS_VALIDOS.includes(tipo_usuario)){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Tipo de usuário inválido"
            });
        }

        const senha_hash = await bcrypt.hash(senha, SALT_ROUNDS);
        const tipoFinal = tipo_usuario || "Funcionario";

        const [resultado] = await pool.query(
            `insert into usuarios(nome, email, telefone, senha_hash, imagem, especialidade, tipo_usuario)
            values(?, ?, ?, ?, ?, ?, ?)`,
            [nome.trim(), email?.trim() || null, telefone.trim(), senha_hash, imagem || null, especialidade?.trim() || null, tipoFinal]
        );

        return res.status(201).json({
            sucesso:true,
            mensagem:"Usuario cadastrado com sucesso",
            dados: {
                id_usuario: resultado.insertId,
                nome: nome.trim(),
                email: email?.trim() || null,
                telefone: telefone.trim(),
                imagem: imagem || null,
                especialidade: especialidade?.trim() || null,
                tipo_usuario: tipoFinal,
                status: "Ativo"
            }
        });
    } catch(erro){
        console.error(erro);
        if(erro.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Este email já está cadastrado."
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao cadastrar usuario"
        });
    }
});

usuariosRoutes.put("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        const {nome, email, telefone, senha, imagem, especialidade, tipo_usuario, status} = req.body;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        if(!nome || !nome.trim() || !telefone || !telefone.trim()){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Nome e telefone são obrigatórios"
            });
        }
        if(nome.trim().length > 100 || (email && email.trim().length > 100) || telefone.trim().length > 20){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Nome e email aceitam até 100 caracteres e o telefone até 20"
            });
        }
        if(senha !== undefined && senha !== null && senha !== ""){
            if(typeof senha !== "string" || senha.length < SENHA_MINIMA){
                return res.status(400).json({
                    sucesso:false,
                    mensagem:`A senha deve ter no mínimo ${SENHA_MINIMA} caracteres`
                });
            }
        }
        if(tipo_usuario && !TIPOS_VALIDOS.includes(tipo_usuario)){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Tipo de usuário inválido"
            });
        }
        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Status inválido"
            });
        }

        const senha_hash = senha ? await bcrypt.hash(senha, SALT_ROUNDS) : null;

        const [resultado] = await pool.query(
            `update usuarios
            set nome = ?, email = ?, telefone = ?, imagem = ?, especialidade = ?,
                tipo_usuario = coalesce(?, tipo_usuario),
                status = coalesce(?, status),
                senha_hash = coalesce(?, senha_hash)
            where id_usuario = ?`,
            [nome.trim(), email?.trim() || null, telefone.trim(), imagem || null, especialidade?.trim() || null,
             tipo_usuario || null, status || null, senha_hash, id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem:"Usuario não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem:"Usuario atualizado com sucesso"
        });
    } catch(erro){
        console.error(erro);
        if(erro.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Esse e-mail já está cadastrado"
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao atualizar usuario"
        });
    }
});

usuariosRoutes.delete("/:id", async (req, res) => {
    try{
        const {id} = req.params;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem:"ID inválido"
            });
        }

        const [resultado] = await pool.query(
            `delete from usuarios
            where id_usuario = ?`, [id]
        );

        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem:"Usuario não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem:"Usuario deletado com sucesso!"
        });

    } catch(erro){
        console.error(erro);
        if(erro.code === "ER_ROW_IS_REFERENCED_2"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Não é possível excluir este usuário, pois existem ordens de serviço vinculadas. Marque-o como Inativo."
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao deletar usuario"
        });
    }
});