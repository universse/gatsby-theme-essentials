import { get, set, del } from 'idb-keyval'

const session = {
  createdAt: Date.now(),
  ref: document.referrer,
  userAgent: navigator.userAgent,
  language: navigator.language,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
}

const events = []

window.___log = (type, properties) => {
  process.env.NODE_ENV === 'development' && console.log({ type, properties })
  events.push({
    timestamp: Date.now(),
    type,
    properties
  })
}

window.___logUser = uid => {
  session.uid = uid
}

// scroll
let prevLocation = window.location.pathname + window.location.search
let prevScrollPos = window.scrollY
let timeout

window.addEventListener('scroll', () => {
  clearTimeout(timeout)

  timeout = setTimeout(() => {
    const location = window.location.pathname + window.location.search
    const scrollPos = window.scrollY

    location === prevLocation &&
      window.___log('scroll', {
        change: scrollPos - prevScrollPos,
        location,
        percentage: Math.round(
          (scrollPos * 100) / (document.body.clientHeight - window.innerHeight)
        )
      })

    prevLocation = location
    prevScrollPos = scrollPos
  }, 400)
})

// visibility
let switchAwayTimestamp

window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    window.___log('switch back', { after: Date.now() - switchAwayTimestamp })
  }

  if (document.visibilityState === 'hidden') {
    window.___log('switch tab')
    switchAwayTimestamp = Date.now()
  }
})

// end session
let sent = false
let endpoint
const key = 'int'

function send(data) {
  const request = new XMLHttpRequest()
  request.open('POST', endpoint)
  request.setRequestHeader('Content-Type', 'application/json')
  request.send(data)
}

function isBot(userAgent) {
  return /bot|crawler|spider|crawling/i.test(userAgent)
}

function endSession() {
  if (isBot(session.userAgent) || sent) return
  sent = true

  if (!endpoint) {
    console.warn('Endpoint has not been configured.')
    return
  }

  if (!session.appId) {
    console.warn('appId has not been configured.')
    return
  }

  const {
    fetchStart,
    loadEventEnd,
    responseEnd
  } = window.performance.getEntriesByType('navigation')[0]
  session.latency = responseEnd - fetchStart
  session.pageLoad = loadEventEnd - fetchStart

  const data = JSON.stringify({ session, events })

  try {
    const beacon = window.navigator.sendBeacon(
      endpoint,
      new Blob([data], { type: 'application/json' })
    )
    if (!beacon) throw new Error()
  } catch {
    const iOS =
      !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)
    const google = window.navigator.vendor.includes('Google')

    if (iOS || google) {
      return set(key, data)
    }

    send(data)

    const latency = session.latency || 0
    const t = Date.now() + Math.max(300, latency + 200)
    while (Date.now() < t) {}
  }
}

const once = { once: true }
window.addEventListener('pagehide', endSession, once)
window.addEventListener('beforeunload', endSession, once)
window.addEventListener('unload', endSession, once)

// view page
function logViewPage({ location, prevLocation }) {
  const properties = {
    location: location.pathname + location.search,
    ...(prevLocation && {
      prevLocation: prevLocation.pathname + prevLocation.search
    })
  }

  location.pathname.startsWith('/collection')
    ? window.___log('view collection', properties)
    : window.___log('view page', properties)
}

export const onRouteUpdate = ({ location, prevLocation }, options = {}) => {
  if (!prevLocation) {
    session.appId = options.appId
    endpoint = options.endpoint

    get(key).then(data => {
      data && send(data)
      del(key)
    })
  }

  document.visibilityState === 'visible' &&
    logViewPage({ location, prevLocation })
}
