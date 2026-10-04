import {enterpriseOptions} from './enterprise.mts';
export const catalogue = [
 {ref:'ADM-TA',name:'Tasse de Noël',price:12,measures:'98 g · H 4,5 cm · 8 × 8 cm'},
 {ref:'ADM-LE',name:'Livre de Noël',price:26,measures:'107 g · 8,8 × 6,5 cm'},
 {ref:'ADM-CB-M',name:'Cube Bulle',price:14,measures:'128 g · 5 × 5 cm',colours:['Rouge et vert','Noir et blanc','Rouge et blanc']},
 {ref:'ADM-CL-M',name:'Cloche de Noël moyenne',price:22,measures:'147 g · H 8 cm · Ø 7 cm'},
 {ref:'ADM-CL-G',name:'Cloche de Noël grande',price:15,measures:'187 g · H 10 cm · Ø 8 cm'},
 {ref:'ADM-SA',name:'Sapin de Noël',price:15,measures:'190 g · H 12,5 cm · 7 × 7 cm'},
 {ref:'ADM-PP',name:'Pomme de pin',price:12,measures:'105 g · H 9 cm · 5,5 × 4 cm'},
 {ref:'ADM-KND',name:'Coffret de Noël',price:39,measures:'442 g · Coffret 30 × 14 cm'},
 {ref:'ADM-TBN',name:'Trio Bulles de Noël',price:39,measures:'329 g · 3 bougies + 2 fleurs · Coffret 30 × 14 cm'}
];
export const fragrances=['Vanille','Cannelle–Vanille','Christmas Tree'];
export function prepareInvoice(input:any){
 const enterprise=input.mode==='enterprise'?enterpriseOptions(input):null;
 if(input.mode&&input.mode!=='enterprise'&&input.mode!=='retail')throw new Error('Type de commande invalide.');
 const product=enterprise?.product||catalogue.find(p=>p.ref===input.ref);
 if(!product)throw new Error('Article invalide.');
 if(!enterprise&&(!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>100))throw new Error('Quantité : de 1 à 100.');
 if(!fragrances.includes(input.fragrance))throw new Error('Parfum invalide.');
 if(!enterprise&&product.colours&&!product.colours.includes(input.colour))throw new Error('Couleur invalide.');
 const field=(key:string,max=200)=>{const value=input[key];if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new Error('Veuillez vérifier vos coordonnées.');return value.trim();};
 const email=field('email',254);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Email invalide.');
 const name=field('name');const address=field('address');const city=field('city');const postal=field('postal',20);
 // Delivery is currently limited to Switzerland; no international shipping price was supplied.
 if(input.country!=='CH')throw new Error('Pour une livraison hors de Suisse, contactez-nous.');
 const description=product.measures+' · Parfum : '+input.fragrance+(product.colours?' · Couleur : '+input.colour:'')+(enterprise?' · Étiquette entreprise'+(input.personalized?' · Prénom personnalisé (+1,50 CHF)':'')+(input.bag?' · Sac cadeau (+2,00 CHF)':''):'');
 return {detail:{currency_code:'CHF',reference:product.ref,payment_term:{term_type:'DUE_ON_RECEIPT'},note:'Bougie artisanale — Ateliers des Mains. Conservez le lien de cette facture pour la consulter et l’imprimer.'},invoicer:{business_name:'Ateliers des Mains',email_address:'maria.emerenciano21@gmail.com',website:'https://ateliersdesmains.com',address:{address_line_1:'Route Aloys-Fauquez 129',admin_area_2:'Lausanne',postal_code:'1018',country_code:'CH'}},primary_recipients:[{billing_info:{name:{full_name:name},email_address:email,...(enterprise?{business_name:enterprise.production.company}:{})},shipping_info:{name:{full_name:name},address:{address_line_1:address,admin_area_2:city,postal_code:postal,country_code:'CH'}}}],items:[{name:product.ref+' — '+product.name,description,quantity:String(input.quantity),unit_amount:{currency_code:'CHF',value:((enterprise?.unitCents??Math.round(product.price*100))/100).toFixed(2)}}],configuration:{allow_tip:false,partial_payment:{allow_partial_payment:false}}};
}
export function payerUrl(invoice:any){
 const link=invoice.detail?.metadata?.recipient_view_url||invoice.links?.find((l:any)=>l.rel==='payer-view')?.href;
 if(typeof link!=='string')throw new Error('Lien de facture indisponible.');
 const url=new URL(link);if(url.protocol!=='https:'||!(url.hostname==='www.paypal.com'||url.hostname==='www.sandbox.paypal.com'))throw new Error('Lien de facture invalide.');
 return url.href;
}
