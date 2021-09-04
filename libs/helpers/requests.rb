require 'base64'

module Requests

  $headers_json = {:content_type => :json, :accept => :json}

  def headers_cookies_manager
    headers_cookies = convert_to_json(read_file('./config/headers-cookies.json'))
    headers_to_send = headers_cookies['headers']
    cookies_to_send = headers_cookies['cookies']

    #set Authorization/authToken in headers/cookies
    headers_to_send = headers_to_send.merge({"token" => $token}) if $token
    cookies_to_send = cookies_to_send.merge($cookies) if $cookies

    return headers_to_send, cookies_to_send
  end

  def send_request(method, url, params=Hash.new, cookies=nil, headers=nil)
    headers_to_send, cookies_to_send = headers_cookies_manager
    headers_to_send = headers if !headers.nil?
    cookies_to_send = cookies if !cookies.nil?
    
    $log.debug "HEADERS TO SEND:\n#{headers_to_send}"
    $log.debug "COOKIES TO SEND:\n#{cookies_to_send}"

    standard_params = {
      method: method,
      url: url,
      headers: headers_to_send,
      cookies: cookies_to_send
    }

    $params = standard_params.merge(params)
    $response = nil
    begin
      $response = RestClient::Request.new($params).execute
      # Refresh authToken for every successful api call
      if $response.code == 200 && $response.cookies["authToken"] != nil
        $auth_token_cookie = $response.cookies["authToken"]
        refresh_access_token_about_to_expire
      end
    rescue RestClient::Exception => e
      raise 'Response is Nil' if e.response.nil?
      raise "401 Unauthorized. #{Time.now}" if e.response.code == 401
      if e.response.code == 500
        print_last_request
        raise "500 Internal Server Error. #{Time.now}"
      end
      if e.response.code == 504
        print_last_request
        raise "504 Gateway Timeout. #{Time.now}"
      end
      $response = e.response
    end
    $response
  end

  # Sends file as multipart with headers. By default using 'POST' request
  def send_file(api_url, file_path, method='post')
    headers_to_send, cookies_to_send = headers_cookies_manager
    headers_to_send = headers if !headers.nil?
    cookies_to_send = cookies if !cookies.nil?
    
    params = {
      method: method,
      url: api_url,
      payload: {file: File.new(file_path, 'rb')},
      multipart: true
    }
    
    params.merge!(cookies: cookies_to_send)
    params.merge!(headers: headers_to_send)

    $response = nil
    begin
      $response = RestClient::Request.new(params).execute
      # Refresh authToken for every successful api call
    rescue RestClient::Exception => e
      raise "Response is Nil" if e.response.nil?
      raise "401 Unauthorized. #{Time.now}" if e.response.code == 401
      if e.response.code == 500
        print_last_request
        raise "500 Internal Server Error. #{Time.now}"
      end
      if e.response.code == 504
        print_last_request
        raise "504 Gateway Timeout. #{Time.now}"
      end
      $response = e.response
    end
    $response
  end

  # Sends file as multipart with headers. By default using 'POST' request
  def send_multipart_data(api_url, json, method = "post")
    headers_to_send, cookies_to_send = headers_cookies_manager
    headers_to_send = headers if !headers.nil?
    cookies_to_send = cookies if !cookies.nil?

    params = {
      method: method,
      url: api_url,
      payload: json,
      multipart: true
    }

    params.merge!(cookies: cookies_to_send)
    params.merge!(headers: headers_to_send)

    $response = nil
    begin
      $response = RestClient::Request.new(params).execute
      # Refresh authToken for every successful api call
    rescue RestClient::Exception => e
      raise "Response is Nil" if e.response.nil?
      raise "401 Unauthorized. #{Time.now}" if e.response.code == 401
      if e.response.code == 500
        print_last_request
        raise "500 Internal Server Error. #{Time.now}"
      end
      if e.response.code == 504
        print_last_request
        raise "504 Gateway Timeout. #{Time.now}"
      end
      $response = e.response
    end
    $response
  end

  def send_get_request(api_url, headers=nil)
    send_request('get', api_url, {}, headers)
  end

  def send_post_request(api_url, json=nil, headers=nil)
    json = Hash.new if json.nil?
    json = json.to_json unless json.is_json?
    send_request('post', api_url, {payload: json}, headers)
  end

  def send_delete_request(api_url)
    send_request('delete', api_url)
  end

  def send_archive_request(api_url, json)
    send_patch_request(api_url, json, {:'PATCH' => 'ARCHIVED'})
  end

  def send_patch_request(api_url, json, patch_header={})
    json = json.to_json unless json.is_json?
    send_request('patch', api_url, {payload: json}, patch_header)
  end

  def send_put_request(api_url, json)
    json = json.to_json unless json.is_json?
    send_request('put', api_url, {payload: json})
  end

  def get_file(api_url)
    send_request('get', api_url, {}, {accept: 'application/octet-stream'})
  end

  def print_last_request
    log_message = []
    log_message.push '***** last request is: *****'
    if $params.nil?
      log_message.push 'request is empty'
    else
      log_message.push("method: #{$params[:method]}", "url: #{$params[:url]}", "payload: #{$params[:payload]}")
    end
    $log.info log_message.join("\n\t")
  end

  def print_last_response
    log_message = []
    log_message.push '***** last response is: *****'
    if $response.nil?
      log_message.push 'response is empty'
    else
      log_message.push("code: #{$response.code}", "response: #{$response}")
    end
    $log.info log_message.join("\n")
  end

end
