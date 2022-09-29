```
sudo fdisk -l                                    #check what is your hard disk name that contains your image in my example it's /dev/sda
sudo growpart /dev/sda 2               #resize the 2nd partition which contains userspace, also please take note of the space between /dev/sda 2
sudo fdisk -l                                    #check if partition 2 for /dev/sda has been correctly grown
sudo resize2fs /dev/sda2                #resize the filesystem to utilize the whole partition that we created
sudo df -h                                        #your "/" home directory should now reflect the similar size to the size of your partition
```
