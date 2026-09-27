import json, re, uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction, IntegrityError
from django.db.models import F
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.http import require_GET, require_POST
from django.core.cache import cache
from .models import Product, Variant, Order, OrderItem, Subscriber, ContactMessage

def error(message, status=400): return JsonResponse({"error":message}, status=status)
def body(request):
    if len(request.body)>20000: raise ValueError("Request too large.")
    data=json.loads(request.body)
    if not isinstance(data,dict): raise ValueError("Invalid request.")
    return data
def limited(request, scope, maximum=20):
    # Configure a shared cache and trusted reverse-proxy IPs for multi-worker production.
    key=f"{scope}:{request.META.get('REMOTE_ADDR','unknown')}"
    count=cache.get(key,0)
    cache.set(key,count+1,300)
    return count>=maximum
def order_response(order):
    return {"reference":str(order.reference),"total":order.total,"shipping":order.shipping,"status":order.status,"is_test":order.is_test}

@require_GET
def session(request):
    return JsonResponse({"csrfToken":get_token(request),"checkoutEnabled":settings.CHECKOUT_ENABLED,"shippingFee":settings.SHIPPING_FEE,"freeShippingThreshold":settings.FREE_SHIPPING_THRESHOLD})

@require_GET
def catalog(request):
    products=[]
    for p in Product.objects.filter(active=True).prefetch_related("variants"):
        products.append({"id":p.slug,"name":p.name,"category":p.category,"fabric":p.fabric,"color":p.color,"description":p.description,"price":p.price,"image":p.image,"imagePosition":p.image_position,"badge":p.badge,"sample":p.is_sample,"variants":[{"size":v.size,"stock":v.stock} for v in p.variants.all()]})
    return JsonResponse({"products":products})

@require_POST
def create_order(request):
    if not settings.CHECKOUT_ENABLED: return error("Orders are not open yet. Please check back soon.",503)
    if limited(request,"order"): return error("Too many attempts. Please try again in a few minutes.",429)
    try:
        d=body(request)
        key=uuid.UUID(str(d.get("idempotencyKey","")))
        email=str(d.get("email","")).strip().lower()
        validate_email(email)
        existing=Order.objects.filter(idempotency_key=key).first()
        if existing:
            if existing.email != email: return error("Invalid order request.",409)
            return JsonResponse(order_response(existing))
        fields={}
        for name,maximum in [("name",120),("phone",25),("address",500),("city",100)]:
            value=str(d.get(name,"")).strip()
            if not value or len(value)>maximum: raise ValueError(f"Please enter a valid {name}.")
            fields[name]=value
        if not re.fullmatch(r"[+0-9() -]{10,25}",fields["phone"]): raise ValueError("Please enter a valid phone number.")
        items=d.get("items")
        if not isinstance(items,list) or not 1<=len(items)<=30: raise ValueError("Your bag must contain 1 to 30 items.")
        grouped={}
        for item in items:
            if not isinstance(item,dict): raise ValueError("Invalid item.")
            qty=item.get("quantity")
            if type(qty) is not int or not 1<=qty<=10: raise ValueError("Choose between 1 and 10 of each item.")
            pair=(str(item.get("id","")),str(item.get("size","")))
            grouped[pair]=grouped.get(pair,0)+qty
            if grouped[pair]>10: raise ValueError("Maximum 10 per size.")
        with transaction.atomic():
            subtotal=0
            resolved=[]
            for (slug,size),qty in sorted(grouped.items()):
                variant=Variant.objects.select_for_update().select_related("product").filter(product__slug=slug,product__active=True,size=size).first()
                if not variant: raise ValueError("An item is no longer available.")
                if variant.product.is_sample and not settings.DEBUG: raise ValueError("Sample products cannot be purchased.")
                if Variant.objects.filter(pk=variant.pk,stock__gte=qty).update(stock=F("stock")-qty)!=1:
                    raise ValueError(f"Not enough stock for {variant.product.name} in {size}.")
                subtotal+=variant.product.price*qty
                resolved.append((variant,qty))
            shipping=0 if subtotal>=settings.FREE_SHIPPING_THRESHOLD else settings.SHIPPING_FEE
            order=Order.objects.create(idempotency_key=key,email=email,subtotal=subtotal,shipping=shipping,total=subtotal+shipping,is_test=settings.DEBUG,**fields)
            for variant,qty in resolved:
                OrderItem.objects.create(order=order,product_name=variant.product.name,variant=variant,size=variant.size,quantity=qty,unit_price=variant.product.price)
        return JsonResponse(order_response(order),status=201)
    except (ValueError,ValidationError,TypeError) as exc:
        return error(str(exc) if isinstance(exc,ValueError) else "Please check your details.")
    except IntegrityError:
        existing=Order.objects.filter(idempotency_key=key,email=email).first()
        return JsonResponse(order_response(existing)) if existing else error("Please retry your order.",409)

@require_POST
def track_order(request):
    if limited(request,"track",30): return error("Please try again in a few minutes.",429)
    try:
        d=body(request)
        reference=uuid.UUID(str(d.get("reference","")))
        order=Order.objects.filter(reference=reference,email=str(d.get("email","")).strip().lower()).first()
        if not order: return error("No matching order. Check your reference and email.",404)
        result=order_response(order)
        result["created"]=order.created_at.isoformat()
        result["items"]=[{"name":i.product_name,"size":i.size,"quantity":i.quantity} for i in order.items.all()]
        return JsonResponse(result)
    except (ValueError,TypeError): return error("Please enter a valid order reference.")

@require_POST
def newsletter(request):
    if limited(request,"subscribe"): return error("Please try again later.",429)
    try:
        d=body(request)
        email=str(d.get("email","")).strip().lower()
        validate_email(email)
        if d.get("consent") is not True: raise ValueError()
        Subscriber.objects.get_or_create(email=email)
        return JsonResponse({"message":"You are on the list. Thank you for joining us."})
    except (ValueError,ValidationError): return error("Please enter a valid email and agree to subscribe.")

@require_POST
def contact(request):
    if limited(request,"contact",10): return error("Please try again later.",429)
    try:
        d=body(request)
        email=str(d.get("email","")).strip().lower()
        validate_email(email)
        name=str(d.get("name","")).strip()
        message=str(d.get("message","")).strip()
        if not 1<=len(name)<=120 or not 10<=len(message)<=3000: raise ValueError()
        ContactMessage.objects.create(name=name,email=email,message=message)
        return JsonResponse({"message":"Your message has been received."},status=201)
    except (ValueError,ValidationError): return error("Enter your name, email, and a message of 10–3,000 characters.")
