RSpec.describe "Users Reqres", :users do
  before(:all) { @users = Users.new }

  context "Users CRUD : parameterized" do
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
  context "Users CRUD : CSV" do
    read_csv_file_to_hash('testdata/reqres/users.csv').each { |test_case|
      it "Add #{test_case}, Update and Get", :wip do
        post_user_request = @users.user_post_payload_request.merge!({ "name" => test_case[:name], "job" => test_case[:job] })
        response = @users.post_user(post_user_request)
        #verify_response_code(response, 200)
        #verify_response(response, @users.user_post_response)
        #expected_response = @users.user_post_response.merge!({ "name" => test_case[:name], "job" => test_case[:job] })
        #verify_response_template(response, expected_response, 200)
      end
    }
  end
end