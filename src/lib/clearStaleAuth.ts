// Runs once on app load to clear stale auth from old projects
export const clearStaleAuth = () => {
  try {
    const validProject = 'bcgcxflakiyhqbmcixgv'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') && !key.includes(validProject)) {
        localStorage.removeItem(key)
        console.log('Cleared stale auth key:', key)
      }
    })
  } catch (e) {}
}
