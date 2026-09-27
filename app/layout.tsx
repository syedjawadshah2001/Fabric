import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
export async function generateMetadata():Promise<Metadata>{
 const h=await headers();
 const host=h.get("host")||"localhost:3000";
 const protocol=host.startsWith("localhost")||host.startsWith("127.0.0.1")?"http":"https";
 const origin=protocol+"://"+host;
 return {
  title:{default:"KAHLID FABRIC | Everyday elegance",template:"%s | KAHLID FABRIC"},
  description:"Tradition, woven into the everyday. Discover considered fabrics, everyday pret and occasion wear.",
  metadataBase:new URL(origin),
  openGraph:{title:"KAHLID FABRIC",description:"Tradition, woven into the everyday.",images:[{url:origin+"/og.png",width:1536,height:1024}],type:"website"},
  twitter:{card:"summary_large_image",title:"KAHLID FABRIC",images:[origin+"/og.png"]},
  icons:{icon:"/og.png"}, robots:{index:false,follow:false},
 };
}
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
