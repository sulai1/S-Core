/* eslint-disable */
/**
 * THIS FILE IS GENERATED AUTOMATICALLY.
 * DO NOT EDIT.
 *
 * You are probably looking on adding startup/initialization code.
 * Use "quasar new boot <name>" and add it there.
 * One boot file per concern. Then reference the file(s) in quasar.config file > boot:
 * boot: ['file', ...] // do not add ".js" extension to it.
 *
 * Boot files are your "main.js"
 **/
import { createApp } from 'vue'


import '@quasar/extras/roboto-font/roboto-font.css'

import '@quasar/extras/material-icons/material-icons.css'




// We load Quasar stylesheet file
import 'quasar/dist/quasar.sass'




import 'src/css/app.scss'


import createQuasarApp from './app.js'
import quasarUserOptions from './quasar-user-options.js'



const publicPath = `/`


const httpRE = /^https?:\/\//

function getRedirectUrl (url, router) {
  if (typeof url === 'string' && httpRE.test(url) === true) {
    return url
  }

  try { return router.resolve(url).href }
  catch (err) {}

  return url
}

function getUrlPath(ssrContext) {
  
  const url = ssrContext.url || ssrContext.req.url

  try {
    
    const parsedUrl = new URL(url)
    return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash
  } catch {
    
    return url
  }
}

const { components, directives, ...qUserOptions } = quasarUserOptions


let bootFunctions = null
let bootPromise = Promise.allSettled([
  
  import('boot/di')
  
])
.then(bootFiles => bootFiles.map(result => {
  if (result.status === 'rejected') {
    console.error('[Quasar] boot error:', result.reason)
    return
  }
  return result.value.default
}))
.then(bootFiles => bootFiles.filter(entry => typeof entry === 'function'))


// This is where we perform data-prefetching to determine the
// state of our application before actually rendering it.
// Since data fetching is async, this function is expected to
// return a Promise that resolves to the app instance.
export default ssrContext => {
  return new Promise(async (resolve, reject) => {
    
    if (bootFunctions === null) {
      bootFunctions = await bootPromise
      bootPromise = null
    }
    

    const {
      app, router
    } = await createQuasarApp(createApp, qUserOptions, ssrContext)

    
    let hasRedirected = false
    const redirect = (url, httpStatusCode) => {
      hasRedirected = true
      reject({ url: getRedirectUrl(url, router), code: httpStatusCode })
    }

    for (let i = 0; hasRedirected === false && i < bootFunctions.length; i++) {
      try {
        await bootFunctions[ i ]({
          app,
          router,
          
          ssrContext,
          redirect,
          urlPath: getUrlPath(ssrContext),
          publicPath
        })
      }
      catch (err) {
        reject(err)
        return
      }
    }

    if (hasRedirected === true) return
    

    app.use(router)

    const urlPath = getUrlPath(ssrContext)
    const { fullPath } = router.resolve(urlPath)

    if (fullPath !== urlPath) {
      return reject({ url: fullPath })
    }

    // set router's location
    router.push(urlPath).catch(() => {})

    // wait until router has resolved possible async hooks
    router.isReady().then(() => {
      let matchedComponents = router.currentRoute.value.matched
        .filter(record => record.components !== void 0)
        .flatMap(record => Object.values(record.components))

      // no matched routes
      if (matchedComponents.length === 0) {
        return reject({ code: 404 })
      }

      

        

        resolve(app)

      
    }).catch(reject)
  })
}
