import {readFile,writeFile,access} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const raiz=resolve(dirname(fileURLToPath(import.meta.url)),'..');
async function criarSeNaoExiste(nome,conteudo){const caminho=resolve(raiz,nome);try{await access(caminho);console.log(nome+': já existe, preservado.')}catch{await writeFile(caminho,conteudo,{mode:0o600});console.log(nome+': criado.')}}
const modelo=await readFile(resolve(raiz,'backend/.env.example'),'utf8');
await criarSeNaoExiste('backend/.env',modelo.replace('JWT_SECRET=','JWT_SECRET='+randomBytes(48).toString('hex')));
await criarSeNaoExiste('frontend/.env.local',await readFile(resolve(raiz,'frontend/.env.local.example'),'utf8'));
await criarSeNaoExiste('.env','MYSQL_ROOT_PASSWORD='+randomBytes(24).toString('hex')+'\nMYSQL_PASSWORD='+randomBytes(24).toString('hex')+'\n');
console.log('Configuração pronta. Importe database/techassistpro.sql e instale as dependências de cada pasta.');
