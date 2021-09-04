require './libs/helpers/html_reports_merger_helper'

class Array
  # Returns values for specified key for each Hash in Array
  def map_by(key_name)
    self.map{ |hash| hash[key_name] }
  end

  def get_sum
    self.inject(0){ |sum, x| sum + x.to_f }
  end
end

module HTMLReportsMerger

  def merge_html_reports(input_report_files, output_report_file)
    File.delete(output_report_file) if File.exist?(output_report_file)
    $log.info "MERGING REPORT FILES\n\t#{input_report_files}\n\tto #{output_report_file}"

    include HTMLReportsMergerHelper
    report_template_file = 'test_data/' + 'report_template.html'

    all_results = []
    input_report_files.each do |report_file|
      report_info = {}
      report_info[:file] = report_file
      xml = parse_html_file(report_file)
      next unless xml # if report_file does not exist
      report_info[:xml] = xml

      results_node = get_results_node(xml)
      report_info[:results_node] = results_node
      report_info[:results_list] = get_results_list(results_node)

      duration, examples_number, failure_number = get_results_info(results_node)

      report_info[:duration]        = duration
      report_info[:examples_number] = examples_number
      report_info[:failure_number]  = failure_number

      all_results.push(report_info)
    end

    template_html = parse_html_file(report_template_file)
    report_results_node = get_results_node(template_html)

    last_group_num = 0
    all_results.each do |result_info|
      result_info[:results_list].each do |result|
        last_group_num += 1
        result['id'] = "div_group_#{last_group_num}"
        # TODO: set #result//dt['id'] = "example_group_#{last_group_num}"
        report_results_node << result
      end
    end

    duration_max          = all_results.map_by(:duration).map(&:to_f).max.to_i
    examples_number_full  = all_results.map_by(:examples_number).get_sum.to_i
    failure_number_full   = all_results.map_by(:failure_number).get_sum.to_i

    duration_node_str = %Q(<script type="text/javascript">document.getElementById('duration').innerHTML = "Finished in <strong>DURATION_PLACEHOLDER</strong>";</script>)
    duration_str = "#{duration_max / 60} minutes #{duration_max % 60} seconds"
    duration_node_str.gsub!('DURATION_PLACEHOLDER', duration_str)

    info_number_node_str = %Q(<script type="text/javascript">document.getElementById('totals').innerHTML = "EXAMPLES_PH examples, FAILURE_PH failures";</script>)
    info_number_node_str.gsub!('EXAMPLES_PH', examples_number_full.to_s) # set number of examples
    info_number_node_str.gsub!('FAILURE_PH', failure_number_full.to_s) # set number of failures

    report_results_node << duration_node_str << info_number_node_str
    template_html.xpath('//body//div[class="results"]').each {|z| z << report_results_node}
    template_html.xpath('//script[starts-with(text(), "moveProgressBar")]').map(&:remove)

    File.write(output_report_file, template_html)
  end

end
