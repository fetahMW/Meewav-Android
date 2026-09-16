import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const root=resolve('.');
const require=createRequire(resolve(root,'tools/messaging-media/package.json'));
const {Client}=require('pg');
const env=Object.fromEntries((await readFile(resolve(root,'../Meewav-Web/.env.local'),'utf8')).split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const url=new URL(env.SUPABASE_DB_URL);url.searchParams.delete('sslmode');
const client=new Client({connectionString:url.href,ssl:{rejectUnauthorized:true,ca:await readFile('tools/messaging-media/supabase-ca.crt','utf8')},connectionTimeoutMillis:15000});

try {
 await client.connect(); await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='3s';SET LOCAL statement_timeout='45s';SET LOCAL search_path=public,extensions,pg_catalog");
 const source=await readFile(process.argv[2],'utf8');
 const results=await client.query(source.replace(/^\s*(begin|commit|rollback);\s*$/gmi,''));
 const lines=(Array.isArray(results)?results:[results]).flatMap(r=>r.rows.flatMap(row=>Object.values(row).filter(v=>typeof v==='string'))).flatMap(v=>v.split('\n'));
 const failures=lines.filter(l=>/^not ok|^#.*(?:failed|planned)/i.test(l));
 const plan=lines.find(l=>/^1\.\.\d+$/.test(l));const passed=lines.filter(l=>/^ok \d+/.test(l)).length;
 if(failures.length||!plan||passed!==Number(plan.slice(3)))throw Error(JSON.stringify({plan,passed,failures}));
 await client.query('ROLLBACK');console.log(JSON.stringify({result:'passed-rolled-back',passed,plan}));
} catch(e){await client.query('ROLLBACK').catch(()=>{});console.error(e.code||e.name,e.message);process.exitCode=1;}finally{await client.end()}
