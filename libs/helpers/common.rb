require "time"
require "csv"
require "securerandom"

def write_file(file_path, data, mode = "w")
  create_dir(file_path)
  file = File.new(file_path, mode)
  file.puts(data)
  file.close
end

def write_file_binary(file_path, data)
  write_file(file_path, data, "wb")
end

def create_new_file(file_path)
  dirname = File.dirname(file_path)
  FileUtils.mkdir_p(dirname) unless File.directory?(dirname)
  file = File.new(file_path, "w")
  file.close
end

def append_to_file(file_path, data)
  file = File.open(file_path, "a")
  file.puts(data)
  file.close
end

def download_file(url, file_path = nil)
  require "open-uri"

  file_path ||= PDF_DIR + Pathname.new(url).split[1].to_s
  $log.info "Downloading file:\n\tfrom url: #{url}\n\tto local path: #{file_path}"
  file_content = open(url).read
  write_file_binary(file_path, file_content)
  file_path
end

def create_dir(path)
  dirname = File.dirname(path)
  FileUtils.mkdir_p(dirname) unless File.directory?(dirname)
end

def read_csv_file(file_path, skip_number_sign = true)
  settings = { headers: true, skip_blanks: true, encoding: "UTF-8" }
  settings.merge!(skip_lines: /#(.*)/) if skip_number_sign
  CSV.read(file_path, settings)
end

def read_csv_file_to_hash(file_path, skip_number_sign = true)
  file_contents = read_csv_file(file_path, skip_number_sign)
  file_hash = Array.new
  file_contents.each do |row|
    row_hash = row.to_hash
    puts row
    file_hash.push(row_hash)
  end
  file_hash
end

def read_file(file_path)
  File.read(file_path, :encoding => "UTF-8") #if File.exists?(file_path)
end

def read_json_file(file_path)
  convert_to_json(read_file(file_path))
end

def create_timestamp
  Time.now.getutc.to_i
end

### 'Date and Time' ###
def time_in_iso
  Time.now.utc.iso8601
end

# if days is less than 0, time is in past, otherwise - future
def time_in_iso_shift(days)
  (Time.now + days * 60 * 60 * 24).utc.iso8601
end

def time_now
  Time.new.strftime("%Y-%m-%dT%H:%M:%SZ")
end

def date_now
  Date.today
end

def date_of_next(day)
  date = Date.parse(day)
  delta = date > Date.today ? 0 : 7
  date + delta
end

def date_shift_days(days_num)
  date_now = Date.today
  date_now + days_num
end

def date_to_timestamp(date)
  DateTime.parse(date).to_time.to_i
end

### end 'Date and Time' ###

def convert_to_json(object)
  json = object.is_json? ? object : object.to_json
  JSON.parse(json)
end

def set_user(user)
  $user = user.clone
end

def get_current_user
  $user
end

def word_from_chars(chars_amount)
  "a" * (chars_amount)
end

def word_from_numbers(numbers_amount)
  "1" * (numbers_amount)
end

# minimum chars_amount can be 9
def email_from_chars_amount(chars_amount)
  "a" * (chars_amount - 9) + "@mail.com"
end

def build_error_message(key, message)
  { "errorCode" => key, "errorDescription" => message }
end

#generate a GUID, and remove all '-'.  This should create unique string of length 32
#  used to generate referenceId for transaction
def generate_guid
  SecureRandom.uuid.gsub("-", "")
end

def generate_unique_name
  timestamp = Time.now.getutc.to_i
  "#{timestamp}#{rand(10000)}"
end

def random_string(char_amount = 4)
  (0...char_amount).map { (65 + rand(26)).chr }.join
end

# Generates number amount of emails
# @param [FixNum] number, default: 1
# @param [String] domain, default: 'mailinator.com'
# @return [String/Array] one or multiple emails
def generate_email(number = 1, prefix = "", domain = "mailinator.com")
  return "#{prefix}#{generate_unique_name}@#{domain}" if number == 1
  emails = []
  number.times { emails.push "#{prefix}#{generate_unique_name}@#{domain}" }
  emails
end

def get_user_by_email(email)
  return if email.nil?
  users_json = JSON.parse read_file("config/users.json")
  user = users_json.find { |user| user["email"] == email }
  $log.info "There is no user with email #{email} in file 'config/users.json'" if user.nil?
  user
end

def is_windows?
  (/cygwin|mswin|mingw|bccwin|wince|emx/ =~ RUBY_PLATFORM) != nil
end

def array_diff(arr1, arr2)
  (arr1 - arr2) || (arr2 - arr1)
end
