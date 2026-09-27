import type {Metadata} from "next";
import {headers} from "next/headers";
import "./globals.css";
export async function generateMetadata():Promise<Metadata>{
 const h=await headers();
 const host=h.get("host")||"localhost:3000";
 const protocol=host.startsWith("localhost")||host.startsWith("127.0.0.1")?"http":"https";
 const origin=protocol+"://"+host;
 const title="KAHLID FABRIC | Unstitched Velvet";
 const description="Discover 43 unstitched velvet designs at Rs. 7,500 each. Explore the collection and order directly with Khalid on WhatsApp.";
 return {
  title:{default:title,template:"%s | KAHLID FABRIC"},description,metadataBase:new URL(origin),
  openGraph:{title,description,images:[{url:origin+"/catalog/catalog_04.jpg",alt:"Burgundy unstitched velvet catalog design"}],type:"website"},
  twitter:{card:"summary_large_image",title,description,images:[origin+"/catalog/catalog_04.jpg"]},
  icons:{icon:"/catalog/catalog_04.jpg"},robots:{index:false,follow:false}
 };
}
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
