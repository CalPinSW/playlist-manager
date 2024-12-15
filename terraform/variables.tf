variable "db_connection_string" {
  description = "The connection string for the db used by the application"
  sensitive = true
}

variable "musicbrainz_url" {
  description = "The address of the musicbrainz API"
}

variable "musicbrainz_user_agent" {
  description = "The user_agent to attach to musicbrainz request"
  sensitive = true
}

variable "flask_secret_key" {
  description = "The SECRET_KEY used by the flask application"
  sensitive = true
}

variable "spotify_client_id" {
  description = "The client_id used for spotify requests"
  sensitive = true
}

variable "spotify_secret" {
  description = "The secret_key used for spotify requests"
  sensitive = true
}

variable "frontend_url" {
  description = "The address of the frontend application"
}

variable "backend_url" {
  description = "The address of the backend application"
}
