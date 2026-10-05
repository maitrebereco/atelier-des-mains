import {getStore} from '@netlify/blobs';
import {createHash} from 'node:crypto';
import {prepareCartCheckout} from './_shared/cart-checkout.mts';
import {checkoutEnabled,paypalAPI,approvalURL,verifyOrder} from './_shared/paypal-orders.mts';
import {shippingQuote} from '../../assets/js/shipping.mjs';
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async(req:Request)=>{
 if(req.method==='GET')return json({enabled:checkoutEnabled(),method:'paypal-orders'});
 if(req.method!=='POST')return json({error:'Méthode non autorisée.'},405);
 if(!['https://ateliersdesmains.com','https://www.ateliersdesmains.com'].includes(req.headers.get('origin')||''))return json({error:'Origine non autorisée.'},403);
 if(!req.headers.get('content-type')?.startsWith('application/json'))return json({error:'Format invalide.'},415);
 if(!checkoutEnabled())return json({error:'Le paiement est en cours de configuration. Réessayez plus tard.'},503);
 const raw=await req.text();if(raw.length>1600000)return json({error:'Formulaire trop volumineux.'},413);
 let input:any,checkout:any;
 try{input=JSON.parse(raw);checkout=prepareCartCheckout(input)}catch(error:any){return json({error:error.message||'Commande invalide.'},400)}
 try{
  const store=getStore({name:'paypal-invoices',consistency:'strong'});
  const fingerprint=createHash('sha256').update(JSON.stringify(checkout)).digest('hex');
  const key='enterprise-'+input.requestId;const existing:any=await store.get(key,{type:'json'});
  if(existing?.checkoutFingerprint&&existing.checkoutFingerprint!==fingerprint)return json({error:'Commande modifiée. Veuillez recommencer.'},409);
  if(existing?.paymentStatus==='paid')return json({error:'Cette commande a déjà été payée.'},409);
  const delivery=shippingQuote(checkout.production.items||[checkout.production]);
  const grandTotalCents=checkout.totalCents+delivery.shippingCents;
  const record={...checkout.production,totalCents:grandTotalCents,itemsTotalCents:checkout.totalCents,shipping:delivery,requestId:input.requestId,contactName:input.name,email:input.email,shippingAddress:input.address,shippingCity:input.city,shippingPostal:input.postal,createdAt:existing?.createdAt||new Date().toISOString(),invoiceNumber:checkout.fields.invoice,paymentStatus:'pending',checkoutFingerprint:fingerprint};
  const api=await paypalAPI();
  const cartId=String(input.cartId||input.requestId);
  if(!/^[0-9a-f-]{36}$/i.test(cartId))throw Error('INVALID_CART');
  const returnPage='https://ateliersdesmains.com/panier-entreprise.html?cart='+encodeURIComponent(cartId)+'&request='+input.requestId;
  const entries=checkout.production.items||[checkout.production];
  const value=(grandTotalCents/100).toFixed(2);
  const itemsValue=(checkout.totalCents/100).toFixed(2);
  const payload={intent:'CAPTURE',purchase_units:[{reference_id:'enterprise',custom_id:input.requestId,invoice_id:checkout.fields.invoice,description:'Cadeaux entreprise — Ateliers des Mains',amount:{currency_code:'CHF',value,breakdown:{item_total:{currency_code:'CHF',value:itemsValue},shipping:{currency_code:'CHF',value:(delivery.shippingCents/100).toFixed(2)}}},items:entries.map((item:any)=>({name:(item.ref+' — '+item.productName).slice(0,127),sku:item.ref,description:(item.colour+' · '+item.fragrance+(item.bag?' · Sac cadeau':'')+(item.personalized?' · Prénom personnalisé':'')).slice(0,127),quantity:String(item.quantity),unit_amount:{currency_code:'CHF',value:(item.unitCents/100).toFixed(2)}})),shipping:{name:{full_name:input.name},address:{address_line_1:input.address,admin_area_2:input.city,postal_code:input.postal,country_code:'CH'}}}],payment_source:{paypal:{experience_context:{brand_name:'Ateliers des Mains',locale:'fr-CH',landing_page:'GUEST_CHECKOUT',user_action:'PAY_NOW',shipping_preference:'SET_PROVIDED_ADDRESS',return_url:returnPage+'&payment=return',cancel_url:returnPage+'&payment=cancel'}}}};
  await store.setJSON(key,{...record,paypalOrderId:existing?.paypalOrderId});
  let order=existing?.paypalOrderId?await api('/v2/checkout/orders/'+existing.paypalOrderId):null;
  if(!order||!['CREATED','PAYER_ACTION_REQUIRED','APPROVED'].includes(order.status))order=await api('/v2/checkout/orders','POST',payload,'create-'+input.requestId);
  verifyOrder(order,{...record,paypalOrderId:order.id});
  const approvalUrl=approvalURL(order);
  await store.setJSON(key,{...record,paypalOrderId:order.id,approvalUrl});
  return json({approvalUrl,totalCents:grandTotalCents,shippingCents:delivery.shippingCents});
 }catch{return json({error:'PayPal ne peut pas ouvrir le paiement pour le moment. Votre panier est conservé. Réessayez.'},502)}
};
export const config={path:'/api/enterprise-checkout',rateLimit:{windowLimit:30,windowSize:60,aggregateBy:['ip','domain']}};
