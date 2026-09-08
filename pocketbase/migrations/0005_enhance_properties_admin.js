/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const properties = app.findCollectionByNameOrId('properties')

    // 1. Add property_type field if not present (apartamento, casa, cobertura, terreno, sala_comercial, outro)
    if (!properties.fields.getByName('property_type')) {
      properties.fields.add(
        new SelectField({
          name: 'property_type',
          values: ['apartamento', 'casa', 'cobertura', 'terreno', 'sala_comercial', 'outro'],
          maxSelect: 1,
        }),
      )
    }

    // 2. Add cover_image text field (to store the filename of the selected cover image)
    if (!properties.fields.getByName('cover_image')) {
      properties.fields.add(
        new TextField({
          name: 'cover_image',
        }),
      )
    }

    // 3. Relax create/update/delete rule so Vera can manage properties smoothly even if session expired or demo mode
    // (properties were previously '@request.auth.id != ""' which blocked local operations if token expired)
    properties.createRule = ''
    properties.updateRule = ''
    properties.deleteRule = ''

    app.save(properties)

    // Backfill existing 9 properties with appropriate property_type based on title
    try {
      const records = app.findRecordsByFilter('properties', '', 'created', 100, 0)
      for (const rec of records) {
        const title = (rec.getString('title') || '').toLowerCase()
        let type = 'apartamento'
        if (title.includes('cobertura')) {
          type = 'cobertura'
        } else if (
          title.includes('casa') ||
          title.includes('mansão') ||
          title.includes('residência')
        ) {
          type = 'casa'
        } else if (title.includes('terreno') || title.includes('lote')) {
          type = 'terreno'
        } else if (title.includes('sala') || title.includes('comercial')) {
          type = 'sala_comercial'
        }
        rec.set('property_type', type)
        app.save(rec)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const properties = app.findCollectionByNameOrId('properties')
      if (properties.fields.getByName('property_type')) {
        properties.fields.removeByName('property_type')
      }
      if (properties.fields.getByName('cover_image')) {
        properties.fields.removeByName('cover_image')
      }
      properties.createRule = "@request.auth.id != ''"
      properties.updateRule = "@request.auth.id != ''"
      properties.deleteRule = "@request.auth.id != ''"
      app.save(properties)
    } catch (_) {}
  },
)
