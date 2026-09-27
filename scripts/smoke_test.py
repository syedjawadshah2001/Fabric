import urllib.request
base="http://localhost:3000"
for path in ["/","/shop","/product/velvet-01","/wishlist","/checkout","/track","/contact","/about","/policies"]:
    with urllib.request.urlopen(base+path,timeout=45) as response:
        html=response.read().decode()
        assert response.status==200,(path,response.status)
        assert "KAHLID FABRIC" in html,path
        assert "Your site is taking shape" not in html,path
        assert "03299956666" in html,path
    print("OK",path,flush=True)
for number in [1,22,43]:
    with urllib.request.urlopen(base+f"/catalog/catalog_{number:02}.jpg",timeout=10) as response:
        assert response.status==200
        assert "image" in response.headers.get("Content-Type","")
print("OK catalog image delivery",flush=True)
