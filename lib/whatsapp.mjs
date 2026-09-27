export const OWNER = Object.freeze({name:"Khalid", phone:"03299956666", international:"923299956666"});
export const UNIT_PRICE = 7500;
/** @param {string} message */
export function whatsappUrl(message) {
  return "https://wa.me/"+OWNER.international+"?text="+encodeURIComponent(message);
}
/** @param {Array<{id:string,quantity:number}>} items
 * @param {Array<{id:string,code:string,name:string,price:number}>} products
 * @param {{name:string,phone:string,city:string,address:string,notes?:string}} customer
 */
export function prepareOrder(items, products, customer) {
  for (const [field,limit] of [["name",100],["phone",25],["city",100],["address",350]]) {
    const value=String(customer[field]||"").trim();
    if(!value || value.length>Number(limit))throw new Error("Please enter a valid "+field+".");
  }
  if(!/^[+0-9() -]{10,25}$/.test(customer.phone.trim()))throw new Error("Please enter a valid phone number.");
  if(!Array.isArray(items)||items.length<1||items.length>43)throw new Error("Please add a design to your bag.");
  if((customer.notes||"").length>300)throw new Error("Keep order notes under 300 characters.");
  const seen=new Set();
  let subtotal=0;
  const lines=items.map(item=>{
    const product=products.find(p=>p.id===item.id);
    if(!product)throw new Error("A design in your bag is no longer available. Please refresh your bag.");
    if(seen.has(item.id))throw new Error("Duplicate design in bag.");
    seen.add(item.id);
    if(!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)throw new Error("Choose 1–10 of each design.");
    if(!Number.isInteger(product.price)||product.price<=0)throw new Error("Please confirm this product's price with Khalid.");
    const amount=product.price*item.quantity;subtotal+=amount;
    return product.code+" | "+product.color+" | Qty "+item.quantity+" | Rs. "+amount.toLocaleString("en-PK");
  });
  const text=[
    "KAHLID FABRIC — ORDER REQUEST",
    "Assalam-o-Alaikum Khalid, I would like to order:",
    "",...lines,"",
    "Fabric: Unstitched velvet (not a stitched outfit)",
    "Items subtotal: Rs. "+subtotal.toLocaleString("en-PK"),
    "Delivery charges: please confirm","",
    "Name: "+customer.name.trim(),
    "Phone: "+customer.phone.trim(),
    "City: "+customer.city.trim(),
    "Address: "+customer.address.trim(),
    ...(customer.notes?.trim()?["Notes: "+customer.notes.trim()]:[]),"",
    "Please confirm availability, included fabric pieces, final total and payment/delivery details."
  ].join("\n");
  return {text,url:whatsappUrl(text),subtotal};
}
