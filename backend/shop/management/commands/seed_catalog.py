import json
from pathlib import Path
from django.core.management.base import BaseCommand
from shop.models import Product, Variant
class Command(BaseCommand):
    help="Load clearly marked demonstration products without changing existing inventory"
    def handle(self,*args,**kwargs):
        data=json.loads((Path(__file__).resolve().parents[4]/"data"/"catalog.json").read_text(encoding="utf-8"))
        for row in data:
            p,created=Product.objects.get_or_create(slug=row["id"],defaults={"name":row["name"],"category":row["category"],"fabric":row["fabric"],"color":row["color"],"description":row["description"],"price":row["price"],"image":row["image"],"image_position":row.get("imagePosition","center"),"badge":row.get("badge",""),"is_sample":True})
            if created:
                for v in row["variants"]: Variant.objects.create(product=p,size=v["size"],stock=v["stock"])
        self.stdout.write(self.style.SUCCESS("Sample catalog ready. Existing inventory preserved."))
