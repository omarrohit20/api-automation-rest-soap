require './spec/spec_helper'
require 'savon'

class Numberconversion
  include RSpec::Matchers

  attr_reader :sample_input

  def initialize
    init_variables
  end

  def numberconversion_get_client()
    Savon.client(wsdl: $numberconversion_host)
  end

  def init_variables
    @sample_input = {
        test: 'should_not_be_null',
        test: 'should_not_be_null'
    }
  end

end
