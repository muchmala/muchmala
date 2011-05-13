Muchmala
==========
Massive multiplayer online puzzle.

Requirements
------------

* git v1.6.5+
* [Vagrant-only] [Vagrant](http://vagrantup.com/)
* [Vagrant-only] maverick32 box added to Vagrant
* [AWS-only] Amazon Web Services account credentials

Installation (Vagrant)
----------------------

1. Clone the repository recursively to also get all submodules.

        git clone --recursive https://github.com/muchmala/muchmala.git

2. Go inside the cloned directory and fire up Vagrant instance.

        cd puzzle
        vagrant up

3. Wait for the instance to finish provisioning.
4. SSH into it.

        vagrant ssh

5. Go to project directory.

        cd /opt/muchmala

6. Install required node modules.

        npm install

7. Install jake globally.

        sudo npm install jake -g

8. Put some big image into project directory. Call it something like `puzzle.jpg`.
9. Generate the first puzzle using that image.

        bin/muchmala-generator -i puzzle.jpg

10. Start all services using (don't forget the colon at the end).

        sudo supervisorctl start muchmala:

Vagrant is pre-configured to give your VM an IP address of 33.33.33.15.
This way you can now check if Muchmala is running by opening `http://33.33.33.15/` in your browser.

Installation (AWS)
------------------

TODO: automate all this stuff.

1. Launch instance based on AMI `ami-cef405a7` (others weren't tested, but any Ubuntu 10.10+ should work). Don't forget to allow incoming connections to port 80 in EC2 security group settings.
2. SSH into your EC2 instance.
3. Update packages info.

        sudo apt-get update

4. Install git, ruby and rubygems.

        sudo apt-get install -y git ruby1.8-dev rubygems

5. Install chef.

        sudo gem install --version 0.9.16 chef --no-rdoc --no-ri

6. Create project directory and change it's owner/group to the current user.

        sudo mkdir /opt/muchmala
        sudo chown $USER:$USER /opt/muchmala

7. Clone the project repository into project directory.

        git clone --recursive https://github.com/muchmala/muchmala.git /opt/muchmala

8. Go into project directory and run chef-solo.

        cd /opt/muchmala
        sudo /var/lib/gems/1.8/bin/chef-solo -c chef/solo.rb -j chef/node.json

9. Install required node modules.

        npm install
        sudo npm install jake -g

10. Create S3 bucket with the name like `static.muchmala.com` for JS/CSS/images, including puzzles images.
11. Create `config.local.js` that should look like this:

        var config = exports;
        config.DEV = false;
        config.AWS_KEY      = '<YOUR AWS KEY>';
        config.AWS_SECRET   = '<YOUR AWS SECRET>';

        config.MAIN_DOMAIN = 'muchmala.com'; // hostname of your EC2 instance

        config.IO_HOST = 'io.muchmala.com'; // for now it's just an alias for muchmala.com
        config.IO_PORT = 80; // don't forget the port - it's important

        config.STATIC_HOST = 'static.muchmala.com.s3.amazonaws.com'; // your S3 bucket hostname (or it's CNAME alias) for static files
        config.STATIC_PORT = 80; // don't forget the port - it's important

        config.S3_BUCKET_STATIC = 'static.muchmala.com'; // your S3 bucket name for static files

        config.TWITTER_KEY = '<YOUR TWITTER KEY>';
        config.TWITTER_SECRET = '<YOUR TWITTER SECRET>';

        config.FACEBOOK_ID = '<YOUR FACEBOOK ID>';
        config.FACEBOOK_SECRET = '<YOUR FACEBOOK SECRET>';

        config.YAHOO_KEY = '<YOUR YAHOO KEY>';
        config.YAHOO_SECRET = '<YOUR YAHOO SECRET>';

        config.GOOGLE_KEY = '<YOUR GOOGLE KEY>';
        config.GOOGLE_SECRET = '<YOUR GOOGLE SECRET>';


12. Put some big image into project directory. Call it something like `puzzle.jpg`.
13. Generate the first puzzle using that image.

        bin/muchmala-generator -i puzzle.jpg

14. Generate production CSS/JS and upload them to S3, together with puzzle images.

        ant
        jake static-upload

15. Start all services using (don't forget the colon at the end).

        sudo supervisorctl start muchmala:

You can now check if Muchmala is running by navigating to EC2's hostname in your browser.
