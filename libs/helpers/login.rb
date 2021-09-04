def login_user
  # begin
  #   $log.info "Logging in with Okta access token."
  #   # Get okta session token

  #   # Get okta access token
  #   access_token = nil

  #   # Get auth token
  #   url_for_send_token = $auth_url + "?clientid=#{$user[:clientid]}"
  #   response = RestClient.post(url_for_send_token, {}, content_type: :json, accept: :json, Authorization: :"Bearer #{access_token}")
  # rescue RestClient::Exception => e
  #   raise e
  # end
  # $auth_token_cookie = response.cookies['authToken']
  # $cookies = response.cookies
  begin
    url_for_send_token = $reqres + 'api/login'
    response = RestClient.post(url_for_send_token, { "email": "#{$user[:username]}", "password": "#{$user[:password]}" }, content_type: :json, accept: :json)
  rescue RestClient::Exception => e
    raise e
  end
  $auth_token = response["token"]
  $cookies = response.cookies
end

def login_with_default_creds
  $log.info "Logging in with #{$user_test_default[:username]}"
  set_user($user_test_default)
  login_user
end

def login_with_creds(username, password=nil)
  if get_current_user[:username] == username # do not perform login if user is already logged in
    $log.info "User #{get_current_user[:username]} is already logged in."
    return
  end
  password = get_user_by_email(username)["password"] if password.nil?
  $user[:username] = username.strip
  $user[:password] = password.strip
  login_user
end
