"use client";
import {useEffect,useState,type FormEvent} from "react";
export type CustomerAccount={name:string;email:string};
export async function accountRequest(action:string,data?:Record<string,string>){
 let headers:Record<string,string>={};
 if(data){
  const session=await fetch("/api/session/",{cache:"no-store",credentials:"same-origin"});
  if(!session.ok)throw new Error("Account service is temporarily unavailable. Please try again.");
  const token=await session.json() as {csrfToken:string};
  headers={"Content-Type":"application/json","X-CSRFToken":token.csrfToken};
 }
 const response=await fetch("/api/"+action+"/",{method:data?"POST":"GET",headers,body:data?JSON.stringify(data):undefined,cache:"no-store",credentials:"same-origin"});
 let result:{customer?:CustomerAccount;error?:string};
 try{result=await response.json() as typeof result;}catch{throw new Error("Please refresh the page and try again.");}
 if(!response.ok)throw new Error(result.error||"Account service is temporarily unavailable. Please try again.");
 return result;
}
export function AuthForm({onSuccess,initial="login",shopping=false}:{onSuccess:(customer:CustomerAccount)=>void;initial?:string;shopping?:boolean}){
 const [mode,setMode]=useState(initial),[busy,setBusy]=useState(false),[error,setError]=useState(""),[show,setShow]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setError("");
  const form=new FormData(e.currentTarget);
  const values=Object.fromEntries(form.entries()) as Record<string,string>;
  if(mode==="signup"&&values.password!==values.confirm){setError("Your passwords do not match.");return;}
  setBusy(true);
  try{const result=await accountRequest(mode,values);if(result.customer)onSuccess(result.customer);}
  catch(e){setError(e instanceof Error?e.message:"Please try again.");}
  finally{setBusy(false);}
 }
 return <div className="auth-form"><span className="eyebrow">YOUR KAHLID FABRIC ACCOUNT</span><h2>{mode==="signup"?"A little more you.":"Welcome back."}</h2><p className="auth-intro">{shopping?"Sign in or create an account to add this design to your bag. Your selection is waiting.":"Your next occasion starts here. Sign in to shop the velvet collection."}</p><div className="auth-tabs"><button type="button" disabled={busy} aria-pressed={mode==="login"} onClick={()=>{setMode("login");setError("");}}>Log in</button><button type="button" disabled={busy} aria-pressed={mode==="signup"} onClick={()=>{setMode("signup");setError("");}}>Create account</button></div><form onSubmit={submit}>
 {mode==="signup"&&<label className="field"><span>Full name</span><input name="name" autoComplete="name" maxLength={150} required/></label>}
 <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="email" maxLength={254} required/></label>
 <label className="field"><span>Password</span><div className="password-field"><input name="password" type={show?"text":"password"} autoComplete={mode==="signup"?"new-password":"current-password"} minLength={mode==="signup"?8:1} maxLength={128} required/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Hide password":"Show password"}>{show?"Hide":"Show"}</button></div></label>
 {mode==="signup"&&<><p className="auth-hint">Use at least 8 characters. Avoid common passwords or only numbers.</p><label className="field"><span>Confirm password</span><input name="confirm" type={show?"text":"password"} autoComplete="new-password" maxLength={128} required/></label></>}
 {error&&<p className="error" role="alert">{error}</p>}
 <button disabled={busy} className="button full" type="submit">{busy?"Please wait…":mode==="signup"?"Create account & continue":"Log in & continue"}<span>→</span></button>
 </form><p className="auth-hint">{mode==="signup"?"No email verification required. ":""}By continuing, you agree to our <a href="/policies">store policies</a>.</p></div>;
}
export default function CustomerAccountPage({initial="login"}:{initial?:string}){
 const [customer,setCustomer]=useState<CustomerAccount|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{fetch("/api/account/",{cache:"no-store"}).then(async r=>{if(r.status===401)return;if(!r.ok)throw new Error("Account service is temporarily unavailable. Please try again.");const data=await r.json() as {customer:CustomerAccount};setCustomer(data.customer);}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
 async function signout(){setBusy(true);setError("");try{await accountRequest("logout",{});setCustomer(null);}catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}}
 return <section className="account-section"><div className="account-editorial"><img src="/catalog/catalog_06.jpg" alt="Velvet occasion design from the Khalid collection"/><div><span className="eyebrow">THE ART OF OCCASION DRESSING</span><h1>Beautiful choices.<br/><em>Made yours.</em></h1><p>43 velvet designs. Rs. 7,500 each.</p></div></div><div className="account-content">{error&&<p role="alert" className="error">{error}</p>}{loading?<p role="status">Opening your account…</p>:customer?<div className="auth-form"><span className="eyebrow">YOUR ACCOUNT</span><h2>Hello, {customer.name}.</h2><p>{customer.email}</p><p>Discover your next velvet favourite and add it to your bag. Khalid confirms availability and delivery on WhatsApp.</p><a href="/shop" className="button full">Explore the collection <span>→</span></a><a href="/wishlist" className="text-link">View this device’s wishlist</a><p className="auth-hint">Your bag and wishlist are saved on this browser. For updates on WhatsApp orders, contact Khalid directly.</p><button className="outline-button" onClick={signout} disabled={busy}>{busy?"Signing out…":"Log out"}</button></div>:<AuthForm initial={initial} onSuccess={c=>{setCustomer(c);setError("");}}/>}</div></section>;
}
