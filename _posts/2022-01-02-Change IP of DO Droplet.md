---
layout: post
title: Automatically Changing the Public IP of a Digital Ocean Droplet
subtitle: they'll never catch you now!
bigimg: /img/hiding.png
tags: [network, ipv4, digitalocean, pentest, droplet]
date: 2020-10-02
---

Sometimes it's necessary to change the public IP address of a cloud deployed system.  I had need to do that recently and wanted to be able to do it again on a regular basis, here we go.

I recently moved a script that I regularly use from AWS to DO for cost saving. The script calls other scripts that pull subdomain info for various root domains.  After migrating the script and running it for the first time in DO I noticed that I was getting a lot more results than expected...  I went through some troubleshooting steps thinking I must've missed something and was getting historic results, but no, these were valid results.

So my first thought (and so far my only thought) is that due to me being on a new IP after moving from AWS then a lot of the sources i'm using for searching for subdomains are letting me back after flagging my previous IP address.  I have no logs or reports saying that my IP has been blocked anywhere, but this is my running theory.

## Step 1 - The setup

Digital Ocean uses a Ruby thing for API calls (I found out half-way through that they also have a normal API).  I tend to try and avoid Ruby where I can (he says while using Ruby to host this blog) however there isn't much I can do about that.

### Ruby Install
Ensure Ruby is installed on the host from where we will be running this script (Ubuntu 20.04):

`sudo apt install ruby-full`

For other linuxes you can install ruby from package manager as well.  For other platforms you can figure it out yourself, you're clever:

Ruby install guide: [https://www.ruby-lang.org/en/documentation/installation/](https://www.ruby-lang.org/en/documentation/installation/)

### Gem install

{: .box-note}
**Note:** Ruby uses things called gems.  I think this is back to front, a ruby is a gem, a gem is not a ruby.  The whole thing should be called Gem, and then a thing in it should be called a ruby, then you could have other types of gems.

You can do stuff to get the gem in and find more details here: [https://github.com/digitalocean/droplet_kit](https://github.com/digitalocean/droplet_kit).

You can add it to applications or something, not sure, things are too dynamic these days.  To install in Ubuntu 20.04 do this:

`sudo gem install droplet_kit`

### DO API key

We need to get ourselves an API key so that or script can auth to DO.  

Login to your DO control panel: [https://cloud.digitalocean.com/login](https://cloud.digitalocean.com/login) 

At the very bottom of the left hand menu, click on the API thing:

<p align="center">
<img src="{{site.url}}/img/2020-10-02 10_23_54.png" alt="drawing" width="300" class="center"/>
</p>

Then click on Generate New Token:

<p align="center">
<img src="{{site.url}}/img/2020-10-02 10_24_28.png" alt="drawing" width="800" class="center"/>
</p>

Give the new token a name and ensure both Read and Write are selected:

<p align="center">
<img src="{{site.url}}/img/2020-10-02 10_26_52.png" alt="drawing" width="600" class="center"/>
</p>

{: .box-note}
**Warning:** Make sure you take note of your API token here and store it safely and securely.  You will never be able to see this key again, and if someone gets there hands on it they can do stuff to you!!!

<p align="center">
<img src="{{site.url}}/img/2020-10-02 10_28_17.png" alt="drawing" width="600" class="center"/>
</p>

## Step 2 - The script

So the process we need to undertake is this:

1.  Shutdown the droplet
2.  Take a snapshot of the droplet
3.  Delete the droplet
4.  Deploy the snapshot to a new droplet (ensuring we keep the same size, region, etc.)
5.  Delete the snapshot
6.  Get the new IP address

ANd luckily I've done this all for you. Get this script on to wherever you installed the Ruby stuff, then run it with:

 `ruby do-ipchange.rb <api-token> <droplet name>`


```
#/!/usr/bin/ruby -w

# The setup
require 'time'
require 'droplet_kit'
require 'json'

if ARGV.length != 2
    puts "Usage: do-ipchange <api-token> <droplet name>"
    exit
end

Timestamp = Time.now.utc.iso8601
Token=ARGV[0]
Droplet_name=ARGV[1]
Client = DropletKit::Client.new(access_token: Token)

# Get the ID, size and location of the droplet we are doing this on
def get_droplet_id()
  droplets = Client.droplets.all
  droplets.each do |droplet|
    if droplet.name == Droplet_name
      puts "  - Droplet id: #{droplet.id}"
      puts "  - Droplet size_slug: #{droplet.size_slug}"
      puts "  - Droplet region: #{droplet.region.slug}"
      @droplet_id = droplet.id
      @droplet_size = droplet.size_slug
      @droplet_region = droplet.region.slug
    end
  end
rescue NoMethodError
  puts JSON.parse(droplets)['message']
end

# Shut down the droplet
def shutdown(id)
  res = Client.droplet_actions.shutdown(droplet_id: id)
  until res.status == "completed"
    res = Client.actions.find(id: res.id)
    sleep(2)
  end
  puts " *   Action status: #{res.status}"
rescue NoMethodError
  puts JSON.parse(res)['message']
end

# Create snapshot
def take_snapshot(id, name)
  res = Client.droplet_actions.snapshot(droplet_id: id, name: name)
  until res.status == "completed"
    res = Client.actions.find(id: res.id)
    sleep(2)
  end
  puts " *   Action status: #{res.status}"
rescue NameError
  puts JSON.parse(res)['message']
end

# Delete incumbent droplet
def delete_droplet(id)
  res = Client.droplets.delete(id: id)
  until res == True
    sleep(2)
  end
  puts res
end

# Create new droplet from snapshot
def deploy_droplet()
  images = Client.images.all(public:false)
  images.each do |image|
    if image.name == Timestamp
      @image_id = image.id
      puts @image_id
    end
  end
  droplet = DropletKit::Droplet.new(name: Droplet_name, region: @droplet_region, size: @droplet_size, image: @image_id)
  res = Client.droplets.create(droplet)
  puts " *   Action status: #{res.status}"
rescue NameError
  puts JSON.parse(res)['message']
end

# Delete snapshot
def delete_snapshot()
  res = Client.images.delete(id: @image_id)
  until res == true
    sleep(2)
  end
  puts " *   Action status: #{res.status}"
rescue NameError
  puts res
end

# Get IP of new droplet
def get_IP()
    droplets = Client.droplets.all
    droplets.each do |droplet|
        if droplet.name == Droplet_name
            puts "  - Droplet ID: #{droplet.id}"
            droplet.networks.each do |network|
                network.each do |net|
                    if net["type"] == 'public'
                        puts "  - Droplet IP: #{net["ip_address"]}"
                    end
                end
            end
        end
    end
rescue NameError
    puts "Something went wrong in get_IP()"
end

puts "Getting droplet id..."
get_droplet_id()
puts "Powering off droplet..."
shutdown(@droplet_id)
sleep(2)
puts "Taking snapshot..."
take_snapshot(@droplet_id, Timestamp)
sleep(2)
puts "Deleting droplet..."
delete_droplet(@droplet_id)
sleep(2)
puts "Creating new droplet from image..."
deploy_droplet()
sleep(2)
puts "Deleting snapshot..."
delete_snapshot()
puts "Waiting 30s for new droplet to deploy..."
sleep(30)
puts "Getting details of new droplet..."
get_IP()
puts " Complete"
```

## Conclusion

I think this would've been simpler using the normal HTTP API, I don;t know why I did this with the Ruby gem.  You can also access this script on github [https://github.com/joefizz/scripts/blob/main/do-ipchange.rb](https://github.com/joefizz/scripts/blob/main/do-ipchange.rb)
