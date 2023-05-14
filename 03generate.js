import fs from 'fs'
import PDF2Tree from 'pdf2tree'

fs.readJsonSync = path => JSON.parse(fs.readFileSync(path))

const folderPath = 'out'
const { sources } = fs.readJsonSync('sources.json')

function decode(o) {
  if (Array.isArray(o)) return o.map(decode)
  if (o?.Texts) return o.Texts.map(t => decodeURIComponent(t.R[0].T))
  return o
}

function join(a) {
  return a.join(' ').replaceAll('  ', ' ').replaceAll('""', '"')
}

function decjoin(o) {
  return decode(o).map(join)
}

function vd(a) {
  a = decjoin(a)
  return {
    value: a[0],
    description: a[1],
  }
}

function formatDate(str) {
  let splitted = str.slice(7).replaceAll('. ', '.').split('.')
  splitted.reverse()
  return splitted.join('-')
}

const vda = ([value, description]) => ({ value, description })

function valDesc(row, i) {
  return Array.isArray(row[i]) ? row[i].map(vd) : [vd(row.slice(i))]
}

sources.forEach(async source => {
  let metadata = fs.readJsonSync('sources/adjusted/' + source.split('/').at(-1) + '.json')
  let pdf = metadata.desc.split('/').at(-1)
  console.log(pdf)
  let pdf2tree = new PDF2Tree()
  pdf2tree.maxStrokeWidth = 1
  pdf2tree.maxGapWidth = 0.1
  let json = await pdf2tree.loadPDF('sources/descriptions/' + pdf)
  let tree = json.Tree.slice(2).flat().filter(n => !n.Texts)

  // Tables that continue on next page
  for (let i = 1; i < tree.length; i++) {
    let row = 0, col = 0
    if (isFinite(decode(tree[i][row][col])[0])) continue
    tree.splice(i - 1, 2, tree[i - 1].concat(tree[i]))
  }

  let layers = tree.map(table => {
    let result = {}
    let row0 = decode(table[0][0])
    let row1 = decode(table[1][0])

    let includesRules = row0.length != 4

    result.layer = row0.find(v => v.startsWith('Abgabebeschreibung')).replaceAll('   ', '  ').split('  ')[1]
    let version = row0[1]
    if (includesRules) version = row1[0]
    result.version = formatDate(version)

    let i = 2
    if (includesRules) i = 3

    if (decode(table[i]).length == 6) includesRules = true
    result.datatype = null

    result.columns = table.slice(i).map(row => {
      let drow = decjoin(row)
      let column = {
        column: drow[0].replaceAll(' ', ''),
        description: drow[1],
        datatype: drow[2],
      }
      column.values = []
      column.rules = []
      if (includesRules) {
        let multipleRules = Array.isArray(row[3])
        let valuesNested = Array.isArray(row[4])
        if (multipleRules) {
          if (valuesNested)
            column.values = row[4].map(decjoin).map(vda)

          row[3].map(rule => {
            let features = decode(rule)[0]
            let values = decode(rule)[1]
            if (Array.isArray(rule[1])) {
              values = decode(rule[1]).map(v => v[0][0])
              if (!valuesNested) column.values.push(...rule[1].map(decjoin).map(vda))
            }
            column.rules.push({
              features,
              values,
            })
          })
        } else {
          column.values = valDesc(row, 4)
        }
      } else {
        column.values = valDesc(row, 3)
      }
      return column
    })

    return result
  })

  layers.forEach(layer => layer.datatype = layer.columns[1].values[0].value)

  let { title, theme, annex, resourceConstraints } = metadata

  let data = {
    title,
    theme,
    annex,
    layers,
    sources: [metadata.doi, theme],
    resourceConstraints,
  }
  fs.writeFileSync(folderPath + '/' + pdf.slice(0, -3) + 'json', JSON.stringify(data, null, 2))
})