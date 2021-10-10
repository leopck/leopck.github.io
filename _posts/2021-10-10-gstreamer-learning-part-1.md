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
2. 

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
