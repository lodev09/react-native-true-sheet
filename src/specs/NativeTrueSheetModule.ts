/**
 * TurboModule spec for TrueSheet imperative API
 * Provides promise-based async operations with proper error handling
 *
 * @format
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

interface Spec extends TurboModule {
  /**
   * Present a sheet by reference
   * @param viewTag - Native view tag of the sheet component
   * @param index - Detent index to present at
   * @param animated - Whether to animate the presentation
   * @returns Promise that resolves when sheet is fully presented
   * @throws PRESENT_FAILED if presentation fails
   */
  presentByRef(viewTag: number, index: number, animated: boolean): Promise<void>;

  /**
   * Dismiss a sheet and all sheets presented on top of it
   * @param viewTag - Native view tag of the sheet component
   * @param animated - Whether to animate the dismissal
   * @returns Promise that resolves when sheet is fully dismissed
   * @throws DISMISS_FAILED if dismissal fails
   */
  dismissByRef(viewTag: number, animated: boolean): Promise<void>;

  /**
   * Dismiss only the sheets presented on top of this sheet, keeping this sheet presented
   * @param viewTag - Native view tag of the sheet component
   * @param animated - Whether to animate the dismissal
   * @returns Promise that resolves when all child sheets are fully dismissed
   * @throws DISMISS_FAILED if dismissal fails
   */
  dismissChildrenByRef(viewTag: number, animated: boolean): Promise<void>;

  /**
   * Resize a sheet to a different index by reference
   * @param viewTag - Native view tag of the sheet component
   * @param index - New detent index
   * @returns Promise that resolves when resize is complete
   */
  resizeByRef(viewTag: number, index: number): Promise<void>;

  /**
   * Dismiss all presented sheets
   * @param animated - Whether to animate the dismissals
   * @returns Promise that resolves when all sheets are dismissed
   */
  dismissAll(animated: boolean): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('TrueSheetModule');
