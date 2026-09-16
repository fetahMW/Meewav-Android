import{readFile,writeFile,mkdir}from'node:fs/promises';
import{createRequire}from'node:module';
import{resolve,basename}from'node:path';
import{createHash}from'node:crypto';
const root=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(root,'tools/messaging-media/package.json'));
const {Client}=require('pg');
const env=Object.fromEntries((await readFile(resolve(root,'../Meewav-Web/.env.local'),'utf8')).split(/\r?\n/).filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1).replace(/^['"]|['"]$/g,'')]}));
const url=new URL(env.SUPABASE_DB_URL);url.searchParams.delete('sslmode');
if(!`${url.hostname}/${url.username}`.includes('dqabekaqpznjsagoxzwc'))throw Error('Unexpected target');
const path=process.argv[2];if(!path||!/^\d{14}_[a-z0-9_]+\.sql$/.test(basename(path)))throw Error('Explicit migration path required');
const source=await readFile(path,'utf8');
const digest=createHash('sha256').update(source).digest('hex');
const apply=process.argv.includes('--apply');
const testIndex=process.argv.indexOf('--test');
if(apply&&testIndex>=0)throw Error('Tests must roll back, never combine with apply');
const testSource=testIndex>=0?await readFile(process.argv[testIndex+1],'utf8'):null;
const version=basename(path).split('_')[0];
if(apply){
 const proof=JSON.parse(await readFile(resolve(root,'app/build/shared-schema',version+'-check.json'),'utf8'));
 if(proof.sha256!==digest||!proof.testSha256||proof.result!=='dry-run-rolled-back')throw Error('This exact migration must pass a rolled-back test before deployment');
}
const sql=source.replace(/^\s*(?:begin|commit);\s*$/gmi,'');
const client=new Client({connectionString:url.href,ssl:{rejectUnauthorized:true,ca:await readFile(resolve(root,'tools/messaging-media/supabase-ca.crt'),'utf8')},connectionTimeoutMillis:15000});
try{
 await client.connect();await client.query('BEGIN');await client.query("SET LOCAL lock_timeout='3s'; SET LOCAL statement_timeout='45s'");
 const exists=await client.query('select version from supabase_migrations.schema_migrations where version=$1',[version]);
 if(exists.rowCount)throw Error('Migration already recorded; do not replay');
 const before=(await client.query('select (select count(*) from auth.users)::int as users,(select count(*) from public.profiles)::int as profiles,(select count(*) from public.messaging_messages_v1)::int as messages')).rows[0];
 await client.query(sql);
 const after=(await client.query('select (select count(*) from auth.users)::int as users,(select count(*) from public.profiles)::int as profiles,(select count(*) from public.messaging_messages_v1)::int as messages')).rows[0];
 if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Unexpected cardinality change');
 if(testSource){
 await client.query('SET LOCAL search_path=public,extensions,pg_catalog');
 const results=await client.query(testSource.replace(/^\s*(?:begin|commit|rollback);\s*$/gmi,''));
 const lines=(Array.isArray(results)?results:[results]).flatMap(r=>r.rows.flatMap(row=>Object.values(row).filter(v=>typeof v==='string'))).flatMap(v=>v.split('\n'));
 const failures=lines.filter(l=>/^not ok|^#.*(?:failed|planned)/i.test(l));
 const plan=lines.find(l=>/^1\.\.\d+$/.test(l));const passed=lines.filter(l=>/^ok \d+/.test(l)).length;
 if(failures.length||(plan&&passed!==Number(plan.slice(3))))throw Error(JSON.stringify({plan,passed,failures,diagnostics:lines.filter(l=>l.startsWith('#'))}));
 if(plan)console.log(JSON.stringify({testsPassed:passed,plan}));
 }
 if(apply){await client.query('insert into supabase_migrations.schema_migrations(version,name,statements) values($1,$2,$3)',[version,basename(path).replace('.sql','').slice(15),[source]]);await client.query("NOTIFY pgrst,'reload schema'");await client.query('COMMIT');}
 else await client.query('ROLLBACK');
 const result={at:new Date().toISOString(),project:'dqabekaqpznjsagoxzwc',migration:basename(path),sha256:digest,testSha256:testSource?createHash('sha256').update(testSource).digest('hex'):null,result:apply?'applied':'dry-run-rolled-back',cardinalityUnchanged:true};
 await mkdir(resolve(root,'app/build/shared-schema'),{recursive:true});await writeFile(resolve(root,'app/build/shared-schema',version+(apply?'-applied':'-check')+'.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
}catch(error){await client.query('ROLLBACK').catch(()=>{});console.error('Schema operation failed:',error.code||error.name,error.message?.replace(/postgres(?:ql)?:\/\/\S+/g,'[connection]'));process.exitCode=1;}finally{await client.end()}
