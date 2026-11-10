import express from 'express';
import {pool} from '../config/database.js';

export const ordemServicoRoutes = express.Router();

const STATUS_VALIDOS = [
    'Recebido', 'Em diagnostico', 'Aguardando aprovacao', 'Aguardando peca',
    'Em reparo', 'Em testes', 'Pronto para retirada', 'Entregue',
    'Cancelado', 'Produto Armazenado'
];

function dataValida(valor){
    if(valor === undefined || valor === null || valor === "") return null;
    if(typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return undefined;
    return Number.isNaN(new Date(valor).getTime()) ? undefined : valor;
}

function dataHoraValida(valor){
    if(valor === undefined || valor === null || valor === "") return null;
    const data = new Date(valor);
    if(Number.isNaN(data.getTime())) return undefined;
    return data.toISOString().slice(0, 19).replace("T", " ");
}

function valorValido(valor){
    if(valor === undefined || valor === null || valor === "") return 0;
    const numero = Number(valor);
    if(Number.isNaN(numero) || numero < 0) return null;
    return Math.round(numero * 100) / 100;
}

const SELECT_COMPLETO = `
    select os.*,
        e.nome as equipamento_nome,
        e.tipo as equipamento_tipo,
        c.id_cliente,
        c.nome as cliente_nome,
        u.nome as tecnico_nome
    from ordens_servicos os
    join equipamentos e on e.id_equipamento = os.id_equipamento
    join clientes c on c.id_cliente = e.id_cliente
    left join usuarios u on u.id_usuario = os.id_usuario`;

ordemServicoRoutes.get("/", async (req, res) => {
    try{
        const {status, id_equipamento, id_usuario, rastreio} = req.query;
        const condicoes = [];
        const parametros = [];

        if(status){
            if(!STATUS_VALIDOS.includes(status)){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "Status inválido"
                });
            }
            condicoes.push("os.status = ?");
            parametros.push(status);
        }
        if(id_equipamento){
            if(!Number.isInteger(Number(id_equipamento)) || Number(id_equipamento) <= 0){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "id_equipamento inválido"
                });
            }
            condicoes.push("os.id_equipamento = ?");
            parametros.push(id_equipamento);
        }
        if(id_usuario){
            if(!Number.isInteger(Number(id_usuario)) || Number(id_usuario) <= 0){
                return res.status(400).json({
                    sucesso:false,
                    mensagem: "id_usuario inválido"
                });
            }
            condicoes.push("os.id_usuario = ?");
            parametros.push(id_usuario);
        }
        if(rastreio){
            condicoes.push("os.rastreio = ?");
            parametros.push(rastreio);
        }

        const where = condicoes.length ? `where ${condicoes.join(" and ")}` : "";

        const [ordens] = await pool.query(
            `${SELECT_COMPLETO}
            ${where}
            order by os.id_os desc`, parametros
        );
        return res.status(200).json({
            sucesso:true,
            total: ordens.length,
            dados: ordens
        });
    } catch (erro){
        console.error("Erro ao listar ordens de serviço", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao buscar."
        });
    }
});

ordemServicoRoutes.get("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }

        const [ordens] = await pool.query(
            `${SELECT_COMPLETO} where os.id_os = ?`, [id]
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
            order by data_atualizacao asc, id_hist asc`, [id]
        );

        return res.status(200).json({
            sucesso:true,
            dados: {...ordens[0], historico}
        });

    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao buscar ordem de serviço"
        });
    }
});

ordemServicoRoutes.post("/", async(req, res) =>{
    const conexao = await pool.getConnection();
    try{
        const {id_equipamento, id_usuario, status, diagnostico, prazo, data_manutencao, valor} = req.body;

        if(!Number.isInteger(Number(id_equipamento)) || Number(id_equipamento) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "O id do equipamento é obrigatório"
            });
        }
        if(id_usuario && (!Number.isInteger(Number(id_usuario)) || Number(id_usuario) <= 0)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "id_usuario inválido"
            });
        }
        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }

        const prazoFinal = dataValida(prazo);
        const manutencaoFinal = dataValida(data_manutencao);
        if(prazoFinal === undefined || manutencaoFinal === undefined){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Datas devem estar no formato AAAA-MM-DD"
            });
        }

        const valorFinal = valorValido(valor);
        if(valorFinal === null){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Valor deve ser um número maior ou igual a zero"
            });
        }

        const [equipamentos] = await pool.query(
            `select id_equipamento from equipamentos
            where id_equipamento = ?`, [id_equipamento]
        );
        if(equipamentos.length === 0){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Equipamento não encontrado"
            });
        }

        if(id_usuario){
            const [usuarios] = await pool.query(
                `select id_usuario from usuarios
                where id_usuario = ? and status = 'Ativo'`, [id_usuario]
            );
            if(usuarios.length === 0){
                return res.status(400).json({
                    sucesso:false,
                    mensagem:"Usuário não encontrado ou inativo"
                });
            }
        }

        const statusFinal = status || "Recebido";

        await conexao.beginTransaction();

        const [resultado] = await conexao.query(
            `insert into ordens_servicos(id_equipamento, id_usuario, status, diagnostico, prazo, data_manutencao, valor)
            values(?, ?, ?, ?, ?, ?, ?)`,
            [id_equipamento, id_usuario || null, statusFinal, diagnostico || null, prazoFinal, manutencaoFinal, valorFinal]
        );

        const rastreio = `OS-${new Date().getFullYear()}-${String(resultado.insertId).padStart(3, "0")}`;
        await conexao.query(
            `update ordens_servicos set rastreio = ? where id_os = ?`,
            [rastreio, resultado.insertId]
        );

        await conexao.query(
            `insert into historico_servicos(id_os, status, descricao)
            values(?, ?, ?)`,
            [resultado.insertId, statusFinal, "Ordem de serviço criada"]
        );

        await conexao.commit();

        return res.status(201).json({
            sucesso:true,
            mensagem: "Ordem de serviço adicionada com sucesso",
            dados: {
                id_os: resultado.insertId,
                id_equipamento,
                id_usuario: id_usuario || null,
                rastreio,
                status: statusFinal,
                diagnostico: diagnostico || null,
                prazo: prazoFinal,
                data_manutencao: manutencaoFinal,
                valor: valorFinal
            }
        });

    }catch(erro){
        await conexao.rollback();
        console.error("Erro ao cadastrar ordem de serviço", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao cadastrar ordem de serviço"
        });
    } finally {
        conexao.release();
    }
});

ordemServicoRoutes.put("/:id", async (req, res)=>{
    const conexao = await pool.getConnection();
    try{
        const {id} = req.params;
        const {id_equipamento, id_usuario, status, diagnostico, prazo, data_manutencao, data_entrega, valor, descricao_historico} = req.body;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        if(!Number.isInteger(Number(id_equipamento)) || Number(id_equipamento) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "O id do equipamento é obrigatório"
            });
        }
        if(id_usuario && (!Number.isInteger(Number(id_usuario)) || Number(id_usuario) <= 0)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "id_usuario inválido"
            });
        }
        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }

        const prazoFinal = dataValida(prazo);
        const manutencaoFinal = dataValida(data_manutencao);
        let entregaFinal = dataHoraValida(data_entrega);
        if(prazoFinal === undefined || manutencaoFinal === undefined || entregaFinal === undefined){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Datas inválidas (use AAAA-MM-DD; a data de entrega aceita data e hora)"
            });
        }

        const valorFinal = valorValido(valor);
        if(valorFinal === null){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Valor deve ser um número maior ou igual a zero"
            });
        }

        const [atual] = await pool.query(
            `select status, data_entrega from ordens_servicos where id_os = ?`, [id]
        );
        if(atual.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Ordem de serviço não encontrada"
            });
        }

        const [equipamentos] = await pool.query(
            `select id_equipamento from equipamentos
            where id_equipamento = ?`, [id_equipamento]
        );
        if(equipamentos.length === 0){
            return res.status(400).json({
                sucesso:false,
                mensagem:"Equipamento não encontrado"
            });
        }

        if(id_usuario){
            const [usuarios] = await pool.query(
                `select id_usuario from usuarios
                where id_usuario = ? and status = 'Ativo'`, [id_usuario]
            );
            if(usuarios.length === 0){
                return res.status(400).json({
                    sucesso:false,
                    mensagem:"Usuário não encontrado ou inativo"
                });
            }
        }

        const statusFinal = status || atual[0].status;
        const mudouStatus = statusFinal !== atual[0].status;
        if(statusFinal === "Entregue" && !entregaFinal){
            entregaFinal = atual[0].data_entrega
                ? new Date(atual[0].data_entrega).toISOString().slice(0, 19).replace("T", " ")
                : new Date().toISOString().slice(0, 19).replace("T", " ");
        }

        await conexao.beginTransaction();

        await conexao.query(
            `update ordens_servicos
            set id_equipamento = ?, id_usuario = ?, status = ?, diagnostico = ?,
                prazo = ?, data_manutencao = ?, data_entrega = ?, valor = ?
            where id_os = ?`,
            [id_equipamento, id_usuario || null, statusFinal, diagnostico || null,
             prazoFinal, manutencaoFinal, entregaFinal, valorFinal, id]
        );

        if(mudouStatus){
            await conexao.query(
                `insert into historico_servicos(id_os, status, descricao)
                values(?, ?, ?)`,
                [id, statusFinal, descricao_historico || `Status alterado para ${statusFinal}`]
            );
        }

        await conexao.commit();

        return res.status(200).json({
            sucesso:true,
            mensagem: "Ordem de serviço alterada com sucesso!"
        });
    }catch(erro){
        await conexao.rollback();
        console.log(erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar ordem de serviço"
        });
    } finally {
        conexao.release();
    }
});

ordemServicoRoutes.patch("/:id/status", async (req, res)=>{
    const conexao = await pool.getConnection();
    try{
        const {id} = req.params;
        const {status, descricao} = req.body;

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

        const [atual] = await pool.query(
            `select status from ordens_servicos where id_os = ?`, [id]
        );
        if(atual.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Ordem de serviço não encontrada"
            });
        }
        if(atual[0].status === status){
            return res.status(200).json({
                sucesso:true,
                mensagem: "A ordem de serviço já está com esse status"
            });
        }

        await conexao.beginTransaction();

        if(status === "Entregue"){
            await conexao.query(
                `update ordens_servicos set status = ?, data_entrega = now()
                where id_os = ?`, [status, id]
            );
        } else {
            await conexao.query(
                `update ordens_servicos set status = ?
                where id_os = ?`, [status, id]
            );
        }

        await conexao.query(
            `insert into historico_servicos(id_os, status, descricao)
            values(?, ?, ?)`,
            [id, status, descricao || `Status alterado para ${status}`]
        );

        await conexao.commit();

        return res.status(200).json({
            sucesso:true,
            mensagem: "Status da ordem de serviço atualizado com sucesso!"
        });
    }catch(erro){
        await conexao.rollback();
        console.log(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao atualizar status da ordem de serviço"
        });
    } finally {
        conexao.release();
    }
});

ordemServicoRoutes.delete("/:id", async(req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        const [resultado] = await pool.query(
            `delete from ordens_servicos
            where id_os = ?`, [id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Ordem de serviço não encontrada"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Ordem de serviço excluida com sucesso!"
        });
    } catch(erro){
        console.log(erro);
        if(erro.code === "ER_ROW_IS_REFERENCED_2"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Não é possivel excluir essa ordem de serviço pois ela possui orçamento, peças ou histórico vinculados"
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao excluir a ordem de serviço"
        });
    }
});