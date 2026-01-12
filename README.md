# DSW Replies Importer

*Import from replies in JSON exported from DSW*

# Deployment

You can deploy this importer in two ways:

1. **Docker**: simply run it as a service using [datastewardshipwizard/replies-importer](https://hub.docker.com/r/datastewardshipwizard/replies-importer) image from Docker Hub. It exposes the importer on port 8080.
2. **Deploying static files**: there are only few static files in a folder to be served via HTTP(S) so you can use public S3 bucket or HTTP(S) proxy to serve those static files, you can find them in [GitHub releases](https://github.com/ds-wizard/dsw-replies-importer/releases) in a ZIP file.

Once deployed, you need to add it to your DSW instance database (see `importer.sql` file where you need to adjust the `http://localhost:8000` value).

## Changelog

### 0.9.1

- Fix checking document template metamodel version

### 0.9.0

- Support importer distribution

### 0.8.0

- Updated max supported metamodel version (17)
- Added support for the new integration question

### 0.7.0

- Updated max supported metamodel version (16)

### 0.6.0

- Updated max supported metamodel version (15)
- Updated Bootstrap CSS/JS

### 0.5.0

- Updated max supported metamodel version (14)
- Added support for item select question

### 0.4.0

- Updated and fixed import of nested questions

### 0.3.0

- Updated max supported metamodel version (13)

### 0.2.0

- Migrated to DSW Integration SDK

### 0.1.0

Initial testing version of the importer.

## License

This project is licensed under the Apache License v2.0 - see the
[LICENSE](LICENSE) file for more details.
