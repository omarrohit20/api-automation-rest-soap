module RestClient::AbstractResponse
  def json
    convert_to_json(self)
  end
end
