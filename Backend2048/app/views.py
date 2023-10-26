from django.shortcuts import render
from .models import *
from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse
# Create your views here.

@csrf_exempt
def admin_test(request):
    all_data = json.loads(request.body)
    username = all_data['username']
    password = all_data['password']
    if RefAdminData.objects.filter(username=username,password=password).exists():
        return JsonResponse({'msg':True})
    return JsonResponse({'msg':False})

@csrf_exempt
def Ref_CRM_Customer(request):
    all_data = json.loads(request.body)
    name = all_data['name']
    mobile_number = all_data['mobile_number']
    email = all_data['email']
    address = all_data['address']
    comission = all_data['comission']
    username = all_data['username']
    password = all_data['password']
    outstanding = all_data['outstanding']
    is_active = all_data['is_active']

    if RefCRMCustomer.objects.filter(email=email).exists():
        return JsonResponse({'msg':'email is already exists'})
    RefCRMCustomer.objects.create(
        name = name,
        mobile_number = mobile_number,
        email = email,
        address = address,
        comission = comission,
        username = username,
        password = password,
        outstanding = outstanding,
        is_active = is_active
    )
    return JsonResponse({'msg':True})

def get_active(request):
    all_data = list(RefCRMCustomer.objects.filter(is_active=True).values())
    return JsonResponse({'data':all_data,'msg':True})