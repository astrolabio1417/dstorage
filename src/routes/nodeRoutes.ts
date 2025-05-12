import {
  nodeCreateFolderController,
  nodeDownloadController,
  nodeListController,
  nodeRetrieveController,
  nodeUploadFilesController,
  nodeValidationController,
} from '@/controllers/NodeController'
import uploadFiles from '@/middleware/upload'
import express from 'express'

const nodeRouter = express.Router()

nodeRouter.get('/', nodeListController)
nodeRouter.post('/', nodeCreateFolderController)
nodeRouter.post('/upload', uploadFiles.array('files'), nodeUploadFilesController)
nodeRouter.get('/:id', nodeValidationController(), nodeRetrieveController)
nodeRouter.get('/:id/download', nodeValidationController('FILE'), nodeDownloadController)

export default nodeRouter
