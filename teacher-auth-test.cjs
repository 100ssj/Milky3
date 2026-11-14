const {PGlite}=require(process.argv[2] || '@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 await db.exec('create role anon;create role authenticated;');
 await db.exec(fs.readFileSync(__dirname+'/supabase-setup.sql','utf8'));
 await db.exec(fs.readFileSync(__dirname+'/teacher-auth.sql','utf8'));
 const pin='0058',day='2026-11-14';
 await db.query("update milky_private.teacher set token_hash=sha256(convert_to($1,'UTF8'))",[pin]);
 await db.exec('set role anon');
 const call=async(fn,args)=>(await db.query(`select public.${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args)).rows[0]?.result;
 const login=()=>call('milky_teacher_login',[pin]);
 const list=token=>db.query('select * from public.milky_teacher($1,$2)',[token,day]);
 await assert.rejects(()=>db.query('select * from milky_private.teacher_sessions'),e=>e.code==='42501');
 await assert.rejects(()=>list(pin),e=>e.code==='42501');
 const first=await login();assert.equal(first.ok,true);assert.match(first.session_key,/^[a-f0-9]{64}$/);
 await list(first.session_key);
 for(let i=1;i<=5;i++) {
  const failure=await call('milky_teacher_login',['9999']);
  assert.equal(failure.ok,false);assert.equal(failure.retry_after,i===5?300:0);
 }
 const blocked=await login();assert.equal(blocked.ok,false);assert.ok(blocked.retry_after>0);
 await list(first.session_key); // Existing sessions still work during login lockout.
 await db.exec("reset role;update milky_private.teacher set blocked_until=now()-interval '1 second';set role anon;");
 const next=await login();assert.equal(next.ok,true);
 await call('milky_teacher_logout',[next.session_key]);
 await assert.rejects(()=>list(next.session_key),e=>e.code==='42501');
 await db.exec("reset role;update milky_private.teacher_sessions set expires_at=now()-interval '1 second';set role anon;");
 await assert.rejects(()=>list(first.session_key),e=>e.code==='42501');
 const rotate=await login();
 await db.exec("reset role;update milky_private.teacher set token_hash=sha256(convert_to('different-code','UTF8'));set role anon;");
 await assert.rejects(()=>list(rotate.session_key),e=>e.code==='42501');
 await db.close();console.log('PASS: leading-zero PIN, server lockout persists, existing session isolation, logout, expiry, rotation revocation and private session table');
})().catch(e=>{console.error(e);process.exitCode=1});
