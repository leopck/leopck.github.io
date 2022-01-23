---
layout: post
title: Infineon Distance2Go Part 1
categories:
- blog
---

Infineon Distance2Go Part 1

---
# Infineon Distance2Go Part 1

## Getting started

1. Using Extract raw data as the main example:
```
https://github.com/leopck/P2G-Dashboard/tree/main/3rdparty/ComLib_C_Interface/examples
```

2. Compile on Linux

```
$ cd P2G-Dashboard/tree/main/3rdparty/ComLib_C_Interface
$ mkdir build && cd build
$ cmake ..
$ make
```

3. Run demo in root since /dev/ttyACM0 requires root access unless udev is setup

```
sudo ./hellodemo
```
