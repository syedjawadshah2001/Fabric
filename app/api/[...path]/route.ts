import { NextRequest } from "next/server";
async function forward(request: NextRequest, context: { params: Promise<{path:string[]}> }) {
  const {path} = await context.params;
  const allowed = ["account","signup","login","logout","catalog","session","orders","track","newsletter","contact"];
  if(path.length!==1 || !allowed.includes(path[0])) return Response.json({error:"Not found"},{status:404});
  const origin = process.env.COMMERCE_API_URL || "http://127.0.0.1:8000";
  const headers = new Headers();
  for(const key of ["content-type","cookie","x-csrftoken","origin"]) {
    const value=request.headers.get(key); if(value) headers.set(key,value);
  }
  try {
    const upstream=await fetch(origin+"/api/"+path[0]+"/",{
      method:request.method,headers,
      body:request.method==="GET"?undefined:await request.text(),
      redirect:"manual",signal:AbortSignal.timeout(12000)
    });
    const responseHeaders=new Headers({"Content-Type":upstream.headers.get("content-type")||"application/json","Cache-Control":"no-store"});
    for(const cookie of upstream.headers.getSetCookie()) responseHeaders.append("Set-Cookie",cookie);
    return new Response(await upstream.text(),{status:upstream.status,headers:responseHeaders});
  } catch {
    return Response.json({error:"Our store service is temporarily unavailable. Please try again shortly."},{status:503});
  }
}
export const GET=forward;
export const POST=forward;
