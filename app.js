import{db,rupiah,finalPrice,el}from"./firebase.js";
import{collection,doc,query,where,onSnapshot,addDoc,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $=id=>document.getElementById(id);
const view=n=>["catalog","checkout","pay"].forEach(v=>{$(v).hidden=v!==n});
const note=(id,t)=>{const m=$(id);m.textContent=t||"";m.hidden=!t};
const fallback=$("banner").firstElementChild;
let pay={},cur=null,ord=null;
const logo=$("store-name"),calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
let shown="EpinStore",iv;
const setLogo=(t,anim)=>{
  clearInterval(iv);
  shown=t;
  if(!anim||calm)return void(logo.textContent=t);
  logo.textContent="";
  let i=0;
  iv=setInterval(()=>{logo.textContent=t.slice(0,++i);if(i>=t.length)clearInterval(iv)},90);
};
setTimeout(()=>{$("loader").classList.add("done");setLogo("EpinStore",true)},calm?0:600);

const CK="epn_products";
let got=false,cached=false;
function renderProducts(items){
  const box=$("products");
  box.replaceChildren();
  note("list-msg",items.length?"":"Produk belum tersedia.");
  items.forEach((p,i)=>{
    const c=el("article","card c"+(i%3));
    c.append(el("span","sticker",rupiah(finalPrice(p))+"/bln"),el("h3","",p.name),el("p","",p.desc||""));
    if(p.discount>0){
      const o=el("p","old");
      o.append(el("s","",rupiah(p.price))," diskon "+p.discount+"%");
      c.append(o);
    }
    const b=el("button","btn y","Checkout");
    b.type="button";
    b.onclick=()=>pick(p);
    c.append(b);
    box.append(c);
  });
}
try{const c=JSON.parse(localStorage.getItem(CK)||"null");if(Array.isArray(c)&&c.length){cached=true;renderProducts(c)}}catch{}
if(!cached)note("list-msg","Memuat produk...");
setTimeout(()=>{if(!got&&!cached)note("list-msg","Koneksi lambat. Masih mencoba memuat produk...")},6000);
onSnapshot(query(collection(db,"products"),where("active","==",true)),s=>{
  got=true;
  const items=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.sort||0)-(b.sort||0));
  try{localStorage.setItem(CK,JSON.stringify(items))}catch{}
  renderProducts(items);
},()=>{if(!got&&!cached)note("list-msg","Produk gagal dimuat. Muat ulang halaman.")});

onSnapshot(doc(db,"settings","banner"),s=>{
  const d=s.data(),b=$("banner");
  if(!d||!d.src||(d.type==="video"&&!/^https:\/\//.test(d.src)))return b.replaceChildren(fallback);
  let m;
  if(d.type==="video"){
    m=el("video");
    m.src=d.src;
    m.autoplay=m.loop=m.muted=m.defaultMuted=m.playsInline=true;
  }else{
    m=el("img");
    m.src=d.src;
    m.alt="Banner toko";
  }
  b.replaceChildren(m);
});

onSnapshot(doc(db,"settings","payment"),s=>{
  pay=s.data()||{};
  const n=pay.storeName||"EpinStore";
  if(n!==shown)setLogo(n,false);
  $("banner-title").textContent=n;
  document.title=n;
  if(ord)showPay();
});

function pick(p){
  cur=p;
  $("co-name").textContent=p.name;
  $("co-desc").textContent=p.desc||"";
  $("co-price").textContent=rupiah(finalPrice(p))+" per bulan";
  $("co-user").value="";
  note("co-msg","");
  view("checkout");
  scrollTo(0,0);
}

$("co-form").onsubmit=async e=>{
  e.preventDefault();
  const u=$("co-user").value.trim();
  if(!u)return note("co-msg","Username wajib diisi.");
  if(u.length>40)return note("co-msg","Username maksimal 40 karakter.");
  if(!/^[A-Za-z0-9_.-]+$/.test(u))return note("co-msg","Username hanya boleh huruf, angka, titik, strip, dan underscore.");
  const btn=$("co-submit");
  btn.disabled=true;
  btn.textContent="Memproses...";
  note("co-msg","");
  const o={code:"EPN-"+Math.random().toString(36).slice(2,7).toUpperCase(),username:u,productId:cur.id,productName:cur.name,total:finalPrice(cur),status:"baru",createdAt:serverTimestamp()};
  try{
    await addDoc(collection(db,"orders"),o);
    ord=o;
    showPay();
    view("pay");
    scrollTo(0,0);
  }catch{
    note("co-msg","Pesanan gagal dibuat. Cek koneksi lalu coba lagi.");
  }finally{
    btn.disabled=false;
    btn.textContent="Buat pesanan";
  }
};

function showPay(){
  $("pay-code").textContent=ord.code;
  $("pay-for").textContent=ord.productName+" untuk "+ord.username;
  $("pay-total").textContent=rupiah(ord.total);
  const q=$("qris");
  q.replaceChildren();
  if(pay.qris){
    const i=el("img");
    i.src=pay.qris;
    i.alt="QRIS pembayaran";
    q.append(i);
  }else q.textContent="QRIS belum diatur. Hubungi admin lewat WhatsApp.";
  let wa=String(pay.waNumber||"").replace(/\D/g,"");
  if(wa.startsWith("0"))wa="62"+wa.slice(1);
  const a=$("pay-wa");
  a.hidden=!wa;
  note("pay-msg",wa?"":"Nomor WhatsApp admin belum diatur. Catat kode order ini dan hubungi admin.");
  if(wa)a.href="https://wa.me/"+wa+"?text="+encodeURIComponent("Halo admin, saya konfirmasi pesanan.\nKode: "+ord.code+"\nProduk: "+ord.productName+"\nUsername: "+ord.username+"\nTotal: "+rupiah(ord.total));
}

$("co-back").onclick=()=>view("catalog");
$("pay-new").onclick=()=>{ord=null;view("catalog")};
