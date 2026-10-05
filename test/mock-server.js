// Servidor simulado (sin dependencias) que imita los contratos de la API real para probar la UI
const http=require('http'),crypto=require('crypto');
const users={marta_fit:{username:'marta_fit',email:'m@x.com',password:'password1',seen:null},taken_user:{username:'taken_user',email:'t@x.com',password:'password1'}};
const friends=[];const posts=[];const socks=new Map();const lastPost={};const hb=[];
const send=(res,s,o,h={})=>{res.writeHead(s,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET,POST,PUT,OPTIONS','Access-Control-Expose-Headers':'Retry-After',...h});res.end(o==null?'':JSON.stringify(o))};
const frame=o=>{const b=Buffer.from(JSON.stringify(o));const h=b.length<126?Buffer.from([0x81,b.length]):Buffer.from([0x81,126,b.length>>8,b.length&255]);return Buffer.concat([h,b])};
const push=(u,o)=>(socks.get(u)||[]).forEach(s=>s.write(frame(o)));
const pub=p=>({id:p.id,content:p.content,progressData:p.card,createdAt:new Date(p.t).toISOString(),author:{username:p.u}});
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://x');let body='';req.on('data',d=>body+=d);req.on('end',()=>{
 if(req.method==='OPTIONS')return send(res,204);
 const j=body?JSON.parse(body):{};const tok=(req.headers.authorization||'').replace('Bearer ','');const me=tok.startsWith('tok_')?tok.slice(4):null;
 const P=url.pathname;
 if(P==='/api/users/check-username'){const u=url.searchParams.get('username');return send(res,200,users[u.toLowerCase()]?{available:false,reason:'taken',message:'Ese nombre de usuario ya está en uso.'}:{available:true})}
 if(P==='/api/auth/register'){if(users[j.username.toLowerCase()])return send(res,409,{error:'username_taken',message:'Ese nombre de usuario ya está en uso.'});users[j.username.toLowerCase()]={username:j.username,email:j.email,password:j.password};return send(res,201,{token:'tok_'+j.username.toLowerCase(),user:{id:'1',username:j.username,email:j.email}})}
 if(P==='/api/auth/login'){const u=Object.values(users).find(x=>x.username===j.identifier||x.email===j.identifier);if(!u||u.password!==j.password)return send(res,401,{error:'bad_credentials',message:'Usuario o contraseña incorrectos.'});return send(res,200,{token:'tok_'+u.username.toLowerCase(),user:{id:'1',username:u.username,email:u.email}})}
 if(P==='/__trigger'){if(j.type==='post'){const p={id:crypto.randomUUID(),u:'marta_fit',content:j.text,card:null,t:Date.now()};posts.unshift(p);socks.forEach((l,u)=>push(u,{type:'forum:new_post',post:pub(p)}))}
   if(j.type==='request'){friends.push({a:'marta_fit',b:j.to,status:'pending',id:crypto.randomUUID()});push(j.to,{type:'friend:request',from:'marta_fit'})}return send(res,200,{ok:1})}
 if(P==='/__hb')return send(res,200,hb);
 if(!me)return send(res,401,{error:'unauthorized',message:'Inicia sesión para continuar.'});
 if(P==='/api/auth/me')return send(res,200,{user:{id:'1',username:users[me]?users[me].username:me,email:'x'}});
 if(P==='/api/users/heartbeat'){hb.push(me);return send(res,204)}
 if(P==='/api/users/search'){const q=url.searchParams.get('q').toLowerCase();return send(res,200,{users:Object.values(users).filter(u=>u.username.toLowerCase().startsWith(q)&&u.username.toLowerCase()!==me).map(u=>({username:u.username}))})}
 if(P==='/api/friends'&&req.method==='GET'){const f=x=>x.a===me||x.b===me;const o=x=>x.a===me?x.b:x.a;const L=friends.filter(f);return send(res,200,{friends:L.filter(x=>x.status==='accepted').map(x=>({username:o(x),lastSeen:new Date().toISOString()})),incoming:L.filter(x=>x.status==='pending'&&x.b===me).map(x=>({requestId:x.id,username:x.a})),outgoing:L.filter(x=>x.status==='pending'&&x.a===me).map(x=>({requestId:x.id,username:x.b}))})}
 if(P==='/api/friends/request'){friends.push({a:me,b:j.username,status:'pending',id:crypto.randomUUID()});return send(res,201,{status:'pending',username:j.username})}
 if(P==='/api/friends/respond'){const r=friends.find(x=>x.b===me&&x.status==='pending'&&(x.id===j.requestId||x.a===j.username));if(!r)return send(res,404,{error:'not_found',message:'No hay ninguna solicitud pendiente de ese usuario.'});r.status=j.action==='accept'?'accepted':'rejected';return send(res,200,{status:r.status,username:r.a})}
 if(P==='/api/forum/posts'&&req.method==='GET')return send(res,200,{posts:posts.slice(0,+url.searchParams.get('limit')||20).map(pub),nextCursor:null});
 if(P==='/api/forum/posts'){const w=Math.ceil((10000-(Date.now()-(lastPost[me]||0)))/1000);if(w>0)return send(res,429,{error:'rate_limited',message:'Debes esperar 10 segundos entre mensajes.',retryAfter:w},{'Retry-After':w});
   lastPost[me]=Date.now();const p={id:crypto.randomUUID(),u:users[me]?users[me].username:me,content:j.content||'',card:j.progressData||null,t:Date.now()};posts.unshift(p);socks.forEach((l,u)=>push(u,{type:'forum:new_post',post:pub(p)}));return send(res,201,{post:pub(p)})}
 send(res,404,{error:'not_found',message:'Ruta no encontrada.'})})});
server.on('upgrade',(req,sock)=>{const k=req.headers['sec-websocket-key'];sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+crypto.createHash('sha1').update(k+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')+'\r\n\r\n');
 sock.once('data',b=>{let l=b[1]&127,o=2;const m=b.slice(o,o+4);o+=4;const d=Buffer.from(b.slice(o,o+l).map((x,i)=>x^m[i%4]));const t=JSON.parse(d).token.replace('tok_','');if(!socks.has(t))socks.set(t,[]);socks.get(t).push(sock);sock.write(frame({type:'ready'}))});sock.on('error',()=>{})});
server.listen(3000,()=>console.log('mock on 3000'));
