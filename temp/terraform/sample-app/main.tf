resource "helm_release" "my_dotnet_app" {
  name       = "my-dotnet-app"
  repository = "https://github.com/huseyindeniz/cicd-lab.git" # URL of your GitHub repo
  chart      = "helm-charts/sample-app"                       # Path to your Helm chart within the repo
  version    = "0.1.0"                                        # Chart version (adjust if necessary)
  namespace  = "default"                                      # Namespace for deployment

  values = [
    file("values.yaml") # Path to your values file
  ]
}
