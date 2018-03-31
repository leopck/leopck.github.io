---
layout: post
title: Project MangaMeeya
---

**What is MangaMeeya?**

It is a fast and small image viewer that is commonly used in the Manga reading community.
This software isn't open source but it is very fast and would only take less than a few seconds to extract and open to view each images within a large and heavy zip file (400++ MB).

**What is so impressive about that?**

Well to begin with, most programs nowadays are very slow in opening large images and this is excluding extracting the image from a compressed file (e.g zip or rar).

**Okay, sounds cool. Why don't we just use MangaMeeya as it is?**

MangaMeeya is quite old and the original developer left without leaving the code open sourced. So the community isn't able to support this software for long. There are alternative, but after using them, MangaMeeya is still superior in terms of speed and image processing.

**Okay, you got my interest.... What do we do now?**

So, I spent some time looking at the MangaMeeya, it's likely that MM is designed in C++/C with VS (Visual Studio) or something similar. And it's possible that the code is pretty simple. Also, it doesn't look like MM uses large libraries to read the image codecs based on the existance of libpng and other image codecs. Also, going thru MM, it seems that it loads all the images that it extracts into the RAM in order to gain that speed.

Things to point out:
1. Doesn't use heavy and bulky image codecs and frameworks
2. Loads all extracted images into RAM
3. How long does extraction to RAM takes? Usually extracting from 7zip would take some time for 400+MB. Probably the slowest process is actually writing into the disk.
4.

Reference:
[GUI toolkit](https://www.khronos.org/opengl/wiki/Related_toolkits_and_APIs)
[opengl](http://www.opengl-tutorial.org/beginners-tutorials/tutorial-1-opening-a-window/)
[glfw](http://www.glfw.org/docs/latest/quick.html)
[SOIL](http://www.lonesock.net/soil.html)
[Displaying an image in C answered!](https://www.quora.com/How-can-I-display-image-in-C)
