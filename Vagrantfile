Vagrant::Config.run do |config|
  config.vm.box = "muchmala"
  # only maverick32 is supported :(
  #config.vm.box_url = "http://files.vagrantup.com/lucid32.box"

  config.vm.network "33.33.33.15"
  config.vm.share_folder("v-root", "/opt/muchmala", ".")

  config.vm.provision :chef_solo do |chef|
    chef.cookbooks_path = ["chef/cookbooks/muchmala", "chef/cookbooks/opscode", "chef/cookbooks/mdxp"]
    chef.add_recipe "muchmala"
    chef.add_recipe "muchmala::vagrant"
  end
end
