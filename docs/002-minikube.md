# minikube notes

minikube quickly sets up a local Kubernetes cluster on macOS, Linux, and Windows.

## Commands

Start cluster

```bash
minikube start
```

Start dashboard

```bash
minikube dashboard
```

Pause Kubernetes without impacting deployed applications

```bash
minikube pause
```

Unpause a paused instance

```bash
minikube unpause
```

Halt the cluster

```bash
minikube stop
```

Change the default memory limit (requires a restart)

```bash
minikube config set memory 9001
```

Create a second cluster running an older Kubernetes release

```bash
minikube start -p aged --kubernetes-version=v1.16.1
```

Delete all of the minikube clusters

```bash
minikube delete --all
```

Browse the catalog of easily installed Kubernetes services

```bash
minikube addons list
```

Enable an Addon

```bash
minikube addons enable {addon-name}
```

Disable an Addon

```bash
minikube addons disable {addon-name}
```

Check Cluster Status

```bash
minikube status
```

View Minikube Logs

```bash
minikube logs
```

Access Minikube’s Docker Daemon

```bash
eval $(minikube docker-env)
```

SSH into the Minikube VM

```bash
minikube ssh
```

Update Minikube

```bash
minikube update-check
```

Set Custom Kubernetes Version

```bash
minikube start --kubernetes-version={version}
```

View Cluster IP and Port Information

```bash
minikube service list
```

**Installing/Running/Uninstalling YAKD k8s Dashboard**

```bash
minikube addons enable yakd
minikube service yakd-dashboard -n yakd-dashboard
```
