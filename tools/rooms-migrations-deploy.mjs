// Déploie les migrations manquantes validées par le dry-run.
// Chaque fichier garde son contrôle transactionnel interne (begin/commit).
// En cas d'échec : skip + rapport (le dry-run a prouvé que les suivants passent).
import {readFile,readdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const root=process.cwd();
const require=createRequire(resolve(root,'tools/messaging-media/package.json'));
const {Client}=require('pg');
const env=Object.fromEntries((await readFile(resolve(root,'../Meewav-Web/.env.local'),'utf8')).split(/\r?\n/)
  .filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1).replace(/^['"]|['"]$/g,'')];}));
const db=new URL(env.SUPABASE_DB_URL);
if(!`${db.hostname}/${db.username}`.includes('dqabekaqpznjsagoxzwc')) throw Error('Unexpected deployment target');
db.searchParams.delete('sslmode');
const client=new Client({connectionString:db.href,ssl:{rejectUnauthorized:true,
  ca:await readFile(resolve(root,'tools/messaging-media/supabase-ca.crt'),'utf8')},connectionTimeoutMillis:15000});

const MIGRATIONS_DIR=resolve(root,'../Meewav-Web-supabase-wiring/supabase/migrations');
// Fichiers qui ont échoué au dry-run — on ne les tente pas.
const SKIP=new Set(process.argv.slice(2)); // noms de fichiers à sauter

await client.connect();
const {rows:dep}=await client.query('select version from supabase_migrations.schema_migrations');
const deployed=new Set(dep.map(r=>r.version));
const missing=(await readdir(MIGRATIONS_DIR)).filter(f=>f.endsWith('.sql')&&!deployed.has(f.split('_')[0])&&!SKIP.has(f)).sort();
console.log(`Déploiement de ${missing.length} migrations (skip: ${SKIP.size})\n`);

let applied=0,failed=[];
for(const f of missing){
  const version=f.split('_')[0];
  const sql=await readFile(resolve(MIGRATIONS_DIR,f),'utf8');
  try {
    await client.query(sql);
    await client.query('insert into supabase_migrations.schema_migrations(version,name) values($1,$2) on conflict (version) do nothing',[version,f.replace(/\.sql$/,'')]);
    applied++;
    console.log(`OK    ${f}`);
  } catch(e){
    failed.push({f,err:e.message.split('\n')[0].slice(0,120)});
    console.log(`FAIL  ${f}  ->  ${e.message.split('\n')[0].slice(0,110)}`);
  }
}
await client.end();
console.log(`\n=== ${applied}/${missing.length} déployées ===`);
if(failed.length) console.log('Échecs:',failed.map(x=>`${x.f} (${x.err})`).join('\n  '));
process.exitCode=failed.length?1:0;
