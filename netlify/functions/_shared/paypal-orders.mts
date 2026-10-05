export function checkoutEnabled(){
 const env=(globalThis as any).Netlify.env;
 return !!env.get('PAYPAL_CLIENT_ID') && !!env.get('PAYPAL_CLIENT_SECRET');
}
export async function paypalAPI(){
 const env=(globalThis as any).Netlify.env;
 const base=env.get('PAYPAL_ENVIRONMENT')==='sandbox'?'https://api-m.sandbox.paypal.com':'https://api-m.paypal.com';
 const auth=await fetch(base+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(env.get('PAYPAL_CLIENT_ID')+':'+env.get('PAYPAL_CLIENT_SECRET')).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(12000)});
 if(!auth.ok)throw Error('AUTH');
 const {access_token}=await auth.json();
 return async(path:string,method='GET',body?:any,requestId?:string)=>{
  const response=await fetch(base+path,{method,headers:{Authorization:'Bearer '+access_token,'Content-Type':'application/json',Prefer:'return=representation',...(requestId?{'PayPal-Request-Id':requestId}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('PAYPAL_'+response.status);
  return response.json();
 };
}
export function approvalURL(order:any){
 const href=order.links?.find((link:any)=>['payer-action','approve'].includes(link.rel))?.href;
 if(typeof href!=='string')throw Error('NO_APPROVAL');
 const url=new URL(href);
 if(url.protocol!=='https:'||!['www.paypal.com','www.sandbox.paypal.com'].includes(url.hostname))throw Error('INVALID_APPROVAL');
 return url.href;
}
export function verifyOrder(order:any,record:any){
 if(order.id!==record.paypalOrderId||order.purchase_units?.length!==1)throw Error('ORDER_MISMATCH');
 const unit=order.purchase_units[0];
 if(unit.custom_id!==record.requestId||unit.amount?.currency_code!=='CHF'||Math.round(Number(unit.amount.value)*100)!==record.totalCents)throw Error('AMOUNT_MISMATCH');
}
export function completedCapture(order:any,record:any){
 verifyOrder(order,record);
 const captures=order.purchase_units[0].payments?.captures;
 if(order.status!=='COMPLETED'||!Array.isArray(captures)||captures.length!==1)return null;
 const capture=captures[0];
 if(capture.status!=='COMPLETED'||capture.amount?.currency_code!=='CHF'||Math.round(Number(capture.amount.value)*100)!==record.totalCents)return null;
 return capture.id;
}
