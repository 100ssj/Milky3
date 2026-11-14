const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const nodes = new Map();
function element(id) {
  if (!nodes.has(id)) nodes.set(id, {
    innerHTML: '', textContent: '', hidden: true, open: false,
    addEventListener(name, fn) { this['on' + name] = fn; },
    querySelector() { return element('child'); }, querySelectorAll() { return []; },
    focus() {}, setAttribute() {}, getContext() { return new Proxy({}, {get:(o,k)=>o[k]||(()=>{})}); }, showModal() { this.open = true; },
    close() { this.open = false; this.onclose?.(); }
  });
  return nodes.get(id);
}
const context = vm.createContext({
  document: { getElementById: element, querySelector: element, createElement: element,
    addEventListener() {}, body: { appendChild() {}, classList: {add(){},remove(){}} } },
  window: { scrollTo() {}, addEventListener() {}, innerWidth:1280, innerHeight:720, matchMedia(){return {matches:false}} },
  requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}, setTimeout, console, assert
});
for (const file of ['app.js', 'adventure.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
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
for(let i=0;i<3;i++) {
  meet(i); choice=cases[i].options[0]; phase=1; game();
  assert.equal(activeCase,i); assert.equal(journals[i].opened.size,0);
  for(let k=0;k<3;k++) { collect(k); dialog.querySelector('button').onclick(); }
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
`, context);
console.log('PASS: movement, boundaries, collision, diagonal speed, all 3 clue journeys, book unlock, reflection escaping');
