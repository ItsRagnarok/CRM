import 'server-only';
import {safeOblioUrl} from './oblio';
export async function remotePdf(value:string|null):Promise<Buffer|null>{
 const url=safeOblioUrl(value);if(!url)return null;
 try{
  const response=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok||!response.headers.get('content-type')?.includes('application/pdf'))return null;
  const reader=response.body?.getReader();if(!reader)return null;
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>10*1024*1024){await reader.cancel();return null;}chunks.push(value);}
  const file=Buffer.concat(chunks);return file.subarray(0,4).toString()==='%PDF'?file:null;
 }catch{return null;}
}
