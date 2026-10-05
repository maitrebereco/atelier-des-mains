import {getStore} from '@netlify/blobs';
import {checkoutEnabled,paypalAPI,verifyOrder,completedCapture} from './_shared/paypal-orders.mts';
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async(req:Request)=>{
 if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
 if(!['https://ateliersdesmains.com','https://www.ateliersdesmains.com'].includes(req.headers.get('origin')||''))return json({error:'Origine non autorisée.'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Format invalide.'},415);
 if(!checkoutEnabled())return json({error:'Paiement indisponible.'},503);
 let input:any;
 try{const raw=await req.text();if(raw.length>1000)throw Error();input=JSON.parse(raw);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId)||!(/^[A-Z0-9]{10,32}$/.test(input.orderId)))throw Error();}catch{return json({error:'Retour de paiement invalide.'},400)}
 try{
  const store=getStore({name:'paypal-invoices',consistency:'strong'}),key='enterprise-'+input.requestId;
  const record:any=await store.get(key,{type:'json'});
  if(!record||record.paypalOrderId!==input.orderId)return json({error:'Commande introuvable.'},404);
  if(record.paymentStatus==='paid')return json({paid:true,invoiceNumber:record.invoiceNumber,totalCents:record.totalCents});
  const api=await paypalAPI();
  let order=await api('/v2/checkout/orders/'+input.orderId);
  verifyOrder(order,record);
  if(order.status==='APPROVED'){
   try{await api('/v2/checkout/orders/'+input.orderId+'/capture','POST',{},'capture-'+input.requestId)}catch{}
   order=await api('/v2/checkout/orders/'+input.orderId)
  }
  const captureId=completedCapture(order,record);
  if(!captureId)return json({paid:false,pending:order.status==='COMPLETED',error:'Le paiement n’est pas encore confirmé. Ne repassez pas commande : réessayez la vérification.'},409);
  await store.setJSON(key,{...record,paymentStatus:'paid',captureId,paidAt:new Date().toISOString()});
  return json({paid:true,invoiceNumber:record.invoiceNumber,totalCents:record.totalCents});
 }catch{return json({error:'La confirmation PayPal est temporairement indisponible. Réessayez la vérification avant de payer à nouveau.'},502)}
};
export const config={path:'/api/enterprise-capture',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
