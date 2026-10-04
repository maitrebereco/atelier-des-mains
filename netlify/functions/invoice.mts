import {getStore} from '@netlify/blobs';
import {createHash} from 'node:crypto';
import {catalogue,fragrances,prepareInvoice,payerUrl} from './_shared/invoice.mts';
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const env=(key:string)=>(globalThis as any).Netlify.env.get(key);
export default async(req:Request)=>{
 const enabled=env('PAYPAL_INVOICES_ENABLED')==='true'&&!!env('PAYPAL_CLIENT_ID')&&!!env('PAYPAL_CLIENT_SECRET');
 if(req.method==='GET')return json({enabled,catalogue,fragrances});
 if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
 if(!enabled)return json({error:'La facturation automatique est en cours de configuration. Contactez-nous pour commander.'},503);
 const origin=req.headers.get('origin');
 if(origin!=='https://ateliersdesmains.com'&&origin!=='https://www.ateliersdesmains.com')return json({error:'Origine non autorisée.'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Format invalide.'},415);
 const raw=await req.text();if(raw.length>8192)return json({error:'Formulaire trop volumineux.'},413);
 let input:any,payload:any;
 try{input=JSON.parse(raw);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId))throw new Error('Commande invalide.');payload=prepareInvoice(input);}catch(error:any){return json({error:error.message||'Formulaire invalide.'},400);}
 const fingerprint=createHash('sha256').update(JSON.stringify(payload)).digest('hex');
 const store=getStore({name:'paypal-invoices',consistency:'strong'});
 const key=input.requestId;const cached:any=await store.get(key,{type:'json'});
 if(cached&&cached.fingerprint!==fingerprint)return json({error:'Commande modifiée. Veuillez recommencer.'},409);
 try{
  const base=env('PAYPAL_ENVIRONMENT')==='sandbox'?'https://api-m.sandbox.paypal.com':'https://api-m.paypal.com';
  const auth=await fetch(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(env('PAYPAL_CLIENT_ID')+':'+env('PAYPAL_CLIENT_SECRET')).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(12000)});
  if(!auth.ok)throw new Error('AUTH');const {access_token}=await auth.json();
  const api=async(path:string,method='GET',body?:any)=>{const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/json',Prefer:'return=representation'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('PAYPAL_'+r.status);return r.status===204?null:await r.json();};
  let id=cached?.invoiceId;
  if(!id){payload.detail.invoice_number='WEB-'+key.replaceAll('-','').slice(0,20);const created=await api('/v2/invoicing/invoices','POST',payload);id=created.id;if(!id)throw new Error('NO_ID');await store.setJSON(key,{fingerprint,invoiceId:id});}
  let invoice=await api('/v2/invoicing/invoices/'+id);
  if(invoice.status==='DRAFT'){await api('/v2/invoicing/invoices/'+id+'/send','POST',{send_to_recipient:false,send_to_invoicer:false});invoice=await api('/v2/invoicing/invoices/'+id);}
  if(!['SENT','UNPAID','PAID','PAYMENT_PENDING','PARTIALLY_PAID'].includes(invoice.status))throw new Error('INVOICE_STATUS');
  return json({invoiceUrl:payerUrl(invoice),invoiceNumber:invoice.detail.invoice_number});
 }catch{return json({error:'PayPal ne peut pas préparer votre facture pour le moment. Réessayez ou contactez-nous.'},502);}
};
export const config={path:'/api/invoice',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
