import fs from 'fs'

let descriptions = fs.readdirSync('out').map(file => JSON.parse(fs.readFileSync('out/' + file)))

const sum = a => a.reduce((p, c) => p + c, 0)

let stats = descriptions.map(description => {
  let result = []
  result.push(description.title.split(' - ').at(-1).split(' ')[0])
  result.push(description.layers.length)
  result.push(sum(description.layers.map(layer => layer.columns.length)))
  result.push(sum(description.layers.map(layer => sum(layer.columns.map(column => column.values.length)))))
  result.push(sum(description.layers.map(layer => sum(layer.columns.map(column => column.rules.length)))))
  return result
})

stats.unshift(['Geopackage', 'Number of Layers', 'Number of Columns', 'Number of Values', 'Number of Rules'])
fs.writeFileSync('stats.csv', stats.map(r => r.join(',')).join('\n'))