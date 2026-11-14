const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function screen(responses) {
 const nodes=new Map(),calls=[];
 const $=id=>{if(!nodes.has(id))nodes.set(id,{value:'',innerHTML:'',textContent:'',hidden:true,disabled:false,focus(){},querySelector(){return $('submit')}});return nodes.get(id)};
 const context={window:{ClassroomAPI:{ready:true,rpc:async(name,data)=>{calls.push({name,data});const result=responses.shift();if(result instanceof Error)throw result;return result}}},document:{getElementById:$,addEventListener(){}},Intl,Date,setInterval(){return 1},clearInterval(){}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/teacher.js','utf8'),context);
 return {$,calls,submit:()=>$('login-form').onsubmit({preventDefault(){},currentTarget:$('login-form')})};
}
(async()=>{
 const token='a'.repeat(64),ui=screen([{ok:true,session_key:token},[],null]);
 ui.$('teacher-key').value='0058';await ui.submit();
 assert.equal(ui.calls[0].data.p_code,'0058','leading zero preserved');
 assert.equal(ui.calls[1].data.p_key,token,'data reads use session rather than PIN');
 assert.equal(ui.$('teacher-key').value,'');assert.equal(ui.$('dashboard').hidden,false);
 ui.$('logout').onclick();assert.equal(ui.calls[2].name,'milky_teacher_logout');assert.equal(ui.$('dashboard').hidden,true);
 const blocked=screen([{ok:false,retry_after:300}]);blocked.$('teacher-key').value='0058';await blocked.submit();
 assert.match(blocked.$('login-error').textContent,/5분/);assert.equal(blocked.calls.length,1);
 const wrong=screen([{ok:false,retry_after:0}]);wrong.$('teacher-key').value='9999';await wrong.submit();assert.match(wrong.$('login-error').textContent,/맞지/);
 const old=screen([Object.assign(new Error('not installed'),{status:404}),[]]);old.$('teacher-key').value=token;await old.submit();assert.equal(old.$('dashboard').hidden,false);
 console.log('PASS: PIN form, leading zero, session-only polling, logout, lockout message and safe migration fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
