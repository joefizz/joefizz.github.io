---
author: joseph
title: Nessus SSL cert from letsencrypt.org
tags: [nessus, ssl]
---

We have Nessus set up on a cloud hosted server for shared use.  Access to it is restricted by IP address to only allow our VPN connections in so we are relatiely confident on the security of the connection.  However the security pop-up in the browser is annoying and if there's an easy way to fix a problem, you can be sure i'll ignore it until i'm looking for a distraction.

A potential solution to this security warning is just installing the root CA from Nessus.  This can be achieved by browsing to `https://[IP address]:8834/getcert`

The more time consuming solution is to install an SSL certificate that is signed by a known Certificate Authority (CA).  Most CA's charge for certificate but Let's Encrypt (<https://letsencrypt.org>) is here to rescue your insecure SSL connections.  Let's Encrypt, by their own webpage banner, is a free, automated, and open Certificate Authority.  They are sponsored by a huge selection of tech giants which enables them to offer this service for free.

As well as providing free CA certificates they also offer great guides on getting things set up along with a tool called certbot that aims to set all your SSL certs up with their service and also automated the renewal process.  Excellent!

From experience securing a basic Linux site running on nginx or Apache is relatively straight-frorward and takes jsut a few minutes with certbot.  More technical set-ups can take a bit more tinkering.  In our case it is nessusd listening on port 8834 (Nessus's port) and therefore we wouldn't be looking at a standard setup that certbot could manage all by itself, but it should be realtively easy nonetheless.

1.  First we need to get certbot up and running on our server.  There are great guides for this over at <letsencrypt.org> which you can follow.  Here we are running Nessus on CentOS 7 so the following will be based on that. (certbot requires shell access so if you don't have that to your Nessus host then you're going to struggle going forward)

    To install certbot we need the EPEL repository.  This doesn't come with CentOS by default but is relatively common repo that is used for additional tools.  To enable the EPEL repo for CentOS 7 just do the following:

    ```
    $ sudo yum install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
    ```
    Once EPEL is installed certbot can be installed just like this:

    ```
    $ sudo yum install certbot
    ```

2.  Now that certbot is installed we can use it to produce our SSL certs.  When certbot runs throught this process it does an HTTP test from its servers back to the local Nessus host to confirm that the domain name we use is valid and targets this server.  Nessus listens on port 8834 which leave port 80 free for certbot to use.  If this is the same as your setup then run certbot as so (make sure port 80 is open publicly):

    ```
    $ sudo certbot certonly --standalone
    ```
    If you happen to be running another HTTP service on port 80 you can either stop it and let certbot run.  Or run certbot with the webroot flag

    ```
    $ sudo certbot certonly --webroot
    ```

    You will then be taken through some steps asking for email address, domain, etc.  Following which certbot will verify your domain, and then produce and download your SSL certs to the `/etc/letsencrypt/archive` directory.  It will also create handy links to these certificates in the `/etc/letsencrypt/live/DOMAIN_NAME` directory.

3.  Now that we have our fancy new certs we need to let Nessus have them.  According to the Nessus docs the location it looks for  certs on Linux hosts is:

    ```
    /opt/nessus/com/nessus/CA/servercert.pem

    /opt/nessus/var/nessus/CA/serverkey.pem
    ```

    And in addition to this you also need to ensure that the intermediate certificates are available at:
    ```
    /opt/nessus/com/nessus/CA/cacert.pem
    ```

    The sensible thing to do here would be to move these certs out of the way, and replace them with links to our new certs (or the links at least.  linkception).  First we need to stop Nessus

    ```
    $ sudo systemctl stop nessusd
    ```

    and then move existing certs out of the way

    ```
    $ sudo mv /opt/nessus/com/nessus/CA/servercert.pem /opt/nessus/com/nessus/CA/servercert.pem.old
    $ sudo mv /opt/nessus/com/nessus/CA/cacert.pem /opt/nessus/com/nessus/CA/carcert.pem.old
    $ sudo mv /opt/nessus/var/nessus/CA/serverkey.pem /opt/nessus/var/nessus/CA/serverkey.pem.old
    ```

    now replace with links to the new certs
    ```
    $ sudo ln -s /etc/letsencrypt/live/DOMAIN NAME/cert.pem /opt/nessus/com/nessus/CA/servercert.pem
    $ sudo ln -s /etc/letsencrypt/live/DOMAIN NAME/chain.pem /opt/nessus/com/nessus/CA/cacert.pem
    $ sudo ln -s /etc/letsencrypt/live/DOMAIN NAME/privkey.pem /opt/nessus/var/nessus/CA/serverkey.pem
    ```
    Followed by starting Nessus up again
    ```
    $ systemctl start nessusd
    ```

4.  Now all that is left to do is browse to the site and see your classy new certificate!

