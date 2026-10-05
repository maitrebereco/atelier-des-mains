// La Poste PostPac Economy, standard Swiss counter prices, checked 5 Oct 2026.
// https://www.post.ch/fr/expedier-des-colis/colis-suisse
const weights={ 'ADM-TA':98,'ADM-CB-P':39,'ADM-CB-M':128,'ADM-CB-G':167,'ADM-CBN-P':39,'ADM-CBN-M':128,'ADM-CBN-G':167,'ADM-CL-M':147,'ADM-CL-G':187,'ADM-LE':107,'ADM-SA':190,'ADM-SA-C':190,'ADM-PP':105,'ADM-KND':442,'ADM-TBN':329 };
// Country zones/limits from La Poste country information; rates from its Jan 2026 table.
export const countries=[
 ['CH','Suisse',0,30],['LI','Liechtenstein',0,30],
 ['AL','Albanie',3,20],['DE','Allemagne',1,30],['AD','Andorre',2,30],['AM','Arménie',5,30],['AT','Autriche',1,30],['AZ','Azerbaïdjan',5,30],['BE','Belgique',1,30],['BY','Biélorussie',3,30],['BA','Bosnie-Herzégovine',3,20],['BG','Bulgarie',3,30],['CY','Chypre',3,30],['HR','Croatie',3,30],['DK','Danemark',1,30],['ES','Espagne',2,30],['EE','Estonie',2,30],['FI','Finlande',2,30],['FR','France',1,30],['GE','Géorgie',5,30],['GR','Grèce',3,30],['HU','Hongrie',2,30],['IE','Irlande',2,30],['IS','Islande',3,30],['IT','Italie',1,30],['KZ','Kazakhstan',6,20],['XK','Kosovo',3,20],['LV','Lettonie',2,30],['LT','Lituanie',2,30],['LU','Luxembourg',1,30],['MK','Macédoine du Nord',3,30],['MT','Malte',3,30],['MD','Moldavie',3,20],['MC','Monaco',1,30],['ME','Monténégro',3,30],['NO','Norvège',2,30],['NL','Pays-Bas',1,30],['PL','Pologne',2,30],['PT','Portugal',2,30],['RO','Roumanie',3,30],['GB','Royaume-Uni',1,30],['RU','Russie',3,20],['SM','Saint-Marin',1,30],['RS','Serbie',3,30],['SK','Slovaquie',2,20],['SI','Slovénie',2,30],['SE','Suède',2,20],['CZ','Tchéquie',2,30],['TR','Turquie',3,30],['UA','Ukraine',3,20],['VA','Vatican',1,20],
 ['AX','Åland',2,30],['FO','Îles Féroé',3,30],['GI','Gibraltar',3,20],['GG','Guernesey',1,20],['IM','Île de Man',1,30],['JE','Jersey',1,30]
];
const internationalRates={1:[3600,4600,5200,5900,6500,7100,7600],2:[4000,5100,6100,7300,8300,9300,10300],3:[4200,5700,6800,8300,9500,11000,12300],5:[5300,7800,11300,15100,19300,22800,25800],6:[5800,8900,13700,18700,24700,29700,33700]};
export function shippingQuote(items,country='CH'){
 const destination=countries.find(c=>c[0]===country);
 if(!destination)throw Error('Choisissez un pays européen pour la livraison.');
 if(!Array.isArray(items)||items.length>20)throw Error('Panier invalide.');
 let contentGrams=0;
 for(const item of items){
  if(!weights[item.ref]||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>1000)throw Error('Article invalide pour la livraison.');
  const wrapping=['ADM-KND','ADM-TBN'].includes(item.ref)?200:50;
  contentGrams+=(weights[item.ref]+wrapping+(item.bag?30:0))*item.quantity;
 }
 const parcels=[],maxContents=destination[3]*1000-500;
 while(contentGrams>0){
  const contents=Math.min(contentGrams,maxContents),grams=contents+500;
  const tier=[2000,5000,10000,15000,20000,25000,30000].findIndex(max=>grams<=max);
  const cents=destination[2]===0?(grams<=2000?900:grams<=10000?1200:2100):internationalRates[destination[2]][tier];
  parcels.push({grams,cents});contentGrams-=contents;
 }
 return {country,countryName:destination[1],service:destination[2]===0?'La Poste — PostPac Economy':'La Poste — PostPac International',shippingCents:parcels.reduce((sum,p)=>sum+p.cents,0),estimatedGrams:parcels.reduce((sum,p)=>sum+p.grams,0),parcelCount:parcels.length};
}
