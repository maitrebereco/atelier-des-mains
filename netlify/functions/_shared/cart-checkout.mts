import {enterpriseBundle} from './enterprise.mts';
import {prepareInvoice} from './invoice.mts';
export function prepareCartCheckout(input:any){
 if(input.mode!=='enterprise')throw new Error('Commande entreprise uniquement.');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.requestId))throw new Error('Commande invalide.');
 prepareInvoice(input); // Validate contact, delivery and all product options.
 const bundle=enterpriseBundle(input);
 const entries=bundle.production.items||[bundle.production];
 const fields:Record<string,string>={cmd:'_cart',upload:'1',business:'maria.emerenciano21@gmail.com',currency_code:'CHF',charset:'utf-8',lc:'FR',no_note:'1',no_shipping:'2',custom:input.requestId,invoice:'DEV-'+input.requestId,email:input.email,address1:input.address,city:input.city,zip:input.postal,country:'CH',cancel_return:'https://ateliersdesmains.com/fr/cadeaux-entreprise.html?paiement=annule',return:'https://ateliersdesmains.com/fr/cadeaux-entreprise.html?paiement=retour'};
 entries.forEach((item:any,index:number)=>{const suffix=index+1;fields['item_name_'+suffix]=(item.ref+' — '+item.productName).slice(0,127);fields['item_number_'+suffix]=item.ref;fields['amount_'+suffix]=(item.unitCents/100).toFixed(2);fields['quantity_'+suffix]=String(item.quantity);fields['on0_'+suffix]='Couleur / parfum';fields['os0_'+suffix]=(item.colour+' / '+item.fragrance).slice(0,200);});
 return {fields,production:bundle.production,totalCents:bundle.totalCents};
}
