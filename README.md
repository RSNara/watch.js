watch.js
========

This is a node.js script that watches your working directory and **rsyncs** the changes to a remote server on each save.

```bash
node watch.js source destination
```

>	-i,	--identity=ARG		Specify id_rsa file location (default is `~/.ssh/id_rsa`).
>
>	-h,	--help			Display this help.
>
>	-v,	--version			Display version number.


### Example Output:
```bash
> watch.js ../a3/ rsnara@linux.student.university.ca:/home/rsnara/cs240/a3
SUCCESS: rsync -avz -e "ssh -i ~/.ssh/id_rsa" ../a3/ rsnara@linux.student.cs.university.ca:/home/rsnara/cs240/a3
SUCCESS: rsync -avz -e "ssh -i ~/.ssh/id_rsa" ../a3/ rsnara@linux.student.cs.university.ca:/home/rsnara/cs240/a3
SUCCESS: rsync -avz -e "ssh -i ~/.ssh/id_rsa" ../a3/ rsnara@linux.student.cs.university.ca:/home/rsnara/cs240/a3
...
```

### Windows Requirements:

The first requirement can be easily met by visiting [Node.JS](http://nodejs.org). For the second and third, it's easiest to install [Cygwin](https://www.cygwin.com/).

	1. node.js
	2. rsync
	3. ssh-keygen

### Server Preparation:

This step is fairly straightforward. It'll generate two files: ```id_rsa``` and ```id_rsa.pub```.
> **NOTE:** This script requires that id_rsa have no password.

Generating SSH keys; follow the instructions:
```bash
> ssh-keygen
```

Now, append the contents of newly generated ```id_rsa.pub``` to the file ```~/.ssh/authorized_keys``` on your server.
```bash
# copy over the file (fill in the details here)
> scp ~/.ssh/id_rsa.pub username@server:/temporary/location/id_rsa.pub

# SSH into the server
> ssh username@server

# append to ~/.ssh/authorized_keys
> echo '' >> ~/.ssh/authorized_keys
> cat /temporary/location/id_rsa.pub >> ~/.ssh/authorized_keys

```

To test to see if the key works, simply run watch.js <src> <dest>.

------

##Special thanks:
This script builds on the following two node projects:

>[**getopt**](https://github.com/jiangmiao/node-getopt) - a command line parser that makes the script easier to run
>[**node-rsync**](https://github.com/mattijs/node-rsync) - building and executing rsync commands with Node.js.
