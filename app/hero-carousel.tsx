"use client";
import {useEffect,useRef,useState} from "react";
type Slide={eyebrow:string;title:string;accent:string;description:string;images:string[];color:string;href:string};
const slides:Slide[]=[
 {eyebrow:"THE VELVET COLLECTION",title:"An evening",accent:"to remember.",description:"Rich velvet. Beautiful detail. A collection that makes every occasion feel a little more special.",images:["/catalog/catalog_04.jpg","/catalog/catalog_06.jpg"],color:"Burgundy",href:"/shop?color=Burgundy"},
 {eyebrow:"THE JEWEL-TONE EDIT",title:"A deeper shade",accent:"of beautiful.",description:"Discover emerald and teal colour stories. Unstitched velvet, ready for your own expression.",images:["/catalog/catalog_22.jpg","/catalog/catalog_24.jpg"],color:"Emerald",href:"/shop?color=Emerald"},
 {eyebrow:"THE AFTER-DARK EDIT",title:"Quietly bold.",accent:"Always timeless.",description:"Midnight tones and considered details. Find the design that feels entirely your own.",images:["/catalog/catalog_01.jpg","/catalog/catalog_05.jpg"],color:"Midnight",href:"/shop?color=Midnight"}
];
export default function HeroCarousel(){
 const [index,setIndex]=useState(0);
 const [playing,setPlaying]=useState(true);
 const [interacting,setInteracting]=useState(false);
 const [reduced,setReduced]=useState(false);
 const touch=useRef<{x:number;y:number}|null>(null);
 useEffect(()=>{
  const media=window.matchMedia("(prefers-reduced-motion: reduce)");
  const sync=()=>setReduced(media.matches);sync();media.addEventListener("change",sync);
  return()=>media.removeEventListener("change",sync);
 },[]);
 useEffect(()=>{
  if(!playing||interacting||reduced)return;
  const id=setInterval(()=>{if(!document.hidden)setIndex(i=>(i+1)%slides.length);},6500);
  return()=>clearInterval(id);
 },[playing,interacting,reduced]);
 const move=(delta:number)=>setIndex(i=>(i+delta+slides.length)%slides.length);
 const slide=slides[index];
 return <section className="hero-carousel" aria-roledescription="carousel" aria-label="Featured velvet collections"
 onMouseEnter={()=>setInteracting(true)} onMouseLeave={()=>setInteracting(false)}
 onFocusCapture={()=>setInteracting(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setInteracting(false);}}
 onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}}
 onTouchEnd={e=>{if(touch.current){const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)){move(dx<0?1:-1);setPlaying(false);}touch.current=null;}}}>
 <div className="hero-slide" key={index} aria-roledescription="slide" aria-label={`${index+1} of ${slides.length}: ${slide.color}`}>
  <div className="hero-copy"><span className="eyebrow"><i/> {slide.eyebrow} — 2026</span><h1>{slide.title}<br/><em>{slide.accent}</em></h1><p>{slide.description}</p><div className="hero-ctas"><a href={slide.href} className="button">Discover the edit <span>↗</span></a><span className="hero-price">Every design<strong>Rs. 7,500</strong></span></div><div className="hero-footnote"><span className="mini-line"/> UNSTITCHED. UNCOMPROMISINGLY YOU.</div></div>
  <div className="hero-art"><span className="hero-watermark">VELVET</span><div className="hero-frame hero-frame-back"><img src={slide.images[1]} alt={slide.color+" unstitched velvet catalog design, styled for reference"} fetchPriority={index===0?"high":"auto"}/></div><div className="hero-frame hero-frame-front"><img src={slide.images[0]} alt={slide.color+" velvet embroidery and styling reference"} fetchPriority={index===0?"high":"auto"}/><span>{slide.color.toUpperCase()} / THE OCCASION EDIT</span></div><div className="hero-stamp"><span>43 DESIGNS</span><b>One beautiful<br/>collection.</b><span>KAHLID FABRIC</span></div></div>
 </div>
 <div className="hero-controls"><div className="slide-dots" aria-label="Choose a collection">{slides.map((s,i)=><button key={s.color} className={index===i?"active":""} aria-label={"Show "+s.color+" collection"} aria-current={index===i?"true":undefined} onClick={()=>setIndex(i)}><span>0{i+1}</span><i/></button>)}</div><div className="slide-buttons"><span>{String(index+1).padStart(2,"0")} <i>/ 03</i></span><button aria-label="Previous collection" onClick={()=>move(-1)}>←</button><button aria-label="Next collection" onClick={()=>move(1)}>→</button><button className="pause" aria-label={playing?"Pause automatic slideshow":"Play automatic slideshow"} onClick={()=>setPlaying(!playing)} disabled={reduced}>{playing&&!reduced?"Ⅱ":"▷"}</button></div></div>
 </section>;
}
