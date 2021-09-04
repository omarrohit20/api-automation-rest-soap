module HTMLReportsMergerHelper

  def parse_html_file(file_path)
    unless File.exist?(file_path)
      $log.info "#{file_path} does not exist"
      return false
    end
    Nokogiri::HTML(File.read(file_path))
  end

  def parse_html_str(html_str)
    Nokogiri::HTML(html_str)
  end

  # returns node with all
  #   <div>['id'] nodes that starts_with 'div_group_N'
  # and
  #   <script> nodes with 'example_number' and 'duration'
  def get_results_node(xml)
    xml.at('div[class="results"]')
  end

  # returns results_node_list:
  #     <div id="div_group_1" class="example_group passed">
  #       <dl style="margin-left: 0px;">
  #         <dt id="example_group_1" class="passed">Addressbook</dt>
  #       </dl>
  #     </div>
  def get_results_list(xml)
    xml.xpath('//div[starts-with(@id, "div_group")]')
  end

  def get_script_info_nodes(results_node)
    script_nodes_full_list = results_node.xpath('.//script')
    list_size = script_nodes_full_list.size
    script_nodes_full_list[list_size - 2, list_size - 1] # get last two nodes
  end

  # returns 2 nodes with info 'examples_number' and 'duration'
  # returns 'duration', 'examples_number' and 'failure_number'
  def get_results_info(results_node)
    script_nodes_list = get_script_info_nodes(results_node)
    return [0, 0, 0] unless script_nodes_list

    # get duration, example: "Finished in <strong>16.31416 seconds</strong>"
    duration = script_nodes_list[0].content.match(/<strong>([\d\.]+).*<\/strong>/)[1]

    # get examples_number and failure_number, example: "12 examples, 1 failure"
    examples_number, failure_number = script_nodes_list[1].content.scan(/[\d]+/)

    [duration, examples_number, failure_number]
  end
end