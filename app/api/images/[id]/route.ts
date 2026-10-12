import { env } from '../../../runtime';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){
 const{id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('Not found',{status:404});
 const image=await env.BUCKET!.get('question-images/'+id);if(!image)return new Response('Not found',{status:404});
 return new Response(image.body.buffer as ArrayBuffer,{headers:{'Content-Type':image.httpMetadata?.contentType||'image/png','Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'}});
}
