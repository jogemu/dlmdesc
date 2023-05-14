import fs from 'fs'
import Parser from 'xml2js'
import https from 'https'

fs.readJsonSync = path => JSON.parse(fs.readFileSync(path))

const folderPath = 'sources/adjusted'
const { sources } = fs.readJsonSync('sources.json')

function get(o, ...keys) {
  keys.forEach(key => o = o[key][0])
  return o
}

folderPath.split('/').forEach((_, index, array) => {
  let folder = array.slice(0, index + 1).join('/')
  if (!fs.existsSync(folder)) fs.mkdirSync(folder)
})

const annex = theme => new Promise((resolve, reject) => {
  https.get(theme + '/' + theme.slice('/').at(-1) + '.en.json', (res) => {
    if (res.statusCode !== 200) return reject(res.statusMessage)
    let body = []

    res.on('data', data => body.push(data.toString()))
    res.on('end', () => resolve(JSON.parse(body.join()).theme.annex))
  });
})

sources.forEach(source => {
  Parser.parseString(fs.readFileSync('sources/metadata/' + source.split('/').at(-1) + '.xml'), (err, data) => {
    if (err) return console.error(err)
    let metadata = data['gmd:MD_Metadata']

    let citation = get(metadata, 'gmd:identificationInfo', 'gmd:MD_DataIdentification', 'gmd:citation', 'gmd:CI_Citation')
    let title = get(citation, 'gmd:title', 'gco:CharacterString')
    let doi = get(citation, 'gmd:identifier', 'gmd:MD_Identifier', 'gmd:code', 'gmx:Anchor')['$']['xlink:href']

    let identificationInfo = get(metadata, 'gmd:identificationInfo', 'gmd:MD_DataIdentification')
    let descriptiveKeywords = identificationInfo['gmd:descriptiveKeywords']
      .map(keyword => get(keyword, 'gmd:MD_Keywords', 'gmd:keyword'))
      .filter(keyword => keyword['gmx:Anchor'])
      .map(keyword => get(keyword, 'gmx:Anchor')['$']['xlink:href'])

    let resourceConstraints = identificationInfo['gmd:resourceConstraints']
      .map(keyword => get(keyword, 'gmd:MD_LegalConstraints', 'gmd:otherConstraints', 'gmx:Anchor')['$']['xlink:href'])

    let theme = descriptiveKeywords.find(keyword => keyword.startsWith('http://inspire.ec.europa.eu/theme/'))
    // manually verfied that all links support https
    theme = theme.replace('http', 'https')

    let onLines = get(metadata, 'gmd:distributionInfo', 'gmd:MD_Distribution', 'gmd:transferOptions', 'gmd:MD_DigitalTransferOptions')['gmd:onLine']
      .map(onLine => get(onLine, 'gmd:CI_OnlineResource', 'gmd:linkage', 'gmd:URL'))

    let desc = onLines.find(onLine => onLine.endsWith('.pdf') && onLine.includes('gpkg'))
    let gpkg = onLines.find(onLine => onLine.endsWith('.gpkg'))

    annex(theme).then(annex => {
      fs.writeFileSync(folderPath + '/' + source.split('/').at(-1) + '.json', JSON.stringify({
        title, doi,
        theme,
        annex,
        desc,
        gpkg,
        resourceConstraints,
      }, null, 2))
    })
  })
})