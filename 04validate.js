import fs from 'fs'
import sqlite3 from 'sqlite3'

// gpkg files are not automatically downloaded
// you will find the links in sources/adjusted
// then put the files directly in sources/gpkg

fs.readJsonSync = path => JSON.parse(fs.readFileSync(path))

const folderPath = 'out'
const { sources } = fs.readJsonSync('sources.json')

// choose file you want to validate
let i = 6
let source = sources[i]

let metadata = fs.readJsonSync('sources/adjusted/' + source.split('/').at(-1) + '.json')

let outPath = folderPath + '/' + metadata.desc.split('/').at(-1).slice(0, -4) + '.json'
let desc = fs.readJsonSync(outPath)

let gpkg = metadata.gpkg.split('/').at(-1)

let db = new sqlite3.Database('sources/gpkg/' + gpkg, err => {
  if (err) return console.error(err.message)
  console.log('Connected to db')
  desc.layers.forEach(layer => {
    let rows = []
    db.each(`pragma table_info('${layer.layer}')`, (err, row) => {
      if (err) return console.error(err.message)
      rows.push(row)
    }, () => {
      let names = rows.map(row => row.name)
      let errors = 0
      layer.columns.forEach(column => {
        if (!names.includes(column.column)) {
          errors++
          console.warn('column', column.column, 'in layer', layer.layer, 'missing')
        }
      })
      if (!errors) console.log('no errors in layer', layer.layer)
    })
  })
  db.close()
})