const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto').webcrypto;
function game(storage=new Map()) {
 const nodes=new Map(), calls=[];let created=0,failStart=false,failUpdate=false;
 function element(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',value:'',textContent:'',hidden:true,disabled:false,open:false,style:{},listeners:{},
 appendChild(){},insertAdjacentHTML(){},setAttribute(){},focus(){},click(){return this.onclick?.()},
 addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);if(k==='click')this.onclick=fn},querySelector(){return element('child')},
 querySelectorAll(sel){return id==='guide'&&sel==='p'?[element('p1'),element('p2'),element('p3')]:[]},
 getContext(){return new Proxy({},{get:(o,k)=>o[k]||(()=>{})})},showModal(){this.open=true},close(){this.open=false;(this.listeners.close||[]).forEach(f=>f())}});return nodes.get(id)}
 const context=vm.createContext({console,crypto,Set,Map,URL,AbortController,Uint8Array,
 document:{getElementById:element,querySelector:element,createElement:k=>element(k+created++),addEventListener(){},body:{appendChild(){},classList:{add(){},remove(){}}}},
 innerWidth:1280,innerHeight:720,scrollTo(){},addEventListener(){},matchMedia(){return {matches:false}},requestAnimationFrame(){},
 setTimeout(){return 1},clearTimeout(){},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
 ClassroomAPI:{ready:true,secret:()=>crypto.randomUUID().replaceAll('-','').repeat(2),rpc:async(n,p)=>{calls.push({n,p});if((n==='milky_start'&&failStart)||(n==='milky_update'&&failUpdate))throw Error('network');return {saved:true}}}});
 context.window=context;
 for(const f of ['app.js','pixel-art.js','adventure.js','classroom.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),context);
 return {run:s=>vm.runInContext(s,context),nodes,calls,storage,setFailStart:v=>failStart=v,setFailUpdate:v=>failUpdate=v};
}
(async()=>{
 const a=game();
 await a.nodes.get('begin').onclick();assert.equal(a.calls.length,0,'empty name rejected');
 a.nodes.get('student-name').value='테스트 탐정';a.setFailStart(true);
 await a.nodes.get('begin').onclick();assert.equal(a.run('started'),false);assert.equal(a.nodes.get('begin').disabled,false);
 a.setFailStart(false);await a.nodes.get('begin').onclick();
 assert.equal(a.run('started'),true);assert.equal(a.calls.filter(x=>x.n==='milky_start').length,2);
 const id=a.calls.at(-1).p.p_id;
 a.run("meet(0);choice=cases[0].options[0];phase=1;game();collect(0);updateAnimation(1);reflection={scene:'PRIVATE EXPERIENCE'};window.dispatchTest=null;");
 // pagehide handler isn't needed: the next game transition persists the reflection.
 a.run('home()');
 const serialized=[...a.storage.values()][0];assert.ok(serialized.includes('PRIVATE EXPERIENCE'));
 assert.ok(!JSON.stringify(a.calls).includes('PRIVATE EXPERIENCE'),'private reflection never sent');
 const b=game(a.storage);b.nodes.get('student-name').value='테스트 탐정';await b.nodes.get('begin').onclick();
 assert.equal(b.calls[0].p.p_id,id,'same tab and same name reuse run');
 assert.equal(b.run('journals[0].opened.size'),1,'collected clue restored after reload');
 assert.equal(b.run('reflection.scene'),'PRIVATE EXPERIENCE');
 assert.equal(b.calls.at(-1).p.p_clues.length,1);
 b.run('started=false;titleScreen()');b.nodes.get('student-name').value='다른 탐정';await b.nodes.get('begin').onclick();
 assert.notEqual(b.calls.filter(c=>c.n==='milky_start').at(-1).p.p_id,id);
 assert.equal(b.run('Object.keys(journals).length'),0,'new student begins fresh');
 console.log('PASS: required name, network failure, entry, progress snapshot, private reflection, refresh resume and separate student runs');
})().catch(e=>{console.error(e);process.exitCode=1});
