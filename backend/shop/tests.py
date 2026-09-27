import json, uuid
from django.test import TestCase, Client, override_settings
from django.core.cache import cache
from .models import Product, Variant, Order, Subscriber, ContactMessage

@override_settings(DEBUG=True,CHECKOUT_ENABLED=True)
class CommerceTests(TestCase):
    def setUp(self):
        cache.clear()
        self.p=Product.objects.create(slug="test-piece",name="Test piece",category="Pret",fabric="Cotton",color="Ivory",description="Test",price=2500,image="/images/product-ivory.png")
        self.v=Variant.objects.create(product=self.p,size="M",stock=3)
        self.data={"idempotencyKey":str(uuid.uuid4()),"name":"Test Buyer","email":"buyer@example.com","phone":"03001234567","address":"Sample Street","city":"Lahore","items":[{"id":self.p.slug,"size":"M","quantity":2}],"total":1}
    def post(self,path,data):
        return self.client.post("/api/"+path+"/",json.dumps(data),content_type="application/json")
    def test_order_total_ignores_client_price_and_decrements_stock(self):
        response=self.post("orders",self.data)
        self.assertEqual(response.status_code,201,response.content)
        self.assertEqual(response.json()["total"],5250)
        self.v.refresh_from_db()
        self.assertEqual(self.v.stock,1)
    def test_duplicate_request_does_not_double_order_or_deduct(self):
        first=self.post("orders",self.data)
        second=self.post("orders",self.data)
        self.assertEqual(first.json()["reference"],second.json()["reference"])
        self.assertEqual(Order.objects.count(),1)
        self.v.refresh_from_db()
        self.assertEqual(self.v.stock,1)
    def test_stock_failure_rolls_back(self):
        self.data["items"].append({"id":"missing","size":"M","quantity":1})
        self.assertEqual(self.post("orders",self.data).status_code,400)
        self.v.refresh_from_db()
        self.assertEqual(self.v.stock,3)
        self.assertEqual(Order.objects.count(),0)
    def test_insufficient_stock(self):
        self.data["items"][0]["quantity"]=4
        self.assertEqual(self.post("orders",self.data).status_code,400)
        self.assertEqual(Order.objects.count(),0)
    def test_negative_and_fractional_quantities_rejected(self):
        for quantity in [-1,0,1.5,True,11]:
            self.data["items"][0]["quantity"]=quantity
            self.assertEqual(self.post("orders",self.data).status_code,400)
    def test_tracking_requires_matching_email(self):
        ref=self.post("orders",self.data).json()["reference"]
        self.assertEqual(self.post("track",{"reference":ref,"email":"other@example.com"}).status_code,404)
        self.assertEqual(self.post("track",{"reference":ref,"email":"buyer@example.com"}).status_code,200)
    def test_csrf_enforced_and_valid_request_works(self):
        client=Client(enforce_csrf_checks=True)
        self.assertEqual(client.post("/api/orders/",json.dumps(self.data),content_type="application/json").status_code,403)
        token=client.get("/api/session/").json()["csrfToken"]
        self.assertEqual(client.post("/api/orders/",json.dumps(self.data),content_type="application/json",HTTP_X_CSRFTOKEN=token).status_code,201)
    def test_admin_requires_login(self):
        self.assertEqual(self.client.get("/admin/shop/order/").status_code,302)
    def test_newsletter_requires_consent_and_deduplicates(self):
        self.assertEqual(self.post("newsletter",{"email":"buyer@example.com"}).status_code,400)
        for _ in range(2):
            self.assertEqual(self.post("newsletter",{"email":"buyer@example.com","consent":True}).status_code,200)
        self.assertEqual(Subscriber.objects.count(),1)
    def test_contact_persists(self):
        self.assertEqual(self.post("contact",{"name":"Test","email":"buyer@example.com","message":"Please help with my sample order."}).status_code,201)
        self.assertEqual(ContactMessage.objects.count(),1)
    def test_free_shipping_threshold(self):
        self.v.stock=6;self.v.save()
        self.data["items"][0]["quantity"]=4
        self.assertEqual(self.post("orders",self.data).json()["shipping"],0)
    @override_settings(DEBUG=False,CHECKOUT_ENABLED=True)
    def test_sample_products_blocked_in_production(self):
        response=self.post("orders",self.data)
        self.assertEqual(response.status_code,400)
        self.assertIn("Sample",response.json()["error"])
    @override_settings(CHECKOUT_ENABLED=False)
    def test_checkout_switch(self):
        self.assertEqual(self.post("orders",self.data).status_code,503)
    def test_invalid_json(self):
        response=self.client.post("/api/orders/","[",content_type="application/json")
        self.assertEqual(response.status_code,400)
