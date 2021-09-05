# API automation

##### Installation
You will need to have Ruby installed. Then Bundler for downloading dependencies.

1. Download and install Ruby from http://rubyinstaller.org/downloads/ 
   Ruby 2.5 with DevKit. Make sure for full installation along with devkit
2. Add Ruby bin path to Path variable
3. Gem Installation – gem install bundler in command prompt



##### Automation repository and dependency
1. Automation repository: git clone 
2. Change directory to root of api_automation_rest_soap project (api_automation_rest_soap)
3. Run `bundle install` to download dependencies.



##### How to Run API Tests
Using Rake you can run specific tests suites. Type 'rake -T' in terminal to see all Rake tasks to run.

This is the command structure to run tests: <enviroment variables> rake <task>

`rake` will run all tests with default configuration.

Available environment variables
app_env [local, dev, qa]
specifies on which environment to run tests (dev - default). 

Examples:
`rake wip` will run all wip tests on default dev server.
`app_env=qa rake wip` will run all wip tests on localhost.(update config file for localhost endpoint)



##### Package dependency
   gem 'rake'
   gem 'rspec'
   gem 'rspec-core'
   gem 'rspec_junit_formatter'
   gem 'rspec-retry'
   gem 'allure-rspec'
   gem 'jsonpath'
   gem 'rest-client'
   gem 'savon', '~> 2.12.0'

Rake is a Make-like program implemented in Ruby. Tasks and dependencies are specified in standard Ruby syntax.

RSpec is a computer domain-specific language (DSL) (particular application domain) testing tool written in the programming language Ruby to test Ruby code. It is a behavior-driven development (BDD) framework which is extensively used in production applications. https://rspec.info

Allure Framework is a flexible lightweight multi-language test report tool

JSONPath is used for selecting and extracting a JSON document's property values.

rest-client A simple HTTP and REST client for Ruby, inspired by the Sinatra's microframework style of specifying actions: get, put, post, delete. https://github.com/rest-client/rest-client

savon Heavy metal SOAP client https://github.com/savonrb/savon



##### Configuration
config => hosts.json - list down host for Dev/QA

    {
        "dev": {
            "reqres": "reqres.in"
        },
        "qa": {
            "reqres": "reqres.in"
        }
    }

config => users.json - list of test users used acrossed in automation

config => headers-cookies.json - common headers other than Authentication token



##### host url setup 
libs => helpers => setup.rb - Read host config and build base url, add save them in global variable

    hosts = convert_to_json(read_file('./config/hosts.json'))
    app_env = ENV['app_env']
    environment = app_env ? app_env : 'dev'
    if environment
        env_hosts = hosts[environment]
        $log.info "environment is #{environment}!"
    end

    $reqres_host = 'https://' + env_hosts['reqres'] + '/'



##### user authentication and login
libs => helpers => login.rb - make changes in login_user to retrive authentication token and cookies, save them in global variable

    def login_user
        begin
            url_for_send_token = $reqres + 'api/login'
            response = RestClient.post(url_for_send_token, { "email": "#{$user[:username]}", "password": "#{$user[:password]}" }, content_type: :json, accept: :json)
        rescue RestClient::Exception => e
            raise e
        end
        $auth_token = response["token"]
        $cookies = response.cookies
    end

libs => helpers => requests.rb - make changes in headers_cookies_manager for authentication token and cookies
    def headers_cookies_manager
        headers_cookies = convert_to_json(read_file('./config/headers-cookies.json'))
        headers_to_send = headers_cookies['headers']
        cookies_to_send = headers_cookies['cookies']

        #set Authorization/authToken in headers/cookies
        headers_to_send = headers_to_send.merge({"token" => $token}) if $token
        cookies_to_send = cookies_to_send.merge($cookies) if $cookies

        return headers_to_send, cookies_to_send
    end



##### HTTP Request
libs => helpers => requests.rb - list of available http methods
    def send_file(api_url, file_path, method='post')
    def send_multipart_data(api_url, json, method = "post")
    def send_get_request(api_url, headers=nil)
    def send_post_request(api_url, json=nil, headers=nil)
    def send_delete_request(api_url)
    def send_archive_request(api_url, json)
    def send_patch_request(api_url, json, patch_header={})
    def send_put_request(api_url, json)
    def get_file(api_url)



##### Assertions
libs => assertions.rb - list of available assertions methods
    def verify_response(response, expected_response, expected_response_code)
    def verify_response_code(response, expected_response_code)
    def verify_response_is_successful(response)
    def verify_response_is_successful_create_entity(response)
    def verify_response_message_equals(response, message)
    # response - Hash, message - string
    def verify_response_message_includes(response, message)
    # validate response with their values or "only_digits", "only_chars", "skip", "should_not_be_null"
    def verify_response_template(response, expected_response, expected_response_code)
    


##### API endpoint lib for CRUD and payload
Create lib dir and file for endpoint to test (ex libs => util-reqres and users.rb) 
Define all the CRUD operation for endpoint
Expose request response json payload

    #exposed for json to use in test
    attr_reader :user_post_payload_request, :user_post_response, :user_get_response

    def initialize
        init_variables
    end

    def users_url
        $reqres_host + '/api/users'
    end

    def post_user(user)
        send_post_request(users_url, user)
    end

    def get_user(id)
        send_get_request(users_url + "/#{id}")
    end

    def put_user(id, user)
        send_put_request(users_url + "/#{id}", user)
    end

    def patch_user(id, user)
        send_patch_request(users_url + "/#{id}", user)
    end

    def delete_user(id)
        send_get_request(users_url + "/#{id}")
    end

    #Define request and response payload, for large payload create them as file in test data and read here
    def init_variables
        @user_post_payload_request = convert_to_json('{
        "name": "",
        "job": ""
        }')

        @user_post_response = convert_to_json('{
        "name": "",
        "job": "",
        "id": "should_not_be_null",
        "createdAt": "skip"
        }')

        @user_get_response = convert_to_json('{
        "data": {
            "id": "should_not_be_null",
            "email": "janet.weaver@reqres.in",
            "first_name": "Janet",
            "last_name": "Weaver",
            "avatar": "https://reqres.in/img/faces/2-image.jpg",
        },
        "support": {
            "url": "https://reqres.in/#support-heading",
            "text": "To keep ReqRes free, contributions towards server costs are appreciated!",
        }
        }')
    end



##### Test for API
Create file for endpoint to test (ex spec => reqres => users_spec.rb) 

    RSpec.describe "Users Reqres", :users do
    before(:all) { @users = Users.new }

    context "Users CRUD", :wip do
        test_data = [
        { name: "morpheus", job: "leader"},
        { name: "name1", job: "job1"}
        ]
        test_data.each { |test_case|
            it "Add #{test_case}, Update and Get" do
                post_user_request = @users.user_post_payload_request.merge!({"name" => test_case[:name], "job" => test_case[:job]})
                response = @users.post_user(post_user_request)
                #verify_response_code(response, 200)
                #verify_response(response, @users.user_post_response)
                #expected_response = @users.user_post_response.merge!({ "name" => test_case[:name], "job" => test_case[:job] })
                #verify_response_template(response, expected_response, 200)
            end
        }
        end
    end





        




