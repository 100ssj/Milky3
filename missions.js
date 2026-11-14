/* Short, untimed puzzles. Every clue route goes through the same reward gate. */
const missionWins = new Set();
let mission = null;
const missionDialog = document.createElement('dialog');
missionDialog.className = 'mission-dialog';
missionDialog.setAttribute('aria-label', '단서 미니게임');
document.body.appendChild(missionDialog);
const missionThemes = [
  [
    {type:'observe', title:'쪽지의 봉인 찾기', object:'봉투', brief:'모모의 쪽지에 찍힌 봉인을 찾아보자. 모양, 색 이름, 점 개수가 모두 같은 봉투를 골라 줘.'},
    {type:'memory', title:'발표 가방 정리', items:[['✉','쪽지'],['★','발표 배지'],['♫','마이크']], brief:'발표 가방 속 물건이 섞였어. 카드를 두 장씩 뒤집어 같은 물건 세 쌍을 찾아 줘.'},
    {type:'order', title:'다시 인사하는 방법', brief:'친구가 인사를 못 본 것 같아. 다시 만나 이야기하는 순서대로 카드를 눌러 줘.', steps:['친구가 나를 볼 때까지 기다린다','다시 손을 흔들며 인사한다','친구의 대답을 들어 본다']}
  ],
  [
    {type:'observe', title:'물감 상자의 표식', object:'물감 상자', brief:'루루의 작업대에서 같은 표식의 상자를 찾아보자. 모양, 색 이름, 점 개수를 함께 살펴봐.'},
    {type:'memory', title:'작업실 짝 찾기', items:[['✎','붓'],['▧','앞치마'],['◈','물감']], brief:'작업실 물건의 짝을 찾아 정리해 줘. 같은 그림과 이름의 카드끼리 짝이야.'},
    {type:'order', title:'궁금한 옷 이야기', brief:'물감 묻은 옷을 보고 궁금해졌어. 잘 모르는 친구를 알아가는 순서로 카드를 골라 줘.', steps:['직접 본 모습과 내 추측을 구분한다','옷에 물감이 묻은 이유를 물어본다','친구의 이야기를 듣고 생각해 본다']}
  ],
  [
    {type:'observe', title:'체육 창고의 표식', object:'공 주머니', brief:'토리가 찾는 공 주머니를 골라 줘. 표본과 모양, 색 이름, 점 개수가 모두 같아야 해.'},
    {type:'memory', title:'운동장 물건 정리', items:[['◉','공'],['↥','펌프'],['⚑','팀 깃발']], brief:'공놀이 준비를 도와주자. 카드 여섯 장에서 같은 물건 세 쌍을 찾아 줘.'},
    {type:'order', title:'함께 쓰는 공', brief:'공을 가져간 이유를 몰라 당황했어. 대화로 확인하는 순서대로 카드를 골라 줘.', steps:['공을 가져간 이유를 물어본다','토리의 설명을 끝까지 듣는다','내 마음과 다음에 바라는 점을 말한다']}
  ]
];
function shuffleMission(items) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function missionKey(c,i) { return c+':'+i; }
function openMission(c,i) {
  if (missionDialog.open || dialog.open || !journals[c] || journals[c].opened.has(i)) return;
  const config=missionThemes[c]?.[i]; if(!config) return;
  clearKeys();player.moving=false;dialogOpen=true;
  mission={caseIndex:c,index:i,config,won:false,message:'',round:0,picked:[],matched:new Set(),flipped:[],order:[],roundDone:false};
  if(config.type==='observe') {
    mission.deck=shuffleMission(Array.from({length:9},(_,id)=>({id,shape:id%3,color:Math.floor(id/3),dots:(id*2+Math.floor(id/3))%3+1})));
    mission.targets=shuffleMission(mission.deck).slice(0,2);
  } else if(config.type==='memory') {
    mission.deck=shuffleMission(config.items.flatMap((item,pair)=>[{item,pair},{item,pair}]));
  } else mission.deck=shuffleMission([0,1,2]);
  renderMission();missionDialog.showModal();
}
missionDialog.addEventListener('close',()=>{
  mission=null;dialogOpen=dialog.open||missionDialog.open;clearKeys();
  if(worldActive&&!dialogOpen)mapCanvas.focus({preventScroll:true});
});
function exitMission() { mission=null;missionDialog.close(); }
function sealLabel(card){return ['별','마름모','동그라미'][card.shape]+' · '+['노랑','하늘','분홍'][card.color]+' · 점 '+card.dots+'개'}
function sealMarkup(card){return `<span class="seal shape-${card.shape} color-${card.color}" aria-hidden="true"><b>${['★','◆','●'][card.shape]}</b><small>${'• '.repeat(card.dots).trim()}</small></span><span class="seal-name">${['노랑','하늘','분홍'][card.color]} · ${['별','마름모','동그라미'][card.shape]}<br>점 ${card.dots}개</span>`}
function missionSuccess(){
  if(!mission||mission.won)return;
  mission.won=true;mission.message='';missionWins.add(missionKey(mission.caseIndex,mission.index));beep(1);renderMission();
}
function chooseSeal(id){
  if(!mission||mission.config.type!=='observe'||mission.won||mission.roundDone)return;
  const target=mission.targets[mission.round];
  if(id!==target.id){mission.message='조금 달라! 모양, 색 이름, 점 개수를 하나씩 비교해 봐.';mission.lastWrong=id;renderMission();return}
  mission.lastWrong=null;mission.roundDone=true;beep();
  if(mission.round===1){missionSuccess();return}
  mission.message='같은 표식을 찾았어! 이번에는 다른 표식도 살펴볼까?';renderMission();
}
function nextSealRound(){if(!mission||mission.config.type!=='observe'||!mission.roundDone||mission.won)return;mission.round++;mission.roundDone=false;mission.message='';renderMission()}
function flipMissionCard(index){
  if(!mission||mission.config.type!=='memory'||mission.won||mission.flipped.length===2||!mission.deck[index]||mission.matched.has(index)||mission.flipped.includes(index))return;
  mission.flipped.push(index);mission.message='';
  if(mission.flipped.length===2){const [a,b]=mission.flipped;
    if(mission.deck[a].pair===mission.deck[b].pair){mission.matched.add(a);mission.matched.add(b);mission.flipped=[];mission.message='한 쌍 발견! 남은 짝도 찾아보자.';beep();if(mission.matched.size===6){missionSuccess();return}}
    else mission.message='서로 다른 물건이네. 위치를 기억한 뒤 다시 뒤집어 봐.';
  }renderMission();
}
function resetMismatch(){if(mission?.config.type==='memory'&&mission.flipped.length===2){mission.flipped=[];mission.message='다른 두 장을 골라 봐.';renderMission()}}
function chooseOrder(id){if(!mission||mission.config.type!=='order'||mission.won||!mission.deck.includes(id)||mission.order.includes(id))return;mission.order.push(id);mission.message='';renderMission()}
function undoOrder(){if(!mission||mission.config.type!=='order'||mission.won)return;mission.order.pop();mission.message='';renderMission()}
function checkOrder(){if(!mission||mission.config.type!=='order'||mission.order.length!==3||mission.won)return;if(mission.order.every((n,i)=>n===i)){missionSuccess();return}mission.message='먼저 할 일부터 다시 생각해 볼까? 한 단계 되돌리거나 모두 다시 골라도 돼.';renderMission()}
function claimMission(){
  if(!mission?.won)return;
  const {caseIndex,index}=mission;
  // Award is started by the close event, so a late close never unpauses a clue dialog.
  mission=null;
  missionDialog.addEventListener('close',function rewardAfterClose(){
    if(activeCase===caseIndex&&journals[caseIndex]&&missionWins.has(missionKey(caseIndex,index)))awardClue(index);
  },{once:true});
  missionDialog.close();
}
function renderMission(){
  const m=mission;if(!m)return;
  const {config}=m;
  let board='';
  if(m.won){const takeaway={observe:'자세히 보니 작은 차이도 발견할 수 있었어!',memory:'한 장만 보았을 때보다, 여러 장을 살펴보니 알게 됐어!',order:'먼저 살펴보고, 물어보고, 이야기를 듣는 연습을 했어!'}[config.type];board=`<div class="mission-win"><div class="win-star" aria-hidden="true">✦</div><h3>미션 성공!</h3><p>${takeaway}</p><div class="clue-reward">▤ ${cases[m.caseIndex].name}의 ${m.index+1}번째 단서가 열렸어</div><button class="primary" id="claim-mission">단서 열기　▶</button></div>`}
  else if(config.type==='observe')board=`<div class="sample-row"><div><span class="mission-chip">찾아야 할 표본</span><p>같은 ${config.object}를 골라 줘!</p></div><div class="sample-seal" aria-label="표본: ${sealLabel(m.targets[m.round])}">${sealMarkup(m.targets[m.round])}</div></div><div class="seal-grid">${m.deck.map(card=>`<button data-seal="${card.id}" class="seal-card ${m.lastWrong===card.id?'retry-card':''}" aria-label="${sealLabel(card)}" ${m.roundDone?'disabled':''}>${sealMarkup(card)}</button>`).join('')}</div><div class="mission-progress">표식 발견 ${m.round+(m.roundDone?1:0)} / 2</div>${m.roundDone?'<button class="primary" id="next-seal">다음 표식 찾기　▶</button>':''}`;
  else if(config.type==='memory')board=`<div class="memory-grid">${m.deck.map((card,i)=>{const matched=m.matched.has(i),revealed=matched||m.flipped.includes(i);return `<button data-memory="${i}" class="memory-card ${revealed?'face-up':''} ${matched?'matched':''}" aria-label="${i+1}번 카드${revealed?': '+card.item[1]+(matched?', 짝 찾음':''):': 뒤집기'}" ${matched||m.flipped.includes(i)||m.flipped.length===2?'disabled':''}><span class="card-glyph" aria-hidden="true">${revealed?card.item[0]:'?'}</span><span>${revealed?card.item[1]:'카드 '+(i+1)}</span>${matched?'<b class="match-check">✓</b>':''}</button>`}).join('')}</div><div class="mission-progress">찾은 짝 ${m.matched.size/2} / 3</div>${m.flipped.length===2?'<button class="primary" id="flip-back">기억했어! 다시 뒤집기 ↻</button>':''}`;
  else board=`<div class="order-slots" aria-label="내가 고른 순서">${[0,1,2].map(i=>`<div class="order-slot"><b>${i+1}</b><span>${m.order[i]===undefined?'아래 카드를 골라 줘':config.steps[m.order[i]]}</span></div>`).join('')}</div><div class="order-choices">${m.deck.map(id=>`<button data-order="${id}" ${m.order.includes(id)?'disabled':''}>${m.order.includes(id)?'✓':'＋'} ${config.steps[id]}</button>`).join('')}</div><div class="mission-actions"><button id="undo-order" ${m.order.length?'':'disabled'}>한 단계 되돌리기</button><button id="reset-order" ${m.order.length?'':'disabled'}>다시 고르기</button><button class="primary" id="check-order" ${m.order.length===3?'':'disabled'}>순서 확인 ✓</button></div>`;
  missionDialog.innerHTML=`<div class="mission-top"><span class="eyebrow">CLUE MISSION · ${cases[m.caseIndex].name} ${m.index+1}/3</span><button id="leave-mission" aria-label="미션 닫고 탐험으로 돌아가기">✕</button></div><h2>${config.title}</h2>${m.won?'':`<p class="mission-brief">${config.brief}</p>`}<div class="mission-board">${board}</div><p class="mission-feedback" role="status">${m.message}</p><p class="mission-footnote">시간 제한 없음 · 실수해도 다시 도전할 수 있어요</p>`;
  missionDialog.querySelector('#leave-mission').onclick=exitMission;
  missionDialog.querySelector('#claim-mission')?.addEventListener('click',claimMission);
  missionDialog.querySelectorAll('[data-seal]').forEach(b=>b.onclick=()=>chooseSeal(+b.dataset.seal));
  missionDialog.querySelector('#next-seal')?.addEventListener('click',nextSealRound);
  missionDialog.querySelectorAll('[data-memory]').forEach(b=>b.onclick=()=>flipMissionCard(+b.dataset.memory));
  missionDialog.querySelector('#flip-back')?.addEventListener('click',resetMismatch);
  missionDialog.querySelectorAll('[data-order]').forEach(b=>b.onclick=()=>chooseOrder(+b.dataset.order));
  missionDialog.querySelector('#undo-order')?.addEventListener('click',undoOrder);
  missionDialog.querySelector('#reset-order')?.addEventListener('click',()=>{m.order=[];m.message='';renderMission()});
  missionDialog.querySelector('#check-order')?.addEventListener('click',checkOrder);
  if(missionDialog.open){
    const next=m.won?'#claim-mission':m.roundDone?'#next-seal':m.flipped.length===2?'#flip-back':null;
    if(next)missionDialog.querySelector(next)?.focus();
  }
}
