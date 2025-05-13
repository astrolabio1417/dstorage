import {
  nodeCreateFolderController,
  nodeDeleteController,
  nodeDownloadController,
  nodeListController,
  nodeRetrieveController,
  nodeUploadFilesController,
  nodeValidationController,
} from '@/controllers/NodeController'
import { authMiddleware } from '@/middleware/authMiddleware'
import uploadFiles from '@/middleware/upload'
import express from 'express'

const nodeRouter = express.Router()

nodeRouter.get('/', nodeListController)
nodeRouter.post('/', authMiddleware, nodeCreateFolderController)

nodeRouter.post('/upload', authMiddleware, uploadFiles.array('files'), nodeUploadFilesController)

nodeRouter.get('/:id', nodeValidationController(), nodeRetrieveController)
nodeRouter.delete('/:id', authMiddleware, nodeValidationController(), nodeDeleteController)
nodeRouter.get('/:id/download', nodeValidationController('FILE'), nodeDownloadController)

export default nodeRouter
