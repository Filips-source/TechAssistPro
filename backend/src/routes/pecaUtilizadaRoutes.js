import express from 'express';
import {pool} from '../config/database.js';

export const pecaUtilizadaRoutes = express.Router();

const STATUS_VALIDOS = ['Reservada', 'Utilizada', 'Devolvida'];
const STATUS_OS_FECHADA = ['Entregue', 'Cancelado'];

class ErroNegocio extends Error {
    constructor(status, mensagem){
        super(mensagem);
        this.status = status;
    }
}

function consumo(status, quantidade){
    return status === "Devolvida" ? 0 : quantidade;
}

async function ajustarEstoque(conexao, id_peca, diferenca){
    const [pecas] = await conexao.query(
        `select quantidade, status from pecas where id_peca = ? for update`, [id_peca]
    );
    if(pecas.length === 0){
        throw new ErroNegocio(400, "Peça não encontrada");
    }
    const peca = pecas[0];

    if(diferenca === 0) return;

    if(diferenca > 0){
        if(peca.status === "Inativa"){
            throw new ErroNegocio(409, "Essa peça está inativa");
        }
        if(peca.quantidade < diferenca){
            throw new ErroNegocio(409, `Estoque insuficiente. Disponível: ${peca.quantidade}`);
        }
    }

    const novaQuantidade = peca.quantidade - diferenca;
    const novoStatus = peca.status === "Inativa"
        ? "Inativa"
        : (novaQuantidade > 0 ? "Disponivel" : "Esgotada");

    await conexao.query(
        `update pecas set quantidade = ?, status = ? where id_peca = ?`,
        [novaQuantidade, novoStatus, id_peca]
    );
}


async function atualizarItem(conexao, id, novaQuantidade, novoStatus){
    const [itens] = await conexao.query(
        `select * from pecas_utilizadas where id_pecas_util = ? for update`, [id]
    );
    if(itens.length === 0){
        throw new ErroNegocio(404, "Registro não encontrado");
    }
    const item = itens[0];

    const quantidade = novaQuantidade ?? item.quantidade;
    const status = novoStatus ?? item.status;

    const diferenca = consumo(status, quantidade) - consumo(item.status, item.quantidade);
    await ajustarEstoque(conexao, item.id_peca, diferenca);

    await conexao.query(
        `update pecas_utilizadas set quantidade = ?, status = ? where id_pecas_util = ?`,
        [quantidade, status, id]
    );
}

function responderErro(res, erro, mensagemPadrao){
    if(erro instanceof ErroNegocio){
        return res.status(erro.status).json({
            sucesso:false,
            mensagem: erro.message
        });
    }
    console.error(erro);
    return res.status(500).json({
        sucesso:false,
        mensagem: mensagemPadrao
    });
}

const SELECT_COMPLETO = `
    select pu.*,
        p.nome as peca_nome,
        p.valor as valor_unitario,
        (p.valor * pu.quantidade) as subtotal,
        os.rastreio
    from pecas_utilizadas pu
    join pecas p on p.id_peca = pu.id_peca
    join ordens_servicos os on os.id_os = pu.id_os`;

pecaUtilizadaRoutes.get("/", async (req, res) => {
    try{
        const {id_os, id_peca, status} = req.query;
        const condicoes = [];
        const parametros = [];

        if(id_os){
            if(!Number.isInteger(Number(id_os)) || Number(id_os) <= 0){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "id_os inválido"
                });
            }
            condicoes.push("pu.id_os = ?");
            parametros.push(id_os);
        }
        if(id_peca){
            if(!Number.isInteger(Number(id_peca)) || Number(id_peca) <= 0){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "id_peca inválido"
                });
            }
            condicoes.push("pu.id_peca = ?");
            parametros.push(id_peca);
        }
        if(status){
            if(!STATUS_VALIDOS.includes(status)){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "Status inválido"
                });
            }
            condicoes.push("pu.status = ?");
            parametros.push(status);
        }

        const where = condicoes.length ? `where ${condicoes.join(" and ")}` : "";

        const [itens] = await pool.query(
            `${SELECT_COMPLETO}
            ${where}
            order by pu.id_pecas_util desc`, parametros
        );

        const totalPecas = itens
            .filter(item => item.status !== "Devolvida")
            .reduce((soma, item) => soma + Number(item.subtotal), 0);

        return res.status(200).json({
            sucesso:true,
            total: itens.length,
            total_pecas: Math.round(totalPecas * 100) / 100,
            dados: itens
        });
    } catch (erro){
        console.error("Erro ao listar peças utilizadas", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao buscar."
        });
    }
});

pecaUtilizadaRoutes.get("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }

        const [itens] = await pool.query(
            `${SELECT_COMPLETO} where pu.id_pecas_util = ?`, [id]
        );

        if(itens.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Registro não encontrado"
            });
        }
        return res.status(200).json({
            sucesso:true,
            dados: itens[0]
        });

    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao buscar registro"
        });
    }
});

pecaUtilizadaRoutes.post("/", async(req, res) =>{
    const conexao = await pool.getConnection();
    try{
        const {id_os, id_peca, quantidade, status} = req.body;

        if(!Number.isInteger(Number(id_os)) || Number(id_os) <= 0 ||
           !Number.isInteger(Number(id_peca)) || Number(id_peca) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Os ids da ordem de serviço e da peça são obrigatórios"
            });
        }
        if(!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Quantidade deve ser um número inteiro maior que zero"
            });
        }
        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }

        const quantidadeFinal = Number(quantidade);
        const statusFinal = status || "Reservada";

        await conexao.beginTransaction();

        const [ordens] = await conexao.query(
            `select status from ordens_servicos where id_os = ?`, [id_os]
        );
        if(ordens.length === 0){
            throw new ErroNegocio(400, "Ordem de serviço não encontrada");
        }
        if(STATUS_OS_FECHADA.includes(ordens[0].status)){
            throw new ErroNegocio(409, `Não é possível adicionar peças a uma OS ${ordens[0].status.toLowerCase()}`);
        }

        await ajustarEstoque(conexao, id_peca, consumo(statusFinal, quantidadeFinal));

        const [resultado] = await conexao.query(
            `insert into pecas_utilizadas(id_os, id_peca, quantidade, status)
            values(?, ?, ?, ?)`,
            [id_os, id_peca, quantidadeFinal, statusFinal]
        );

        await conexao.commit();

        return res.status(201).json({
            sucesso:true,
            mensagem: "Peça adicionada à ordem de serviço com sucesso",
            dados: {
                id_pecas_util: resultado.insertId,
                id_os,
                id_peca,
                quantidade: quantidadeFinal,
                status: statusFinal
            }
        });

    }catch(erro){
        await conexao.rollback();
        return responderErro(res, erro, "Erro ao cadastrar peça utilizada");
    } finally {
        conexao.release();
    }
});

pecaUtilizadaRoutes.put("/:id", async (req, res)=>{
    const conexao = await pool.getConnection();
    try{
        const {id} = req.params;
        const {quantidade, status} = req.body;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        if(quantidade === undefined && status === undefined){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Informe a quantidade e/ou o status"
            });
        }
        if(quantidade !== undefined && (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Quantidade deve ser um número inteiro maior que zero"
            });
        }
        if(status !== undefined && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }

        await conexao.beginTransaction();
        await atualizarItem(
            conexao,
            id,
            quantidade !== undefined ? Number(quantidade) : undefined,
            status
        );
        await conexao.commit();

        return res.status(200).json({
            sucesso:true,
            mensagem: "Registro alterado com sucesso!"
        });
    }catch(erro){
        await conexao.rollback();
        return responderErro(res, erro, "Erro ao alterar registro");
    } finally {
        conexao.release();
    }
});

pecaUtilizadaRoutes.patch("/:id/status", async (req, res)=>{
    const conexao = await pool.getConnection();
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

        await conexao.beginTransaction();
        await atualizarItem(conexao, id, undefined, status);
        await conexao.commit();

        return res.status(200).json({
            sucesso:true,
            mensagem: "Status atualizado com sucesso!"
        });
    }catch(erro){
        await conexao.rollback();
        return responderErro(res, erro, "Erro ao atualizar status");
    } finally {
        conexao.release();
    }
});

pecaUtilizadaRoutes.delete("/:id", async(req, res)=>{
    const conexao = await pool.getConnection();
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }

        await conexao.beginTransaction();

        const [itens] = await conexao.query(
            `select * from pecas_utilizadas where id_pecas_util = ? for update`, [id]
        );
        if(itens.length === 0){
            throw new ErroNegocio(404, "Registro não encontrado");
        }
        const item = itens[0];

        await ajustarEstoque(conexao, item.id_peca, -consumo(item.status, item.quantidade));

        await conexao.query(
            `delete from pecas_utilizadas where id_pecas_util = ?`, [id]
        );

        await conexao.commit();

        return res.status(200).json({
            sucesso:true,
            mensagem: "Registro excluido com sucesso!"
        });
    } catch(erro){
        await conexao.rollback();
        return responderErro(res, erro, "Erro ao excluir o registro");
    } finally {
        conexao.release();
    }
});