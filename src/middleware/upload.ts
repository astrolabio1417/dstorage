import multer from 'multer'

import DiscordStorage from '../discord/DiscordStorage'

const discordStorage = new DiscordStorage()

const uploadFiles = multer({
  storage: discordStorage,
})

export default uploadFiles
