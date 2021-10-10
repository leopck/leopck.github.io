---
layout: post
title: Gstreamer Learning Part 1
categories:
- blog
---

Gstreamer Learning Part 1

---
# Gstreamer Plugins Learning Part 1

There isn't much details online to detail on where to get started with, but after some research and some references on others that attempted this, this is the summary.
This learnings are to share about how to go about creating your own gstreamer plugin and where to get started. 

## Gstreamer Plugins Documentations

1. https://qiita.com/maueki/items/419f9a4bd0a397ec474c : Easily one of the best and simplest tutorial thus far to get started though not complete and using his code demo is broken for me as it doesn't run. Outdated.
2. https://developer.ridgerun.com/wiki/index.php?title=Creating_a_New_GStreamer_Element_or_Application_Using_Templates : Shows all the list of empty Gstreamer elements that I can use and how to use project maker
3. https://gstreamer.freedesktop.org/documentation/gstreamer/gstmemory.html?gi-language=c : Understanding on how gstreamer gstmemory works
4. https://lazka.github.io/pgi-docs/Gst-1.0/classes/MapInfo.html : Understanding on gst.mapinfo
5. https://gstreamer.freedesktop.org/documentation/gstreamer/gstbuffer.html?gi-language=c : Understanding on gstbuffer
6. https://gstreamer.freedesktop.org/documentation/gstreamer/gstutils.html?gi-language=c : Understanding on gstutils

## Build system with gstreamer and building steps

1. ninja -C build
2. meson build
3. (Optional) meson build install
4. GST_PLUGIN_PATH=. gst-launch-1.0 .... ! ....

## Getting Started with creating your own plugin

### Setup your environment

1. Install dependencies

```
$ sudo apt install build-essential libgstreamer1.0-dev indent
```

2. Get gst-project-maker and gst-element-maker

Because the Debian release doesn't come with this, we have to clone from the repo and gst-indent

```
$ mkdir -p ~/projectname
$ git clone https://anongit.freedesktop.org/git/gstreamer/gst-plugins-bad.git
$ cd gst-plugsins-bad/tools
$ cp -r gst-element-maker element-templates gst-project-maker ~/projectname

$ git clone https://anongit.freedesktop.org/git/gstreamer/gstreamer.git
$ cd gstreamer/tools
$ cp gst-indent ~/projectname
```


### Create a project

1. Using `gst-project-maker` to create a project and create the element using `gst-element-maker`

```
$ gst-project-maker myproject
```

2. Create plugin code

```
$ gst-element-maker numbersrc basesrc
$ gst-element-maker numbersink basesink
$ cp -r *.c *.h ~/myproject/plugins
```

3. Register your new plugins into the myproject code

In my case it's called gstmyprojectplugin.c

```
static gboolean
plugin_init (GstPlugin * plugin)
{
  gst_element_register (plugin, "myproject", GST_RANK_NONE, GST_TYPE_MYPROJECT);
  gst_element_register (plugin, "myprojectsrc", GST_RANK_NONE, GST_TYPE_MYPROJECTSRC);
  gst_element_register (plugin, "myprojectsink", GST_RANK_NONE, GST_TYPE_MYPROJECTSINK);

  return TRUE;
}
```

4. Build and compile

```
$ ninja -C build
$ meson build
```

5. Run

```
$ GST_PLUGIN_PATH=. gst-launch-1.0 myprojectsrc ! myprojectsink
```

## Error Notes

1. During the gstreamer exploration, I got blacklisted from the gstreamer which means there was something wrong with it, I fixed this using gst-project-maker instead of creating my own Makefile.
2. Use gst-inspect-1.0 to list all the features, the features should show your feature inside.
3. Use GST_DEBUG=5 gst-inspect-1.0 ... this will show all the debug log or gst-launch-1.0
4. Even if it compiles, it doesn't mean that the syntaxs pass, during runtime, it shows some syntaxs not found, resolve that.
5. Meaning of blacklist: https://newbedev.com/what-s-the-meaning-of-blacklisted-on-gstreamer

## Some important notes and understanding

When creating an element you can refer to here for a list of base elements that you can use:

```
Create an empty GStreamer element
The gst-element-maker tool creates a barebones GStreamer element which may inherit from a variety of base classes. As per 1.15, the base classes for elements available are:

audiodecoder
audioencoder
audiofilter
audiosink
audiosrc
baseparse
basesink
basesrc
basetransform
element
videodecoder
videoencoder
videofilter
videosink
Additionally, you can create classes based on other GStreamer elements such as:

sinkpad
sinkpad-audio
sinkpad-simple
sinkpad-template
sinkpad-template-video
srcpad
srcpad-audio
srcpad-simple
srcpad-template
srcpad-template-video
```

- Gstmemory

Helps to allocate a region of the memory and manage the data of a GstBuffer

- GstBuffer

Basic unit of data transfer in Gstreamer. Contains the timing and offset along with other arbitrary metadata that is associated with the GstMemory blocks that the buffer contains.

- Great sample for learning is filesrc:

Filesrc is pretty simple though they used goto which makes it look confusing and gchar with is from glib, but ignoring those, you'll comprehend the code pretty easily after organizing it using IDE.

https://github.com/GStreamer/gstreamer/blob/4a2d1d9c78580f247a35c217f9dc3fe077cd5a38/plugins/elements/gstfilesrc.h
https://github.com/GStreamer/gstreamer/blob/4a2d1d9c78580f247a35c217f9dc3fe077cd5a38/plugins/elements/gstfilesrc.c
