import urllib.request, urllib.error, urllib.parse, json

try:
    data = urllib.parse.urlencode({'username':'admin', 'password':'admin_password'}).encode()
    req = urllib.request.Request('http://127.0.0.1:8001/api/auth/login', data=data, headers={'Content-Type':'application/x-www-form-urlencoded'})
    token = json.loads(urllib.request.urlopen(req).read())['access_token']
    
    req2 = urllib.request.Request('http://127.0.0.1:8001/api/employees/', 
                                 data=json.dumps({'first_name':'Test', 'last_name':'User', 'email':'test3@example.com', 'phone':'+91 12345 67890', 'department':'Development', 'designation':'Tester'}).encode(), 
                                 headers={'Content-Type':'application/json', 'Authorization':'Bearer '+token})
    print("Response:", urllib.request.urlopen(req2).read().decode())
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print(e.read().decode())
