import fs from 'fs'
import https from 'https'

fs.readJsonSync = path => JSON.parse(fs.readFileSync(path))

const folderPath = 'sources/descriptions'
const { sources } = fs.readJsonSync('sources.json')

const download = url => new Promise((resolve, reject) => {
  const outputPath = folderPath + '/' + url.split('/').at(-1)
  const file = fs.createWriteStream(outputPath)

  https.get(url, res => {
    if (res.statusCode === 200) res.pipe(file).on('close', resolve)
    else reject(res.statusCode)
    res.resume()
  })
})

folderPath.split('/').forEach((_, index, array) => {
  let folder = array.slice(0, index + 1).join('/')
  if (!fs.existsSync(folder)) fs.mkdirSync(folder)
})

sources.forEach(source => {
  let metadata = fs.readJsonSync('sources/adjusted/' + source.split('/').at(-1) + '.json')
  download(metadata.desc)
})