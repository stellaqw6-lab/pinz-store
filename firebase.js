import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getFirestore}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import{getAuth}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{initializeAppCheck,ReCaptchaV3Provider}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js";

const firebaseConfig={
  apiKey:"AIzaSyDK-xv0vZnhNDS1h7xXHJDgv-_L4vsjtdM",
  authDomain:"pinz-store.firebaseapp.com",
  projectId:"pinz-store",
  storageBucket:"pinz-store.firebasestorage.app",
  messagingSenderId:"266332574029",
  appId:"1:266332574029:web:b3d3f2468a68cfe85fe704"
};
export const RECAPTCHA_SITE_KEY="ISI_SITE_KEY";
export const OWNER_EMAIL="pinzxoxyofficial@gmail.com";

const app=initializeApp(firebaseConfig);

// App Check: memastikan permintaan ke Firestore datang dari situs asli, bukan skrip spam.
if(RECAPTCHA_SITE_KEY&&!RECAPTCHA_SITE_KEY.startsWith("ISI_")){
  if(["localhost","127.0.0.1"].includes(location.hostname))self.FIREBASE_APPCHECK_DEBUG_TOKEN=true;
  initializeAppCheck(app,{provider:new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),isTokenAutoRefreshEnabled:true});
}
export const db=getFirestore(app);
export const auth=getAuth(app);

export const rupiah=n=>"Rp"+Number(n).toLocaleString("id-ID");
export const finalPrice=p=>Math.floor(p.price*(100-p.discount)/100);
export const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};

export function compressImage(file,maxW,q){
  return new Promise((ok,fail)=>{
    const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{
      const s=Math.min(1,maxW/img.width),c=document.createElement("canvas");
      c.width=Math.round(img.width*s);c.height=Math.round(img.height*s);
      const x=c.getContext("2d");
      x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);
      x.drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      const out=c.toDataURL("image/jpeg",q);
      out.length>900000?fail(new Error("Gambar terlalu besar. Pakai gambar yang lebih kecil.")):ok(out);
    };
    img.onerror=()=>fail(new Error("File bukan gambar yang valid."));
    img.src=url;
  });
}
