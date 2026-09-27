import json, urllib.request, http.cookiejar
base="http://localhost:3000"
for path in ["/","/shop","/product/noor","/wishlist","/checkout","/track","/contact","/about","/policies"]:
    with urllib.request.urlopen(base+path,timeout=60) as response:
        html=response.read().decode()
        assert response.status==200,(path,response.status)
        assert "KAHLID FABRIC" in html,path
        assert "Your site is taking shape" not in html,path
    print("OK",path)
jar=http.cookiejar.CookieJar()
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
session=json.load(client.open(base+"/api/session/"))
catalog=json.load(client.open(base+"/api/catalog/"))
assert len(catalog["products"])>=8
request=urllib.request.Request(base+"/api/track/",data=json.dumps({"reference":"invalid","email":"test@example.com"}).encode(),headers={"Content-Type":"application/json","X-CSRFToken":session["csrfToken"],"Origin":base})
try:
    client.open(request)
except urllib.error.HTTPError as error:
    assert error.code==400,error.code
    assert "error" in json.load(error)
else:
    raise AssertionError("Invalid tracking request unexpectedly succeeded")
print("OK API proxy, CSRF session and validation")
