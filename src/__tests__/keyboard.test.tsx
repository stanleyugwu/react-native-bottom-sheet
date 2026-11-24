import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import React from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import useHandleKeyboardEvents from '../hooks/useHandleKeyboardEvents';
import BottomSheet from '../components/bottomSheet';
import type { BottomSheetMethods } from '../types.d';

const SCREEN_HEIGHT = 800;
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

describe('useHandleKeyboardEvents & Smart Keyboard Handling (Issue #41)', () => {
  const originalPlatform = Platform.OS;
  const listeners: Record<string, ((e?: any) => void)[]> = {};
  let dismissSpy: any;

  beforeAll(() => {
    Platform.OS = 'ios';
    jest.spyOn(Dimensions, 'get').mockImplementation(() => {
      return {
        height: SCREEN_HEIGHT,
        width: 400,
        scale: 1,
        fontScale: 1,
      } as any;
    });

    jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((event: any, cb: any) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event].push(cb);
        return {
          remove: () => {
            if (listeners[event]) {
              listeners[event] = listeners[event].filter((fn) => fn !== cb);
              if (listeners[event].length === 0) {
                delete listeners[event];
              }
            }
          },
        } as any;
      });

    dismissSpy = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});
  });

  afterAll(() => {
    Platform.OS = originalPlatform;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    Platform.OS = 'ios';
    for (const key of Object.keys(listeners)) {
      delete listeners[key];
    }
    dismissSpy.mockClear();
  });

  const emitEvent = (event: string, data?: any) => {
    const handlers = listeners[event] ? [...listeners[event]] : [];
    handlers.forEach((handler) => handler(data));
  };

  it('smart keyboard handling keeps sheet above keyboard without flying to full screen, and pushes up just enough for bottom inputs (#41)', async () => {
    const animatedStart = jest.fn();
    const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
      start: animatedStart,
    }));
    const fakeWrapper = { current: {} as any };

    // Fake bottom input node located 320px from top of sheet
    const fakeBottomInput = {
      measureLayout: jest.fn(
        (
          _wrapper: any,
          cb: (x: number, y: number, w: number, h: number) => void
        ) => {
          // top = 280, height = 40 => bottom = 320px
          cb(0, 280, 100, 40);
        }
      ),
    };

    // Fake top input node located 120px from top of sheet
    const fakeTopInput = {
      measureLayout: jest.fn(
        (
          _wrapper: any,
          cb: (x: number, y: number, w: number, h: number) => void
        ) => {
          cb(0, 80, 100, 40);
        }
      ),
    };

    let hookResult: any;
    const KeyboardTestComponent = () => {
      hookResult = useHandleKeyboardEvents(
        true,
        550,
        true,
        heightAnimationDriver as any,
        fakeWrapper as any,
        400,
        200,
        SCREEN_HEIGHT
      );
      return <View testID="keyboard-test-root" />;
    };

    const { unmount } = await render(<KeyboardTestComponent />);

    await waitFor(() => {
      expect(listeners.keyboardWillShow?.length).toBeGreaterThan(0);
    });

    // 1. Initial focus on top input: keyboardWillShow with height 300
    await act(async () => {
      emitEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
      hookResult?.handleFocus?.({ target: fakeTopInput });
    });

    expect(heightAnimationDriver).toHaveBeenCalled();
    const firstTargetHeight =
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0];
    // Top input fits within 550px (needed: 120 + 300 + 20 = 440 <= 550).
    // Sheet must stay at resting height (550px), NEVER fly to 800px (100%)!
    expect(firstTargetHeight).toBe(550);

    heightAnimationDriver.mockClear();

    // 2. Switch focus to bottom input: pushes up "just enough"
    await act(async () => {
      hookResult?.handleFocus?.({ target: fakeBottomInput });
    });

    expect(heightAnimationDriver).toHaveBeenCalled();
    const secondTargetHeight =
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0];
    // Bottom input needed: 320 (bottom) + 300 (keyboard) + 20 (margin) = 640px.
    // Lifts up to 640px to keep Input in view, leaving 160px visible backdrop at top!
    expect(secondTargetHeight).toBe(640);

    heightAnimationDriver.mockClear();

    // 3. Switch focus back to top input: sheet lowers back to resting height
    await act(async () => {
      hookResult?.handleFocus?.({ target: fakeTopInput });
    });

    expect(heightAnimationDriver).toHaveBeenCalled();
    const thirdTargetHeight =
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0];
    expect(thirdTargetHeight).toBe(550);

    heightAnimationDriver.mockClear();

    // 4. Keyboard dismissed: keyboardWillHide (debounced with 100ms timer)
    await act(async () => {
      emitEvent('keyboardWillHide');
    });

    await waitFor(() => {
      expect(heightAnimationDriver).toHaveBeenCalledWith(550, 200);
    });

    await act(async () => {
      unmount();
    });
  });

  it('adapts sheet height when switching between keyboard types with differing heights (numeric without bar vs default with autocomplete bar)', async () => {
    const animatedStart = jest.fn();
    const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
      start: animatedStart,
    }));
    const fakeWrapper = { current: {} as any };

    // Input located at 250px inside sheet
    const fakeInput = {
      measureLayout: jest.fn(
        (
          _wrapper: any,
          cb: (x: number, y: number, w: number, h: number) => void
        ) => {
          cb(0, 210, 100, 40); // bottom = 250px
        }
      ),
    };

    let hookResult: any;
    const Component = () => {
      hookResult = useHandleKeyboardEvents(
        true,
        400,
        true,
        heightAnimationDriver as any,
        fakeWrapper as any,
        400,
        200,
        SCREEN_HEIGHT
      );
      return <View />;
    };

    const { unmount } = await render(<Component />);

    // Step 1: Numeric keyboard appears (height: 260px, no accessory bar)
    await act(async () => {
      emitEvent('keyboardWillShow', {
        endCoordinates: { height: 260 },
      });
      hookResult?.handleFocus?.({ target: fakeInput });
    });

    // Needed for input: 250 + 260 + 20 = 530px
    const numericTargetHeight =
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0];
    expect(numericTargetHeight).toBe(530);

    heightAnimationDriver.mockClear();

    // Step 2: Switch to default text keyboard with autocomplete bar (height: 336px)
    // iOS fires keyboardWillChangeFrame when keyboard size changes between types
    await act(async () => {
      emitEvent('keyboardWillChangeFrame', {
        endCoordinates: { height: 336 },
      });
    });

    // Needed for input with new keyboard height: 250 + 336 + 20 = 606px
    const defaultTargetHeight =
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0];
    expect(defaultTargetHeight).toBe(606);

    // Verify backdrop is still visible (606px < 800px screen)
    expect(defaultTargetHeight).toBeLessThan(SCREEN_HEIGHT);

    await act(async () => {
      unmount();
    });
  });

  it('guarantees sheet height is strictly >= keyboardHeight + 50 when keyboard appears on short sheets', async () => {
    const animatedStart = jest.fn();
    const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
      start: animatedStart,
    }));
    const fakeWrapper = { current: {} as any };

    let hookResult: any;
    const ShortSheetComponent = () => {
      hookResult = useHandleKeyboardEvents(
        true,
        150, // Short sheet initial resting height (150px)
        true,
        heightAnimationDriver as any,
        fakeWrapper as any,
        400,
        200,
        SCREEN_HEIGHT
      );
      return <View />;
    };

    const { unmount } = await render(<ShortSheetComponent />);

    // Keyboard of 300px appears
    await act(async () => {
      emitEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
    });

    expect(heightAnimationDriver).toHaveBeenCalled();
    const targetHeight =
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0];

    // Must be at least 300 + 50 = 350px
    expect(targetHeight).toBeGreaterThanOrEqual(350);
    expect(targetHeight).toBe(350);
    expect(hookResult.getKeyboardHeight()).toBe(300);
    expect(hookResult.isKeyboardVisible()).toBe(true);

    await act(async () => {
      unmount();
    });
  });

  it('handles Android platform keyboardDidShow/keyboardDidHide sequences and preserves overlayed state across re-fires', async () => {
    Platform.OS = 'android';

    try {
      const animatedStart = jest.fn();
      const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
        start: animatedStart,
      }));

      // Wrapper with measure function returning pageY
      const fakeWrapper = {
        current: {
          measure: jest.fn(
            (
              cb: (
                x: number,
                y: number,
                w: number,
                h: number,
                px: number,
                py: number
              ) => void
            ) => {
              // pageY = 500 => actualSheetHeight = 800 - 500 = 300
              // actualSheetHeight - sheetHeight (300) = 0 < 50 => isSheetOverlayed = true
              cb(0, 0, 400, 300, 0, 500);
            }
          ),
        },
      };

      const AndroidComponent = () => {
        useHandleKeyboardEvents(
          true,
          300,
          true,
          heightAnimationDriver as any,
          fakeWrapper as any,
          400,
          200,
          SCREEN_HEIGHT
        );
        return <View />;
      };

      const { unmount } = await render(<AndroidComponent />);

      await waitFor(() => {
        expect(listeners.keyboardDidShow?.length).toBeGreaterThan(0);
      });

      // 1. Android fires keyboardDidShow with height 280
      await act(async () => {
        emitEvent('keyboardDidShow', {
          endCoordinates: { height: 280 },
        });
      });

      // Min height = 280 + 50 = 330
      expect(heightAnimationDriver).toHaveBeenCalled();
      const androidTarget =
        heightAnimationDriver.mock.calls[
          heightAnimationDriver.mock.calls.length - 1
        ]![0];
      expect(androidTarget).toBe(330);

      heightAnimationDriver.mockClear();

      // 2. Android re-fire preservation: second keyboardDidShow should preserve overlayed state
      // and NOT collapse the sheet even though wrapper.measure now reports higher elevation
      fakeWrapper.current.measure.mockImplementation(
        (
          cb: (
            x: number,
            y: number,
            w: number,
            h: number,
            px: number,
            py: number
          ) => void
        ) => {
          // Now pageY is 470 (elevated)
          cb(0, 0, 400, 330, 0, 470);
        }
      );

      await act(async () => {
        emitEvent('keyboardDidShow', {
          endCoordinates: { height: 280 },
        });
      });

      const preservedTarget =
        heightAnimationDriver.mock.calls[
          heightAnimationDriver.mock.calls.length - 1
        ]![0];
      expect(preservedTarget).toBe(330);

      unmount();
    } finally {
      Platform.OS = 'ios';
    }
  });

  it('handles Android platform keyboardDidShow fallback when wrapper measure is undefined', async () => {
    Platform.OS = 'android';

    try {
      const animatedStart = jest.fn();
      const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
        start: animatedStart,
      }));

      const fallbackWrapper = { current: {} as any }; // no measure function

      const FallbackComponent = () => {
        useHandleKeyboardEvents(
          true,
          250,
          true,
          heightAnimationDriver as any,
          fallbackWrapper as any,
          400,
          200,
          SCREEN_HEIGHT
        );
        return <View />;
      };

      const { unmount } = await render(<FallbackComponent />);

      await act(async () => {
        emitEvent('keyboardDidShow', {
          endCoordinates: { height: 250 },
        });
      });

      // Even without measure, fallback sets overlayed and expands to keyboardHeight + 50 = 300
      const fallbackTarget =
        heightAnimationDriver.mock.calls[
          heightAnimationDriver.mock.calls.length - 1
        ]![0];
      expect(fallbackTarget).toBe(300);

      unmount();
    } finally {
      Platform.OS = 'ios';
    }
  });

  it('executes 3-tier layout measurement fallback cascade (measureLayout -> measureInWindow -> estimated pageY)', async () => {
    const animatedStart = jest.fn();
    const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
      start: animatedStart,
    }));

    // Tier 1: Direct measureLayout succeeds
    const tier1Input = {
      measureLayout: jest.fn(
        (
          _wrapper: any,
          cb: (x: number, y: number, w: number, h: number) => void
        ) => {
          cb(0, 150, 100, 50); // bottom = 200px
        }
      ),
    };

    // Tier 2: measureLayout throws, falls back to measureInWindow on input and wrapper
    const tier2Input = {
      measureLayout: jest.fn(() => {
        throw new Error('measureLayout not supported');
      }),
      measureInWindow: jest.fn(
        (cb: (x: number, y: number, w: number, h: number) => void) => {
          cb(0, 500, 100, 50); // input window Y = 500 + 50 = 550
        }
      ),
    };

    // Tier 3: measureLayout throws, measureInWindow on input works, but wrapper has no measureInWindow or measure
    const tier3Input = {
      measureLayout: jest.fn(() => {
        throw new Error('measureLayout failed');
      }),
      measureInWindow: jest.fn(
        (cb: (x: number, y: number, w: number, h: number) => void) => {
          cb(0, 550, 100, 50); // input window bottom = 600
        }
      ),
    };

    const wrapperWithMeasureInWindow = {
      current: {
        measureInWindow: jest.fn(
          (cb: (x: number, y: number, w: number, h: number) => void) => {
            cb(0, 350, 400, 450); // wrapper window Y = 350 => diff = 550 - 350 = 200px
          }
        ),
      },
    };

    const wrapperEmpty = {
      current: {}, // No measureInWindow, no measure => triggers Tier 3 estimated pageY
    };

    let hookResult1: any;
    let hookResult2: any;
    let hookResult3: any;

    const TierComponent1 = () => {
      hookResult1 = useHandleKeyboardEvents(
        true,
        450,
        true,
        heightAnimationDriver as any,
        wrapperWithMeasureInWindow as any,
        400,
        200,
        SCREEN_HEIGHT
      );
      return <View />;
    };

    const TierComponent2 = () => {
      hookResult2 = useHandleKeyboardEvents(
        true,
        450,
        true,
        heightAnimationDriver as any,
        wrapperWithMeasureInWindow as any,
        400,
        200,
        SCREEN_HEIGHT
      );
      return <View />;
    };

    const TierComponent3 = () => {
      hookResult3 = useHandleKeyboardEvents(
        true,
        450,
        true,
        heightAnimationDriver as any,
        wrapperEmpty as any,
        400,
        200,
        SCREEN_HEIGHT
      );
      return <View />;
    };

    const { unmount: u1 } = await render(<TierComponent1 />);

    // Keyboard shows with height 300
    await act(async () => {
      emitEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
    });

    // Test Tier 1:
    heightAnimationDriver.mockClear();
    await act(async () => {
      hookResult1?.handleFocus?.({ target: tier1Input });
    });
    // bottom = 200 + keyboard 300 + margin 20 = 520
    expect(
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0]
    ).toBe(520);
    await act(async () => {
      u1();
    });

    // Test Tier 2:
    const { unmount: u2 } = await render(<TierComponent2 />);
    await act(async () => {
      emitEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
    });
    heightAnimationDriver.mockClear();
    await act(async () => {
      hookResult2?.handleFocus?.({ target: tier2Input });
    });
    // input window 550 - wrapper window 350 = 200 + keyboard 300 + margin 20 = 520
    expect(
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0]
    ).toBe(520);
    await act(async () => {
      u2();
    });

    // Test Tier 3 (Estimated pageY = containerHeight 800 - lastTarget 450 = 350):
    // input window bottom 600 - estimated sheetPageY 350 = 250 + keyboard 300 + margin 20 = 570
    const { unmount: u3 } = await render(<TierComponent3 />);
    await act(async () => {
      emitEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
    });
    heightAnimationDriver.mockClear();
    await act(async () => {
      hookResult3?.handleFocus?.({ target: tier3Input });
    });
    expect(
      heightAnimationDriver.mock.calls[
        heightAnimationDriver.mock.calls.length - 1
      ]![0]
    ).toBe(570);

    await act(async () => {
      u3();
    });
  });

  it('runs cleanly in New Architecture (Fabric) and Bridgeless modes', async () => {
    // Enable Fabric and Bridgeless globals
    const origFabric = (globalThis as any).nativeFabricUIManager;
    const origBridgeless = (globalThis as any).RN$Bridgeless;

    (globalThis as any).nativeFabricUIManager = {};
    (globalThis as any).RN$Bridgeless = true;

    try {
      const animatedStart = jest.fn();
      const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
        start: animatedStart,
      }));
      const fakeWrapper = { current: {} as any };

      // Fabric HostComponent input ref with native measureLayout
      const fabricInput = {
        _internalInstanceHandle: { tag: 123 },
        measureLayout: jest.fn(
          (
            _wrapper: any,
            cb: (x: number, y: number, w: number, h: number) => void
          ) => {
            cb(0, 180, 100, 40); // bottom = 220px
          }
        ),
      };

      let hookResult: any;
      const FabricTestComponent = () => {
        hookResult = useHandleKeyboardEvents(
          true,
          400,
          true,
          heightAnimationDriver as any,
          fakeWrapper as any,
          400,
          200,
          SCREEN_HEIGHT
        );
        return <View />;
      };

      const { unmount } = await render(<FabricTestComponent />);

      await act(async () => {
        emitEvent('keyboardWillShow', {
          endCoordinates: { height: 250 },
        });
        hookResult?.handleFocus?.({ target: fabricInput });
      });

      // Needed: 220 + 250 + 20 = 490px
      const targetHeight =
        heightAnimationDriver.mock.calls[
          heightAnimationDriver.mock.calls.length - 1
        ]![0];
      expect(targetHeight).toBe(490);
      expect(hookResult.isKeyboardVisible()).toBe(true);

      await act(async () => {
        unmount();
      });
    } finally {
      (globalThis as any).nativeFabricUIManager = origFabric;
      (globalThis as any).RN$Bridgeless = origBridgeless;
    }
  });

  it('re-subscribes keyboard listeners when sheet is closed and reopened so smart keyboard handling works across multiple open/close cycles', async () => {
    const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
      start: jest.fn(),
    }));
    const fakeWrapper = { current: {} as any };

    const ToggleSheet = () => {
      const [isOpen, setIsOpen] = React.useState(false);
      useHandleKeyboardEvents(
        true,
        200,
        isOpen,
        heightAnimationDriver as any,
        fakeWrapper as any,
        400,
        200,
        SCREEN_HEIGHT
      );
      return (
        <Pressable testID="toggle" onPress={() => setIsOpen((prev) => !prev)}>
          <Text>{isOpen ? 'OPEN' : 'CLOSED'}</Text>
        </Pressable>
      );
    };

    const { getByTestId, unmount } = await render(<ToggleSheet />);

    // When sheet is closed, keyboard listeners should not be active
    expect(listeners.keyboardWillShow).toBeUndefined();

    // 1. Open sheet (isOpen transitions false -> true)
    await act(async () => {
      fireEvent.press(getByTestId('toggle'));
    });
    await waitFor(() => {
      expect(listeners.keyboardWillShow?.length).toBeGreaterThan(0);
    });

    // 2. Close sheet (isOpen transitions true -> false)
    await act(async () => {
      fireEvent.press(getByTestId('toggle'));
    });
    await waitFor(() => {
      expect(listeners.keyboardWillShow).toBeUndefined();
    });

    // 3. Open sheet again (isOpen transitions false -> true)
    await act(async () => {
      fireEvent.press(getByTestId('toggle'));
    });
    await waitFor(() => {
      expect(listeners.keyboardWillShow?.length).toBeGreaterThan(0);
    });

    await act(async () => {
      unmount();
    });
    await waitFor(() => {
      expect(listeners.keyboardWillShow).toBeUndefined();
    });
  });

  it('verifies BottomSheet component-level lifecycle teardown and re-subscription across programmatic and backdrop close', async () => {
    const ref = React.createRef<BottomSheetMethods>();

    const { unmount } = await render(
      <BottomSheet ref={ref} height={300}>
        <View>
          <Text>Lifecycle Content</Text>
        </View>
      </BottomSheet>
    );

    // Initial state: sheet closed, no keyboard listeners
    expect(listeners.keyboardWillShow).toBeUndefined();

    // Cycle 1: Open sheet programmatically
    await act(async () => {
      ref.current?.open();
      await sleep(20);
    });

    await waitFor(() => {
      expect(listeners.keyboardWillShow?.length).toBeGreaterThan(0);
    });

    // Close sheet programmatically
    await act(async () => {
      ref.current?.close();
      await sleep(20);
    });

    // Listeners must be torn down and Keyboard.dismiss called
    await waitFor(() => {
      expect(listeners.keyboardWillShow).toBeUndefined();
    });
    expect(dismissSpy).toHaveBeenCalled();

    dismissSpy.mockClear();

    // Cycle 2: Re-open sheet
    await act(async () => {
      ref.current?.open();
      await sleep(20);
    });

    // Re-subscribed cleanly!
    await waitFor(() => {
      expect(listeners.keyboardWillShow?.length).toBeGreaterThan(0);
    });

    // Keyboard shows while open
    await act(async () => {
      emitEvent('keyboardWillShow', {
        endCoordinates: { height: 280 },
      });
    });

    // Close sheet again
    await act(async () => {
      ref.current?.close();
      await sleep(20);
    });

    await waitFor(() => {
      expect(listeners.keyboardWillShow).toBeUndefined();
    });
    expect(dismissSpy).toHaveBeenCalled();

    await act(async () => {
      unmount();
    });
  });

  it('verifies hook return helper methods notifyDragStart and notifyDragEnd', async () => {
    const heightAnimationDriver = jest.fn((_h: number, _d: number) => ({
      start: jest.fn(),
    }));
    const fakeWrapper = { current: {} as any };

    let hookResult: any;
    const HelperComponent = () => {
      hookResult = useHandleKeyboardEvents(
        true,
        300,
        true,
        heightAnimationDriver as any,
        fakeWrapper as any,
        400,
        200,
        SCREEN_HEIGHT
      );
      return <View />;
    };

    const { unmount } = await render(<HelperComponent />);

    expect(typeof hookResult.notifyDragStart).toBe('function');
    expect(typeof hookResult.notifyDragEnd).toBe('function');
    expect(typeof hookResult.isKeyboardVisible).toBe('function');
    expect(typeof hookResult.getKeyboardHeight).toBe('function');
    expect(typeof hookResult.getTargetHeight).toBe('function');

    expect(hookResult.isKeyboardVisible()).toBe(false);
    expect(hookResult.getKeyboardHeight()).toBe(0);

    hookResult.notifyDragStart();
    hookResult.notifyDragEnd();

    await act(async () => {
      unmount();
    });
  });
});
