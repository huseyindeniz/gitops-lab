{{/* Generates the full name of the release, including namespace and environment */}}
{{- define "dotnet-core-webapi.fullname" -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Generates a common set of labels for resources */}}
{{- define "dotnet-core-webapi.labels" -}}
app.kubernetes.io/name: {{ include "dotnet-core-webapi.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/* Generates the basic name of the application */}}
{{- define "dotnet-core-webapi.name" -}}
{{- printf "%s" .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Generates the namespace for resources */}}
{{- define "dotnet-core-webapi.namespace" -}}
{{- printf "%s-%s" .Values.namespace .Values.environment | trunc 63 | trimSuffix "-" -}}
{{- end -}}
