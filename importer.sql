INSERT INTO public.questionnaire_importer (id, name, organization_id, importer_id, version, metamodel_version, description, readme, license, allowed_packages, url, enabled, app_uuid, created_at, updated_at)
VALUES (
  'dsw:replies-importer:0.4.0',
  'DSW Replies Importer',
  'dsw',
  'replies-importer',
  '0.4.0',
  1,
  'Import from replies in JSON exported from DSW',
  '# DSW Replies Importer\n\n*Import from replies in JSON exported from DSW*\n\nSupported template metamodel version: >=4,<11',
  'Apache-2.0',
  '[
    {
      "orgId": null,
      "kmId": null,
      "minVersion": null,
      "maxVersion": null
    }
  ]',
  'http://localhost:8000',
  true,
  '00000000-0000-0000-0000-000000000000',
  '2024-06-11 20:33:00.000000 +00:00',
  '2024-06-11 20:33:00.000000 +00:00'
);
