(()=>{
let invoiceEnabled=false;const updates=[];
document.querySelectorAll('.new-candle-gallery .product-card').forEach(card=>{
 const link=card.querySelector('.product-card__footer a'),paypal=card.querySelector('.candle-paypal');
 const update=()=>{
  const name=card.querySelector('h2').textContent,perfume=card.querySelector('.candle-fragrance').value,colour=card.querySelector('.candle-colour');
  if(colour){const image=card.querySelector('.product-card__img img');const photos={'Rouge et vert':'catalogue-boule-rouge-vert.png','Noir et blanc':'catalogue-boule-noir-blanc.png','Rouge et blanc':'catalogue-boule.png'};image.src='../assets/img/'+photos[colour.value];image.alt=name+' — '+colour.value;}
  const price=card.querySelector('.price').textContent;
  link.href='https://wa.me/41767522703?text='+encodeURIComponent('Bonjour, je souhaite commander : '+card.dataset.productRef+' · '+name+' · '+price+' · Parfum : '+perfume+(colour?' · Couleur : '+colour.value:''));
  if(invoiceEnabled&&paypal){const params=new URLSearchParams({ref:card.dataset.productRef,fragrance:perfume});if(colour)params.set('colour',colour.value);paypal.href='/facture.html?'+params.toString();}
 };
 updates.push(update);card.querySelectorAll('select').forEach(select=>select.addEventListener('change',update));update();
});
if(typeof fetch==='function')fetch('/api/invoice').then(r=>r.ok?r.json():null).then(data=>{if(data?.enabled===true){invoiceEnabled=true;updates.forEach(update=>update());const note=document.querySelector('.new-candle-gallery')?.previousElementSibling;if(note&&document.documentElement.lang==='fr')note.textContent='Votre parfum et votre couleur sont repris dans la facture PayPal. Vérifiez vos coordonnées et le total avant de payer.';}}).catch(()=>{});
})();
