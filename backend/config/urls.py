from django.contrib import admin
from django.urls import path
from shop import views, auth_views
urlpatterns = [
    path("api/account/", auth_views.account),
    path("api/signup/", auth_views.signup),
    path("api/login/", auth_views.signin),
    path("api/logout/", auth_views.signout),
    path("admin/", admin.site.urls),
    path("api/catalog/", views.catalog),
    path("api/session/", views.session),
    path("api/orders/", views.create_order),
    path("api/track/", views.track_order),
    path("api/newsletter/", views.newsletter),
    path("api/contact/", views.contact),
]
