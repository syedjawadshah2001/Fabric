from django.contrib import admin
from .models import Product, Variant, Order, OrderItem, Subscriber, ContactMessage
admin.site.site_header = "KAHLID FABRIC"
admin.site.site_title = "KAHLID FABRIC Management"
admin.site.index_title = "Store management"
class VariantInline(admin.TabularInline):
    model = Variant
    extra = 0
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name","category","price","active","inquiry_only"]
    list_filter = ["category","active","inquiry_only"]
    search_fields = ["name","slug"]
    prepopulated_fields = {"slug":("name",)}
    inlines = [VariantInline]
class ItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ["product_name","variant","size","quantity","unit_price"]
    def has_add_permission(self, request, obj=None): return False
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["reference","name","total","status","is_test","created_at"]
    list_filter = ["status","is_test","created_at"]
    search_fields = ["reference","name","email","phone"]
    readonly_fields = ["reference","idempotency_key","name","email","phone","address","city","subtotal","shipping","total","payment_method","is_test","created_at"]
    inlines = [ItemInline]
    def has_add_permission(self, request): return False
    def has_delete_permission(self, request, obj=None): return False
@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ["email","created_at"]
    search_fields = ["email"]
@admin.register(ContactMessage)
class ContactAdmin(admin.ModelAdmin):
    list_display = ["name","email","resolved","created_at"]
    list_filter = ["resolved"]
    readonly_fields = ["name","email","message","created_at"]
