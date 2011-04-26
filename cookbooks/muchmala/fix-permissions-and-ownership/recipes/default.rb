#
# Author:: George Miroshnykov (george.miroshnykov@gmail.com)
# Cookbook Name:: fix-permissions-and-ownership
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

file "/etc/apt/sources.list.d/mongodb.list" do
  mode 0644
end

bash "fix ownership of /home/vagrant/.npm" do
  user "root"
  code <<-EOH
    chown -R vagrant:vagrant /home/vagrant/.npm
  EOH
end
