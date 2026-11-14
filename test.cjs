const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const nodes = new Map();
let created=0;
function element(id) {
  if (!nodes.has(id)) nodes.set(id, {
    innerHTML: '', textContent: '', hidden: true, open: false, style: {}, appendChild() {},
    listeners:{},
    addEventListener(name, fn, options) { if(name==='click'){this.onclick=fn;return;} (this.listeners[name]??=[]).push({fn,once:options?.once}); },
    querySelector() { return element('child'); }, querySelectorAll() { return []; },
    focus() {}, setAttribute() {}, getContext() { return new Proxy({}, {get:(o,k)=>o[k]||(()=>{})}); }, showModal() { this.open = true; },
    close() { this.open = false; const listeners=[...(this.listeners.close||[])];this.listeners.close=(this.listeners.close||[]).filter(l=>!l.once);for(const l of listeners)l.fn(); }
  });
  return nodes.get(id);
}
const context = vm.createContext({
  document: { getElementById: element, querySelector: element, createElement: kind=>element(kind+'-'+created++),
    addEventListener() {}, body: { appendChild() {}, classList: {add(){},remove(){}} } },
  window: { scrollTo() {}, addEventListener() {}, innerWidth:1280, innerHeight:720, matchMedia(){return {matches:false}} },
  requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}, setTimeout, console, assert
});
for (const file of ['app.js', 'pixel-art.js', 'adventure.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
vm.runInContext(`
assert.equal(canStand(500, 220), false, 'pond blocks movement');
assert.equal(canStand(225, 125), false, 'houses block movement');
assert.equal(canStand(99, 400), false, 'map boundary blocks movement');
player.x = 500; player.y = 510;
movePlayer(1, 0, .1);
assert.equal(player.x, 520.5, 'movement speed is frame-time based');
player.x = 500; player.y = 510;
movePlayer(1, 1, .1);
assert.ok(Math.abs(Math.hypot(player.x-500,player.y-510)-20.5)<.001, 'diagonal speed normalized');
player.x = 420; player.y = 220; movePlayer(1, 0, .04);
assert.equal(player.x, 420, 'player cannot enter pond');
assert.equal(player.moving,false,'blocked movement does not animate walking');
player.x=500;player.y=510;movePlayer(-1,0,.04);assert.equal(player.dir,'left');
movePlayer(0,-1,.04);assert.equal(player.dir,'up');
for(let i=0;i<3;i++) {
  meet(i); choice=cases[i].options[0]; phase=1; game();
  assert.equal(activeCase,i); assert.equal(journals[i].opened.size,0);
  for(let k=0;k<3;k++) {
    collect(k);assert.ok(finding,'investigation directly starts discovery animation');
    assert.equal(journals[i].opened.size,k,'clue waits for discovery animation');
    const pending=finding;collect(k);assert.equal(finding,pending,'repeat input does not restart animation');
    updateAnimation(.4);assert.equal(journals[i].opened.size,k);
    updateAnimation(.41);assert.equal(journals[i].opened.size,k+1,'clue awarded once at end');
    assert.equal(finding,null);dialog.querySelector('button').onclick();
  }
  assert.equal(phase,2,'three clues lead to reflection');
  document.getElementById('fact').onclick();
  assert.equal(document.getElementById('rethink').hidden,false);
  records[i]={before:choice,after:'더 알아보고 싶어'}; discovery();
  assert.equal(activeCase,null); assert.equal(journals[i],undefined);
}
home();assert.ok(targets().some(t=>t.type==='book'),'reflection book unlocks');
reflection={scene:'<script>test</script>'};reflect();finish();
assert.ok(app.innerHTML.includes('&lt;script&gt;test&lt;/script&gt;'),'student input escaped');
assert.equal(worldActive,false,'reflection pauses exploration');
home();held.add('ArrowRight');pauseMenu();assert.equal(held.size,0,'menu clears held movement');
assert.equal(dialogOpen,true,'menu pauses world');dialog.close();assert.equal(dialogOpen,false);
resizeWorld();draw(0,false);assert.equal(mapCanvas.width,427,'pixel canvas matches viewport');
assert.ok(labels.some(l=>l.label==='루루'),'character label queued independently from sprites');
assert.ok(labelNodes.length>=labels.length,'text uses browser-rendered labels');
assert.ok(labelNodes[0].style.fontSize.endsWith('px'),'labels use CSS pixels, not upscaled bitmap text');
function characterFrame(walk) { const marks=[];const pen={save(){},restore(){},translate(){},scale(){},fillRect(...args){marks.push(args)}};detailedCharacter(pen,0,0,-1,{moving:true,dir:'down',walk},0,false);return JSON.stringify(marks); }
assert.notEqual(characterFrame(1),characterFrame(3),'alternating walk frames change limb positions');
delete records[0];meet(0);choice=cases[0].options[0];phase=1;game();collect(0);home();updateAnimation(1);
assert.equal(journals[0].opened.size,0,'leaving a discovery cancels its pending reward');
collect(-1);assert.equal(finding,null,'invalid clue is ignored');
collect(0);updateAnimation(1);assert.equal(journals[0].opened.size,1);
dialog.querySelector('button').onclick();collect(0);assert.equal(journals[0].opened.size,1,'revisiting does not duplicate progress');
`, context);
console.log('PASS: 9 direct clues, discovery animation, duplicate/cancel safety, movement and story flow');
