const expressionEl=document.getElementById("expression");
const resultEl=document.getElementById("result");
const panel=document.getElementById("panel");
const panelTitle=document.getElementById("panelTitle");
const panelBody=document.getElementById("panelBody");

let expr="";
let current="";
let justEvaluated=false;
let history=JSON.parse(localStorage.getItem("khanHistory")||"[]");

const ops="+−×÷";

function render(){
  expressionEl.textContent=expr;
  resultEl.textContent=current||"0";
}
function formatNumber(n){
  if(!Number.isFinite(n)) return "Error";
  return Number.isInteger(n)?String(n):String(Number(n.toFixed(12)));
}
function sanitize(e){return e.replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-");}
function calculate(e){
  if(!e.trim()) return 0;
  if(!/^[0-9+\-*/().%\s]+$/.test(sanitize(e))) throw Error();
  let s=sanitize(e).replace(/(\d+(?:\.\d+)?)%/g,"($1/100)");
  return Function('"use strict";return ('+s+')')();
}
function commitHistory(e,r){
  if(!e) return;
  history.unshift({e,r,ts:new Date().toLocaleString()});
  history=history.slice(0,50);
  localStorage.setItem("khanHistory",JSON.stringify(history));
}
function appendDigit(v){
  if(justEvaluated){expr="";current="";justEvaluated=false}
  if(v==="." && current.includes(".")) return;
  if(v==="." && (!current || /[+\-×÷]$/.test(expr))) current="0";
  current+=v;
  expr+=v;
  render();
}
function appendOperator(op){
  if(justEvaluated){expr=current;justEvaluated=false}
  if(!current && !expr) return;
  if(/[+\-×÷]$/.test(expr)) expr=expr.slice(0,-1)+op;
  else expr+=op;
  current="";
  render();
}
function equals(){
  if(!expr) return;
  let e=expr;
  if(/[+\-×÷]$/.test(e)) e=e.slice(0,-1);
  try{
    const r=formatNumber(calculate(e));
    commitHistory(e,r);
    expr=e;
    current=r;
    justEvaluated=true;
    render();
  }catch{current="Error";justEvaluated=true;render()}
}
function clearAll(){expr="";current="";justEvaluated=false;render()}
function backspace(){
  if(justEvaluated){clearAll();return}
  if(!expr)return;
  expr=expr.slice(0,-1);
  if(/[0-9.]$/.test(expr)) current=current.slice(0,-1);
  else current="";
  render();
}
function percent(){
  if(!current)return;
  const n=parseFloat(current);
  if(Number.isNaN(n))return;
  const p=formatNumber(n/100);
  expr=expr.slice(0,-current.length)+p;
  current=p;render();
}
function sign(){
  if(!current)return;
  const n=parseFloat(current);
  if(Number.isNaN(n))return;
  const p=formatNumber(-n);
  expr=expr.slice(0,-current.length)+p;
  current=p;render();
}

document.querySelectorAll(".key").forEach(b=>{
  b.addEventListener("click",()=>{
    const a=b.dataset.action,v=b.dataset.value;
    if(a==="clear")clearAll();
    else if(a==="backspace")backspace();
    else if(a==="percent")percent();
    else if(a==="sign")sign();
    else if(a==="equals")equals();
    else if(v&&ops.includes(v))appendOperator(v);
    else if(v)appendDigit(v);
  });
});

document.addEventListener("keydown",e=>{
  if(/[0-9.]/.test(e.key))appendDigit(e.key);
  else if(["+","-","*","/"].includes(e.key))appendOperator(e.key==="*"?"×":e.key==="/"?"÷":e.key);
  else if(e.key==="Enter"||e.key==="=")equals();
  else if(e.key==="Backspace")backspace();
  else if(e.key==="Escape")clearAll();
});

function openPanel(title,body){
  panelTitle.textContent=title;panelBody.innerHTML=body;panel.showModal();
}
document.getElementById("closePanel").onclick=()=>panel.close();

document.getElementById("historyBtn").onclick=()=>{
  const body=history.length?history.map(x=>`<div class="history-item"><b>${x.e} = ${x.r}</b><span>${x.ts}</span></div>`).join(""):"<p>No calculations yet.</p>";
  openPanel("History",body);
};

document.getElementById("unitBtn").onclick=()=>{
  openPanel("Unit Converter",`
    <div class="converter">
      <select id="unitType"><option value="length">Length</option><option value="weight">Weight</option><option value="temperature">Temperature</option><option value="area">Area</option><option value="volume">Volume</option><option value="time">Time</option><option value="speed">Speed</option></select>
      <input id="unitInput" type="number" placeholder="Enter value">
      <select id="fromUnit"></select><select id="toUnit"></select>
      <div id="convResult" class="conv-result">—</div>
    </div>`);
  setupConverter();
};

document.getElementById("portraitBtn").onclick=()=>{
  document.documentElement.style.setProperty("--portrait-active","1");
  openPanel("Portrait","Portrait layout is active on this device.");
};

document.getElementById("menuBtn").onclick=()=>openPanel("Khan Calculator","Professional calculator • History • Unit Converter • Portrait");

const units={
 length:{meter:1,kilometer:1000,centimeter:.01,millimeter:.001,mile:1609.344,yard:.9144,foot:.3048,inch:.0254},
 weight:{kilogram:1,gram:.001,milligram:.000001,pound:.45359237,ounce:.028349523125},
 area:{square_meter:1,square_kilometer:1e6,square_centimeter:.0001,square_foot:.09290304,acre:4046.8564224},
 volume:{liter:1,milliliter:.001,cubic_meter:1000,gallon:3.785411784,cup:.2365882365},
 time:{second:1,minute:60,hour:3600,day:86400,week:604800},
 speed:{mps:1,kph:1000/3600,mph:1609.344/3600,knot:1852/3600}
};
function setupConverter(){
  const type=document.getElementById("unitType"),from=document.getElementById("fromUnit"),to=document.getElementById("toUnit"),input=document.getElementById("unitInput"),out=document.getElementById("convResult");
  function fill(){
    const t=type.value;const names=t==="temperature"?["celsius","fahrenheit","kelvin"]:Object.keys(units[t]);
    from.innerHTML=names.map(x=>`<option>${x}</option>`).join("");to.innerHTML=names.map(x=>`<option>${x}</option>`).join("");convert();
  }
  function convert(){
    const v=parseFloat(input.value);if(Number.isNaN(v)){out.textContent="—";return}
    let r;
    if(type.value==="temperature"){
      const c=from.value==="celsius"?v:from.value==="fahrenheit"?(v-32)*5/9:v-273.15;
      r=to.value==="celsius"?c:to.value==="fahrenheit"?c*9/5+32:c+273.15;
    }else{
      const base=v*units[type.value][from.value];r=base/units[type.value][to.value];
    }
    out.textContent=`${formatNumber(r)} ${to.value}`;
  }
  type.onchange=fill;input.oninput=convert;from.onchange=convert;to.onchange=convert;fill();
}

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
render();
