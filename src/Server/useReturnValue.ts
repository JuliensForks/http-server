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

/**
 * Returns a boolean telling if return value of route handler
 * or error handler should be used or not
 */
export function useReturnValue (returnValue: any, ctx: any) {
  return (
    returnValue !== undefined &&            // Return value is explicitly defined
    returnValue !== ctx.response &&         // Return value is not the instance of response object
    !ctx.response.hasLazyBody               // Lazy body is not set
  )
}
