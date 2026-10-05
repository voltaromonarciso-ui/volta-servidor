/* Moderación de nombres de usuario y mensajes de VOLTA (ES + EN). UMD: sirve igual en navegador y en Node.
   Es un filtro HEURÍSTICO: ningún filtro de listas es perfecto. En producción, combínalo con denuncias y revisión manual. */
(function(root,f){typeof module=="object"&&module.exports?module.exports=f():root.VMOD=f()})(this,function(){
const MSG="Este nombre de usuario no está disponible o contiene términos no permitidos. Por favor, elige otro.";
const FMT="Usa de 3 a 20 caracteres: letras, números, guion bajo (_) y punto (.).";
/* raíces ≥ 6 letras: se buscan dentro del nombre. Las cortas solo como palabra, al inicio o al final (evita falsos positivos tipo "computadora") */
const LONG="gilipollas pendejo cabron cabrona hijoputa hijodeputa malparid mamahuevo maricon marikon sudaca negrata panchito subnormal retrasado violador pedofilo pederasta follar mierda coprofag asshole bastard motherfuck fuckyou fucker bullshit dickhead pussy cunt nigger niggas faggot retard rapist paedo pedophile molester whore slut heil hitler nazi terroris yihad jihad".split(" ");
const SHORT="puta puto putas putos putita coño joder verga pija polla pene culo zorra zorro mongolo idiota imbecil estupido tarado gonorrea carajo cojones chocho sida fuck shit bitch dick cock nigga fag rape pedo nazi hitler cum slut whore twat wank porn porno".split(" ");
const SAFE="computa imputa disputa reputa diputa amputa deputa input output circulo musculo oculo particulo ridiculo vehiculo class assist assas mass bass pass grass glass hancock peacock cocktail dickens shitake sussex essex middlesex scunthorpe analisis analyst titan cumbre cumple document pedometer pedal pediatr pedro".split(" ");
const HG={"а":"a","е":"e","о":"o","р":"p","с":"c","х":"x","у":"y","і":"i","ј":"j","к":"k","м":"m","н":"h","т":"t","ѕ":"s","ɡ":"g","α":"a","ο":"o","ν":"v","ρ":"p","ı":"i","ß":"ss","ø":"o","đ":"d","ł":"l"},LT={"0":"o","3":"e","4":"a","5":"s","6":"g","7":"t","8":"b","9":"g","@":"a","$":"s","!":"i","+":"t","¡":"i","|":"i","€":"e","£":"l","¢":"c"};
const col=s=>s.replace(/(.)\1+/g,"$1");
function base(s){return String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/./gu,c=>HG[c]||c)}
function variants(s){const b=base(s),o=[];["i","l"].forEach(one=>{const t=b.replace(/[0-9@$!+¡|€£¢]/g,c=>c=="1"?one:LT[c]||c);o.push(t)});return o}
const SL=LONG.map(col),SS=SHORT.map(col);
function hit(raw){for(const v of variants(raw)){const toks=v.split(/[^a-z0-9ñ]+/).map(t=>col(t.replace(/[^a-zñ]/g,""))).filter(Boolean),whole=col(v.replace(/[^a-zñ]/g,""));
if(v.replace(/[^a-zñ]/g,"").includes("kkk"))return true;
let w=whole;SAFE.forEach(x=>{w=w.split(col(x)).join("·")});const core=w.replace(/^x+|x+$/g,"");
if(SL.some(x=>w.includes(x)))return true;if(SS.some(x=>toks.includes(x)||core==x||core.startsWith(x)||core.endsWith(x)&&!SAFE.some(s=>whole.endsWith(col(s)))))return true}return false}
const RES="admin administrator administrador root volta voltaapp soporte support moderator moderador staff system sistema null undefined anonymous anonimo".split(" ");
const res=u=>variants(u).some(v=>RES.includes(v.replace(/[^a-zñ0-9]/g,"")));
function username(u){u=String(u==null?"":u).trim();if(hit(u)||res(u))return{ok:false,reason:"banned",message:MSG};if(!/^[A-Za-z0-9_.]{3,20}$/.test(u))return{ok:false,reason:"format",message:FMT};return{ok:true}}
return{username,text:t=>!hit(t),hit,MSG,FMT,CD:10000}});
