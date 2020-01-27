---
layout: post
title: Change workspace with touchpad on Linux
subtitle: Why won't they just buy me a mac?
bigimg: /img/powerbook100.jpg
tags: [linux, kali, touchpad, workspaces, bash]
date: 2020-01-22
---
I was recently supplied with a new work laptop and chosen to go with a Linux base OS (specifically Kali 2019.4 in this instance).  I've traditionally always worked from a mac and so enjoy being able to navigate my various workspaces using the touchpad alone hwever with Linux this isn't such a pleasant experience.  I wanted to try and recreate this as best as possible and for now this is wear we've gotten to.

It's a straightforward multitouch swipe on the touchpad that allows you to switch between multiple horizontal workspaces.  There is no support for vertical workspaces however if you're a psychopath and you use vertical workspaces then it's just a matter of playing around with the script to get it to do what you want.

### How it's going to work

Basically we just need to install a bunch of stuff, store a wee script somewhere, then have a multitouch gesture call that script. This is mostly made possible by some great work by Mark Blakeley [https://github.com/bulletmark] and his creation of libinput-gestures.

We're going to install `xdotool` and `libinput-tools` to allow us to interact via the keyboard and touchpad. Then we'll be using `libinput-gestures` to read the gestures from the touchpad and map them to a command in the gestures configuration file.  I highly recommend reading the docs on Marks github page above to give you a lot more info.

On top of this we are going to install a GUI editor called `Gestures` from [@cunidev](https://gitlab.com/cunidev) that allows us to quickly add custom touchpad gestures.

This is actually some pretty cool stuff.  And you can actually do a lot more with it than what we will be doing, it's like we've just discovered a working hoverboard and decided to use it as a shelf of cans of beans.

This guide is for Debian flavours of Linux.  That's not to say that it won't work with other distributions, I've just not tested it so can't help you there.  Instructions for other distros can be found within the various links below.

### Let's get started

First we need to install the pre-requisites

```
sudo sudo apt install python3 python3-setuptools xdotool python3-gi libinput-tools python-gobject wmctrl bc
```

We also need to make sure that our current user is a member of the `input` group

```
sudo gpasswd -a $USER input
```

Once we have done those steps we want to clone `libinput-gestures` to somewhere, install it, and set it to auto-start.  In this case we are going to clone everything to `/opt/`

```
cd /opt
sudo git clone https://github.com/bulletmark/libinput-gestures.git
cd libinput-gestures
sudo make install
libinput-gestures-setup autostart
libinput-gestures-setup start
```

Now we need the `Gestures` GUI.  Again this is being cloned to /opt/ but you obvs can do whatever you prefer.

```
sudo git clone https://gitlab.com/cunidev/gestures.git
cd gestures/
sudo python3 setup.py install
```

Done!  That's the install process out of the way.  You should now be able to find `Gestures` in your applications menu.  As you can see there is nothing configured here yet.  Before we do any configuration we need to create a script that will allow us to change workspaces.

<p align="center">
<img src="{{site.url}}/img/gestures.png" alt="drawing" width="600" class="center"/>
</p>

### Our underlying script

This script allows us to change between any number of horizontal workspaces.  It's pretty basic and you should be able to understand it and hack it apart if you want it to do other things.  You could for instace change it so that when you get to your left or right-most workspace it cycles back to the first one like a carousel effect.  But I don't like this type of free love hippy nonsense so some sensible restrictions have been put in place.

Basically it just finds out the workspace number you are currently on and then adds or subtracts from it depending if you choose to go Left or Right.

Again you can put this wherever you want, just don't forget.  I like to have a single place ony my machine where I keep all my scriptsso I know where to find them.  Clever right?

I have called my script workspaceSwitcher.sh (I came up with this myself)

```
#!/bin/bash

CMD=`echo $1 | tr '[:upper:]' '[:lower:]'`
NUM_WORKSPACES=`wmctrl -d | wc -l`
WORKSPACES=`echo $NUM_WORKSPACES "-" 1 | bc` 

CURRENT_WS=`wmctrl -d | grep \* | cut -d " " -f 1`

case $CMD in

"left" )
        NEW_WS=`echo $CURRENT_WS "-" 1 | bc`
        if [[ $NEW_WS -lt 0 ]]; then NEW_WS=$CURRENT_WS; fi
        ;;

"right" )
        NEW_WS=`echo $CURRENT_WS "+" 1 | bc`
        if [[ $NEW_WS -gt $WORKSPACES ]]; then NEW_WS=$CURRENT_WS; fi
        ;;

* )

esac

wmctrl -s $NEW_WS
```

Now that the script is in place we need to configure `Gestures`

### GUI Configuration

Open `Gestures` from the applications menu and click the + button in the top left corner:

<p align="center">
<img src="{{site.url}}/img/gestures-add.png" alt="drawing" width="600" class="center"/>
</p>

The first gesture we will create is to switch to the workspace to the left.  Ensure `Swipe` is seelcted and then choose `left` for the Direction.  You can choose 3 or 4 fingers, I chose 4 fingers as Linux likes to use 3 finger taps as a middle click and this can get in the way sometimes, you might have better luck than me with 3 fingers but up to you.

Then in the command field enter the full path to your workspace switching script and ensure to add the argument `left` at the end

```
/opt/scripts/workspaceSwitcher.sh left
```

<p align="center">
<img src="{{site.url}}/img/gestures-left.png" alt="drawing" width="600" class="center"/>
</p>

Then click on Confirm and this is complete

<p align="center">
<img src="{{site.url}}/img/gestures-done.png" alt="drawing" width="600" class="center"/>
</p>

Repeat this process for swiping right (ensure that right swipe is selected and the `right` argument is added at the end of the command).

### The end

Done!  That's it, you should now be able to use your multi-touch gestures to switch between all your workspaces.  Again I highly recommend looking at all the other features that are possible with this setup.  There is a lot that can be accomplished.



