class String
  def is_json?
    begin
      !!JSON.parse(self)
    rescue
      false
    end
  end

  # params is Hash
  def set_url_params(params)
    if params
      params_str = Array.new
      params.each do |key, value|
        params_str.push("#{key}=#{CGI::escape(value.to_s)}")
      end
      self << "?" << params_str.join("&")
    end
    self
  end

  # To accept commas in params
  def set_url_params_non_cgi_esc(params)
    if params
      params_str = Array.new
      params.each do |key, value|
        params_str.push("#{key}=#{value}")
      end
      self << "?" << params_str.join("&")
    end
    self
  end

  def to_boolean
    self == "true"
  end

  # @param [String] str_for_replace
  # @return [String] updated string with replaced placeholder by str_for_replace
  def replace_placeholder(str_for_replace)
    placeholder = "<placeholder>"
    self.gsub(placeholder, str_for_replace)
  end
end

class Array
  def downcase
    self.map { |element| element.downcase if element.is_a?(String) }
  end

  def sort_by_hash_key(key)
    self.sort { |a, b| a[key] <=> b[key] }
  end

  def remove(element)
    self.delete(element)
    self
  end

  # Rejects all arrays/subarrays in Array that includes except_element
  def except!(*elements)
    elements.flatten!
    self.reject! { |el| (elements - el).empty? }
  end

  def except(*elements)
    elements.flatten!
    self.reject { |el| (elements - el).empty? }
  end

  def is_json?
    false
  end

  # Returns first Hash that contains specified key-value pair
  def find_by_kv(key, value)
    self.find { |hash| hash[key] == value }
  end

  # Returns all Hashes that contain specified key-value pair
  def select_by_kv(key, value)
    self.select { |hash| hash[key] == value }
  end

  # Returns values for specified key for each Hash in Array
  def map_by(key_name)
    if_contains_only_hash_objects
    self.map { |hash| hash[key_name] }
  end

  # Returns sum of all elements (currently converting strings to Float)
  def find_sum
    self.inject(0) { |sum, x| sum + x.to_f }
  end

  def if_contains_only_hash_objects
    self.each { |obj| raise "Array should contain only Hash object. Found: #{obj.class}" unless obj.is_a?(Hash) }
  end

  def split_to_eql_parts(parts_num)
    part_size = self.size / parts_num + self.size % parts_num
    self.each_slice(part_size).to_a
  end
end

class Hash
  def deep_merge(second)
    merger = proc { |key, v1, v2| Hash === v1 && Hash === v2 ? v1.merge(v2, &merger) : v2 }
    self.merge(second, &merger)
  end

  def is_json?
    false
  end

  def to_s
    result = Array.new
    self.each { |key, value| result << "#{key}: #{value}" }
    result.join(", ")
  end

  # @return [nil or String/Symbol] nil if keys.size != 1; returns the key of hash
  def get_key
    return if self.keys.size != 1
    self.keys.first
  end

  # @return [nil or Object] nil if there are not 1 single key; returns the value of Hash
  def get_value
    self[self.get_key]
  end

  def remove(key)
    self.delete(key)
    self
  end

  def merge_only_existing_keys(other)
    self.merge other.select { |k| self.keys.include? k }
  end

  def merge_only_existing_keys!(other)
    self.merge! other.select { |k| self.keys.include? k }
  end

  def include_hash?(hash)
    self.each do |self_key, self_value|
      hash.remove(self_key) if hash[self_key] == self_value
    end
    hash.empty?
  end

  # Returns a new hash with all keys converted using the +block+ operation.
  #
  #  hash = { name: 'Rob', age: '28' }
  #
  #  hash.transform_keys { |key| key.to_s.upcase } # => {"NAME"=>"Rob", "AGE"=>"28"}
  #
  # If you do not provide a +block+, it will return an Enumerator
  # for chaining with other methods:
  #
  #  hash.transform_keys.with_index { |k, i| [k, i].join } # => {"name0"=>"Rob", "age1"=>"28"}
  def transform_keys
    return enum_for(:transform_keys) { size } unless block_given?
    result = {}
    each_key do |key|
      result[yield(key)] = self[key]
    end
    result
  end

  # Destructively converts all keys using the +block+ operations.
  # Same as +transform_keys+ but modifies +self+.
  def transform_keys!
    return enum_for(:transform_keys!) { size } unless block_given?
    keys.each do |key|
      self[yield(key)] = delete(key)
    end
    self
  end

  # Returns a new hash with all keys converted to strings.
  #   hash = { name: 'Rob', age: '28' }
  #   hash.stringify_keys
  #   # => {"name"=>"Rob", "age"=>"28"}
  def stringify_keys
    transform_keys(&:to_s)
  end

  def stringify_keys!
    transform_keys!(&:to_s)
  end
end # class Hash

class Symbol
  # @param [String]/[Array] remove also removes specified string(s)
  # @return [String] String representation of symbol
  def to_word(remove = nil)
    sym = self.to_s
    sym.gsub!("_", " ")
    gsub_symbols = sym.scan(/[A-Z0-9]/) # find all uppercase and number chars
    gsub_symbols.each { |symbol| sym.gsub!(symbol, " " + symbol) } # adding space before each uppercase/number char

    unless remove.nil?
      [remove].flatten.each { |str_to_remove| sym.gsub!(str_to_remove, "") } # removing specified strings
    end

    sym.split.join(" ").strip
  end

  def with(*args, &block)
    ->(caller, *rest) { caller.send(self, *rest, *args, &block) }
  end
end

### Converts any object to Array if it is not ###
class Object; def to_arr; [self] end end
class Array; def to_arr; to_a end end
class NilClass; def to_arr; to_a end end

### to_arr ###
