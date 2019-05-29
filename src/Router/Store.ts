/**
 * @module @poppinss/http-server
 */

/*
* @poppinss/http-server
*
* (c) Harminder Virk <virk@adonisjs.com>
*
* For the full copyright and license information, please view the LICENSE
* file that was distributed with this source code.
*/

import { pick, cloneDeep } from 'lodash'
import * as matchit from 'matchit'
import { Exception } from '@poppinss/utils'
import {
  RouteDefination,
  RouteNode,
  MatchedRoute,
  DomainNode,
  MethodNode,
  RoutesTree,
} from '../contracts'
import { exceptionCodes } from '../helpers'

/**
 * Store class is used to store a list of routes, along side with their tokens
 * to match the URL's. The used data structures to store information is tailored
 * for quick lookups.
 *
 * @example
 * ```ts
 * const store = new Store()
 *
 * store.add({
 *  pattern: 'posts/:id',
 *  handler: function onRoute () {},
 *  middleware: [],
 *  matchers: {
 *    id: '^[0-9]$+'
 *  },
 *  meta: {},
 *  methods: ['GET']
 * })
 *
 * store.match('posts/1', 'GET')
 * ```
 */
export class Store<Context> {
  public tree: RoutesTree<Context> = { tokens: [], domains: {} }

  /**
   * Returns the domain node for a given domain. If domain node is missing,
   * it will added to the routes object and tokens are also generated
   */
  private _getDomainNode (domain: string): DomainNode<Context> {
    if (!this.tree.domains[domain]) {
      /**
       * The tokens are required to match dynamic domains
       */
      this.tree.tokens.push(matchit.parse(domain))
      this.tree.domains[domain] = {}
    }

    return this.tree.domains[domain]
  }

  /**
   * Returns the method node for a given domain and method. If method is
   * missing, it will be added to the domain node
   */
  private _getMethodRoutes (domain: string, method: string): MethodNode<Context> {
    const domainNode = this._getDomainNode(domain)
    if (!domainNode[method]) {
      domainNode[method] = { tokens: [], routes: {} }
    }

    return domainNode[method]
  }

  /**
   * Adds a route to the store for all the given HTTP methods. Also an array
   * of tokens is generated for the route pattern. The tokens are then
   * matched against the URL to find the appropriate route.
   *
   * @example
   * ```ts
   * store.add({
   *   pattern: 'post/:id',
   *   methods: ['GET'],
   *   matchers: {},
   *   meta: {},
   *   handler: function handler () {
   *   }
   * })
   * ```
   */
  public add (route: RouteDefination<Context>): this {
    /**
     * Create a copy of route properties by cherry picking
     * fields. We create the copy outside the forEach
     * loop, so that the same object is shared across
     * all the methods (saving memory).
     *
     * Also sharing a single route note among all the methods is fine,
     * since we create sub-trees for each method to make the lookups
     * fast.
     */
    const routeJSON = cloneDeep(pick(route, [
      'pattern',
      'handler',
      'meta',
      'middleware',
      'name',
    ])) as RouteNode<Context>

    route.methods.forEach((method) => {
      const methodRoutes = this._getMethodRoutes(route.domain || 'root', method)

      /**
       * Ensure that route doesn't pre-exists. In that case, we need to throw
       * the exception, since it's a programmer error to create multiple
       * routes with the same pattern on the same method.
       */
      if (methodRoutes.routes[route.pattern]) {
        throw new Exception(
          `Duplicate route \`${method}:${route.pattern}\``,
          500,
          exceptionCodes.E_DUPLICATE_ROUTE,
        )
      }

      /**
       * Generate tokens for the given route and push to the list
       * of tokens
       */
      methodRoutes.tokens.push(matchit.parse(route.pattern, route.matchers))

      /**
       * Store reference to the route, so that we can return it to the user, when
       * they call `match`.
       */
      methodRoutes.routes[route.pattern] = routeJSON
    })

    return this
  }

  /**
   * Matches the url, method and optionally domain to pull the matching
   * route. `null` is returned when unable to match the URL against
   * registered routes.
   */
  public match (url: string, method: string, domain?: string): null | MatchedRoute<Context> {
    /**
     * Start by matching the domain and return null, if unable to find
     * the domain
     */
    const matchedDomain = matchit.match(domain || 'root', this.tree.tokens)
    if (!matchedDomain.length) {
      return null
    }

    /**
     * Next get the method node for the given method inside the domain. If
     * method node is missing, means no routes ever got registered for that
     * method
     */
    const matchedMethod = this.tree.domains[matchedDomain[0].old][method]
    if (!matchedMethod) {
      return null
    }

    /**
     * Next, match route for the given url inside the tokens list for the
     * matchedMethod
     */
    const matchedRoute = matchit.match(url, matchedMethod.tokens)
    if (!matchedRoute.length) {
      return null
    }

    return {
      route: matchedMethod.routes[matchedRoute[0].old],
      params: matchit.exec(url, matchedRoute),
      subdomains: matchit.exec(domain || 'root', matchedDomain),
    }
  }
}
