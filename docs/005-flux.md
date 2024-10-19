# Flux Notes

Flux is used exclusively for automatic image updates.

Important Note: Flux is configured to update k8s resources directly. It's not configured to update image tag in github repo.

The bootstrap_git resource in Flux does not work on Windows if Terraform is run from a drive other than the C: drive.

[See details here](https://github.com/fluxcd/flux2/issues/1153)

**Workaround**: Clone the repository to the C drive and work from there :(
