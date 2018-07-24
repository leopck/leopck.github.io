---
layout: post
title: Server upload using PHP and cUrl
categories:
- blog
---

The idea is to upload a file into a server without any dependencies on SSH/SCP/FTP but using similar to REST using PHP upload. This solution relies on PHP, Apache and some server config.

---

## Install Apache & PHP

I followed this tutorial below to setup my Apache and PHP
```
https://www.digitalocean.com/community/tutorials/how-to-install-linux-apache-mysql-php-lamp-stack-ubuntu-18-04#step-3-%E2%80%94-installing-php
```
Once that is done, I had to configure php.ini inside ` /etc/php/7.0/apache2/php.ini` to allow file_uploads. My sample php.ini is here:
`https://gist.github.com/leopck/11a680ca615590116f5d67e3f3ddedd0`

## Setup directory structure

My current setup is that I'm saving all my downloads into `/var/www/html/uploads`, this means that all my dierctories must have read, write access. I just enabled `sudo chmod -R 777 /var/www/html/uploads` which enables the php script to write into that directory.

## HTML code for testing

{% highlight html %}
<!DOCTYPE html>
<html>
<body>

<form action="upload.php" method="post" enctype="multipart/form-data">
    Select image to upload:
    <input type="file" name="fileToUpload" id="fileToUpload">
    <input type="submit" value="Upload Image" name="submit">
</form>

</body>
</html>

{% endhighlight %}

## PHP Code for testing
{% highlight php %}
<?php
$target_dir = "/path/to/upload/file"; //MUST MAKE SURE chmod 777 for this directory
$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]); //fileToUpload variable is important! This variable is used in Curl later
$uploadOk = 1;
$fileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));

// Check if file already exists
if (file_exists($target_file)) {
    echo "You file already exists. Either rename if this is your first time submitting or please wait for your file to be processed.";
    $uploadOk = 0;
}

// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
    echo "Sorry, your file was not uploaded.";
// if everything is ok, try to upload file
} else {
    echo "filename:[". $_FILES["fileToUpload"]["name"]."]<br>";
    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
        echo "The file ". basename( $_FILES["fileToUpload"]["name"]). " has been uploaded.<br>";
    } else {
        echo "Sorry, there was an error uploading your file.";
    }
}
?>
{% endhighlight %}

## Curl command Linux for testing

Please ensure that the variable `fileToUpload=@` is the same as the variable inside the PHP script

```
 curl -i -X POST -H "Content-Type: multipart/form-data"  -F ""fileToUpload"=@/path/to/file;userid=1234" http://<url to php file>/upload.php
```
## Python codes for testing

{% highlight html %}
def publishToServer(filetopush):
    files = {
        'fileToUpload': open(filetopush, 'rb')
    }
    try:
        response = requests.post('http://localhost/upload.php', files=files)
        return response
    except Exception as err:
        print('Exception occured: {}'.format(err))
        print('Failed in publishing to server')
        return 1

def generateTextFile(var):
    textContent = """\
    Something\t%s
    """ % (
        var
        )
    workingdir = os.getcwd()
    file = open(workingdir + "/bkc", "w") 
    file.write(textContent)
    file.close() 
    publishToServer(workingdir + "/bkc")
    return textContent 
{% endhighlight %}
