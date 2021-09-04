require './spec/spec_helper'

class Users
  include RSpec::Matchers

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

  # Define request and response payload, for large payload create them as file in test data and read here
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
end
