#Scripting my own DDNS for Mikrotik

Mikrotik as in every other proprietary routers, has their own scripting language. Previously, I was using dlink router and they were kind enough to provide a free ddns service. Namely, dlinkddns which doesn't require any form of monthly activation or subsciption. The only condition was that you are an owner of dlink router, you can get the ddns domain name.

Of course the hostname will have a suffix at the end ***.dlinkddns.com, but this is acceptable seeing that it's free.

Now the challenge is that Mikrotik does provide ddns but it's weird as it's in random numbers which is not human-friendly.

What's more, Mikrotik doesn't support dlinkddns ddns updating, fortunately, they provide a scripting feature which allows anyone to script and make it run periodically.

With that, we can get started from there.

Some good resources:
https://wiki.mikrotik.com/wiki/Manual:Scripting
https://wiki.mikrotik.com/wiki/Scripts
https://wiki.mikrotik.com/wiki/Dynamic_DNS_Update_Script_for_dynDNS

And thankfully, someone has already reversed engineered the dlinkddns GET request, saving me the effort and time to sniff the packets off my router.

http://herd-of-neurons.com/node/53

With all these resources, it's simple to test out whether it's possible to run your own ddns script.

To begin, I tested out the GET request with my credentials and it works nicely

GET https://members.dyndns.org/nic/update?hostname=hostname.dlinkddns.com&wildcard=OFF&system=dyndns&myip=192.168.0.2

Accept: */*
Accept-Encoding: gzip, deflate
Authorization: Basic hashpassword
Connection: close
Pragma: no-cache
User-Agent: runscope/0.1,D-Link/DSR-250/1.09B32

To be continued... Now writing the ddns script into mikrotik
