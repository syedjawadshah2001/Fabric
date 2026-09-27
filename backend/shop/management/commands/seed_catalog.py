import json
from pathlib import Path
from django.core.management.base import BaseCommand
from django.db import transaction
from shop.models import Product, Variant
class Command(BaseCommand):
    help="Import the 43 owner-supplied unstitched velvet designs; preserve stock and existing orders"
    @transaction.atomic
    def handle(self,*args,**kwargs):
        data=json.loads((Path(__file__).resolve().parents[4]/"data"/"catalog.json").read_text(encoding="utf-8"))
        # Only deactivate old demonstration products. Never delete orders or customer data.
        Product.objects.filter(is_sample=True).update(active=False)
        for row in data:
            p,created=Product.objects.get_or_create(slug=row["id"],defaults={"name":row["name"],"category":row["category"],"fabric":row["fabric"],"color":row["color"],"description":row["description"],"price":row["price"],"image":row["image"],"image_position":row.get("imagePosition","center"),"badge":row.get("badge",""),"is_sample":False,"inquiry_only":True})
            if created:
                Variant.objects.create(product=p,size="Unstitched",stock=0)
        self.stdout.write(self.style.SUCCESS("43 velvet designs imported. Availability is confirmed by the owner; no stock was invented."))
