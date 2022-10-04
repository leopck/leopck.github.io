Review from here: https://www.claudiokuenzler.com/blog/619/apt-behind-proxy-no-proxy-for-some-repositories

cat /etc/apt/apt.conf
Acquire::http::Proxy "http://proxy.example.com:8080";
Acquire::https::Proxy "http://proxy.example.com:8080";
Acquire::http::Proxy::repo.internal.local DIRECT;

Replace repo.internal.local with your repo and if it's using https, then change http to https
