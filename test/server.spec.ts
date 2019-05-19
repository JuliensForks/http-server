/*
 * @adonisjs/server
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import * as test from 'japa'
import * as supertest from 'supertest'
import { createServer } from 'http'
import { Router } from '../src/Router/Router'
import { Ioc } from '@adonisjs/fold'
import * as proxyaddr from 'proxy-addr'

import { ServerConfig, HttpContextContract } from '@poppinss/http-server/contracts'
import { MiddlewareStore } from '../src/Server/MiddlewareStore'
import { Server } from '../src/Server/Server'
import { routePreProcessor } from '../src/Server/routePreProcessor'
import { HttpContext } from '../src/HttpContext'

const config: ServerConfig = {
  etag: false,
  jsonpCallbackName: 'callback',
  cookie: {},
  subdomainOffset: 2,
  secret: Math.random().toFixed(36).substring(2, 38),
  trustProxy: proxyaddr.compile('loopback'),
  allowMethodSpoofing: false,
}

test.group('Server | Response handling', () => {
  test('invoke router handler', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', ({ response }) => response.send('handled'))
    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('use route handler return value when response.send is not called', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async () => 'handled')
    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('do not use return value when response.send is called', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router<HttpContext>((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async ({ response }) => {
      response.send('handled')
      return 'done'
    })
    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })

  test('do not use return value when explicit mode is set to false', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async ({ response }) => {
      response.explicitEnd = false

      setTimeout(() => {
        response.send('handled')
      }, 0)

      return 'done'
    })

    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })
})

test.group('Server | middleware', () => {
  test('execute global middleware before route handler', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async () => {
      stack.push('handler')
      return 'done'
    })

    router.commit()
    server.optimize()

    await supertest(httpServer).get('/').expect(200)
    assert.deepEqual(stack, ['fn1', 'fn2', 'handler'])
  })

  test('execute global and route middleware before route handler', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware (_ctx, next) {
      stack.push('route fn1')
      await next()
    })

    router.commit()
    server.optimize()

    await supertest(httpServer).get('/').expect(200)
    assert.deepEqual(stack, ['fn1', 'fn2', 'route fn1', 'handler'])
  })

  test('terminate request from global middleware', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (ctx: HttpContextContract) {
        stack.push('fn1')
        ctx.response.send('completed')
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware (_ctx, next) {
      stack.push('route fn1')
      await next()
    })

    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.deepEqual(stack, ['fn1'])
    assert.equal(text, 'completed')
  })

  test('terminate request from global middleware with exception', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 () {
        stack.push('fn1')
        throw new Error('Cannot process')
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware (_ctx, next) {
      stack.push('route fn1')
      await next()
    })

    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(500)
    assert.deepEqual(stack, ['fn1'])
    assert.equal(text, 'Cannot process')
  })

  test('terminate request from named middleware with exception', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware () {
      throw new Error('Short circuit')
    })

    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(500)
    assert.deepEqual(stack, ['fn1', 'fn2'])
    assert.equal(text, 'Short circuit')
  })

  test('terminate request from named middleware by not calling next', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    middlewareStore.register([
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn1')
        await next()
      },
      async function middlewareFn1 (_ctx, next) {
        stack.push('fn2')
        await next()
      },
    ])

    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    const httpServer = createServer(server.handle.bind(server))

    router.get('/', async () => {
      stack.push('handler')
      return 'done'
    }).middleware(async function routeMiddleware (_ctx) {
      stack.push('route fn1')
      _ctx.response.send('Short circuit')
    })

    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.deepEqual(stack, ['fn1', 'fn2', 'route fn1'])
    assert.equal(text, 'Short circuit')
  })
})

test.group('Server | hooks', () => {
  test('execute all before hooks', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)
    server.before(async () => {
      stack.push('hook1')
    })
    server.before(async () => {
      stack.push('hook2')
    })

    const httpServer = createServer(server.handle.bind(server))
    router.commit()
    server.optimize()

    await supertest(httpServer).get('/').expect(404)
    assert.deepEqual(stack, ['hook1', 'hook2'])
  })

  test('do not execute next hook when first raises error', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)
    server.before(async () => {
      stack.push('hook1')
      throw new Error('Blown away')
    })
    server.before(async () => {
      stack.push('hook2')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(500)
    assert.equal(text, 'Blown away')
    assert.deepEqual(stack, ['hook1'])
  })

  test('do not execute next hook when first writes the body', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)
    server.before(async ({ response }) => {
      stack.push('hook1')
      response.send('done')
    })
    server.before(async () => {
      stack.push('hook2')
    })

    const httpServer = createServer(server.handle.bind(server))

    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'done')
    assert.deepEqual(stack, ['hook1'])
  })

  test('do not execute next hook when first writes the body in non-explicit mode', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)
    server.before(async ({ response }) => {
      response.explicitEnd = false
      stack.push('hook1')
      response.send('done')
    })
    server.before(async () => {
      stack.push('hook2')
    })

    const httpServer = createServer(server.handle.bind(server))

    router.commit()
    server.optimize()

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'done')
    assert.deepEqual(stack, ['hook1'])
  })

  test('execute after hooks before writing the response', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)

    server.before(async () => {
      stack.push('hook1')
    })
    server.before(async () => {
      stack.push('hook2')
    })
    server.after(async () => {
      stack.push('after hook1')
    })

    router.get('/', async () => {
      stack.push('handler')
      return 'done'
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'done')
    assert.deepEqual(stack, ['hook1', 'hook2', 'handler', 'after hook1'])
  })

  test('execute after hooks when route handler raises error', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)

    server.before(async () => {
      stack.push('hook1')
    })
    server.before(async () => {
      stack.push('hook2')
    })
    server.after(async () => {
      stack.push('after hook1')
    })

    router.get('/', async () => {
      stack.push('handler')
      throw new Error('handler error')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(500)
    assert.equal(text, 'handler error')
    assert.deepEqual(stack, ['hook1', 'hook2', 'handler', 'after hook1'])
  })

  test('execute after hooks when route is missing', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)

    server.before(async () => {
      stack.push('hook1')
    })
    server.before(async () => {
      stack.push('hook2')
    })
    server.after(async () => {
      stack.push('after hook1')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(404)
    assert.equal(text, 'E_ROUTE_NOT_FOUND: Cannot GET:/')
    assert.deepEqual(stack, ['hook1', 'hook2', 'after hook1'])
  })

  test('execute after hooks when before hook raises error', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)

    server.before(async () => {
      stack.push('hook1')
      throw new Error('Short circuit')
    })
    server.before(async () => {
      stack.push('hook2')
    })
    server.after(async () => {
      stack.push('after hook1')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(500)
    assert.equal(text, 'Short circuit')
    assert.deepEqual(stack, ['hook1', 'after hook1'])
  })

  test('execute after hooks when before hook writes response', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)

    server.before(async ({ response }) => {
      stack.push('hook1')
      response.send('handled inside before hook')
    })
    server.before(async () => {
      stack.push('hook2')
    })
    server.after(async ({ response }) => {
      stack.push('after hook1')
      response.send('updated inside after hook')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'updated inside after hook')
    assert.deepEqual(stack, ['hook1', 'after hook1'])
  })

  test('do not execute after hooks when explicit end is set to false', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)

    server.before(async ({ response }) => {
      stack.push('hook1')
      response.explicitEnd = false
      response.send('handled inside before hook')
    })
    server.before(async () => {
      stack.push('hook2')
    })
    server.after(async ({ response }) => {
      stack.push('after hook1')
      response.send('updated inside after hook')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled inside before hook')
    assert.deepEqual(stack, ['hook1'])
  })

  test('catch after hook errors', async (assert) => {
    const stack: string[] = []

    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))
    const server = new Server(HttpContext, router, middlewareStore, config)

    server.before(async () => {
      stack.push('hook1')
    })
    server.before(async () => {
      stack.push('hook2')
    })
    server.after(async () => {
      stack.push('after hook1')
      throw new Error('Unexpected error')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(500)
    assert.equal(text, 'Unexpected error')
    assert.deepEqual(stack, ['hook1', 'hook2', 'after hook1'])
  })
})

test.group('Server | error handler', () => {
  test('pass before hook errors to error handler', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    server.onError(async (_error, { response }) => {
      response.status(200).send('handled by error handler')
    })

    server.before(async () => {
      throw new Error('Bump')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled by error handler')
  })

  test('pass route handler errors to error handler', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    server.onError(async (_error, { response }) => {
      response.status(200).send('handled by error handler')
    })

    router.get('/', async () => {
      throw new Error('bump')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled by error handler')
  })

  test('pass middleware error to custom error handler', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    server.onError(async (_error, { response }) => {
      response.status(200).send('handled by error handler')
    })

    middlewareStore.register([async function middleware () {
      throw new Error('bump')
    }])

    router.get('/', async () => {
      return 'handled by route'
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled by error handler')
  })

  test('pass after hooks error to custom error handler', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    server.onError(async (_error, { response }) => {
      response.send('handled by error handler')
    })

    server.after((async function afterHook () {
      throw new Error('Bump')
    }))

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled by error handler')
  })

   test('passing missing route error to error handler', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    server.onError(async (_error, { response }) => {
      response.send('handled by error handler')
    })

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled by error handler')
  })
})

test.group('Server | all', (group) => {
  group.afterEach(() => {
    delete global['use']
    delete global['make']
  })

  test('raise 404 when route is missing', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    const server = new Server(HttpContext, router, middlewareStore, config)
    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(404)
    assert.equal(text, 'E_ROUTE_NOT_FOUND: Cannot GET:/')
  })

  test('execute IoC container controller binding', async (assert) => {
    const middlewareStore = new MiddlewareStore()
    const router = new Router((route) => routePreProcessor(route, middlewareStore))

    class HomeController {
      public async index () {
        return 'handled'
      }
    }

    const ioc = new Ioc()
    ioc.bind('App/Controllers/Http/HomeController', () => new HomeController())
    global['make'] = ioc.make.bind(ioc)

    router.get('/', 'HomeController.index')

    const server = new Server(HttpContext, router, middlewareStore, config)

    router.commit()
    server.optimize()

    const httpServer = createServer(server.handle.bind(server))

    const { text } = await supertest(httpServer).get('/').expect(200)
    assert.equal(text, 'handled')
  })
})
