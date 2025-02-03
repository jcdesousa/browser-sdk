import type { RumConfiguration } from '@datadog/browser-rum-core'
import type { BrowserIncrementalSnapshotRecord, ComponentRenderData } from '../../../types';
import { assembleIncrementalSnapshot } from '../assembly'
import { getSerializedNodeId, } from '../serialization'
import { IncrementalSource } from '../../../types'
import type { Tracker } from './tracker.types'

export type ComponentRenderRecordCallback = (data: BrowserIncrementalSnapshotRecord) => void

export function trackComponentRender(configuration: RumConfiguration, componentRenderCb: ComponentRenderRecordCallback): Tracker {
    const handler = (event: any) => {
        const { node } = event.detail;
        
        const id = getSerializedNodeId(node);
        const interaction = { id, type: 1 }

        // TODO: We are losing the first render/mount, id not found probably because the mutation observer hasn't ran yet.
        if (!id) {
            return;
        }

        const record = {
        ...assembleIncrementalSnapshot<ComponentRenderData>(IncrementalSource.ComponentRender, interaction),
        }

        console.log(record);
        componentRenderCb(record)
    };
    // TODO: Improve event listener. 
    document.addEventListener('component-render', handler);

    return {
        stop: () => document.removeEventListener('component-render', handler)
    }
}
