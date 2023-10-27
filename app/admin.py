from django.contrib import admin
from .models import *

@admin.register(RefAdminData)
class RefAdminDataAdmin(admin.ModelAdmin):
    list_display = ['id','name','username','password','will_get','wiil_give']

@admin.register(RefCRMCustomer)
class RefCRMCustomerAdmin(admin.ModelAdmin):
    list_display = ['id','name','mobile_number','email','address','comission','username','password','outstanding','is_active','created_at','updated_at']