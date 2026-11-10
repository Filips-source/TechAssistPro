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

clientesRoutes.get("/:id", async (req, res) => {
    try{
        const {id} = req.params;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }

        const [clientes] = await pool.query(
            `select id_cliente, nome, email, telefone, imagem, status
            from clientes where id_cliente = ?`, [id]
        );
        if(clientes.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Cliente não encontrado"
            });
        }
        return res.status(200).json({
            sucesso: true,
            dados: clientes[0]
        });
    } catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao buscar o cliente"
        });
    }
});

clientesRoutes.put("/:id", async (req, res) => {
    try{
        const {id} = req.params;
        
        const{ nome, email, telefone, imagem, status} = req.body;

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
        const [resultado] = await pool.query(
            `update clientes 
            set nome = ?, email = ?, telefone = ?, imagem = ?, status = ?
            where id_cliente = ?`,
            [nome.trim(), email?.trim() || null, telefone.trim(), imagem || null, status || 'Ativo', id]
        );

        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false, 
                mensagem: "Cliente não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Cliente atualizado com sucesso!"
        });
    } catch(erro){
        console.error(erro);

        if(erro.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Este e-mail já está cadastrado"
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao atualizar cliente."
        });
    }
});

clientesRoutes.delete("/:id", async (req, res) => {
    try{
        const {id} = req.params;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso: false,
                mensagem: "ID inválido"
            });
        }

        const [resultado] = await pool.query(
            `delete from clientes
            where id_cliente = ?`, [id]
        );

        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso: false,
                mensagem: "Cliente não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem:"Cliente excluído com sucesso."
        });
    } catch (erro){
        console.error(erro);

        if(erro.code === "ER_ROW_IS_REFERENCED_2"){
            return res.status(409).json({
                sucesso:false,
                mensagem:"Cliente não pode ser excluído porque já tem equipamento cadastrado."
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao excluir o cliente"
        });
    }
});