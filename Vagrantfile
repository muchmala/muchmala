Vagrant::Config.run do |config|
  config.vm.box = "muchmala"
  config.vm.box_url = "http://files.vagrantup.com/lucid32.box"

  config.vm.network "33.33.33.15"
  config.vm.share_folder("v-root", "/opt/muchmala", ".")

  config.vm.provision :chef_solo do |chef|
    chef.cookbooks_path = ["cookbooks/muchmala", "cookbooks/opscode", "cookbooks/mdxp"]

    chef.add_recipe "apt"
    chef.add_recipe "nodejs"
    chef.add_recipe "nodejs::npm"
    chef.add_recipe "mongodb-debs"

    chef.add_recipe "fix-permissions-and-ownership"
    chef.add_recipe "node-canvas-deps"

    chef.json.merge!({
      :nodejs => {
        :version => "0.4.7",
        :npm => "1.0.1rc9"
      }
    })
  end
end
