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