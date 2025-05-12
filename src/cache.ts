import { FlatCache } from 'flat-cache'
export const cache = new FlatCache({
  expirationInterval: 5 * 1000 * 60, // 5 minutes
  lruSize: 1000, // 1000 items,
  persistInterval: 5 * 1000 * 60, // 5 minutes
  ttl: 60 * 60 * 1000, // 1 hour
})
