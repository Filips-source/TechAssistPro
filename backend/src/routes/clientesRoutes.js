import express from 'express';
import {pool} from '../config/database.js';

export const clientesRoutes = express.Router();

clientesRoutes.post("/", async (req, res) => {
    try{
        const {nome, email, telefone, imagem} = req.body;

        if(!nome || !nome.trim()){
            return res.status(400).json({
                sucesso: false,
                mensagem: "O nome é obrigatório." 
            });
        }

        if(!telefone || !telefone.trim()){
            return res.status(400).json({
                sucesso:false,
                mensagem: "O Telefone é obrigatório."
            })
        }

        const [resultado] = await pool.query(
            `insert into clientes(nome, email, telefone, imagem)
            values (?, ?, ?, ?)`, [
                nome.trim(),
                email?.trim(),
                telefone.trim(),
                imagem || null
            ]
        );

        return res.status(201).json({
            sucesso:true,
            mensagem: "Cliente cadastrado com sucesso!",
            dados: {
                id_cliente:resultado.insertId,
                nome: nome.trim(),
                email: email?.trim() || null,
                telefone: telefone.trim(),
                imagem: imagem||null,
                status: 'Ativo'
            }
        });
    } catch(erro){
        console.error("Erro ao cadastrar cliente: ", erro);

        if(erro.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Este email já está cadastrado."
            });
        }

        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao cadastrar cliente."
        });
    }
});

clientesRoutes.get("/", async(req, res)=>{
    try{
        const[clientes] = await pool.query(
            `select id_cliente, nome, email, telefone, imagem, status
            from clientes
            order by id_cliente desc`
        );

        return res.status(200).json({
            sucesso:true,
            total:clientes.length,
            dados:clientes
        });
    }
    catch(erro){
        console.error("Erro ao listar clientes:", erro);

        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao buscar cliente."
        });
    }
});