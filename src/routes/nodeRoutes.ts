import {
  nodeCreateFolderController,
  nodeDeleteController,
  nodeDownloadController,
  nodeListController,
  nodeRetrieveController,
  nodeUploadFilesController,
} from '@/controllers/NodeController'
import { authMiddleware } from '@/middleware/authMiddleware'
import uploadFiles from '@/middleware/upload'
import express from 'express'

const nodeRouter = express.Router()

nodeRouter.get('/', nodeListController)
nodeRouter.post('/', authMiddleware, nodeCreateFolderController)

nodeRouter.post('/upload', authMiddleware, uploadFiles.array('files'), nodeUploadFilesController)

nodeRouter.get('/:id', nodeRetrieveController)
nodeRouter.delete('/:id', authMiddleware, nodeDeleteController)
nodeRouter.get('/:id/download', nodeDownloadController)

export default nodeRouter
