/*
 * @adonisjs/router
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import test from 'japa'
import { RouteResource } from '../src/Router/Resource'

test.group('Route Resource', () => {
  test('add base resource routes', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})

    assert.deepEqual(resource.routes.map((route) => route.toJSON()), [
      {
        pattern: '/photos',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.index',
        name: 'photos.index',
      },
      {
        pattern: '/photos/create',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.create',
        name: 'photos.create',
      },
      {
        pattern: '/photos',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['POST'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.store',
        name: 'photos.store',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.show',
        name: 'photos.show',
      },
      {
        pattern: '/photos/:id/edit',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.edit',
        name: 'photos.edit',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.update',
        name: 'photos.update',
      },
      {
        pattern: '/photos/:id',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'PhotosController.destroy',
        name: 'photos.destroy',
      },
    ])
  })

  test('add base nested resource routes', (assert) => {
    const resource = new RouteResource('magazines.ads', 'AdsController', {}, false)

    assert.deepEqual(resource.routes.map((route) => route.toJSON()), [
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.index',
        name: 'magazines.ads.index',
      },
      {
        pattern: '/magazines/:magazine_id/ads/create',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.create',
        name: 'magazines.ads.create',
      },
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        methods: ['POST'],
        domain: 'root',
        meta: {
          namespace: undefined,
        },
        middleware: [],
        handler: 'AdsController.store',
        name: 'magazines.ads.store',
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.show',
        name: 'magazines.ads.show',
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id/edit',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.edit',
        name: 'magazines.ads.edit',
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        meta: {
          namespace: undefined,
        },
        middleware: [],
        handler: 'AdsController.update',
        name: 'magazines.ads.update',
      },
      {
        pattern: '/magazines/:magazine_id/ads/:id',
        matchers: {},
        methods: ['DELETE'],
        meta: {
          namespace: undefined,
        },
        domain: 'root',
        middleware: [],
        handler: 'AdsController.destroy',
        name: 'magazines.ads.destroy',
      },
    ])
  })

  test('add shallow nested resource routes', (assert) => {
    const resource = new RouteResource('magazines.ads', 'AdsController', {}, true)

    assert.deepEqual(resource.routes.map((route) => route.toJSON()), [
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.index',
        name: 'magazines.ads.index',
      },
      {
        pattern: '/magazines/:magazine_id/ads/create',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.create',
        name: 'magazines.ads.create',
      },
      {
        pattern: '/magazines/:magazine_id/ads',
        matchers: {},
        methods: ['POST'],
        meta: {
          namespace: undefined,
        },
        domain: 'root',
        middleware: [],
        handler: 'AdsController.store',
        name: 'magazines.ads.store',
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.show',
        name: 'ads.show',
      },
      {
        pattern: '/ads/:id/edit',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['GET'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.edit',
        name: 'ads.edit',
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['PUT', 'PATCH'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.update',
        name: 'ads.update',
      },
      {
        pattern: '/ads/:id',
        matchers: {},
        meta: {
          namespace: undefined,
        },
        methods: ['DELETE'],
        domain: 'root',
        middleware: [],
        handler: 'AdsController.destroy',
        name: 'ads.destroy',
      },
    ])
  })

  test('mark non-api routes deleted', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})
    resource.apiOnly()

    assert.isTrue(resource.routes.find((route) => route.name === 'photos.create')!.deleted)
    assert.isTrue(resource.routes.find((route) => route.name === 'photos.edit')!.deleted)
  })

  test('mark all other routes as deleted except defined one\'s', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})
    resource.only(['index', 'show'])

    assert.isFalse(resource.routes.find((route) => route.name === 'photos.index')!.deleted)
    assert.isTrue(resource.routes.find((route) => route.name === 'photos.create')!.deleted)
    assert.isTrue(resource.routes.find((route) => route.name === 'photos.store')!.deleted)
    assert.isFalse(resource.routes.find((route) => route.name === 'photos.show')!.deleted)
    assert.isTrue(resource.routes.find((route) => route.name === 'photos.edit')!.deleted)
    assert.isTrue(resource.routes.find((route) => route.name === 'photos.update')!.deleted)
    assert.isTrue(resource.routes.find((route) => route.name === 'photos.destroy')!.deleted)
  })

  test('mark all defined as delete', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})
    resource.except(['index', 'show'])

    assert.isTrue(resource.routes.find((route) => route.name === 'photos.index')!.deleted)
    assert.isFalse(resource.routes.find((route) => route.name === 'photos.create')!.deleted)
    assert.isFalse(resource.routes.find((route) => route.name === 'photos.store')!.deleted)
    assert.isTrue(resource.routes.find((route) => route.name === 'photos.show')!.deleted)
    assert.isFalse(resource.routes.find((route) => route.name === 'photos.edit')!.deleted)
    assert.isFalse(resource.routes.find((route) => route.name === 'photos.update')!.deleted)
    assert.isFalse(resource.routes.find((route) => route.name === 'photos.destroy')!.deleted)
  })

  test('define middleware on routes', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})
    resource.middleware({
      create: ['auth'],
      store: ['auth', 'acl:admin'],
    })

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.index')!['_middleware'],
      [],
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.create')!['_middleware'],
      ['auth'],
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.store')!['_middleware'],
      ['auth', 'acl:admin'],
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.show')!['_middleware'],
      [],
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.edit')!['_middleware'],
      [],
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.update')!['_middleware'],
      [],
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.destroy')!['_middleware'],
      [],
    )
  })

  test('define matcher for params', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})
    resource.where('id', '[a-z]')

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.index')!['_matchers'],
      {
        id: /[a-z]/,
      },
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.create')!['_matchers'],
      {
        id: /[a-z]/,
      },
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.store')!['_matchers'],
      {
        id: /[a-z]/,
      },
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.show')!['_matchers'],
      {
        id: /[a-z]/,
      },
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.edit')!['_matchers'],
      {
        id: /[a-z]/,
      },
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.update')!['_matchers'],
      {
        id: /[a-z]/,
      },
    )

    assert.deepEqual(
      resource.routes.find((route) => route.name === 'photos.destroy')!['_matchers'],
      {
        id: /[a-z]/,
      },
    )
  })

  test('define namespace for all routes', (assert) => {
    const resource = new RouteResource('photos', 'PhotosController', {})
    resource.namespace('Admin/Controllers')

    assert.deepEqual(resource.routes.map((route) => route.toJSON().meta.namespace), [
      'Admin/Controllers',
      'Admin/Controllers',
      'Admin/Controllers',
      'Admin/Controllers',
      'Admin/Controllers',
      'Admin/Controllers',
      'Admin/Controllers',
    ])
  })
})
