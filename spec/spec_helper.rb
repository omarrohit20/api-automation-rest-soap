require "rest_client"
require "rspec"
require "json"
require "securerandom"
require "jsonpath"
require "gmail"
require "./libs/helpers/setup"
require "./libs/helpers/requests"
require "./libs/helpers/common"
require "./libs/helpers/tags"
require "rspec/retry"
require "allure-rspec"
require "pathname"
require "nokogiri"
require "savon"

# require and include all files and modules in libs folder
require "./libs/assertions"
lib_dir = "./libs/**/*.rb"
[lib_dir].each { |dir| Dir[dir].sort.each { |file| require file } }

include Requests

require "logger"
$log = Logger.new(STDOUT)
$log.level = Logger::INFO

username = ENV['username']
password = ENV['password']

if username && password
  $user_test = {local_name: 'external_user', username: username, password: password}
else
  $user_test = {local_name: 'global_user', username: 'test123@mailinator.com', password: 'Automation123'}
end

$tags = Helpers::Tags.new(RSpec.configuration)
$current_task_tag = $tags.inclusions.keys.first
$log.info "##### \t --- #{$current_task_tag} --- Rake Task started at #{time_now}" if $current_task_tag

RSpec.configure do |config|
  if ENV['allure'] == 'true'
    config.include AllureRSpec::Adaptor
    AllureRSpec.configure do |c|
      #c.output_dir = "allure-results" # default: gen/allure-results
      c.clean_dir = true # clean the output directory first? (default: true)
      c.logging_level = Logger::DEBUG # logging level (default: DEBUG)
    end
  end

  set_hosts

  config.before(:suite) do
    
    set_user($user_test)
    $log.info "Using user #{$user_test[:username]}"
    #check_if_server_alive
    login_with_default_creds
  end

  config.after(:each) do |example|
    if (example.exception != nil) and (ENV['dbg'] != 'off')
      message = example.exception.message
      $log.error message
      $log.error "probably expected Hash, but got Array in Response" if message.include? "no implicit conversion of String into Integer"
      print_last_request
      print_last_response
    end
  end

  config.after(:suite) do
    $log.info "##### \t --- #{$current_task_tag} --- Rake Task end at #{time_now}" if $current_task_tag
  end

  # Configurations for retry test cases
  # https://github.com/NoRedInk/rspec-retry
  # show retry status in spec process
  config.verbose_retry = true
  # show exception that triggers a retry if verbose_retry is set to true
  config.display_try_failure_messages = true

  ## Global settings to retry all test cases
  retry_count = ENV['retry_count']
  retry_sleep = ENV['retry_sleep']
  if retry_count
    # Number of time to retry
    config.add_setting :default_retry_count, :default => retry_count.to_i
  end

  if retry_sleep
    # Sleep time wait before retry
    config.add_setting :default_sleep_interval, :default => retry_sleep.to_i
  end

end

def refresh_access_token_about_to_expire
  if (Time.now - $access_token_time)/60 > 55
    login_with_default_creds
  end
end

def it_behaves_like(*args) ; end
