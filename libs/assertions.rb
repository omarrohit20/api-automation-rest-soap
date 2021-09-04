def verify_response(response, expected_response, expected_response_code)
  verify_response_code(response, expected_response_code)
  expect(response.json).to eql(expected_response)
end

def verify_response_code(response, expected_response_code)
  expect(response.code).to eql(expected_response_code), "Expected: #{expected_response_code}\nActual: #{response.code}.\nRESPONSE:\n#{response}"
end

def verify_response_is_successful(response)
  expect(response.code).to eql(200), "Expected: 200\nActual: #{response.code}.\nRESPONSE:\n#{response}"
end

def verify_response_is_successful_create_entity(response)
  expect(response.code).to eql(201), "Expected: 200\nActual: #{response.code}.\nRESPONSE:\n#{response}"
end

def verify_response_message_equals(response, message)
  message_json = convert_to_json(message)
  expect(response).to eql(message_json)
end

# response - Hash, message - string
def verify_response_message_includes(response, message)
  message_json = convert_to_json(message)
  expect(response).to include(message_json)
end

def verify_response_template(response, expected_response, expected_response_code)
  verify_response_code(response, expected_response_code)
  verify_response_match_expected(response.json, expected_response)
end

# accepts responses in JSON format (Hash objects)
def verify_response_match_expected(actual_response, expected_response)
  if actual_response.is_a?(Array) && expected_response.is_a?(Array)
    actual_response.each_with_index { |actual_response_hash_part, index|
      compare_response_hashes(actual_response_hash_part, expected_response[index])
    }
    expected_response.each_with_index { |expected_response_hash_part, index|
      compare_response_hashes(actual_response[index], expected_response_hash_part)
    }
  else #assuming both expected and actual response variables are arrays OR none
    compare_response_hashes(actual_response, expected_response)
  end
end

def compare_response_hashes(actual_hash, expected_hash)
  if actual_hash.is_a?(Hash) || actual_hash.is_a?(Array)
    begin
      actual_hash.each { |key, value|
        begin
          if value.is_a?(Hash) && expected_hash[key] != "skip"
            compare_response_hashes value, expected_hash[key]
          elsif value.is_a?(Array) && expected_hash[key].is_a?(Array)
            value.each_with_index { |value_hash_part, index|
              compare_response_hashes(value_hash_part, expected_hash[key][index])
            }
          else
            if expected_hash.key?(key)
              message = "#{key} is wrong! actual: #{value} expected: #{expected_hash[key]}"
              compare_values(value, expected_hash[key], message)
            else
              $log.warn "#{key} is not expected"
            end
          end
        rescue NoMethodError => e
          e.message.include?("nil") ? raise("Haven't found #{key}=#{value} in #{expected_hash}") : raise(e)
          #raise "Haven't found #{key}=#{value} in #{expected_hash}" if e.contains("expect")
        end
      }
    rescue NoMethodError => e
      e.message.include?("nil") ? raise("Haven't found #{expected_hash} in actual") : raise(e)
    end
  else
    message = "actual: #{actual_hash} expected: #{expected_hash}"
    compare_values(actual_hash, expected_hash, message)
  end
end

def compare_values(actual, expected, error_message)
  if expected.is_a?(String)
    if expected.include?("match_regex")
      regex = Regexp.new(expected.match(/\/(?<regex>.*)\//)[:regex]).source
      expect(actual.to_s).to match(regex), error_message
    elsif expected == "only_digits"
      expect(actual.to_s).to match(/\d+/), error_message
    elsif expected == "only_chars"
      expect(actual.to_s).to match(/[a-zA-Z]/), error_message
    elsif expected == "skip"
      # do nothing, just skip
    elsif expected == "should_not_be_null"
      expect(actual).not_to be_nil, error_message
    else
      expect(actual).to eql(expected), error_message
    end
  else
    expect(actual).to eql(expected), error_message
  end
end
