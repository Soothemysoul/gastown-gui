/**
 * usePolling composable — periodic async callback runner
 *
 * Starts an interval that calls the given async function.
 * Automatically stops on component unmount.
 */

import { ref, onUnmounted } from 'vue'

export function usePolling(callback, intervalMs = 5000) {
  const isActive = ref(false)
  let timer = null

  function start() {
    if (timer) return
    isActive.value = true
    timer = setInterval(async () => {
      try {
        await callback()
      } catch (err) {
        console.error('[usePolling] callback error:', err)
      }
    }, intervalMs)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isActive.value = false
  }

  function restart() {
    stop()
    start()
  }

  onUnmounted(stop)

  return { isActive, start, stop, restart }
}
