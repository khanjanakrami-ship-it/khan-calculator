const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const display=$('#display'), expression=$('#expression'), historyList=$('#historyList');
let current='0', previous='', operator=null, justEvaluated=false;
const history=JSON.parse(localStorage.getItem('khanHistory')||'[]');
function render(){display.textContent=current;expression.textContent=previous&&operator?`${previous} ${operator}`:''}
function input(v){if(justEvaluated){current='0';previous='';operator=null;justEvaluated=false}if(v==='.'&&current.includes('.'))return;if(current==='0'&&v!=='.')current=v;else current+=v;render()}
function op(o){if(current==='Error')return;if(operator&&previous!==''&&!justEvaluated)equals(false);previous=current;operator=o;current='0';justEvaluated=false;render()}
function calc(a,b,o){a=Number(a);b=Number(b);if(o==='+')return a+b;if(o==='−')return a-b;if(o==='×')return a*b;if(o==='÷')return b===0?'Error':a/b;return b}
function equals(save=true){if(!operator||previous==='')return;const a=previous,b=current,o=operator,res=calc(a,b,o);expression.textContent=`${a} ${o} ${b}`;current=String(res);previous='';operator=null;justEvaluated=true;if(save&&res!=='Error'){history.unshift({expr:`${a} ${o} ${b}`,shown:`${a} ${o} ${b}`,result:res,time:new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})});history.splice(50);localStorage.setItem('khanHistory',JSON.stringify(history));renderHistory()}}
function clear(){current='0';previous='';operator=null;justEvaluated=false;render()}
function backspace(){if(justEvaluated)return clear();current=current.length>1?current.slice(0,-1):'0';render()}
$$('.key').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.action==='clear')clear();else if(b.dataset.action==='backspace')backspace();else if(b.dataset.action==='equals')equals();else if(['+','−','×','÷'].includes(b.dataset.value))op(b.dataset.value);else if(b.dataset.value==='%'){current=String(Number(current)/100);render()}else input(b.dataset.value)}));
document.addEventListener('keydown',e=>{const map={'/':'÷','*':'×','-':'−'};if(/[0-9.]/.test(e.key))input(e.key);else if(['+','-','*','/'].includes(e.key))op(map[e.key]||e.key);else if(e.key==='Enter'||e.key==='=')equals();else if(e.key==='Backspace')backspace();else if(e.key==='Escape')clear()});
function renderHistory(){if(!history.length){historyList.innerHTML='<div class="empty">No calculations yet.</div>';return}historyList.innerHTML=history.map((h,i)=>`<div class="history-item"><div><div class="expr">${escapeHtml(h.shown)}</div><time>${h.time}</time></div><div class="ans">= ${format(h.result)}</div></div>`).join('')}
function format(n){return Number.isFinite(Number(n))?Number(n).toLocaleString(undefined,{maximumFractionDigits:12}):n}function escapeHtml(s){return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
$('#clearHistory').onclick=()=>{history.length=0;localStorage.removeItem('khanHistory');renderHistory()};
function show(id){$$('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
$$('[data-view]').forEach(b=>b.onclick=()=>show(b.dataset.view+'View'));$$('[data-back]').forEach(b=>b.onclick=()=>show('calculatorView'));$('#menuBtn').onclick=()=>show('calculatorView');
$('#portraitBtn').onclick=()=>show('portraitView');
async function lockPortrait(){try{if(screen.orientation?.lock){await screen.orientation.lock('portrait');toast('Portrait mode enabled')}else toast('Use your phone orientation settings')}catch{toast('Portrait lock is not supported here')}}
$('#lockPortrait').onclick=lockPortrait;$('#unlockPortrait').onclick=()=>{try{screen.orientation?.unlock?.();toast('Portrait lock released')}catch{toast('Unlock from phone settings')}};
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
const units={
 Length:{base:'m',units:{m:['Meter (m)',1],km:['Kilometer (km)',1000],cm:['Centimeter (cm)',.01],mm:['Millimeter (mm)',.001],um:['Micrometer (µm)',1e-6],mi:['Mile (mi)',1609.344],yd:['Yard (yd)',.9144],ft:['Foot (ft)',.3048],in:['Inch (in)',.0254],nmi:['Nautical Mile (nmi)',1852]}},
 Area:{units:{m2:['Square Meter (m²)',1],km2:['Square Kilometer (km²)',1e6],ft2:['Square Foot (ft²)',.09290304],in2:['Square Inch (in²)',.00064516],acre:['Acre',4046.8564224],ha:['Hectare',10000]}},
 Volume:{units:{l:['Liter (L)',1],ml:['Milliliter (mL)',.001],m3:['Cubic Meter (m³)',1000],gal:['US Gallon (gal)',3.785411784],qt:['US Quart (qt)',.946352946],pt:['US Pint (pt)',.473176473],cup:['US Cup',.2365882365]}},
 Weight:{units:{kg:['Kilogram (kg)',1],g:['Gram (g)',.001],mg:['Milligram (mg)',1e-6],lb:['Pound (lb)',.45359237],oz:['Ounce (oz)',.028349523125],ton:['Metric Ton (t)',1000]}},
 Temperature:{temp:true,units:{c:['Celsius (°C)'],f:['Fahrenheit (°F)'],k:['Kelvin (K)']}},
 Speed:{units:{ms:['Meter/second (m/s)',1],kmh:['Kilometer/hour (km/h)',.2777777778],mph:['Mile/hour (mph)',.44704],knot:['Knot',.5144444444],fts:['Foot/second (ft/s)',.3048]}},
 Time:{units:{s:['Second (s)',1],min:['Minute (min)',60],h:['Hour (h)',3600],day:['Day',86400],week:['Week',604800]}},
 Data:{units:{b:['Byte (B)',1],kb:['Kilobyte (KB)',1024],mb:['Megabyte (MB)',1048576],gb:['Gigabyte (GB)',1073741824],tb:['Terabyte (TB)',1099511627776]}},
 Energy:{units:{j:['Joule (J)',1],kj:['Kilojoule (kJ)',1000],wh:['Watt-hour (Wh)',3600],kwh:['Kilowatt-hour (kWh)',3600000],cal:['Calorie (cal)',4.184],kcal:['Kilocalorie (kcal)',4184]}},
 Pressure:{units:{pa:['Pascal (Pa)',1],kpa:['Kilopascal (kPa)',1000],bar:['Bar',100000],atm:['Atmosphere (atm)',101325],psi:['PSI',6894.757293]}},
 Angle:{units:{deg:['Degree (°)',1],rad:['Radian (rad)',Math.PI/180],grad:['Gradian (gon)',.9],turn:['Turn',360]}}
};
const catNames=Object.keys(units);const categories=$('#categories');catNames.forEach((name,i)=>{const b=document.createElement('button');b.className='cat'+(!i?' active':'');b.textContent=name;b.onclick=()=>setCategory(name,b);categories.appendChild(b)});
let cat='Length';function setCategory(name,btn){cat=name;$$('.cat').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$('#converterTitle').textContent=name;fillUnits();convert()}
function fillUnits(){const u=units[cat].units;$('#fromUnit').innerHTML=Object.entries(u).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('');$('#toUnit').innerHTML=Object.entries(u).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('');const keys=Object.keys(u);$('#fromUnit').value=keys[0];$('#toUnit').value=keys[1]||keys[0];updateQuick()}
function tempConvert(v,a,b){let c=a==='c'?v:a==='f'?(v-32)*5/9:v-273.15;return b==='c'?c:b==='f'?c*9/5+32:c+273.15}
function convert(){const v=parseFloat($('#fromValue').value);if(Number.isNaN(v)){$('#toValue').value='';return}const a=$('#fromUnit').value,b=$('#toUnit').value;let out;if(units[cat].temp)out=tempConvert(v,a,b);else{const ua=units[cat].units[a][1],ub=units[cat].units[b][1];out=v*ua/ub}$('#toValue').value=Number(out.toFixed(12)).toString()}
function updateQuick(){const title=cat==='Length'?'Quick Convert':'Common conversions';$('#quickInfo').innerHTML=`<strong>${title}</strong><br>${quickFor(cat)}`}
function quickFor(c){const u=units[c].units;const names=Object.values(u).slice(0,6).map(x=>x[0]);if(c==='Length')return '1 km = 1000 m · 1 m = 100 cm · 1 in = 2.54 cm · 1 ft = 0.3048 m';if(c==='Temperature')return '°C ↔ °F ↔ K';return names.join(' · ')}
$('#fromValue').addEventListener('input',convert);$('#fromUnit').addEventListener('change',convert);$('#toUnit').addEventListener('change',convert);$('#swapBtn').onclick=()=>{const a=$('#fromUnit').value,b=$('#toUnit').value;$('#fromUnit').value=b;$('#toUnit').value=a;$('#fromValue').value=$('#toValue').value;convert()};
render();renderHistory();fillUnits();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
