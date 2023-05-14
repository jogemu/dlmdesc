import fs from 'fs'
import https from 'https'

fs.readJsonSync = path => JSON.parse(fs.readFileSync(path))

const folderPath = 'sources/metadata'
const { sources } = fs.readJsonSync('sources.json')

const download = source => new Promise((resolve, reject) => {
  const outputPath = folderPath + '/' + source.split('/').at(-1) + '.xml'
  const file = fs.createWriteStream(outputPath)

  https.get(source, res => {
    if (res.statusCode === 302) https.get(res.headers.location, res => {
      if (res.statusCode === 200) res.pipe(file).on('close', resolve)
      else reject(res.statusCode)
      res.resume()
    })
    else reject(res.statusCode)
    res.resume()
  })
})

folderPath.split('/').forEach((_, index, array) => {
  let folder = array.slice(0, index + 1).join('/')
  if (!fs.existsSync(folder)) fs.mkdirSync(folder)
})

sources.forEach(async (source, index) => {
  await download(source)
  console.log(index + 1, '/', sources.length, 'downloaded')
})
