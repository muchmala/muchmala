#
# Author:: George Miroshnykov (george.miroshnykov@gmail.com)
# Cookbook Name:: private-npm-registry
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
include_recipe "nodejs-debs"

execute "set private npm registry" do
  user "#{node['private-npm-registry'][:user]}"
  group "#{node['private-npm-registry'][:group]}"
  command "npm config set registry #{node['private-npm-registry'][:registry]}"
  #returns [0, 1]
end
