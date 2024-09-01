# Local Dev Notes

- You can run the application by selecting either https or http from the start menu.
- Alternatively, you can choose Container(Dockerfile). However, to make it work with Docker, you must first create a development SSL certificate by running the following command in the certs directory:

```bash
PS: mySampleApp1.weatherForecast.API\certs> > dotnet dev-certs https -ep ./mySampleApp1.weatherForecast.API.pfx -p $CREDENTIAL_PLACEHOLDER$ --trust
```

After creating the certificate, update the **ASPNETCORE_Kestrel**Certificates**Default\_\_Password** value in the _launchSettings.json_ file, under the Container(Dockerfile) section, within the environmentVariables property.
