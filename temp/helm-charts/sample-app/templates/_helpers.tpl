{{/*
Expand the name of the chart.
*/}}
{{- define "sample-app.name" -}}
{{- .Chart.Name -}}
{{- end -}}

{{/*
Create a fullname by appending the release name to the chart name.
*/}}
{{- define "sample-app.fullname" -}}
{{- printf "%s-%s" (include "sample-app.name" .) .Release.Name -}}
{{- end -}}