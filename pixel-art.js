/* Hand-drawn pixel shapes: original characters, scenery and animation frames. */
function detailedCharacter(c,x,y,index,pose,time,reduce){
  const hero=index===-1, frame=pose.moving&&!reduce?Math.floor(pose.walk)%4:0;
  const stride=[0,2,0,-2][frame], bob=pose.moving&&!reduce?(frame%2?-1:0):(!reduce&&Math.sin(time/650+index)>0.8?-1:0);
  const blink=!reduce&&(time+index*751)%4300>4100;
  c.save();c.translate(Math.round(x/2)*2,Math.round(y/2)*2);c.scale(2,2);
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
  const ink='#272a3b',skin='#f2c595',light='#ffe0ae',shadow='#bb846e';
  r(-12,-2,24,4,'#24384455');r(-9,2,18,2,'#24384433');
  if(hero&&pose.dir==='left')c.scale(-1,1);
  // Feet are separate from the torso so the four-step walk is a real gait.
  r(-9,-6+stride,7,6,ink);r(3,-6-stride,7,6,ink);
  r(-8,-5+stride,5,3,'#705956');r(4,-5-stride,5,3,'#705956');
  r(-8,-1+stride,6,1,'#b19777');r(4,-1-stride,6,1,'#b19777');
  c.translate(0,bob);
  if(hero){
    const back=pose.dir==='up',side=pose.dir==='right'||pose.dir==='left';
    // Coat, split tails, gold fasteners and a worn leather satchel.
    r(-10,-23,20,18,ink);r(-9,-22,18,15,'#47766d');r(-8,-21,7,15,'#669b85');r(4,-20,4,15,'#34574f');
    r(-9,-8,8,3,'#89af8d');r(2,-8,7,3,'#47766d');
    r(-13,-22-stride,4,13,ink);r(-12,-21-stride,3,8,'#7ca28b');r(-12,-13-stride,3,3,skin);
    r(9,-22+stride,4,13,ink);r(9,-21+stride,3,8,'#4c8070');r(10,-13+stride,3,3,skin);
    if(back){r(-7,-22,15,15,ink);r(-6,-21,13,12,'#a37354');r(-5,-20,11,4,'#d3aa73');r(-4,-14,9,4,'#8b5e4d');r(0,-14,2,3,'#eed38e')}
    else{r(-1,-21,2,13,'#b9bd95');r(0,-17,1,1,'#ffdf93');r(0,-12,1,1,'#ffdf93');r(-8,-21,3,17,'#b39061');r(-10,-12,7,6,ink);r(-9,-11,5,4,'#bc8c5d');r(-8,-10,3,1,'#ecc995')}
    // Face and hair. Back and side views are distinct while moving.
    r(-10,-37,20,17,ink);r(-9,-36,18,14,back?'#66514d':skin);r(-8,-35,15,8,back?'#8c6250':light);
    r(-11,-30,2,5,shadow);r(9,-30,2,5,skin);
    if(back){r(-8,-32,16,5,'#765343');r(-7,-27,14,4,'#4d4142')}
    else{r(-8,-35,4,4,'#715246');r(5,-35,3,3,'#715246');if(side){r(6,-31,2,blink?1:3,ink);r(9,-29,2,2,light);r(5,-26,3,1,'#b76f64')}else{r(-5,-31,2,blink?1:3,ink);r(4,-31,2,blink?1:3,ink);r(-6,-32,2,1,'#936c58');r(3,-32,2,1,'#936c58');r(-8,-27,3,2,'#e39c81');r(6,-27,3,2,'#e39c81');r(-1,-25,3,1,'#9b5e5b')}}
    // Hat with layered brim, band, feather, and scarf moving behind the body.
    r(-14,-37,28,4,ink);r(-12,-39,24,3,'#42675d');r(-9,-45,18,7,ink);r(-8,-44,16,6,'#5b8e78');r(-6,-44,5,2,'#9ab99a');r(-8,-39,16,2,'#b5a16d');r(6,-44,2,4,'#d8c785');r(8,-46,2,3,'#f3e2a9');
    r(-10,-23,20,3,ink);r(-9,-23,18,2,'#e1a16b');r(-7,-21,14,2,'#bc6854');r(6,-21,3,8+Math.abs(stride),'#cf7959');r(7,-14+Math.abs(stride),3,2,'#f0b87b');
    if(!back){const gy=-15+stride;r(14,gy,6,1,'#ffe0a0');r(12,gy+2,2,6,'#bf8d49');r(20,gy+2,2,6,'#bf8d49');r(14,gy+8,6,2,'#efc56d');r(14,gy+2,6,6,'#a6d8d4');r(14,gy+2,2,3,'#e5f2d7');r(20,gy+9,2,5,ink);r(21,gy+10,2,4,'#b58a5c')}
  }else{
    const fur=['#dca275','#b2a6cf','#81b4a0'][index],shade=['#ae725e','#7b749b','#4c8276'][index],shine=['#f4c797','#d8c8e8','#afd2b5'][index];
    const shirt=['#b16868','#617e9b','#c7ad6a'][index];
    r(-11,-24,22,19,ink);r(-10,-23,20,16,shirt);r(-9,-22,5,14,'#ffffff25');r(7,-22,2,16,'#29283d25');
    r(-14,-22,4,12,ink);r(-13,-21,3,8,shade);r(-13,-13,3,3,fur);r(10,-22,4,12,ink);r(10,-21,3,8,shade);r(11,-13,3,3,fur);
    r(-11,-38,22,17,ink);r(-10,-37,20,15,fur);r(-8,-36,15,5,shine);r(7,-34,3,11,shade);
    if(index===0){r(-11,-44,7,11,ink);r(-10,-42,5,8,fur);r(-9,-40,2,4,'#ba7c76');r(4,-44,7,11,ink);r(5,-42,5,8,fur);r(7,-40,2,4,'#ba7c76');r(-8,-28,16,5,'#f0d6b0');r(-9,-23,18,3,'#7c7598');r(5,-20,3,8,'#9e91b3');r(-13,-10,9,6,'#f3dfb4');r(-12,-9,7,1,'#bca680')}
    if(index===1){r(-8,-49,5,13,ink);r(-7,-48,3,10,shine);r(-6,-46,1,7,'#c99dbd');r(3,-48,5,12,ink);r(4,-47,3,10,shine);r(5,-45,1,7,'#c99dbd');r(-12,-38,24,3,ink);r(-10,-42,20,5,'#987091');r(-5,-44,3,3,'#dbb198');r(-6,-21,13,14,'#d5c9ad');r(-7,-22,2,10,'#9b8f81');r(6,-22,2,10,'#9b8f81');r(-3,-17,3,3,'#bb776b');r(2,-13,3,3,'#739894');r(13,-20,2,13,'#aa8154');r(12,-23,4,5,'#e2ab65');r(12,-25,4,3,'#84a39c')}
    if(index===2){r(-14,-32,4,5,ink);r(-13,-31,3,3,shade);r(10,-32,4,5,ink);r(10,-31,3,3,shine);r(-9,-24,18,3,'#e9dbad');r(-2,-19,5,2,'#fff1cd');r(1,-17,2,2,'#fff1cd');r(-1,-15,4,2,'#fff1cd');r(1,-13,2,2,'#fff1cd');r(-2,-11,5,2,'#fff1cd');r(11,-7,9,8,ink);r(12,-6,7,6,'#e6dfca');r(14,-4,3,3,'#676778');r(12,-6,2,1,'#676778')}
    r(-5,-31,2,blink?1:3,ink);r(4,-31,2,blink?1:3,ink);r(-7,-27,3,1,'#d8918a');r(6,-27,3,1,'#d8918a');r(-1,-26,3,1,'#77566b');
  }
  c.restore();
}

function detailedTree(c,x,y,s,time,reduce){
  c.save();c.translate(x,y);c.scale(s,s);const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)};
  r(-30,13,64,12,'#233b3b44');r(-9,-18,18,45,'#30333e');r(-6,-16,12,40,'#806653');r(-3,-9,4,32,'#aa8561');r(-7,6,4,3,'#564b48');r(1,13,5,3,'#564b48');r(-16,23,33,4,'#465644');
  const sway=reduce?0:Math.round(Math.sin(time/1500+x)*1.5);c.translate(sway,0);
  for(const [xx,yy,w,h,color]of[[-24,-90,48,18,'#273e3d'],[-38,-75,76,30,'#273e3d'],[-46,-53,92,31,'#273e3d'],[-32,-26,66,13,'#273e3d'],[-20,-88,40,16,'#75985e'],[-34,-72,68,24,'#5c8558'],[-42,-49,84,22,'#436f50'],[-26,-27,54,10,'#365947']])r(xx,yy,w,h,color);
  for(let i=0;i<14;i++){const xx=-28+(i*17)%57,yy=-77+(i*11)%50;r(xx,yy,8,4,i%3?'#6d915e':'#91ac6d');r(xx+2,yy+4,4,3,'#4e7953')}
  r(-8,-84,16,4,'#aac17e');r(-28,-63,14,4,'#8ca96c');r(19,-37,8,3,'#6e925f');c.restore();
}

function detailedBuilding(c,x,y,w,label){
  const r=(xx,yy,ww,hh,color)=>rect(c,xx,yy,ww,hh,color),ink='#29283d';
  r(x-13,y+96,w+30,15,'#29353c66');r(x-8,y-12,w+16,114,ink);r(x,y,w,98,'#bc8b78');r(x,y,w,7,'#d6ac8a');r(x+w-12,y,12,100,'#98726e');
  for(let row=0;row<5;row++)for(let col=0;col<Math.ceil(w/24);col++){const bx=x+col*24+(row%2?12:0);if(bx+20<x+w){r(bx,y+row*18+10,20,2,'#9b716c');r(bx+3,y+row*18+12,10,2,'#d1a38a')}}
  // Shingled roof, eaves, gutters, chimney and weathered trim.
  r(x-18,y-24,w+36,24,ink);r(x-8,y-52,w+16,30,ink);r(x-4,y-54,w+8,6,'#efbf91');
  for(let row=0;row<3;row++)for(let col=0;col<Math.ceil((w+20)/16);col++){const rx=x-10+col*16,ry=y-48+row*12;r(rx,ry,14,10,row%2?'#b66e60':'#c8856c');r(rx,ry,14,2,'#e6a67f');r(rx+12,ry+3,2,7,'#885865')}
  r(x-14,y-12,w+28,6,'#e7b58b');r(x-14,y-6,w+28,4,'#86596a');r(x+17,y-75,18,29,ink);r(x+20,y-73,12,24,'#a67570');r(x+17,y-76,18,5,'#d8a78a');r(x+24,y-66,8,2,'#775765');
  for(const wx of[x+14,x+w-44]){r(wx,y+25,32,36,ink);r(wx+4,y+29,24,26,'#edb77c');r(wx+6,y+31,8,18,'#ffe4a5');r(wx+18,y+31,8,18,'#f2c58b');r(wx+14,y+29,3,26,'#937077');r(wx+4,y+41,24,3,'#937077');r(wx-3,y+25,4,34,'#708879');r(wx+32,y+25,4,34,'#708879');r(wx-3,y+56,38,5,'#e5bfa0');r(wx,y+62,32,9,ink);r(wx+2,y+63,28,6,'#9e7762');for(let n=0;n<4;n++){r(wx+4+n*7,y+57,4,7,'#698b63');r(wx+3+n*7,y+55,5,4,n%2?'#e6b784':'#b383a8')}}
  const door=x+w/2-17;r(door-3,y+42,40,59,ink);r(door,y+45,34,53,'#655d72');r(door+4,y+49,26,19,'#927e8b');r(door+4,y+72,26,21,'#7a6879');r(door+23,y+73,4,5,'#e7bc73');r(door-5,y+97,44,7,'#c5afa0');r(door-9,y+104,52,5,'#8d8390');
  r(x+w/2-70,y-8,140,26,ink);r(x+w/2-66,y-6,132,20,'#776974');r(x+w/2-63,y-4,126,2,'#ad9394');pixelText(c,label,x+w/2,y+12,14);
}

function villageDetails(c,time,reduce){
  // Rippling pond, lily pads, reeds, stone edging and stepping stones.
  for(let x=438;x<578;x+=18){rect(c,x,164,15,7,'#b2bab0');rect(c,x+2,166,9,2,'#d0ccbb');rect(c,x,286,15,7,'#7f9796')}
  for(const [x,y]of[[466,205],[535,250]]){rect(c,x-8,y,18,4,'#3d786b');rect(c,x-4,y-4,12,4,'#79a582');rect(c,x+3,y-6,4,4,'#d7a7b8')}
  for(let i=0;i<4;i++){const p=reduce?i/4:((time/1800+i/4)%1),x=470+i*23,y=195+(i*19)%65; c.globalAlpha=(1-p)*.5;rect(c,x-12*p,y-5*p,24*p+2,2,'#d6e5d1');rect(c,x-12*p,y+5*p,24*p+2,2,'#d6e5d1')}c.globalAlpha=1;
  for(const [x,y]of[[430,270],[579,210]])for(let i=0;i<4;i++){rect(c,x+i*3,y-i%2*5,2,15,'#7a9871');rect(c,x+i*3,y-5-i%2*5,2,7,'#b2a377')}
  // Flower gardens, scattered leaves and small mushrooms beside paths.
  for(const [x,y]of[[126,400],[350,190],[610,230],[852,390],[344,550],[600,555]]){
    rect(c,x-12,y+7,32,7,'#435844');for(let i=0;i<5;i++){const xx=x+(i*7)%26,yy=y+(i*11)%10;rect(c,xx,yy,2,9,'#8ea373');rect(c,xx-2,yy-3,6,4,i%2?'#ddb5a0':'#bb9bb3');rect(c,xx,yy-4,2,6,'#f5d69a')}
  }
  for(const [x,y]of[[300,125],[865,530],[120,530]]){rect(c,x,y,4,9,'#d9c6a2');rect(c,x-4,y-4,12,5,'#ba7774');rect(c,x-2,y-3,2,2,'#f1d7b3');rect(c,x+6,y+4,3,7,'#c8b58e');rect(c,x+3,y+2,9,4,'#b88c69')}
  // A little bulletin board, paint stand and football markings tell each place apart.
  rect(c,114,179,5,46,'#65544e');rect(c,147,179,5,46,'#65544e');rect(c,108,170,50,35,'#29283d');rect(c,112,174,42,27,'#b59373');rect(c,117,178,14,18,'#e8d8b5');rect(c,135,181,12,13,'#c9b8a7');rect(c,120,182,8,2,'#a39584');rect(c,120,187,6,2,'#a39584');
  rect(c,845,225,4,45,'#9a785a');rect(c,866,225,4,45,'#9a785a');rect(c,839,223,36,26,'#29283d');rect(c,842,226,30,20,'#e6d2ab');rect(c,849,235,14,8,'#83a28b');rect(c,856,230,5,6,'#b3819b');rect(c,844,249,29,4,'#c09e72');
  for(let x=700;x<=820;x+=12){rect(c,x,542,8,2,'#c5c5ac77');rect(c,x,405,8,2,'#c5c5ac77')}
  // Small irregular stones add depth without obscuring walkable paths.
  for(const [x,y]of[[310,470],[650,485],[155,310],[620,315]]){rect(c,x,y,9,3,'#b2ac9d');rect(c,x+11,y+5,6,2,'#6b7179')}
  // Chimney smoke and butterflies drift slowly; disabled for reduced motion.
  if(!reduce){for(const [x,y]of[[181,7],[701,0]])for(let i=0;i<3;i++){const p=(time/3500+i/3)%1;c.globalAlpha=(1-p)*.28;rect(c,x+Math.sin(p*5)*7,y-p*42,10+p*12,8+p*6,'#d3c6bf')}c.globalAlpha=1;for(let i=0;i<3;i++){const x=360+i*133+Math.sin(time/1700+i)*18,y=380-i*40+Math.cos(time/1100+i)*8;rect(c,x,y,2,5,'#74677e');const wing=Math.sin(time/140)>0?4:2;rect(c,x-wing,y-2,wing,5,'#ceb0a0');rect(c,x+2,y-2,wing,5,'#e5c599')}}
}

function clueArtwork(c,p,time,reduce){
  const lift=reduce?0:Math.round(Math.sin(time/330+p.index)*2)*2,y=p.y-20+lift;
  rect(c,p.x-15,p.y+3,30,6,'#33354c44');rect(c,p.x-13,y-16,26,29,'#29283d');rect(c,p.x-11,y-14,22,25,'#edc682');rect(c,p.x-9,y-12,18,20,'#fff0be');rect(c,p.x-7,y-7,11,2,'#b29c7d');rect(c,p.x-7,y-2,14,2,'#b29c7d');rect(c,p.x-7,y+3,8,2,'#b29c7d');rect(c,p.x+5,y-14,6,6,'#cd9d64');
  for(let i=0;i<3;i++){const a=time/850+i*2.1,x=p.x+Math.cos(a)*23,yy=y+Math.sin(a)*18;c.globalAlpha=reduce?.6:.45+(Math.sin(time/250+i)+1)*.25;rect(c,x-3,yy,8,2,'#ffe2a0');rect(c,x,yy-3,2,8,'#ffe2a0')}c.globalAlpha=1;
}
function discoveryArtwork(c,event,reduce){
  if(!event)return;const p=Math.min(1,event.elapsed/.8),x=event.x,y=event.y-20;
  if(!reduce){for(let i=0;i<12;i++){const angle=i*Math.PI/6,radius=10+p*52,xx=x+Math.cos(angle)*radius,yy=y+Math.sin(angle)*radius*.7;c.globalAlpha=1-p;rect(c,xx,yy,4+(i%2)*2,4+(i%2)*2,i%2?'#fff0be':'#e4b16b')}c.globalAlpha=1;}
  const q=reduce?1:Math.min(1,p*1.6),rise=reduce?0:Math.sin(p*Math.PI)*26;
  const xx=x+(player.x-x)*q,yy=y+(player.y-65-y)*q-rise;
  rect(c,xx-10,yy-13,22,28,'#29283d');rect(c,xx-8,yy-11,18,24,'#fff0be');rect(c,xx-5,yy-6,11,2,'#cba66f');rect(c,xx-5,yy,11,2,'#cba66f');rect(c,xx-5,yy+6,7,2,'#cba66f');
}
