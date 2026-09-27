import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {prepareOrder,whatsappUrl,OWNER} from "../lib/whatsapp.mjs";
const products=JSON.parse(readFileSync(new URL("../data/catalog.json",import.meta.url)));
const customer={name:"Test Customer",phone:"03001234567",city:"Lahore",address:"Test address",notes:"Blue & gold, please"};
test("all 43 real catalog images exist and prices are Rs. 7,500",()=>{
 assert.equal(products.length,43);assert.equal(new Set(products.map(p=>p.id)).size,43);
 for(const p of products){assert.equal(p.price,7500);assert.equal(p.sample,false);assert.equal(p.fabric,"Velvet");assert.ok(existsSync(new URL("../public"+p.image,import.meta.url)));}
});
test("WhatsApp recipient uses Pakistan international format",()=>assert.equal(new URL(whatsappUrl("hello")).pathname,"/923299956666"));
test("order contains exact references, quantities and catalog-calculated total",()=>{
 const order=prepareOrder([{id:products[0].id,quantity:2,price:1},{id:products[1].id,quantity:1}],products,customer);
 assert.equal(order.subtotal,22500);assert.match(order.text,/KF-V001/);assert.match(order.text,/KF-V002/);assert.match(order.text,/Qty 2/);assert.match(order.text,/22,500/);
 assert.equal(new URL(order.url).searchParams.get("text"),order.text);
 assert.match(order.text,/not a stitched outfit/);assert.match(order.text,/Delivery charges: please confirm/);
});
test("missing products and invalid quantities are rejected",()=>{
 for(const quantity of [0,-1,11,1.5,true])assert.throws(()=>prepareOrder([{id:products[0].id,quantity}],products,customer));
 assert.throws(()=>prepareOrder([{id:"old-demo-item",quantity:1}],products,customer));
 assert.throws(()=>prepareOrder([],products,customer));
});
test("customer details are validated and Unicode survives encoding",()=>{
 assert.throws(()=>prepareOrder([{id:products[0].id,quantity:1}],products,{...customer,phone:"123"}));
 const order=prepareOrder([{id:products[0].id,quantity:1}],products,{...customer,name:"خالد"});
 assert.match(new URL(order.url).searchParams.get("text"),/خالد/);
});
