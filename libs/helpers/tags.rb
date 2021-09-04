# class which helps to know if RSpec is going to run or not tests with specific tags
module Helpers
  class Tags
    attr_reader :exclusions, :inclusions

    # accepts RSpec Configuration to get tags that should be run and skipped
    def initialize(rspec_config)
      manager = rspec_config.filter_manager
      @exclusions = manager.exclusions.rules
      @inclusions = manager.inclusions.rules
    end

    # check if some of tags_to_expect are present in list of tags to run
    def run_it?(*tags_to_expect)
      tags_present_list = tags_to_expect.map { |tag| inclusions.include?(tag) }
      tags_present_list.uniq!
      tags_present_list.include?(true)
    end

  end
end
