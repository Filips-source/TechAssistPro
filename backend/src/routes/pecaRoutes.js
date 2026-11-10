import express from 'express';
import {pool} from '../config/database.js';

export const pecaRoutes = express.Router();

const STATUS_VALIDOS = ['Disponivel', 'Esgotada', 'Inativa'];

function valorValido(valor){
    if(valor === undefined || valor === null || valor === "") return 0;
    const numero = Number(valor);
    if(Number.isNaN(numero) || numero < 0) return null;
    return Math.round(numero * 100) / 100;
}


function quantidadeValida(valor){
    if(valor === undefined || valor === null || valor === "") return 0;
    const numero = Number(valor);
    if(!Number.isInteger(numero) || numero < 0) return null;
    return numero;
}


function calcularStatus(status, quantidade){
    if(status === "Inativa") return "Inativa";
    return quantidade > 0 ? "Disponivel" : "Esgotada";
}

pecaRoutes.get("/", async (req, res) => {
    try{
        const {status, nome} = req.query;
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
        if(nome){
            condicoes.push("nome like ?");
            parametros.push(`%${nome}%`);
        }

        const where = condicoes.length ? `where ${condicoes.join(" and ")}` : "";

        const [pecas] = await pool.query(
            `select * from pecas
            ${where}
            order by id_peca desc`, parametros
        );
        return res.status(200).json({
            sucesso:true,
            total: pecas.length,
            dados: pecas
        });
    } catch (erro){
        console.error("Erro ao listar peças", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao buscar."
        });
    }
});

pecaRoutes.get("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }

        const [pecas] = await pool.query(
            `select * from pecas where id_peca = ?`, [id]
        );

        if(pecas.length === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Peça não encontrada"
            });
        }
        return res.status(200).json({
            sucesso:true,
            dados: pecas[0]
        });

    }catch(erro){
        console.error(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao buscar peça"
        });
    }
});

pecaRoutes.post("/", async(req, res) =>{
    try{
        const {nome, descricao, quantidade, valor, status} = req.body;

        if(!nome || !nome.trim()){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Nome é obrigatório"
            });
        }
        if(nome.trim().length > 50){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Nome deve ter no máximo 50 caracteres"
            });
        }

        const quantidadeFinal = quantidadeValida(quantidade);
        if(quantidadeFinal === null){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Quantidade deve ser um número inteiro maior ou igual a zero"
            });
        }

        const valorFinal = valorValido(valor);
        if(valorFinal === null){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Valor deve ser um número maior ou igual a zero"
            });
        }

        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }

        const statusFinal = calcularStatus(status, quantidadeFinal);

        const [resultado] = await pool.query(
            `insert into pecas(nome, descricao, quantidade, valor, status)
            values(?, ?, ?, ?, ?)`,
            [nome.trim(), descricao || null, quantidadeFinal, valorFinal, statusFinal]
        );

        return res.status(201).json({
            sucesso:true,
            mensagem: "Peça adicionada com sucesso",
            dados: {
                id_peca: resultado.insertId,
                nome: nome.trim(),
                descricao: descricao || null,
                quantidade: quantidadeFinal,
                valor: valorFinal,
                status: statusFinal
            }
        });

    }catch(erro){
        console.error("Erro ao cadastrar peça", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao cadastrar peça"
        });
    }
});

pecaRoutes.put("/:id", async (req, res)=>{
    try{
        const {id} = req.params;
        const {nome, descricao, quantidade, valor, status} = req.body;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        if(!nome || !nome.trim()){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Nome é obrigatório"
            });
        }
        if(nome.trim().length > 50){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Nome deve ter no máximo 50 caracteres"
            });
        }

        const quantidadeFinal = quantidadeValida(quantidade);
        if(quantidadeFinal === null){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Quantidade deve ser um número inteiro maior ou igual a zero"
            });
        }

        const valorFinal = valorValido(valor);
        if(valorFinal === null){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Valor deve ser um número maior ou igual a zero"
            });
        }

        if(status && !STATUS_VALIDOS.includes(status)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Status inválido"
            });
        }

        const statusFinal = calcularStatus(status, quantidadeFinal);

        const [resultado] = await pool.query(
            `update pecas
            set nome = ?, descricao = ?, quantidade = ?, valor = ?, status = ?
            where id_peca = ?`,
            [nome.trim(), descricao || null, quantidadeFinal, valorFinal, statusFinal, id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Peça não encontrada"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Peça alterada com sucesso!"
        });
    }catch(erro){
        console.log(erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: "Erro ao alterar peça"
        });
    }
});


pecaRoutes.patch("/:id/estoque", async (req, res)=>{
    const conexao = await pool.getConnection();
    try{
        const {id} = req.params;
        const {quantidade, adicionar} = req.body;

        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        if((quantidade === undefined) === (adicionar === undefined)){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Informe 'quantidade' (novo valor) ou 'adicionar' (valor a somar), apenas um deles"
            });
        }

        await conexao.beginTransaction();

        const [pecas] = await conexao.query(
            `select quantidade, status from pecas where id_peca = ? for update`, [id]
        );
        if(pecas.length === 0){
            await conexao.rollback();
            return res.status(404).json({
                sucesso:false,
                mensagem: "Peça não encontrada"
            });
        }

        const novaQuantidade = quantidade !== undefined
            ? Number(quantidade)
            : pecas[0].quantidade + Number(adicionar);

        if(!Number.isInteger(novaQuantidade) || novaQuantidade < 0){
            await conexao.rollback();
            return res.status(400).json({
                sucesso:false,
                mensagem: "O estoque resultante deve ser um número inteiro maior ou igual a zero"
            });
        }

        const novoStatus = calcularStatus(pecas[0].status, novaQuantidade);

        await conexao.query(
            `update pecas set quantidade = ?, status = ? where id_peca = ?`,
            [novaQuantidade, novoStatus, id]
        );

        await conexao.commit();

        return res.status(200).json({
            sucesso:true,
            mensagem: "Estoque atualizado com sucesso!",
            dados: {quantidade: novaQuantidade, status: novoStatus}
        });
    }catch(erro){
        await conexao.rollback();
        console.log(erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao atualizar estoque"
        });
    } finally {
        conexao.release();
    }
});

pecaRoutes.delete("/:id", async(req, res)=>{
    try{
        const {id} = req.params;
        if(!Number.isInteger(Number(id)) || Number(id) <= 0){
            return res.status(400).json({
                sucesso:false,
                mensagem: "ID inválido"
            });
        }
        const [resultado] = await pool.query(
            `delete from pecas
            where id_peca = ?`, [id]
        );
        if(resultado.affectedRows === 0){
            return res.status(404).json({
                sucesso:false,
                mensagem: "Peça não encontrada"
            });
        }
        return res.status(200).json({
            sucesso:true,
            mensagem: "Peça excluida com sucesso!"
        });
    } catch(erro){
        console.log(erro);
        if(erro.code === "ER_ROW_IS_REFERENCED_2"){
            return res.status(409).json({
                sucesso:false,
                mensagem: "Não é possivel excluir essa peça pois ela foi utilizada em uma ordem de serviço. Marque-a como Inativa."
            });
        }
        return res.status(500).json({
            sucesso:false,
            mensagem:"Erro ao excluir a peça"
        });
    }
});