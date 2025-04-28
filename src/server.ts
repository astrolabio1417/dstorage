import 'dotenv/config'
import bodyParser from 'body-parser'
import express from 'express'

import {
  nodeCreateFolderController,
  nodeDownloadController,
  nodeListController,
  nodeRetrieveController,
  nodeUploadFilesController,
  nodeValidationController,
} from './controllers/NodeController'
import errorHandlerMiddleware from './middleware/errorHandler'
import uploadFiles from './middleware/upload'

const port = 3000
const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.send('test')
})

app.get('/api/nodes', nodeListController)
app.post('/api/nodes', nodeCreateFolderController)
app.post('/api/files', uploadFiles.array('files'), nodeUploadFilesController)
app.get('/api/nodes/:id/', nodeValidationController(), nodeRetrieveController)
app.get('/api/nodes/:id/download', nodeValidationController('FILE'), nodeDownloadController)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port.toString()}`)
})

app.use(errorHandlerMiddleware)
