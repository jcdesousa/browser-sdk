import {
    instrument,
    secure,
    getNearestHostFiber,
    traverseRenderedFibers,
    getTimings,
    getDisplayName,
    getType,
  } from 'bippy'; 
  import type { FiberRoot } from 'react-reconciler';
  import { addDurationVital } from './addDurationVital'

  // eslint-disable-next-line camelcase
  export const UNSTABLE_ReactFiberTracker = (() => {
    /**
     * Highlights a React Fiber node by dispatching a custom event with the component's name and its corresponding DOM node.
     */
    const highlightFiber = (fiber: FiberRoot, phase: string): void => {
      const hostFiber = getNearestHostFiber(fiber);

      if (!(hostFiber?.stateNode instanceof HTMLElement)) {return;}

      const name = getDisplayName(fiber)
      const myEvent = new CustomEvent('component-render', {
        detail: {
          name,
          phase,
          node: hostFiber.stateNode
        }
      });

      document.dispatchEvent(myEvent);
    };
  
    instrument(
      secure({
        onCommitFiberRoot: (rendererID: number, root: FiberRoot) => {
          traverseRenderedFibers(root.current, (fiber: FiberRoot, phase: string) => {
            const type = getType(fiber.type);
            if (!type) {return;}
  
            const { selfTime, totalTime } = getTimings(fiber);
            const componentName = getDisplayName(fiber) || 'Unknown';

            try {
                  if (selfTime !== undefined) {
                    addDurationVital(componentName, {
                      duration: selfTime,
                      startTime: Date.now(),
                      context: {
                        description: componentName,
                        phase,
                        framework: 'react',
                        totalTime
                      }
                    })
                  }
            } catch (e) {
              console.error('Failed to add duration vital', e);
            }
  
            highlightFiber(fiber, phase);
          });
        },
      }, {dangerouslyRunInProduction: true})
    );
  });

// TODO: find a better way to init, needs to happen before any react import.
UNSTABLE_ReactFiberTracker();