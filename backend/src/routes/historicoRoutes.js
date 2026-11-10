import express from 'express';
import {pool} from '../config/database.js';

export const historicoRoutes = express.Router();

const STATUS_VALIDOS = [
    'Recebido', 'Em diagnostico', 'Aguardando aprovacao', 'Aguardando peca',
    'Em reparo', 'Em testes', 'Pronto para retirada', 'Entregue',
    'Cancelado', 'Produto Armazenado'
];

function dataValida(valor){
    return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(new Date(valor).getTime());
}

historicoRoutes.get("/", async (req, res) => {
    try{
        const {id_os, status, data_inicio, data_fim} = req.query;
        const condicoes = [];
        const parametros = [];

        if(id_os){
            if(!Number.isInteger(Number(id_os)) || Number(id_os) <= 0){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "id_os inválido"
                });
            }
            condicoes.push("h.id_os = ?");
            parametros.push(id_os);
        }
        if(status){
            if(!STATUS_VALIDOS.includes(status)){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "Status inválido"
                });
            }
            condicoes.push("h.status = ?");
            parametros.push(status);
        }
        if(data_inicio){
            if(!dataValida(data_inicio)){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "data_inicio deve estar no formato AAAA-MM-DD"
                });
            }
            condicoes.push("h.data_atualizacao >= ?");
            parametros.push(`${data_inicio} 00:00:00`);
        }
        if(data_fim){
            if(!dataValida(data_fim)){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "data_fim deve estar no formato AAAA-MM-DD"
                });
            }
            condicoes.push("h.data_atualizacao <= ?");
            parametros.push(`${data_fim} 23:59:59`);
        }

        const where = condicoes.length ? `where ${condicoes.join(" and ")}` : "";

        const [historico] = await pool.query(
            `select h.*, os.rastreio
            from historico_servicos h
            join ordens_servicos os on os.id_os = h.id_os
            ${where}
            order by h.data_atualizacao desc, h.id_hist desc`, parametros
        );
        return res.status(200).json({
            sucesso:true,
            total: historico.length,
            dados: historico
        });
    } catch (erro){
        console.error("Erro ao listar histórico", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao buscar."
        });
    }
});


historicoRoutes.get("/os/:id_os", async (req, res)=>{
    try{
        const {id_os} = req.params;
        if(!Number.isInteger(Number(id_os)) || Number(id_os) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }

        const [ordens] = await pool.query(
            `select id_os, rastreio, status from ordens_servicos where id_os = ?`, [id_os]
        );
        if(ordens.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Ordem de serviço não encontrada"
            });
        }

        const [historico] = await pool.query(
            `select id_hist, status, descricao, data_atualizacao
            from historico_servicos
            where id_os = ?
            order by data_atualizacao asc, id_hist asc`, [id_os]
        );

        return res.status(200).json({
            sucesso:true,
            total: historico.length,
            ordem_servico: ordens[0],
            dados: historico
        });
    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao buscar histórico da ordem de serviço"
        });
    }
});


historicoRoutes.get("/rastreio/:codigo", async (req, res)=>{
    try{
        const {codigo} = req.params;

        const [ordens] = await pool.query(
            `select os.id_os, os.rastreio, os.status, os.prazo, os.data_entrega,
                e.nome as equipamento
            from ordens_servicos os
            join equipamentos e on e.id_equipamento = os.id_equipamento
            where os.rastreio = ?`, [codigo]
        );
        if(ordens.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Código de rastreio não encontrado"
            });
        }

        const [historico] = await pool.query(
            `select status, descricao, data_atualizacao
            from historico_servicos
            where id_os = ?
            order by data_atualizacao asc, id_hist asc`, [ordens[0].id_os]
        );

        const {id_os, ...ordem} = ordens[0];

        return res.status(200).json({
            sucesso:true,
            ordem_servico: ordem,
            dados: historico
        });
    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao consultar rastreio"
        });
    }
});

historicoRoutes.get("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }

        const [historico] = await pool.query(
            `select * from historico_servicos where id_hist = ?`, [id]
        );

        if(historico.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Registro não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            dados: historico[0]
        });
    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao buscar registro"
        });
    }
});


historicoRoutes.post("/", async(req, res) =>{
    try{
        const {id_os, descricao} = req.body;

        if(!Number.isInteger(Number(id_os)) || Number(id_os) <= 0 || !descricao || !descricao.trim()){
            return res.status(400).json({
                sucesso:false,
                mensagem: "O id da ordem de serviço e a descrição são obrigatórios"
            });
        }

        const [ordens] = await pool.query(
            `select status from ordens_servicos where id_os = ?`, [id_os]
        );
        if(ordens.length === 0){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Ordem de serviço não encontrada"
            });
        }

        const statusAtual = ordens[0].status;

        const [resultado] = await pool.query(
            `insert into historico_servicos(id_os, status, descricao)
            values(?, ?, ?)`, [id_os, statusAtual, descricao.trim()]
        );

        return res.status(201).json({
            sucesso:true,
            mensagem: "Observação adicionada ao histórico",
            dados: {
                id_hist: resultado.insertId,
                id_os,
                status: statusAtual,
                descricao: descricao.trim()
            }
        });
    }catch(erro){
        console.error("Erro ao cadastrar histórico", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao cadastrar histórico"
        });
    }
});

