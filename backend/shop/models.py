import uuid
from django.db import models
from django.core.validators import MinValueValidator

class Product(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=60)
    fabric = models.CharField(max_length=60)
    color = models.CharField(max_length=60)
    description = models.TextField()
    price = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    image = models.CharField(max_length=500)
    image_position = models.CharField(max_length=40, default="center")
    badge = models.CharField(max_length=40, blank=True)
    active = models.BooleanField(default=True)
    is_sample = models.BooleanField(default=True)
    inquiry_only = models.BooleanField(default=False)
    def __str__(self): return self.name

class Variant(models.Model):
    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)
    size = models.CharField(max_length=20)
    stock = models.PositiveIntegerField(default=0)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["product","size"],name="unique_product_size")]
    def __str__(self): return f"{self.product.name} / {self.size}"

class Order(models.Model):
    reference = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    idempotency_key = models.UUIDField(unique=True)
    name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=25)
    address = models.TextField()
    city = models.CharField(max_length=100)
    subtotal = models.PositiveIntegerField()
    shipping = models.PositiveIntegerField()
    total = models.PositiveIntegerField()
    status = models.CharField(max_length=20, default="pending", choices=[("pending","Pending"),("confirmed","Confirmed"),("shipped","Shipped"),("delivered","Delivered"),("cancelled","Cancelled")])
    payment_method = models.CharField(max_length=20, default="cod")
    is_test = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return str(self.reference)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product_name = models.CharField(max_length=120)
    variant = models.ForeignKey(Variant, null=True, on_delete=models.SET_NULL)
    size = models.CharField(max_length=20)
    quantity = models.PositiveIntegerField()
    unit_price = models.PositiveIntegerField()

class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.email

class ContactMessage(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    message = models.TextField()
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name
