import type { TurboModule } from 'react-native'
import { TurboModuleRegistry } from 'react-native'

/**
 * @deprecated This TurboModule is maintained for backwards compatibility.
 * New implementations should use Fabric Commands instead.
 * See TrueSheetViewNativeComponent.ts for the Commands API.
 */
export interface Spec extends TurboModule {
  present(viewTag: number, index: number): Promise<void>
  dismiss(viewTag: number): Promise<void>
}

/**
 * @deprecated Use Fabric Commands instead.
 * Import { Commands } from './TrueSheetViewNativeComponent'
 */
export default TurboModuleRegistry.get<Spec>('TrueSheetModule')
