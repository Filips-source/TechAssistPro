import express from 'express';
import {pool} from '../config/database.js';
 
export const orcamentoRoutes = express.Router();
 
const STATUS_VALIDOS = ['Pendente', 'Aprovado', 'Recusado', 'Expirado'];
 
function valorValido(valor){
    if(valor === undefined || valor === null || valor === "") return 0;
    const numero = Number(valor);
    if(Number.isNaN(numero) || numero < 0) return null;
    return Math.round(numero * 100) / 100;
}
 
orcamentoRoutes.get("/", async (req, res) => {
    try{
        const {status, id_os} = req.query;
        const condicoes = [];
        const parametros = [];
 
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
        if(id_os){
            if(!Number.isInteger(Number(id_os)) || Number(id_os) <= 0){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "id_os inválido"
                });
            }
            condicoes.push("id_os = ?");
            parametros.push(id_os);
        }
 
        const where = condicoes.length ? `where ${condicoes.join(" and ")}` : "";
 
        const [orcamentos] = await pool.query(
            `select * from orcamentos
            ${where}
            order by id_orcamento desc`, parametros
        );
        return res.status(200).json({
            sucesso:true,
            total: orcamentos.length,
            dados: orcamentos
        });
    } catch (erro){
        console.error("Erro ao listar orçamentos", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao buscar."
        });
    }
});
 
orcamentoRoutes.get("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
 
        const [orcamentos] = await pool.query(
            `select * from orcamentos where id_orcamento = ?`, [id]
        );
 
        if(orcamentos.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Orçamento não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            dados: orcamentos[0]
        });
 
    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao buscar orçamento"
        });
    }
});
 
orcamentoRoutes.post("/", async(req, res) =>{
    try{
        const {id_os, valor_pecas, valor_mao_obra, status} = req.body;
 
        if(!Number.isInteger(Number(id_os)) || Number(id_os) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "O id da ordem de serviço é obrigatório"
            });
        }
 
        const pecas = valorValido(valor_pecas);
        const maoObra = valorValido(valor_mao_obra);
        if(pecas === null || maoObra === null){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Valores de peças e mão de obra devem ser números maiores ou iguais a zero"
            });
        }
 
        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }
 
        const [ordens] = await pool.query(
            `select id_os from ordens_servicos
            where id_os = ?`, [id_os]
        );
        if(ordens.length === 0){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Ordem de serviço não encontrada"
            });
        }
 

        const [existente] = await pool.query(
            `select id_orcamento from orcamentos
            where id_os = ?`, [id_os]
        );
        if(existente.length > 0){
            return res.status(409).json({
                sucesso:false,
                mensagem:"Já existe um orçamento para essa ordem de serviço"
            });
        }
 
        const total = Math.round((pecas + maoObra) * 100) / 100;
        const statusFinal = status || "Pendente";
 
        const [resultado] = await pool.query(
            `insert into orcamentos(id_os, valor_pecas, valor_mao_obra, valor_total, status)
            values(?, ?, ?, ?, ?)`, [id_os, pecas, maoObra, total, statusFinal]
        );
 
        return res.status(201).json({
            sucesso:true,
            mensagem: "Orçamento adicionado com sucesso",
            dados: {
                id_orcamento: resultado.insertId,
                id_os,
                valor_pecas: pecas,
                valor_mao_obra: maoObra,
                valor_total: total,
                status: statusFinal
            }
        });
 
    }catch(erro){
        console.error("Erro ao cadastrar orçamento", erro);
        if(erro.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Já existe um orçamento para essa ordem de serviço"
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao cadastrar orçamento"
        });
    }
});
 
orcamentoRoutes.put("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        const {id_os, valor_pecas, valor_mao_obra, status} = req.body;
 
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        if(!Number.isInteger(Number(id_os)) || Number(id_os) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "O id da ordem de serviço é obrigatório"
            });
        }
 
        const pecas = valorValido(valor_pecas);
        const maoObra = valorValido(valor_mao_obra);
        if(pecas === null || maoObra === null){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Valores de peças e mão de obra devem ser números maiores ou iguais a zero"
            });
        }
 
        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }
 
        const [ordens] = await pool.query(
            `select id_os from ordens_servicos
            where id_os = ?`, [id_os]
        );
        if(ordens.length === 0){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Ordem de serviço não encontrada"
            });
        }

        const [existente] = await pool.query(
            `select id_orcamento from orcamentos
            where id_os = ? and id_orcamento <> ?`, [id_os, id]
        );
        if(existente.length > 0){
            return res.status(409).json({
                sucesso:false,
                mensagem:"Já existe outro orçamento para essa ordem de serviço"
            });
        }
 
        const total = Math.round((pecas + maoObra) * 100) / 100;
 
        const [resultado] = await pool.query(
            `update orcamentos
            set id_os = ?, valor_pecas = ?, valor_mao_obra = ?, valor_total = ?, status = ?
            where id_orcamento = ?`,
            [id_os, pecas, maoObra, total, status || "Pendente", id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Orçamento não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Orçamento alterado com sucesso!"
        });
    }catch(erro){
        console.log(erro);
        if(erro.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Já existe outro orçamento para essa ordem de serviço"
            });
        }
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar orçamento"
        });
    }
});
 
orcamentoRoutes.patch("/:id/status", async (req, res)=>{
    try{
        const {id} = req.params;
        const {status} = req.body;
 
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        if(!STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }
 
        const [resultado] = await pool.query(
            `update orcamentos set status = ?
            where id_orcamento = ?`, [status, id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Orçamento não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Status do orçamento atualizado com sucesso!"
        });
    }catch(erro){
        console.log(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao atualizar status do orçamento"
        });
    }
});
 
orcamentoRoutes.delete("/:id", async(req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        const [resultado] = await pool.query(
            `delete from orcamentos
            where id_orcamento = ?`, [id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Orçamento não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Orçamento excluido com sucesso!"
        });
    } catch(erro){
        console.log(erro);
        if(erro.code === "ER_ROW_IS_REFERENCED_2"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Não é possivel excluir esse orçamento pois ele está vinculado a outro registro"
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao excluir o orçamento"
        });
    }
});