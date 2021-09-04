begin
  require 'bundler'
rescue LoadError
  puts 'Failed to load bundler, try running: gem install bundler'
  exit 1
end

begin
  require 'rubygems'
  require 'rspec/core/rake_task'
rescue LoadError
  puts 'Failed to load some dependencies, try running: bundle install'
  exit 1
end

desc 'Run all specs, default task'
RSpec::Core::RakeTask.new(:spec)
task :default => :spec

namespace :ci do
  task :all => :spec
end

def create_rspec_tag_task(tag, description=nil)
  description ||= "Run specs tagged :#{tag}"
  desc description
  RSpec::Core::RakeTask.new("#{tag}") do |t|
    t.rspec_opts = "--tag #{tag} --tag ~skip"
  end
end

### CREATING TASKS ###
create_rspec_tag_task('wip')
create_rspec_tag_task('users')


### DRY RUN ###
desc "Dry Run specs tagged :wip"
RSpec::Core::RakeTask.new(:wip_dry) do |t|
  t.rspec_opts = "--tag wip --tag ~skip --dry-run"
end

desc "Dry Run specs tagged <tag>, e.g. dry[mytag]"
RSpec::Core::RakeTask.new(:dry, :tag) do |t, task_args|
  t.rspec_opts = "--tag #{task_args[:tag]} --tag ~skip --dry-run"
end

### MULTITASK ###

def time_now
  Time.new.strftime("%Y-%m-%dT%H-%M-%S")
end

task :merge_reports, [:report_folder, :report_files] do |_, args|
  require './libs/merge_html_reports'
  require 'pathname'
  include HTMLReportsMerger

  report_dir = args[:report_folder]
  report_files = args[:report_files].split(' ')
  report_files.map! {|file_name| "#{report_dir}/html/report_#{file_name}.html"}
  output_file = "#{report_dir}/merged_parallel_report.html"

  merge_html_reports(report_files, output_file)
  FileUtils.copy(output_file, report_dir + '/html/.')

  # TODO: make it cross platform
  #`open #{File.expand_path(output_file)}`
end
