export function saveSecretKey (clientPrivateKey) {
  try {
    MealTakeClass.saveSecretKey(clientPrivateKey)
  } catch (error) {
    console.error('MealTakeClass.saveSecretKey Error', error)
  }
}

export function getDeviceSN () {
  try {
    return localStorage.getItem('deviceSN') || MealTakeClass.getDeviceSN()
  } catch (error) {
    console.error('MealTakeClass.getDeviceSN Error', error)
    return null
  }
}

export function getToken () {
  try {
    return MealTakeClass.getToken()
  } catch (error) {
    console.error('MealTakeClass.getToken Error', error)
    return null
  }
}