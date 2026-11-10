import jwt from "jsonwebtoken";

const SEGREDO = process.env.JWT_SECRET;
if(!SEGREDO){
    throw new Error("JWT_SECRET não definido no arquivo .env");
}

const EXPIRACAO = process.env.JWT_EXPIRES_IN || "8h";
const METODOS_DE_LEITURA = ["GET", "HEAD", "OPTIONS"];


export function gerarToken(usuario){
    return jwt.sign(
        {id: usuario.id_usuario, tipo: usuario.tipo_usuario},
        SEGREDO,
        {expiresIn: EXPIRACAO}
    );
}


export function autenticar(req, res, next){
    const cabecalho = req.headers.authorization || "";
    const [esquema, token] = cabecalho.split(" ");

    if(esquema !== "Bearer" || !token){
        return res.status(401).json({
            sucesso:false,
            mensagem: "Token não informado"
        });
    }

    try{
        const payload = jwt.verify(token, SEGREDO);
        req.usuario = {id: payload.id, tipo: payload.tipo};
        next();
    } catch(erro){
        const expirado = erro.name === "TokenExpiredError";
        return res.status(401).json({
            sucesso:false,
            mensagem: expirado ? "Token expirado, faça login novamente" : "Token inválido"
        });
    }
}


export function autorizar(...tiposPermitidos){
    return (req, res, next) => {
        if(!req.usuario){
            return res.status(401).json({
                sucesso:false,
                mensagem: "Não autenticado"
            });
        }
        if(!tiposPermitidos.includes(req.usuario.tipo)){
            return res.status(403).json({
                sucesso:false,
                mensagem: "Você não tem permissão para realizar esta ação"
            });
        }
        next();
    };
}


export function autorizarEscrita(...tiposPermitidos){
    return (req, res, next) => {
        if(METODOS_DE_LEITURA.includes(req.method)){
            return next();
        }
        return autorizar(...tiposPermitidos)(req, res, next);
    };
}