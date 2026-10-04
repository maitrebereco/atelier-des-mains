import {getStore} from '@netlify/blobs';
import {createHash} from 'node:crypto';
import {prepareCartCheckout} from './_shared/cart-checkout.mts';
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async(req:Request)=>{
 if(req.method==='GET')return json({enabled:true,method:'paypal-cart'});
 if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
 if(!['https://ateliersdesmains.com','https://www.ateliersdesmains.com'].includes(req.headers.get('origin')||''))return json({error:'Origine non autorisée.'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Format invalide.'},415);
 const raw=await req.text();if(raw.length>1600000)return json({error:'Formulaire trop volumineux.'},413);
 let input:any,checkout:any;
 try{input=JSON.parse(raw);checkout=prepareCartCheckout(input)}catch(error:any){return json({error:error.message||'Commande invalide.'},400)}
 try{
  const store=getStore({name:'paypal-invoices',consistency:'strong'});
  const fingerprint=createHash('sha256').update(JSON.stringify(checkout)).digest('hex');
  const key='enterprise-'+input.requestId;const existing:any=await store.get(key,{type:'json'});
  if(existing?.checkoutFingerprint&&existing.checkoutFingerprint!==fingerprint)return json({error:'Commande modifiée. Veuillez recommencer.'},409);
  await store.setJSON(key,{...checkout.production,contactName:input.name,email:input.email,shippingAddress:input.address,shippingCity:input.city,shippingPostal:input.postal,createdAt:existing?.createdAt||new Date().toISOString(),invoiceNumber:checkout.fields.invoice,paymentStatus:'pending',checkoutFingerprint:fingerprint});
  return json({action:'https://www.paypal.com/cgi-bin/webscr',fields:checkout.fields,totalCents:checkout.totalCents});
 }catch{return json({error:'Votre devis ne peut pas être enregistré pour le moment. Réessayez.'},502)}
};
export const config={path:'/api/enterprise-checkout',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
