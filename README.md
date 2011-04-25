Muchmala
==========
Massive multiplayer online puzzle.

Requirements
------------

* git v1.6.5+
* [Vagrant](http://vagrantup.com/)
* maverick32 box added to Vagrant

Installation
------------

    $ git clone --recursive git@github.com:borbit/puzzle.git
	$ cd puzzle
	$ vagrant up
	# wait some time until VM is ready
	$ vagrant ssh
    # now we're inside the VM
    $ cd /opt/muchmala
    $ npm install
    $ sudo ln -sf /opt/muchmala/config/nginx.conf /etc/nginx/sites-enabled/muchmala
    $ sudo rm /etc/nginx/sites-enabled/default
    $ sudo /etc/init.d/nginx restart
    # put some big image (e.g. puzzle.jpg) in project directory and generate a puzzle
    $ bin/muchmala-generator -i puzzle.jpg -n puzzle -ps 150
    $ sudo bin/muchmala

You can check if Muchmala is running by opening `http://33.33.33.15/` in your browser.
