import express from 'express';
import {pool} from '../config/database.js';

export const equipamentoRoutes = express.Router();

const TIPOS_VALIDOS = ['Notebook', 'Computador', 'Celular', 'Tablet', 'Impressora', 'Monitor', 'Outro'];

equipamentoRoutes.get("/", async (req, res) => {
    try{
        const {id_cliente} = req.query;

        if(id_cliente && (!Number.isInteger(Number(id_cliente)) || Number(id_cliente) <= 0)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "id_cliente inválido"
            });
        }

        const [equipamentos] = id_cliente
            ? await pool.query(
                `select * from equipamentos
                where id_cliente = ?
                order by id_equipamento desc`, [id_cliente]
            )
            : await pool.query(
                `select * from equipamentos
                order by id_equipamento desc`
            );

        return res.status(200).json({
            sucesso:true,
            total: equipamentos.length,
            dados: equipamentos
        });
    } catch (erro){
        console.error("Erro ao listar equipamento", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao buscar."
        });
    }
});

equipamentoRoutes.post("/", async(req, res) =>{
    try{
        const {id_cliente, nome, registro, tipo, imagem, observacoes} = req.body;

        if(!Number.isInteger(Number(id_cliente)) || Number(id_cliente) <= 0 || !nome || !nome.trim()){
            return res.status(400).json({
                sucesso: false,
                mensagem: "Nome e id do cliente são obrigatórios"
            });
        }
        if(nome.trim().length > 100){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Nome deve ter no máximo 100 caracteres"
            });
        }
        if(tipo && !TIPOS_VALIDOS.includes(tipo)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Tipo inválido"
            });
        }

        const[clientes] = await pool.query(
            `select id_cliente, status from clientes
            where id_cliente = ?`, [id_cliente]
        );
        if(clientes.length === 0){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Cliente nao encontrado"
            });
        }
        if(clientes[0].status === "Inativo"){
            return res.status(409).json({
                sucesso:false,
                mensagem:"Cliente inativo não pode receber novos equipamentos"
            });
        }

        const [resultado] = await pool.query(
            `insert into equipamentos(id_cliente, nome, registro, tipo, imagem, observacoes)
            values(?, ?, ?, ?, ?, ?)`,
            [Number(id_cliente), nome.trim(), registro || null, tipo || "Outro", imagem || null, observacoes || null]
        );

        return res.status(201).json({
            sucesso:true,
            mensagem: "Equipamento adicionado com sucesso",
            dados: {
                id_equipamento: resultado.insertId,
                id_cliente: Number(id_cliente),
                nome: nome.trim(),
                registro: registro || null,
                tipo: tipo || "Outro",
                imagem: imagem || null,
                observacoes: observacoes || null
            }
        });

    }catch(erro){
        console.error("Erro ao cadastrar equipamento", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao cadastrar equipamento"
        });
    }
});

equipamentoRoutes.get("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }

        const [equipamentos] = await pool.query(
            `select * from equipamentos where id_equipamento = ?`, [id]
        );

        if(equipamentos.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Equipamento não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            dados: equipamentos[0]
        });

    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao buscar equipamento"
        });
    }
});

equipamentoRoutes.put("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        const {id_cliente, nome, registro, tipo, imagem, observacoes} = req.body;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        if(!Number.isInteger(Number(id_cliente)) || Number(id_cliente) <= 0 || !nome || !nome.trim()){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID do cliente e nome são obrigatórios"
            });
        }
        if(nome.trim().length > 100){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Nome deve ter no máximo 100 caracteres"
            });
        }
        if(tipo && !TIPOS_VALIDOS.includes(tipo)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Tipo inválido"
            });
        }

        const[clientes] = await pool.query(
            `select id_cliente from clientes
            where id_cliente = ?`, [id_cliente]
        );
        if(clientes.length === 0){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Cliente nao encontrado"
            });
        }

        const [resultado] = await pool.query(
            `update equipamentos
            set id_cliente = ?, nome = ?, registro = ?, tipo = ?, imagem = ?, observacoes = ?
            where id_equipamento = ?`,
            [Number(id_cliente), nome.trim(), registro || null, tipo || "Outro", imagem || null, observacoes || null, id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Equipamento não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Equipamento alterado com sucesso!"
        });
    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar equipamento"
        });
    }
});

equipamentoRoutes.delete("/:id", async(req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        const [resultado] = await pool.query(
            `delete from equipamentos
            where id_equipamento = ?`, [id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Equipamento não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Equipamento excluido com sucesso!"
        });
    } catch(erro){
        console.error(erro);
        if(erro.code === "ER_ROW_IS_REFERENCED_2"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Não é possivel excluir esse equipamento pois tem uma ordem de servico vinculada"
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao excluir o equipamento"
        });
    }
});