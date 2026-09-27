export const OWNER: Readonly<{name:string;phone:string;international:string}>;
export const UNIT_PRICE:number;
export function whatsappUrl(message:string):string;
export type Customer={name:string;phone:string;city:string;address:string;notes?:string};
export function prepareOrder(items:Array<{id:string;quantity:number}>,products:Array<{id:string;code:string;name:string;color:string;price:number}>,customer:Customer):{text:string;url:string;subtotal:number};
