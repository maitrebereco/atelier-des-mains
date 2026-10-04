export const enterpriseCatalogue = [
  {
    "ref": "ADM-TA",
    "name": "Tasse de Noël",
    "price": 9,
    "measures": "98 g · H 4,5 cm · Ø 8 × 8 cm",
    "colours": [
      "Turquoise"
    ]
  },
  {
    "ref": "ADM-CB-P",
    "name": "Cube Bulle petite rouge & blanc",
    "price": 6,
    "measures": "39 g · 3 × 3 cm",
    "colours": [
      "Rouge & blanc",
      "Noir & blanc",
      "Rouge & vert"
    ]
  },
  {
    "ref": "ADM-CB-M",
    "name": "Cube Bulle moyenne rouge & blanc",
    "price": 10,
    "measures": "128 g · 5 × 5 cm",
    "colours": [
      "Rouge & blanc",
      "Noir & blanc",
      "Rouge & vert"
    ]
  },
  {
    "ref": "ADM-CB-G",
    "name": "Cube Bulle grand modèle rouge & blanc",
    "price": 11.5,
    "measures": "167 g · 5,5 × 5,5 cm",
    "colours": [
      "Rouge & blanc",
      "Noir & blanc",
      "Rouge & vert"
    ]
  },
  {
    "ref": "ADM-CBN-P",
    "name": "Cube Bulle petite noir & blanc",
    "price": 6,
    "measures": "39 g · 3 × 3 cm",
    "colours": [
      "Rouge & blanc",
      "Noir & blanc",
      "Rouge & vert"
    ]
  },
  {
    "ref": "ADM-CBN-M",
    "name": "Cube Bulle moyenne noir & blanc",
    "price": 10,
    "measures": "128 g · 5 × 5 cm",
    "colours": [
      "Rouge & blanc",
      "Noir & blanc",
      "Rouge & vert"
    ]
  },
  {
    "ref": "ADM-CBN-G",
    "name": "Cube Bulle grand modèle noir & blanc",
    "price": 11.5,
    "measures": "167 g · 5,5 × 5,5 cm",
    "colours": [
      "Rouge & blanc",
      "Noir & blanc",
      "Rouge & vert"
    ]
  },
  {
    "ref": "ADM-CL-M",
    "name": "Cloche de Noël moyenne",
    "price": 11,
    "measures": "147 g · H 8 cm · Ø 7 cm",
    "colours": [
      "Rouge & blanc",
      "Rouge & vert"
    ]
  },
  {
    "ref": "ADM-CL-G",
    "name": "Cloche de Noël grande",
    "price": 12.5,
    "measures": "187 g · H 10 cm · Ø 8 cm",
    "colours": [
      "Rouge & blanc",
      "Rouge & vert"
    ]
  },
  {
    "ref": "ADM-LE",
    "name": "Livre Enchanté",
    "price": 13,
    "measures": "107 g · 8,8 × 6,5 cm · coffret + 2 fleurs",
    "colours": [
      "Blanc & doré"
    ]
  },
  {
    "ref": "ADM-SA",
    "name": "Sapin de Noël vert & or",
    "price": 13,
    "measures": "190 g · H 12,5 cm · 7 × 7 cm",
    "colours": [
      "Noir & doré"
    ]
  },
  {
    "ref": "ADM-SA-C",
    "name": "Sapin de Noël chocolat",
    "price": 13,
    "measures": "190 g · H 12,5 cm · 7 × 7 cm",
    "colours": [
      "Noir & doré"
    ]
  },
  {
    "ref": "ADM-PP",
    "name": "Pomme de pin",
    "price": 10,
    "measures": "105 g · H 9 cm · 5,5 × 4 cm",
    "colours": [
      "Noir & doré"
    ]
  },
  {
    "ref": "ADM-KND",
    "name": "Kit Noël Doré",
    "price": 25,
    "measures": "442 g · sapin + pomme de pin + cube + 2 fleurs · coffret 30 × 14 cm",
    "colours": [
      "Vert, blanc & doré"
    ]
  },
  {
    "ref": "ADM-TBN",
    "name": "Trio Bulles de Noël",
    "price": 20,
    "measures": "329 g · 3 bougies bulles + 2 fleurs · coffret 30 × 14 cm",
    "colours": [
      "Noir & blanc"
    ]
  }
];
export function enterpriseOptions(input:any){
 const product=enterpriseCatalogue.find(p=>p.ref===input.ref);
 if(!product)throw new Error('Article entreprise invalide.');
 if(!Number.isInteger(input.quantity)||input.quantity<10||input.quantity>1000)throw new Error('Commandez de 10 à 1 000 cadeaux.');
 if(!product.colours.includes(input.colour))throw new Error('Couleur indisponible pour cet article.');
 const text=(key:string,max:number,required=false)=>{const value=input[key];if(value==null&&!required)return '';if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error('Veuillez vérifier les informations de votre entreprise.');return value.trim();};
 const company=text('company',200,true),companyAddress=text('companyAddress',180),phone=text('phone',50),website=text('website',100),message=text('message',90),deliveryDate=text('deliveryDate',100);
 if(typeof input.personalized!=='boolean'||typeof input.bag!=='boolean')throw new Error('Options invalides.');
 if(!['both','label','bag'].includes(input.placement))throw new Error('Emplacement invalide.');
 if(input.placement==='bag'&&!input.bag)throw new Error('Choisissez le sac cadeau pour personnaliser le sac.');
 if(!Array.isArray(input.names)||input.names.length>1000||input.names.some((n:any)=>typeof n!=='string'||!n.trim()||n.trim().length>80))throw new Error('Liste des prénoms invalide.');
 const names=input.personalized?input.names.map((n:string)=>n.trim()):[];
 if(input.personalized&&names.length!==input.quantity)throw new Error('Indiquez un prénom par cadeau.');
 let logo='';
 if(input.logo){
  if(typeof input.logo!=='string')throw new Error('Logo invalide.');
  const match=input.logo.match(/^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/);
  if(!match||match[2].length%4)throw new Error('Choisissez un logo PNG ou JPG.');
  const bytes=Buffer.from(match[2],'base64');if(bytes.length>1048576||bytes.length<8)throw new Error('Le logo doit faire moins de 1 Mo.');
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if((match[1]==='png'&&!png)||(match[1]==='jpeg'&&!jpeg))throw new Error('Logo invalide.');
  logo=input.logo;
 }
 const unitCents=Math.round(product.price*100)+(input.personalized?150:0)+(input.bag?200:0);
 return {product,unitCents,totalCents:unitCents*input.quantity,production:{company,companyAddress,phone,website,message,deliveryDate,placement:input.placement,personalized:input.personalized,bag:input.bag,names,logo,ref:product.ref,productName:product.name,colour:input.colour,fragrance:input.fragrance,quantity:input.quantity,unitCents,totalCents:unitCents*input.quantity}};
}
