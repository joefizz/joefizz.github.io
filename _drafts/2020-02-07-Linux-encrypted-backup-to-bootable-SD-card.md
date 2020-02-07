---
layout: post
title: Linux encrypted backup to bootable SD card
subtitle: You might need to give Amazon money for this one
bigimg: /img/shutterstock_dog_laptop.jpg
tags: [laptop, backup, encrypted, rsync, timeshift]
date: 2020-02-07
---

## Introduction

Recently I was supplied with a new laptop and as is the common sense thing to do, I installed Kali as my base OS (2019.4 in this case).  So far everything is actually going surprisingly well.  Kali distributions these days have lots of resources ready to go along with lots of addtitional packages that can be easily installed along with AppImages that just run (nearly).

One thing I was conscious of was how much time I spent configuring it just how I like, with packages, customisations, etc.  And the last thing I want to do is start this process over again.  So the sensible thing to do here is obviously get a backup working.  Now lets not beat around the bush, I am one of the laziest people you will ever meet, and therefore I will go to great lengths to find the solution that requires the least effort.  And lucky you lot get to benefit from my toils.  Hopefully this will be helpful for at least one person.

### The requirements and resources

Encryption - This is a work laptop, and as such would likely contain not just my personal info, but also information about my employer and also clients.  Therefore at rest my data must be encrypted.  As such any backups must be encrypted as well.

Seperate media for backup - I could backup to my local hard drive which would help if I ruin the OS somehow, but it wouldn't help if I suffer a disk failure.  Therefore I need the backup to be on a seperate disk (ideally it would be cloud based but we're not going that far today)

Set and forget - I don't want to have to kick off the backup myself. Nor do I want to have to leave the OS to do a complete system backup.

Hardware available - My laptop is a Dell Latitude which is a loverly little machine.  It helpfully comes with a micro SD card slot and for this setup we are going to utilise that.  At first I wasn't too sure but then saw the cost of micro SD cards on Amazon.  I got a 128GB card for under £20 and if this isn;t enough for some you can get 512GB for around £60 at the moment (they go bigger than as well).

### The setup

OK so this is what it's going to be.  We'll be using LUKS to encrypt our SD card, we will then configure the OS with to open this encrypted device on boot so we don't have to faff around with it.  

We're using a 128GB SD Card.  I think my base OS is about 20GB and rsync uses links to existing snapshots to cut down on space so will have plenty of space for a lot of backups.  Like I said before if you have a bigger OS, get a bigger SD card.

We will then be using a great package called TimeShift to do rsync images of the OS disk.  We will configure it to run daily with something resembling GFFS which will give us the option of reverting to a recent or historic backup, or just pulling in single files that we might've lost or broken.

## Let's get started

(You'll see me SUDOing all over the place because I set up a standard user in Kali)

### Step 1 - Create Encrypted SD Card

We first need to clear the SD Card and get ourselves an empty partition to encrypt.  Open GParted (`sudo apt install gparted` if you don't already have it).

1.  Select your SD card from the top right menu
2.  Select the partition in the middle of the window
3.  Click the Delete button to assign that task
4.  Click Apple to run the task

<p align="center">
<img src="{{site.url}}/img/gparted-1234.png" alt="drawing" width="700" class="center"/>
</p>

Linux gives SD cards a funny device name, not sure why but it doesn't really matter.  Although it's probably a good idea to write the device name down at this point so you know what it is, we'll be needing it later on.

Now we want to create an empty partition.  Still with GParted execute these steps:

1.  Ensure that we still have our SD Card seelcted in the top right corner
2.  Click on New
3.  Choose Unformatted for the `File system`
4.  Click on Add
5.  Click on Apply to execute the task

If you get any boring warning or confirmation boxes just ignore them and click through, who needs more problems in life?

<p align="center">
<img src="{{site.url}}/img/gparted5678.png" alt="drawing" width="700" class="center"/>
</p>

This is it for GParted (assuming everything worked).  You can close it down and we'll move to the encrypting step.

For the actual encryption we will be using `cryptsetup` to encrypt the partition with `dm-crypt` using LUKS extensions. (I don't know what all this means)

With LUKS you can have multiple keys that can be individually used to access the encrypted item.  We are going to first set the encryption up with a key file, then will add a passphrase as well (in case we lose the file cause we're a bit careless sometimes)

You can literally use any file as the key file as long as it never changes (because then it's a different file).  To create a strong keyfile you can run this (obviously update the `of` path to somewhere suitable for you):

```
sudo dd if=/dev/urandom of=/home/joseph/Downloads/keyfile.txt bs=1024 count=4
```


First we need to create the encrypted partition (update `--key-file`):

```
sudo cryptsetup luksFormat -c aes-xts-plain64 --key-size 512 --hash sha512 --use-urandom --key-file ./keyfile.txt /dev/mmcblk0p1
```
Agree to any prompts and ensure when you write YES that you write it ALL IN UPPERCASE (I literally created a support ticket with these guys because I can't follow simple instructions)

<p align="center">
<img src="{{site.url}}/img/cryptsetup1.png" alt="drawing" width="1000" class="center"/>
</p>

You then need to open the encrypted device using your keyfile

```
sudo cryptsetup open /dev/mmcblk0p1 sd-backup --key-file ./keyfile.txt
```

Once opened you can format it as ext4:

```
sudo mkfs.ext4 /dev/mapper/sd-backup
```

Now we'll add that second key, the passphrase

```
sudo cryptsetup -v luksAddKey /dev/mmcblk0p1 --key-file=./keyfile.txt
```
<p align="center">
<img src="{{site.url}}/img/cryptsetup4.png" alt="drawing" width="700" class="center"/>
</p>

That's it.  we now have an encrypted SD card ready for our backup.

### Step 2 - Get the SD Card to auto mount on boot

Remember we don't want to do anything, that includes trying to mount an encrypted disk (seriously it's bothersome), so we can get the OS to do it for us on boot.  We can set it up to either use our key file, or ask us for a passphrase at boot time.  You can guess which the lazy option is.

We use `/etc/crypttab` to open the encrypted partition, and then `/etc/fstab` to mount the partition.

First we need to discover the UUID of the partition (update your device path appropriately):

```
% sudo cryptsetup luksDump /dev/mmcblk0p1 | grep "UUID"
```
<p align="center">
<img src="{{site.url}}/img/cryptsetup5.png" alt="drawing" width="700" class="center"/>
</p>

We then need to add a line to `/etc/crypttab` to open the partition.  We use Vim because we're power users, feel free to use the lesser editors if you wish. 

The line I need to add is:

`SDBackup UUID=986f53b0-04f1-4e8b-a605-9be025351bd0 /home/joseph/Downloads/keyfile.txt luks`

This is:

    `SDBackup` - The name we give the device once opened
    `UUID=` - The UUID of the partition as discovered above.  Make sure you put your one here, not mine.
    The next part is the full path to the keyfile (you now know my first name, or do you??)
    `luks` - This is telling crypttab how to handle it.

 The crypttab file will look something like this after you've added your line.  I have a line above for my system disk as this is also encrypted, it looks different as it's set up differently by Kali during the OS installation and does not use a key file.  You could do this for your SD Card line if you wanted to use a passphrase on boot rather than a key file:

<p align="center">
<img src="{{site.url}}/img/crypttab.png" alt="drawing" width="700" class="center"/>
</p>

Once this is done you then need to add a line to `/etc/fstab` to mount the card.  As we will be using Timeshit for the snapshots and Timeshift will only create images in the `/timeshift` folder then this is where we need to mount our partition.

Open your `/etc/fstab` file with your editor of choice and add a line to the bottom soemthing like this:

`/dev/mapper/SDBackup /timeshift auto nosuid,nodev,nofail 0 0`

This should be fairly obvious what the different bits do, if you have used a different mapping name for your device ensure you update it here.  `/timeshift` needs to remain as it is thoguh for the reason mentioned above.

This is it for the auto-mount.  I;d go ahead and throw a reboot here and ensure the partition is mounting correctly.

`sudo init 6`

### Step 3 - Setting up snapshots with Timeshift

Right so first thing to do is install Timeshift.  THat's and easy one:

`sudo apt install timeshift`

Once this is in you should be able to launch it from your apps menu:

<p align="center">
<img src="{{site.url}}/img/timeshift-new.png" alt="drawing" width="600" class="center"/>
</p>

We are going to use the Wizard for our initial setup so click the Wizard button on the toolbar.

Choose RSYNC as the snapshot type and click `Next`

Make sure you choose the correct partition here and click `Next`.  If you've made it this far I'm pretty confident you know which one to choose.  If you don;t see yours there it's either not mounted properly or you've messed something up.  Good one, Doofus.

<p align="center">
<img src="{{site.url}}/img/timeshift1.png" alt="drawing" width="600" class="center"/>
</p>

On this next screen you can choose how many backups you want to keep.  The default is 5 daily backups, 1 weekly and 1 monthly.  Your choices here will obviously be affected by the size of your base OS, the size of your SD Card, and whether you choose to back up your user files (more on that later).

I've gone with the settings in the screenshot, this can be modified later if need be.

<p align="center">
<img src="{{site.url}}/img/timeshift2.png" alt="drawing" width="600" class="center"/>
</p>

Now it's time to decide how much user data will be backed up. This bit is a little confusing at first, and I think they could give us some more options.  Basically you can choose to backup nothing, just hidden items, or everything within the user folder (Not sure why they don't just say that).  Your user options here will obviously change depending on number of users, etc.  I've chose Hidden items and once the wizard is complete I will be adding some more folders manually.

<p align="center">
<img src="{{site.url}}/img/timeshift3.png" alt="drawing" width="600" class="center"/>
</p>

Wizard is now complete and we can see in the bottom right corner how much space is left on our SD Card.

<p align="center">
<img src="{{site.url}}/img/timeshift4.png" alt="drawing" width="600" class="center"/>
</p>

Now that the wizard is finished we can add any extra folders from a home folder that we want.  Again this bit is a bit confusing, you can only add exclusions here, but then you can change them to being inclusions.

Click the `Add Files` or `Add Folders` button to add whichever you want.  Then once added ensure that you cahnge the option from a - to a + so that it includes the file or folder in the snapshot.  Close settings once done (settings changes auto save)

It's sensible now to create your initial snapshow, which you can do by clicking the `Create` button on the toolbar.  My first snapshot was around 20GB and only took a few minutes to complete (SSD to SD Card)

