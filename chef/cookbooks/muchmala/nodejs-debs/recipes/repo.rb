#
# Author:: George Miroshnykov (george.miroshnykov@gmail.com)
# Cookbook Name:: nodejs-debs
# Recipe:: default
#
# Copyright 2011, George Miroshnykov
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

return if node[:platform] != "ubuntu"

execute "request ppa key" do
  command "gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C7917B12"
  not_if "gpg --list-keys C7917B12"
end

execute "install ppa key" do
  command "gpg -a --export C7917B12 | apt-key add -"
  not_if "apt-key list | grep C7917B12"
end

template "/etc/apt/sources.list.d/nodejs.list" do
  mode 0644
end

execute "update apt" do
  command "apt-get update"
  subscribes :run, resources(:template => "/etc/apt/sources.list.d/nodejs.list"), :immediately
  action :nothing
end
