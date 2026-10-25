import{app,db,OWNER_EMAIL,rupiah,finalPrice,el}from"./firebase.js";
import{getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{collection,doc,query,orderBy,onSnapshot,addDoc,setDoc,updateDoc,deleteDoc,deleteField}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const auth=getAuth(app);
const $=id=>document.getElementById(id);
const note=(id,t,bad=true)=>{const m=$(id);m.textContent=t||"";m.hidden=!t;m.classList.toggle("err",bad)};
const errText=e=>e.code==="permission-denied"?"Akses ditolak. Pasang firestore.rules dan masuk dengan akun owner.":String(e.code||"").startsWith("auth/")?"Email atau password salah.":e.message||"Gagal. Coba lagi.";
const btn=(label,cls,fn)=>{const b=el("button","btn "+cls,label);b.type="button";b.onclick=fn;return b};

async function run(b,id,ok,fn){
  const t=b.textContent;
  b.disabled=true;
  b.textContent="Memproses...";
  note(id,"");
  try{await Promise.race([fn(),new Promise((_,no)=>setTimeout(()=>no(new Error("Koneksi lambat atau terputus. Coba lagi.")),25000))]);note(id,ok,false)}
  catch(e){note(id,errText(e))}
  finally{b.disabled=false;b.textContent=t}
}

const IMGBB_KEY="a5270d0be7d20cb544671d7af99819cc";
let subs=[],prods=[],bn=null,pm={};

onAuthStateChanged(auth,u=>{
  const owner=!!(u&&u.email&&u.email.toLowerCase()===OWNER_EMAIL.toLowerCase());
  $("login").hidden=owner;
  $("dash").hidden=!owner;
  $("logout").hidden=!owner;
  subs.forEach(f=>f());
  subs=[];
  if(owner)start();
  else if(u){signOut(auth);note("login-msg","Akun ini bukan owner.")}
});

$("login-form").onsubmit=e=>{
  e.preventDefault();
  run($("login-btn"),"login-msg","",()=>signInWithEmailAndPassword(auth,$("l-email").value.trim(),$("l-pass").value));
};
$("logout").onclick=()=>signOut(auth);

function start(){
  subs.push(onSnapshot(collection(db,"products"),s=>{
    prods=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.sort||0)-(b.sort||0));
    renderProds();
  },e=>note("p-msg",errText(e))));
  subs.push(onSnapshot(doc(db,"settings","banner"),s=>{bn=s.data()||null;renderBanner()}));
  subs.push(onSnapshot(doc(db,"settings","payment"),s=>{pm=s.data()||{};fillPay()}));
  subs.push(onSnapshot(query(collection(db,"orders"),orderBy("createdAt","desc")),renderOrders,e=>note("o-msg",errText(e))));
}

function resetForm(){
  $("p-form").reset();
  $("p-id").value="";
  $("p-active").checked=true;
}
$("p-reset").onclick=resetForm;

$("p-form").onsubmit=e=>{
  e.preventDefault();
  const name=$("p-name").value.trim(),price=parseInt($("p-price").value,10),discount=parseInt($("p-disc").value||"0",10),sort=parseInt($("p-sort").value||"0",10);
  if(!name)return note("p-msg","Nama produk wajib diisi.");
  if(!(price>0))return note("p-msg","Harga harus lebih dari 0.");
  if(!(discount>=0&&discount<=100))return note("p-msg","Diskon harus antara 0 dan 100.");
  const d={name,desc:$("p-desc").value.trim(),price,discount,sort:sort||0,active:$("p-active").checked},id=$("p-id").value;
  run($("p-save"),"p-msg","Produk disimpan.",async()=>{
    if(id)await setDoc(doc(db,"products",id),d);
    else await addDoc(collection(db,"products"),d);
    resetForm();
  });
};

function renderProds(){
  const l=$("p-list");
  l.replaceChildren();
  if(!prods.length)return l.append(el("p","","Belum ada produk. Isi form di atas."));
  prods.forEach(p=>{
    const r=el("div","row"),t=el("div","grow");
    t.append(el("strong","",p.name),el("br"),el("span","",rupiah(finalPrice(p))+(p.discount?", diskon "+p.discount+"%":"")+(p.active?", aktif":", nonaktif")));
    const fail=e=>note("p-msg",errText(e));
    r.append(t,
      btn("Ubah","b",()=>{
        $("p-id").value=p.id;
        $("p-name").value=p.name;
        $("p-desc").value=p.desc||"";
        $("p-price").value=p.price;
        $("p-disc").value=p.discount||0;
        $("p-sort").value=p.sort||0;
        $("p-active").checked=!!p.active;
        $("p-form").scrollIntoView();
      }),
      btn(p.active?"Nonaktifkan":"Aktifkan","",()=>updateDoc(doc(db,"products",p.id),{active:!p.active}).catch(fail)),
      btn("Hapus","p",()=>confirm("Hapus produk "+p.name+"?")&&deleteDoc(doc(db,"products",p.id)).catch(fail))
    );
    l.append(r);
  });
}

function preview(box,type,src){
  box.replaceChildren();
  box.hidden=!src;
  if(!src)return;
  let m;
  if(type==="video"){m=el("video");m.src=src;m.controls=true;m.muted=true}
  else{m=el("img");m.src=src;m.alt="Preview"}
  box.append(m);
}
const bType=()=>document.querySelector("input[name=b-type]:checked").value;

function renderBanner(){
  if(!bn)return preview($("b-prev"),"image","");
  document.querySelector("input[name=b-type][value="+(bn.type==="video"?"video":"image")+"]").checked=true;
  $("b-url").value=bn.type==="video"?bn.src:"";
  preview($("b-prev"),bn.type,bn.src);
}
$("b-file").onchange=e=>{
  const f=e.target.files[0];
  if(f)preview($("b-prev"),"image",URL.createObjectURL(f));
};

$("b-save").onclick=()=>run($("b-save"),"b-msg","Banner disimpan.",async()=>{
  const type=bType(),f=$("b-file").files[0];
  let src;
  if(type==="video"){
    src=$("b-url").value.trim();
    if(!/^https:\/\/\S+$/.test(src))throw new Error("Link video harus diawali https://");
  }else if(f)src=await uploadImgbb(f,IMGBB_KEY);
  else if(bn&&bn.type==="image"&&/^https:\/\//.test(bn.src))src=bn.src;
  else throw new Error("Pilih gambar banner dulu.");
  if(src.length>500)throw new Error("Link banner terlalu panjang.");
  await setDoc(doc(db,"settings","banner"),{type,src});
  $("b-file").value="";
});
$("b-del").onclick=()=>confirm("Hapus banner?")&&run($("b-del"),"b-msg","Banner dihapus.",()=>deleteDoc(doc(db,"settings","banner")));

function fillPay(){
  $("m-store").value=pm.storeName||"";
  $("m-wa").value=pm.waNumber||"";
  $("m-url").value=/^https:\/\//.test(pm.qris||"")?pm.qris:"";
  preview($("m-prev"),"image",pm.qris||"");
}
$("m-url").oninput=e=>{
  const u=e.target.value.trim();
  preview($("m-prev"),"image",/^https:\/\/\S+$/.test(u)?u:"");
};
$("m-file").onchange=e=>{
  const f=e.target.files[0];
  if(f)preview($("m-prev"),"image",URL.createObjectURL(f));
};

async function shrink(f,maxW,q){
  try{
    const url=URL.createObjectURL(f);
    const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url});
    const s=Math.min(1,maxW/img.width),c=document.createElement("canvas");
    c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
    const x=c.getContext("2d");
    x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);
    x.drawImage(img,0,0,c.width,c.height);
    URL.revokeObjectURL(url);
    const b=await new Promise(ok=>c.toBlob(ok,"image/jpeg",q));
    return b&&b.size<f.size?b:f;
  }catch{return f}
}

async function uploadImgbb(f,key){
  if(f.size>20*1024*1024)throw new Error("Gambar terlalu besar.");
  const blob=await shrink(f,1200,.9),fd=new FormData(),ac=new AbortController(),tm=setTimeout(()=>ac.abort(),20000);
  fd.append("image",blob,"img.jpg");
  let r;
  try{r=await fetch("https://api.imgbb.com/1/upload?key="+encodeURIComponent(key),{method:"POST",body:fd,signal:ac.signal})}
  catch(e){throw new Error(e.name==="AbortError"?"Upload ke ImgBB terlalu lama. Coba lagi atau pakai gambar lebih kecil.":"Upload ke ImgBB gagal. Cek koneksi.")}
  finally{clearTimeout(tm)}
  const j=await r.json().catch(()=>null),url=j&&j.success&&j.data&&(j.data.url||j.data.display_url);
  if(!url)throw new Error((j&&j.error&&j.error.message)||"Upload ke ImgBB gagal.");
  return url;
}

$("m-save").onclick=()=>run($("m-save"),"m-msg","Pembayaran disimpan.",async()=>{
  let wa=$("m-wa").value.replace(/\D/g,"");
  if(wa.startsWith("0"))wa="62"+wa.slice(1);
  if(wa.length<10||wa.length>15)throw new Error("Nomor WhatsApp tidak valid. Contoh: 6285545153532");
  const d={storeName:$("m-store").value.trim()||"EpinStore",waNumber:wa},f=$("m-file").files[0];
  let q=$("m-url").value.trim();
  if(f){
    q=await uploadImgbb(f,IMGBB_KEY);
    $("m-url").value=q;
    $("m-file").value="";
  }
  if(q&&!/^https:\/\/\S+$/.test(q))throw new Error("Link QRIS harus diawali https://");
  if(q.length>500)throw new Error("Link QRIS terlalu panjang.");
  d.qris=q||deleteField();
  await setDoc(doc(db,"settings","payment"),d,{merge:true});
});

function renderOrders(s){
  const l=$("o-list");
  l.replaceChildren();
  note("o-msg","");
  if(s.empty)return l.append(el("p","","Belum ada pesanan."));
  s.forEach(d=>{
    const o=d.data(),r=el("div","row"),t=el("div","grow"),fail=e=>note("o-msg",errText(e));
    t.append(el("strong","",o.code+", "+rupiah(o.total)),el("br"),el("span","",o.productName+", username: "+o.username),el("br"),el("small","",o.createdAt?o.createdAt.toDate().toLocaleString("id-ID"):"baru saja"));
    const sel=el("select");
    ["baru","dibayar","selesai"].forEach(v=>{const op=el("option","",v);op.value=v;sel.append(op)});
    sel.value=o.status;
    sel.onchange=()=>updateDoc(d.ref,{status:sel.value}).catch(fail);
    r.append(t,sel,btn("Hapus","p",()=>confirm("Hapus pesanan "+o.code+"?")&&deleteDoc(d.ref).catch(fail)));
    l.append(r);
  });
}
