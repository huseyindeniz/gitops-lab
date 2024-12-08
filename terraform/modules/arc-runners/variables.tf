variable "github_repo_url" {
  description = "GitHub Repo Urls"
  type        = string
}

variable "github_arc_pat" {
  description = "GitHub arc PAT"
  sensitive   = true
  type        = string
}
