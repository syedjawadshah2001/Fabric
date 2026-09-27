"use client";
import { useEffect, useRef, useState } from "react";
function Link(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) { return <a {...props}/>; }
import sampleCatalog from "../data/catalog.json";

type Product=typeof sampleCatalog[number];
type Item={id:string;size:string;quantity:number};
const money=(n:number)=>"Rs. "+n.toLocaleString("en-PK");
async function api(path:string,data?:unknown):Promise<any>{
 let headers:Record<string,string>={};
 if(data){
  const session=await fetch("/api/session/",{cache:"no-store"});
  if(!session.ok) throw new Error("The store service is unavailable. Please try again shortly.");
  const s=await session.json() as {csrfToken:string};
  headers={"Content-Type":"application/json","X-CSRFToken":s.csrfToken};
 }
 const response=await fetch("/api/"+path+"/",{method:data?"POST":"GET",headers,body:data?JSON.stringify(data):undefined,cache:"no-store"});
 let result:any;
 try{result=await response.json();}catch{throw new Error("The service could not process your request. Please try again.");}
 if(!response.ok)throw new Error(result.error||"Something went wrong. Please try again.");
 return result;
}
function Icon({name}:{name:string}){
 return <span aria-hidden="true" className={"icon icon-"+name}>{({search:"⌕",bag:"♧",heart:"♡",arrow:"↗",close:"×",menu:"☰",minus:"−",plus:"+",check:"✓",user:"♙"} as Record<string,string>)[name]||name}</span>;
}
function Field({label,name,type="text",required=true,placeholder="",maxLength=150}:{label:string;name:string;type?:string;required?:boolean;placeholder?:string;maxLength?:number}){
 return <label className="field"><span>{label}</span><input name={name} type={type} required={required} placeholder={placeholder} maxLength={maxLength}/></label>;
}
export default function Store({view="home",slug=""}:{view?:string;slug?:string}){
 const [products,setProducts]=useState<Product[]>(sampleCatalog);
 const [live,setLive]=useState(false);
 const [bag,setBag]=useState<Item[]>([]);
 const [saved,setSaved]=useState<string[]>([]);
 const [ready,setReady]=useState(false);
 const [drawer,setDrawer]=useState(false);
 const [mobile,setMobile]=useState(false);
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState("All");
 const [fabric,setFabric]=useState("All");
 const [sort,setSort]=useState("featured");
 const [size,setSize]=useState("");
 const [sizeGuide,setSizeGuide]=useState(false);
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [result,setResult]=useState<any>(null);
 const [consent,setConsent]=useState(false);
 const [shippingFee,setShippingFee]=useState(250);
 const [freeThreshold,setFreeThreshold]=useState(10000);
 const [checkoutEnabled,setCheckoutEnabled]=useState(false);
 const orderKey=useRef("");
 const dialogRef=useRef<HTMLDialogElement>(null);
 const sizeDialogRef=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  try{
   const stored=JSON.parse(localStorage.getItem("kf-bag")||"[]");
   if(Array.isArray(stored))setBag(stored.filter((i:Item)=>i&&typeof i.id==="string"&&typeof i.size==="string"&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=10));
   const likes=JSON.parse(localStorage.getItem("kf-saved")||"[]");
   if(Array.isArray(likes))setSaved(likes.filter(i=>typeof i==="string"));
  }catch{}
  setReady(true);
  const params=new URLSearchParams(window.location.search);
  setCategory(params.get("category")||"All");setQuery(params.get("q")||"");
  api("catalog").then(d=>{setProducts(d.products);setLive(true);}).catch(()=>setLive(false));
  api("session").then(s=>{setShippingFee(s.shippingFee);setFreeThreshold(s.freeShippingThreshold);setCheckoutEnabled(s.checkoutEnabled);}).catch(()=>{});
 },[]);
 useEffect(()=>{if(ready){try{localStorage.setItem("kf-bag",JSON.stringify(bag));localStorage.setItem("kf-saved",JSON.stringify(saved));}catch{}}},[bag,saved,ready]);
 useEffect(()=>{if(notice){const timer=setTimeout(()=>setNotice(""),4000);return()=>clearTimeout(timer);}},[notice]);
 useEffect(()=>{const d=dialogRef.current;if(drawer&&!d?.open)d?.showModal();if(!drawer&&d?.open)d.close();},[drawer]);
 useEffect(()=>{const d=sizeDialogRef.current;if(sizeGuide&&!d?.open)d?.showModal();if(!sizeGuide&&d?.open)d.close();},[sizeGuide]);
 const selected=products.find(p=>p.id===slug);
 const bagRows=bag.map(i=>({...i,product:products.find(p=>p.id===i.id)}));
 const subtotal=bagRows.reduce((sum,i)=>sum+(i.product?.price||0)*i.quantity,0);
 const shipping=subtotal===0||subtotal>=freeThreshold?0:shippingFee;
 const count=bag.reduce((n,i)=>n+i.quantity,0);
 const toggleSave=(id:string)=>setSaved(prev=>prev.includes(id)?prev.filter(s=>s!==id):[...prev,id]);
 const add=(p:Product,chosen:string)=>{
  if(!chosen){setError("Please choose a size first.");return;}
  const stock=p.variants.find(v=>v.size===chosen)?.stock||0;
  const existing=bag.find(i=>i.id===p.id&&i.size===chosen)?.quantity||0;
  if(existing>=Math.min(stock,10)){setError("The available quantity is already in your bag.");return;}
  setBag(prev=>prev.some(i=>i.id===p.id&&i.size===chosen)?prev.map(i=>i.id===p.id&&i.size===chosen?{...i,quantity:i.quantity+1}:i):[...prev,{id:p.id,size:chosen,quantity:1}]);
  setError("");setDrawer(true);
 };
 const updateQuantity=(id:string,size:string,delta:number)=>{
  setBag(prev=>prev.map(i=>{
   if(i.id!==id||i.size!==size)return i;
   const stock=products.find(p=>p.id===id)?.variants.find(v=>v.size===size)?.stock||0;
   return {...i,quantity:Math.min(Math.max(0,stock),10,i.quantity+delta)};
  }).filter(i=>i.quantity>0));
 };
 const filtered=products.filter(p=>(category==="All"||p.category===category)&&(fabric==="All"||p.fabric===fabric)&&(`${p.name} ${p.fabric} ${p.color} ${p.category}`.toLowerCase().includes(query.toLowerCase())));
 if(sort==="low")filtered.sort((a,b)=>a.price-b.price);
 if(sort==="high")filtered.sort((a,b)=>b.price-a.price);
 const submit=async(event:React.FormEvent<HTMLFormElement>,endpoint:string)=>{
  event.preventDefault();setBusy(true);setError("");setResult(null);
  const form=event.currentTarget;
  const values=Object.fromEntries(new FormData(form));
  try{
   const response=await api(endpoint,values);setResult(response);
   if(endpoint==="contact")form.reset();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 };
 const Card=({p}:{p:Product})=><article className="product-card">
  <div className="product-image">
   <Link href={"/product/"+p.id}><img src={p.image} alt={p.name+" in "+p.color} loading="lazy" style={{objectPosition:p.imagePosition}}/></Link>
   {p.badge&&<span className="product-badge">{p.badge}</span>}
   <button className={"save-button "+(saved.includes(p.id)?"selected":"")} aria-label={(saved.includes(p.id)?"Remove ":"Save ")+p.name} onClick={()=>toggleSave(p.id)}><Icon name="heart"/></button>
   <Link className="quick-shop" href={"/product/"+p.id}>Discover piece <span>↗</span></Link>
  </div>
  <div className="product-meta"><span>{p.category} · {p.fabric}</span><i style={{background:({Sage:"#919580",Ivory:"#ded5bd",Rose:"#ba8d85",Forest:"#344b3e"} as any)[p.color]}}/></div>
  <Link href={"/product/"+p.id} className="product-name">{p.name}</Link><p className="price">{money(p.price)}</p>
 </article>;
 const BagItems=()=> <>{bagRows.map(i=><div className="bag-item" key={i.id+i.size}>
  {i.product&&<img src={i.product.image} alt={i.product.name} style={{objectPosition:i.product.imagePosition}}/>}
  <div><Link href={"/product/"+i.id}>{i.product?.name||"Unavailable item"}</Link><p>{i.size}</p><strong>{money((i.product?.price||0)*i.quantity)}</strong>
  <div className="quantity"><button aria-label={"Decrease "+i.product?.name} onClick={()=>updateQuantity(i.id,i.size,-1)}>−</button><span>{i.quantity}</span><button aria-label={"Increase "+i.product?.name} onClick={()=>updateQuantity(i.id,i.size,1)}>+</button><button className="remove" onClick={()=>setBag(prev=>prev.filter(v=>!(v.id===i.id&&v.size===i.size)))}>Remove</button></div></div>
 </div>)}</>;
 return <>
  <div className="announcement"><span>A new season. A beautiful beginning.</span><Link href="/shop">Discover the collection <span>↗</span></Link><span>PAKISTAN · PKR</span></div>
  <header>
   <div className="header-main"><div className="header-start"><button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={mobile} onClick={()=>setMobile(!mobile)}><Icon name="menu"/></button><Link className="header-small" href="/about">A considered way to dress</Link></div>
   <Link href="/" className="wordmark">KAHLID FABRIC<span>THE ART OF EVERYDAY ELEGANCE</span></Link>
   <div className="header-actions"><Link href="/shop?search=1" aria-label="Search collection"><Icon name="search"/></Link><Link href="/wishlist" aria-label={"Wishlist, "+saved.length+" pieces"}><Icon name="heart"/></Link><button onClick={()=>setDrawer(true)} aria-label={"Open shopping bag, "+count+" items"}><Icon name="bag"/><span className="bag-count">{count}</span></button></div></div>
   <nav className={mobile?"navigation open":"navigation"} aria-label="Main navigation"><Link href="/shop">New arrivals <span className="tiny-dot"/></Link><Link href="/shop?category=Unstitched">Unstitched</Link><Link href="/shop?category=Ready%20to%20wear">Ready to wear</Link><Link href="/shop?category=Luxury%20pret">Luxury pret</Link><Link href="/shop?category=Accessories">Accessories</Link><Link href="/about">Our story</Link></nav>
  </header>
  <main>
  {view==="home"&&<>
   <section className="hero">
    <img className="hero-photo" src="/images/hero.png" alt="Forest green embroidered ensemble in a sunlit sandstone courtyard" fetchPriority="high"/>
    <div className="hero-shade"/>
    <div className="hero-content"><span className="eyebrow">THE NEW SEASON EDIT · 2026</span><h1>Tradition, woven<br/>into <em>the everyday.</em></h1><p>Beautiful fabrics. Thoughtful details.<br/>Pieces that feel like you.</p><Link className="button cream" href="/shop">Explore the collection <Icon name="arrow"/></Link><span className="hero-note">A softer palette. A fresh perspective.</span></div>
    <div className="hero-bottom"><span>THE KAHLID FABRIC EDIT</span><span>01 <span className="slide-line"/> A NEW CHAPTER</span></div>
   </section>
   <div className="values-strip"><span>FABRIC AT THE HEART</span><i>✧</i><span>DETAILS THAT MAKE A DIFFERENCE</span><i>✧</i><span>MADE FOR YOUR EVERYDAY</span><i>✧</i><span>A WARDROBE, WELL CONSIDERED</span></div>
   <section className="section collection-section"><div className="section-heading"><div><span className="eyebrow">FIND YOUR EXPRESSION</span><h2>A collection for every you.</h2></div><Link className="text-link" href="/shop">Explore all collections ↗</Link></div>
    <div className="collection-grid">{[{title:"Unstitched",sub:"Your fabric. Your signature.",image:"/images/product-sage.png"},{title:"Ready to wear",sub:"Everyday, beautifully dressed.",image:"/images/product-ivory.png"},{title:"Luxury pret",sub:"For moments worth remembering.",image:"/images/hero.png"}].map((c,i)=><Link className={"collection-tile collection-"+i} href={"/shop?category="+encodeURIComponent(c.title)} key={c.title}><img src={c.image} alt={c.title+" collection"} loading="lazy"/><div><span>{c.sub}</span><h3>{c.title}<span>↗</span></h3></div></Link>)}</div>
   </section>
   <section className="section arrivals"><div className="section-heading"><div><span className="eyebrow">FRESH FROM THE EDIT</span><h2>Meet your new favourites.</h2></div><Link className="text-link" href="/shop">Shop new arrivals ↗</Link></div><div className="product-grid">{products.slice(0,4).map(p=><Card key={p.id} p={p}/>)}</div></section>
   <section className="story-band"><div className="story-photo"><img src="/images/product-sage.png" alt="A close look at the textures and embroidery of the season" loading="lazy"/><span>THE BEAUTY IS IN THE DETAILS</span></div><div className="story-copy"><span className="eyebrow">THE KAHLID FABRIC POINT OF VIEW</span><h2>Some things<br/>never go out<br/>of <em>feeling.</em></h2><p>The comfort of a favourite fabric. The quiet beauty of thoughtful detail. The confidence of something that feels entirely your own.</p><p>Our new chapter begins with a simple idea: make room for everyday elegance.</p><Link className="text-link" href="/about">Discover our story ↗</Link></div></section>
   <section className="service-grid"><div><span>01</span><h3>Find your fabric</h3><p>Explore by texture, colour, and the way you like to dress.</p></div><div><span>02</span><h3>Know your fit</h3><p>Clear size options and a guide to help you choose.</p></div><div><span>03</span><h3>Follow your order</h3><p>Your order reference keeps every update close at hand.</p><Link href="/track">Track an order ↗</Link></div></section>
  </>}
  {(view==="shop"||view==="wishlist")&&<section className="section shop-section"><div className="breadcrumb"><Link href="/">Home</Link> / {view==="wishlist"?"Wishlist":"The collection"}</div><div className="shop-heading"><span className="eyebrow">{view==="wishlist"?"SAVED FOR ANOTHER MOMENT":"THE KAHLID FABRIC WARDROBE"}</span><h1>{view==="wishlist"?"Your favourites.":"Considered pieces. Endless possibilities."}</h1><p>{view==="wishlist"?"A little collection of everything you love.":"Discover soft textures, rich colour, and details that make a piece your own."}</p></div>
   {view==="shop"&&<><div className="filter-tabs">{["All","Unstitched","Ready to wear","Luxury pret","Accessories"].map(c=><button className={category===c?"active":""} key={c} onClick={()=>setCategory(c)}>{c==="All"?"All pieces":c}</button>)}</div><div className="shop-toolbar"><label className="search-field"><Icon name="search"/><input aria-label="Search products" placeholder="Search pieces, fabrics, colours…" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Fabric <select value={fabric} onChange={e=>setFabric(e.target.value)}>{["All","Lawn","Cotton","Silk blend","Voile"].map(f=><option key={f}>{f}</option>)}</select></label><label>Sort <select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></div></>}
   <p className="results-count">{(view==="wishlist"?products.filter(p=>saved.includes(p.id)):filtered).length} pieces</p>
   <div className="product-grid">{(view==="wishlist"?products.filter(p=>saved.includes(p.id)):filtered).map(p=><Card key={p.id} p={p}/>)}</div>
   {(view==="wishlist"?products.filter(p=>saved.includes(p.id)):filtered).length===0&&<div className="empty-state"><h2>{view==="wishlist"?"A little inspiration awaits.":"No pieces found."}</h2><p>{view==="wishlist"?"Tap the heart on any piece to save it here.":"Try another colour, fabric, or collection."}</p><Link className="button" href="/shop">Explore the collection ↗</Link></div>}
  </section>}
  {view==="product"&&<section className="section">{selected?<><div className="breadcrumb"><Link href="/">Home</Link> / <Link href="/shop">Collection</Link> / {selected.name}</div><div className="product-detail"><div className="detail-image"><img src={selected.image} alt={selected.name} style={{objectPosition:selected.imagePosition}}/>{selected.sample&&<span>Collection concept · preview imagery</span>}</div><div className="detail-info"><span className="eyebrow">{selected.category} / {selected.fabric}</span><h1>{selected.name}</h1><p className="detail-price">{money(selected.price)}</p><p className="detail-description">{selected.description}</p><div className="detail-line">Colour <strong>{selected.color}</strong></div><div className="size-label"><span>Choose your size</span><button onClick={()=>setSizeGuide(true)}>Size guide ↗</button></div><div className="sizes">{selected.variants.map(v=><button disabled={!v.stock} className={size===v.size?"active":""} aria-pressed={size===v.size} key={v.size} onClick={()=>{setSize(v.size);setError("");}}>{v.size}</button>)}</div><p className="stock-note">{size?(selected.variants.find(v=>v.size===size)?.stock||0)+" available in this size":"Select a size to check availability"}</p>{error&&<p role="alert" className="error">{error}</p>}<div className="product-buttons"><button className="button" onClick={()=>add(selected,size)}>Add to bag <span>↗</span></button><button className="outline-button" aria-label="Save this piece" onClick={()=>toggleSave(selected.id)}>{saved.includes(selected.id)?"♥":"♡"}</button></div><div className="detail-accordions"><details open><summary>Fabric & care</summary><p>{selected.fabric}. For this concept collection, care specifications will be confirmed with the final product label. Actual colours can vary by screen.</p></details><details><summary>Delivery & returns</summary><p>This is a preview store. Sample orders are for testing only. Final delivery and return terms will be published before real orders open.</p><Link href="/policies">Read store policies ↗</Link></details><details><summary>Need a hand?</summary><p>Ask us about the fabric, fit, or your order.</p><Link href="/contact">Contact the team ↗</Link></details></div></div></div><div className="section-heading related-heading"><div><span className="eyebrow">A LITTLE MORE INSPIRATION</span><h2>You may also love.</h2></div></div><div className="product-grid">{products.filter(p=>p.id!==selected.id).slice(0,4).map(p=><Card key={p.id} p={p}/>)}</div></>:<div className="empty-state"><h1>We couldn't find this piece.</h1><Link href="/shop">Back to the collection ↗</Link></div>}</section>}
  {view==="checkout"&&<section className="section narrow-section"><div className="breadcrumb"><Link href="/shop">Collection</Link> / Checkout</div><h1>Your next favourite,<br/><em>one step closer.</em></h1>{result?<div className="success-panel" role="status"><span className="success-mark">✓</span><h2>{result.is_test?"Test order received.":"Your order is received."}</h2><p>{result.is_test?"This is a test order. No payment was taken and no products will be dispatched.":"Your order is awaiting confirmation."}</p><p className="order-reference">{result.reference}</p><p>Total: {money(result.total)}</p><p>Save your reference and use your email to follow its progress.</p><Link className="button" href="/track">Track your order ↗</Link></div>:!bag.length?<div className="empty-state"><h2>Your bag is waiting.</h2><Link className="button" href="/shop">Discover the collection ↗</Link></div>:<div className="checkout-grid"><form onSubmit={async e=>{e.preventDefault();setError("");setBusy(true);if(!orderKey.current)orderKey.current=crypto.randomUUID();try{const values=Object.fromEntries(new FormData(e.currentTarget));const order=await api("orders",{...values,items:bag,idempotencyKey:orderKey.current});setResult(order);setBag([]);}catch(err){setError((err as Error).message);}finally{setBusy(false);}}}><div className="preview-note">Preview checkout — sample orders only. No payment is collected.</div><h3>Contact details</h3><Field name="name" label="Full name" maxLength={120}/><div className="field-row"><Field name="email" label="Email address" type="email"/><Field name="phone" label="Phone number" type="tel" maxLength={25}/></div><h3>Delivery address</h3><Field name="address" label="Street address, house & area" maxLength={500}/><Field name="city" label="City" maxLength={100}/><p className="muted">Country: Pakistan</p><h3>Payment</h3><div className="payment-option"><span>◉ Cash on delivery</span><small>Test mode · no charge</small></div><label className="checkbox"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/><span>I understand this is a sample order and have read the <Link href="/policies">store policies</Link>.</span></label>{error&&<p className="error" role="alert">{error}</p>}{!live&&<p className="error">The order service is unavailable. Your bag is saved on this device.</p>}<button disabled={busy||!live||!checkoutEnabled||!consent} className="button full" type="submit">{busy?"Placing your order…":"Place sample order"} <span>↗</span></button></form><aside className="order-summary"><h3>Your bag <span>({count})</span></h3><BagItems/><div className="summary-row"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-row"><span>Delivery</span><span>{shipping?money(shipping):"Complimentary"}</span></div><div className="summary-row total"><span>Total</span><span>{money(subtotal+shipping)}</span></div><p className="muted">Final totals and stock are checked by the store when you order.</p></aside></div>}</section>}
  {view==="track"&&<section className="section form-page"><span className="eyebrow">EVERY STEP OF THE WAY</span><h1>Follow your order.</h1><p>Enter your full order reference and the email used at checkout.</p><form onSubmit={e=>submit(e,"track")}><Field name="reference" label="Order reference" placeholder="Your full order reference"/><Field name="email" label="Email address" type="email"/><button className="button full" disabled={busy}>{busy?"Finding your order…":"Find my order ↗"}</button></form>{error&&<p className="error" role="alert">{error}</p>}{result&&<div className="success-panel"><span className="eyebrow">{result.is_test?"SAMPLE ORDER":"ORDER UPDATE"}</span><h2>{result.status.charAt(0).toUpperCase()+result.status.slice(1)}</h2>{result.items.map((i:any,index:number)=><p key={index}>{i.name} · {i.size} × {i.quantity}</p>)}<strong>{money(result.total)}</strong></div>}</section>}
  {view==="contact"&&<section className="section form-page"><span className="eyebrow">LET'S TALK</span><h1>A little help,<br/>a personal touch.</h1><p>Questions about a piece or an order? Leave a message for the store team.</p><form onSubmit={e=>submit(e,"contact")}><Field name="name" label="Your name" maxLength={120}/><Field name="email" label="Email address" type="email"/><label className="field"><span>Your message</span><textarea name="message" required minLength={10} maxLength={3000} rows={5}/></label><button className="button full" disabled={busy}>{busy?"Sending…":"Send message ↗"}</button></form>{error&&<p role="alert" className="error">{error}</p>}{result&&<p className="success-panel" role="status">{result.message}</p>}<p className="muted">Preview store: messages are saved for review in store management.</p></section>}
  {view==="about"&&<><section className="about-hero"><img src="/images/hero.png" alt="Forest green fabric in a warm courtyard"/><div><span className="eyebrow">OUR NEW CHAPTER</span><h1>Rooted in tradition.<br/><em>Made personal.</em></h1></div></section><section className="section editorial-copy"><span className="eyebrow">KAHLID FABRIC</span><h2>Good style begins<br/>with a feeling.</h2><p>The texture you reach for. The colour that lifts your day. The small detail that makes something ordinary feel special.</p><p>KAHLID FABRIC is a new expression of everyday elegance, bringing together unstitched fabrics, ready-to-wear silhouettes and occasion-inspired pieces in one considered wardrobe.</p><p>This preview introduces the direction of our first collection. Our final catalog and store information will be announced before launch.</p><Link className="button" href="/shop">Explore the edit ↗</Link></section></>}
  {view==="policies"&&<section className="section editorial-copy policies"><span className="eyebrow">CLEAR FROM THE START</span><h1>Store information.</h1><div className="preview-note">The store is in preview. Products, stock, prices and imagery are samples. Real purchasing is not yet open.</div><h2>Orders & payment</h2><p>Local preview checkout records test orders only. No money is collected and no goods are shipped. Cash on delivery is the planned payment option. Online payment options will be announced once available.</p><h2>Delivery</h2><p>The preview calculates delivery at Rs. 250, or complimentary for orders of Rs. 10,000 and above. These are demonstration settings, not a confirmed delivery offer. Final areas, charges and timelines will be published before launch.</p><h2>Returns & exchanges</h2><p>Final return eligibility, reporting periods and refund terms are awaiting confirmation by the store owner. Sample orders have no payment to refund. Please use the contact form with questions.</p><h2>Your information</h2><p>Checkout stores the name, email, phone, delivery address and items you submit. Contact messages and newsletter subscriptions are saved for the store team. Your bag and favourites are stored on this device. Do not enter real sensitive information into this preview.</p><p>Newsletter enrollment requires your consent. To request removal of submitted information, contact the store team through the contact form. No marketing email is sent automatically by this preview.</p><Link className="text-link" href="/contact">Contact the store ↗</Link></section>}
  </main>
  <section className="newsletter"><div><span className="eyebrow">LET GOOD THINGS FIND YOU</span><h2>A little inspiration, in your inbox.</h2><p>Collection notes, new arrivals, and a fresh perspective.</p></div><form onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const fd=new FormData(form);try{const r=await api("newsletter",{email:fd.get("email"),consent:fd.get("consent")==="on"});setNotice(r.message);form.reset();}catch(err){setNotice((err as Error).message);}}}><div className="newsletter-input"><input name="email" type="email" aria-label="Email for newsletter" placeholder="Your email address" required/><button aria-label="Subscribe to newsletter">↗</button></div><label className="checkbox"><input name="consent" type="checkbox" required/><span>I agree to receive collection updates. <Link href="/policies">Privacy information</Link></span></label></form></section>
  <footer><div className="footer-main"><div className="footer-brand"><Link href="/" className="wordmark">KAHLID FABRIC</Link><p>Tradition, woven into the everyday.</p><span>Beautiful fabrics. Thoughtful living.</span></div><div><h4>THE COLLECTION</h4><Link href="/shop">All pieces</Link><Link href="/shop?category=Unstitched">Unstitched</Link><Link href="/shop?category=Ready%20to%20wear">Ready to wear</Link><Link href="/shop?category=Luxury%20pret">Luxury pret</Link></div><div><h4>HERE TO HELP</h4><Link href="/contact">Contact us</Link><Link href="/track">Track your order</Link><Link href="/policies">Delivery & returns</Link><Link href="/wishlist">Your wishlist</Link></div><div><h4>OUR WORLD</h4><Link href="/about">Our story</Link><Link href="/policies">Privacy & store policies</Link><p>PAKISTAN · PKR</p></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} KAHLID FABRIC</span><span>Collection preview · Sample products & imagery</span><span>CONSIDERED. TIMELESS. YOURS.</span></div></footer>
  <dialog ref={dialogRef} className="bag-dialog" onCancel={()=>setDrawer(false)} onClick={e=>{if(e.target===dialogRef.current)setDrawer(false);}}><div className="drawer-content"><div className="drawer-heading"><h2>Your bag <small>({count})</small></h2><button aria-label="Close shopping bag" onClick={()=>setDrawer(false)}>×</button></div>{bag.length?<><p className="bag-shipping">{subtotal>=freeThreshold?"Your sample order qualifies for complimentary delivery.":money(freeThreshold-subtotal)+" away from complimentary delivery."}</p><BagItems/><div className="drawer-bottom"><div className="summary-row total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Delivery calculated at checkout.</p><Link className="button full" href="/checkout" onClick={()=>setDrawer(false)}>Continue to checkout ↗</Link><button className="continue-shopping" onClick={()=>setDrawer(false)}>Continue exploring</button></div></>:<div className="empty-state"><span className="empty-bag">♧</span><h2>A little room for<br/>something beautiful.</h2><p>Your bag is currently empty.</p><Link className="button" href="/shop" onClick={()=>setDrawer(false)}>Explore the collection ↗</Link></div>}</div></dialog>
  <dialog ref={sizeDialogRef} className="size-dialog" onCancel={()=>setSizeGuide(false)}><button className="close-size" aria-label="Close size guide" onClick={()=>setSizeGuide(false)}>×</button><span className="eyebrow">FIND YOUR FIT</span><h2>A guide to your size.</h2><p>Preview measurements, in inches. Final garment measurements will be confirmed before launch.</p><table><thead><tr><th>Size</th><th>Chest</th><th>Waist</th><th>Hip</th></tr></thead><tbody>{[["S","36","30","38"],["M","38","32","40"],["L","40","34","42"],["XL","42","36","44"]].map(row=><tr key={row[0]}>{row.map((cell,i)=><td key={i}>{cell}</td>)}</tr>)}</tbody></table><p>Measure around your body, keeping the tape comfortably level. Unstitched pieces are supplied as fabric.</p></dialog>
  {notice&&<div className="toast" role="status">{notice}<button aria-label="Dismiss notification" onClick={()=>setNotice("")}>×</button></div>}
 </>;
}
