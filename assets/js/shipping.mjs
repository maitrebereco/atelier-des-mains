// La Poste PostPac Economy, standard Swiss counter prices, checked 5 Oct 2026.
// https://www.post.ch/fr/expedier-des-colis/colis-suisse
const weights={ 'ADM-TA':98,'ADM-CB-P':39,'ADM-CB-M':128,'ADM-CB-G':167,'ADM-CBN-P':39,'ADM-CBN-M':128,'ADM-CBN-G':167,'ADM-CL-M':147,'ADM-CL-G':187,'ADM-LE':107,'ADM-SA':190,'ADM-SA-C':190,'ADM-PP':105,'ADM-KND':442,'ADM-TBN':329 };
export function shippingQuote(items){
 if(!Array.isArray(items)||items.length>20)throw Error('Panier invalide.');
 let contentGrams=0;
 for(const item of items){
  if(!weights[item.ref]||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>1000)throw Error('Article invalide pour la livraison.');
  // Allowance for wrapping/gift boxes and bags; postage is an estimate by weight.
  const wrapping=['ADM-KND','ADM-TBN'].includes(item.ref)?200:50;
  contentGrams+=(weights[item.ref]+wrapping+(item.bag?30:0))*item.quantity;
 }
 const parcels=[];
 while(contentGrams>0){
  const contents=Math.min(contentGrams,29500),grams=contents+500;
  parcels.push({grams,cents:grams<=2000?900:grams<=10000?1200:2100});
  contentGrams-=contents;
 }
 return {service:'La Poste — PostPac Economy',shippingCents:parcels.reduce((sum,p)=>sum+p.cents,0),estimatedGrams:parcels.reduce((sum,p)=>sum+p.grams,0),parcelCount:parcels.length};
}
