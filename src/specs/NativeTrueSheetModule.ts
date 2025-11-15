/**
 * TurboModule spec for TrueSheet imperative API
 * Provides promise-based async operations with proper error handling
 *
 * @format
 */

import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

export interface Spec extends TurboModule {
  /**
   * Present a sheet by reference
   * @param viewTag - Native view tag of the sheet component
   * @param index - Size index to present at
   * @returns Promise that resolves when sheet is fully presented
   * @throws PRESENT_FAILED if presentation fails
   */
  presentByRef(viewTag: number, index: number): Promise<void>

  /**
   * Dismiss a sheet by reference
   * @param viewTag - Native view tag of the sheet component
   * @returns Promise that resolves when sheet is fully dismissed
   * @throws DISMISS_FAILED if dismissal fails
   */
  dismissByRef(viewTag: number): Promise<void>

  /**
   * Resize a sheet to a different index by reference
   * @param viewTag - Native view tag of the sheet component
   * @param index - New size index
   * @returns Promise that resolves when resize is complete
   */
  resizeByRef(viewTag: number, index: number): Promise<void>
}

export default TurboModuleRegistry.get<Spec>('TrueSheetModule')
