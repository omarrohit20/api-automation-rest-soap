def set_hosts
  hosts = convert_to_json(read_file('./config/hosts.json'))
  app_env = ENV['app_env']
  environment = app_env ? app_env : 'dev'
  if environment
    env_hosts = hosts[environment]
    $log.info "environment is #{environment}!"
  end

  $reqres_host = 'https://' + env_hosts['reqres'] + '/'
  #$oktadomain = env_hosts["oktadomain"]
  #$okta = env_hosts["okta"]
  #$okta_session_token_url = $oktadomain + '/api/v1/authn' unless $oktadomain.nil?
  #$okta_access_token_url = $okta + '/v1/authorize' unless $okta.nil?
end

def exit_with_error(error)
  raise(error)
end

def build_api_url(host, proto)
  proto + host + '/api/v1'
end

def build_api_url_soap(host, proto)
  proto + host + '/ws/abc.wsdl'
end

def build_api_url_okta(host, proto)
  proto + host
end

def check_if_server_alive
  time_to_wait = 900
  time_wait = 0
  wait = 10
  server_alive = true
  response = nil

  while time_wait < time_to_wait
    begin
      response = RestClient.get($host_to_check)
    rescue Errno::ECONNREFUSED, Errno::EHOSTUNREACH, RestClient::Exception => e
      $log.error "Exception: #{e.message}"
      server_alive = false
    end

    server_alive = true if response.code == 200 if response

    if server_alive
      $log.info "#{$service_to_check} Server is alive!"
      return
    else
      sleep wait
      time_wait += wait
      $log.info "#{$service_to_check} Server is not alive, waiting... #{time_wait} seconds..."
    end
  end

  unless server_alive
    puts '502 bad gateway'
    exit 1
  end
end

def get_password_by_name(username)
  begin
    JSON.parse(File.read(Dir.pwd + '/config/users.json'))["users"].find{|user| user["user_id"] == username}["user_password"]
  rescue NoMethodError
    JSON.parse(File.read(Dir.pwd + '/config/users.json'))[username]
  end
end

def get_user_credentials
  if ENV["TEST_ENV_NUMBER"]
    thread_number = ENV['TEST_ENV_NUMBER'].to_i > 0 ? ENV['TEST_ENV_NUMBER'].to_i - 1 : ENV['TEST_ENV_NUMBER'].to_i
    if ENV["test_users"] && ENV["test_users"].size > 0
      users = []
      ENV["test_users"].split(",").each {|user| users<<user}
      username = users[thread_number]
    else
      username = "test#{(14+thread_number).to_s}@mailinator.com"
    end
    password = get_password_by_name(username)
  else
    username = ENV['username'] ? ENV['username'] : "test123@mailinator.com"
    password = ENV['password'] && ENV['username'] ? ENV['password']: get_password_by_name(username)
  end

  [username, password]
end
