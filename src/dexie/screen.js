import db from './database'

export default {
  get (key) {
    return db.waitings.get(key)
  },
  bulkAdd (items) {
    return db.waitings.bulkAdd(items)
  },
  getUnplayOrder () {
    return db.waitings.where('playTimes').equals(0).reverse().sortBy('createTime')
  },
  put (item) {
    return db.waitings.put(item)
  }
}
