import { env } from '../../runtime';
import { getUser } from '../../auth';
export async function POST(req:Request){
 if(!await getUser())return Response.json({error:'Only the owner can upload images.'},{status:403});
 if(Number(req.headers.get('content-length')||0)>5500000)return Response.json({error:'Images must be smaller than 5 MB.'},{status:413});
 try{const form=await req.formData(),file=form.get('image');if(!(file instanceof File)||file.size>5000000||!file.size)return Response.json({error:'Choose an image smaller than 5 MB.'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());let type='';
 if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)type='image/png';
 else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)type='image/jpeg';
 else if(new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')type='image/webp';
 if(!type)return Response.json({error:'Upload a PNG, JPEG or WebP image.'},{status:400});
 const id=crypto.randomUUID();await env.BUCKET!.put('question-images/'+id,bytes,{httpMetadata:{contentType:type}});return Response.json({url:'/api/images/'+id});
 }catch{return Response.json({error:'Image upload failed. Try a smaller PNG or JPEG.'},{status:500});}
}
