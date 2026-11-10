import express from 'express';
import bcrypt from "bcrypt";
import {pool} from '../config/database.js';
import {autenticar, gerarToken} from '../middlewares/authMiddleware.js';

export const authRoutes = express.Router();

authRoutes.post("/login", async (req, res) => {
    try{
        const {email, senha} = req.body;

        if(!email || typeof email !== "string" || !senha || typeof senha !== "string"){
            return res.status(400).json({
                sucesso:false,
                mensagem: "Email e senha são obrigatórios"
            });
        }

        const [usuarios] = await pool.query(
            `select id_usuario, nome, email, senha_hash, tipo_usuario, status
            from usuarios
            where email = ?`, [email.trim()]
        );
        const usuario = usuarios[0];


        const senhaConfere = usuario?.senha_hash
            ? await bcrypt.compare(senha, usuario.senha_hash)
            : false;

        if(!usuario || !senhaConfere){
            return res.status(401).json({
                sucesso:false,
                mensagem: "Email ou senha inválidos"
            });
        }

        if(usuario.status !== "Ativo"){
            return res.status(403).json({
                sucesso:false,
                mensagem: "Usuário inativo. Procure o administrador."
            });
        }

        const token = gerarToken(usuario);

        return res.status(200).json({
            sucesso:true,
            mensagem: "Login realizado com sucesso",
            token,
            usuario: {
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email,
                tipo_usuario: usuario.tipo_usuario
            }
        });
    } catch(erro){
        console.error("Erro no login", erro);
        return res.status(500).json({
            sucesso:false,
            mensagem: "Erro ao realizar login"
        });
    }
});


authRoutes.get("/me", autenticar, async (req, res) => {
    try{
        const [usuarios] = await pool.query(
            `select id_usuario, nome, email, telefone, imagem, especialidade, tipo_usuario, status
            from usuarios
            where id_usuario = ?`, [req.usuario.id]
        );

        if(usuarios.length === 0 || usuarios[0].status !== "Ativo"){
            return res.status(401).json({
                sucesso:false,
                mensagem: "Sessão inválida"
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
            mensagem: "Erro ao buscar usuário logado"
        });
    }
});