import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getDatabase}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig={
  apiKey:"AIzaSyDK-xv0vZnhNDS1h7xXHJDgv-_L4vsjtdM",
  authDomain:"pinz-store.firebaseapp.com",
  databaseURL:"https://pinz-store-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:"pinz-store",
  storageBucket:"pinz-store.firebasestorage.app",
  messagingSenderId:"266332574029",
  appId:"1:266332574029:web:b3d3f2468a68cfe85fe704"
};
export const RECAPTCHA_SITE_KEY="ISI_SITE_KEY";
export const OWNER_EMAIL="pinzxoxyofficial@gmail.com";

export const app=initializeApp(firebaseConfig);

// App Check hanya dimuat kalau site key sudah diisi (supaya situs tidak lambat).
if(RECAPTCHA_SITE_KEY&&!RECAPTCHA_SITE_KEY.startsWith("ISI_")){
  const{initializeAppCheck,ReCaptchaV3Provider}=await import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js");
  if(["localhost","127.0.0.1"].includes(location.hostname))self.FIREBASE_APPCHECK_DEBUG_TOKEN=true;
  initializeAppCheck(app,{provider:new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),isTokenAutoRefreshEnabled:true});
}

export const db=getDatabase(app);

export const rupiah=n=>"Rp"+Number(n).toLocaleString("id-ID");
export const finalPrice=p=>Math.floor(p.price*(100-p.discount)/100);
export const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
