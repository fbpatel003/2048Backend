from django.db import models

# Create your models here.
class RefAdminData(models.Model):
    name = models.CharField(max_length=100)
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=50)
    will_get = models.FloatField(default=0.0)
    wiil_give = models.FloatField(default=0.0) 


class RefCRMCustomer(models.Model):
    name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=50)
    email = models.EmailField()
    address = models.TextField()
    comission = models.FloatField()
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True)
    outstanding = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)