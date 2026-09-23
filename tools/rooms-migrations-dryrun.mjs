// Dry-run des migrations non déployées — appliquées dans l'ordre dans UNE
// transaction annulée (rollback final). Zéro écriture persistante.
// Détecte les conflits "already exists" et les erreurs de dépendance.
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
// Neutralise le contrôle transactionnel interne aux fichiers (notre tx globale gère).
// IMPORTANT : supprimer, pas commenter — Supavisor détecte 'commit' même en commentaire
// et terminerait la transaction côté serveur.
const sanitize=sql=>sql
  .replace(/^\s*(begin|start\s+transaction)\s*;/gim,'')
  .replace(/^\s*(commit|rollback)(\s+work|\s+transaction)?\s*;/gim,'')
  .replace(/create\s+(unique\s+)?index\s+concurrently/gi,m=>m.replace(/concurrently/i,''));

await client.connect();
const {rows:dep}=await client.query('select version from supabase_migrations.schema_migrations');
const deployed=new Set(dep.map(r=>r.version));
const missing=(await readdir(MIGRATIONS_DIR)).filter(f=>f.endsWith('.sql')&&!deployed.has(f.split('_')[0])).sort();
console.log(`Dry-run de ${missing.length} migrations non déployées (rollback final)\n`);

let applied=0,failed=[];
await client.query('begin');
for(const f of missing){
  const sql=sanitize(await readFile(resolve(MIGRATIONS_DIR,f),'utf8'));
  const sp='m'+f.split('_')[0];
  try {
    await client.query(`savepoint ${sp}`);
    await client.query(sql);
    await client.query(`release savepoint ${sp}`);
    applied++;
    console.log(`OK    ${f}`);
  } catch(e){
    await client.query(`rollback to savepoint ${sp}`).catch(()=>{});
    failed.push({f,err:e.message.split('\n')[0].slice(0,120)});
    console.log(`FAIL  ${f}  ->  ${e.message.split('\n')[0].slice(0,110)}`);
  }
}
await client.query('rollback');
await client.end();
console.log(`\n=== ${applied}/${missing.length} migrations s'appliqueraient proprement ===`);
if(failed.length) console.log('Échecs:',failed.map(x=>x.f).join(', '));
