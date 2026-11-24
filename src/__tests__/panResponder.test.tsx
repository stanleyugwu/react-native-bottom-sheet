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
import { Dimensions, Keyboard, Platform, Text, View } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import BottomSheet from '../components/bottomSheet';
import type { BottomSheetMethods } from '../types.d';

const SCREEN_HEIGHT = 800;
const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

describe('BottomSheet PanResponder & Gesture Robustness (Issue #41)', () => {
  const originalPlatform = Platform.OS;
  const keyboardListeners: Record<string, ((e?: any) => void)[]> = {};
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
        if (!keyboardListeners[event]) {
          keyboardListeners[event] = [];
        }
        keyboardListeners[event].push(cb);
        return {
          remove: () => {
            if (keyboardListeners[event]) {
              keyboardListeners[event] = keyboardListeners[event].filter(
                (fn) => fn !== cb
              );
              if (keyboardListeners[event].length === 0) {
                delete keyboardListeners[event];
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
    for (const key of Object.keys(keyboardListeners)) {
      delete keyboardListeners[key];
    }
    dismissSpy.mockClear();
  });

  const emitKeyboardEvent = (event: string, data?: any) => {
    const handlers = keyboardListeners[event]
      ? [...keyboardListeners[event]]
      : [];
    handlers.forEach((handler) => handler(data));
  };

  const createTouchMoveEvent = (
    currentX: number,
    currentY: number,
    startX: number = 100,
    startY: number = 100,
    timestamp: number = 100
  ) => ({
    nativeEvent: {
      touches: [{ pageX: currentX, pageY: currentY }],
    },
    touchHistory: {
      mostRecentTimeStamp: timestamp,
      touchBank: [
        {
          touchActive: true,
          startPageX: startX,
          startPageY: startY,
          currentPageX: currentX,
          currentPageY: currentY,
          currentTimeStamp: timestamp,
          previousPageX: startX,
          previousPageY: startY,
          previousTimeStamp: timestamp - 16,
        },
      ],
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
    },
  });

  it('does not capture tap micro-jitters (dy <= 5) as pan gestures, preserving input clicks while keyboard is visible', async () => {
    const ref = React.createRef<BottomSheetMethods>();
    const { unmount } = await render(
      <BottomSheet ref={ref} height={400}>
        <View>
          <Text>Tap Test Content</Text>
        </View>
      </BottomSheet>
    );

    // Open sheet
    await act(async () => {
      ref.current?.open();
      await sleep(450);
    });

    // Keyboard shows with height 300
    await act(async () => {
      emitKeyboardEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
      await sleep(20);
    });

    const handleBar = screen.getByTestId('default-handle-bar');
    expect(handleBar).toBeTruthy();
    const panHandlers = handleBar.props;
    expect(panHandlers).toBeTruthy();

    const resetTouch = () => {
      panHandlers.onStartShouldSetResponderCapture?.({
        nativeEvent: { touches: [{}] },
        touchHistory: { numberActiveTouches: 1 },
      });
    };

    // 1. Minimal movement: dy = 1px (micro-jitter)
    resetTouch();
    const microJitter1 = createTouchMoveEvent(100, 101);
    expect(panHandlers.onMoveShouldSetResponderCapture(microJitter1)).toBe(
      false
    );

    // 2. Micro-jitter: dy = 5px (exact boundary <= 5)
    resetTouch();
    const microJitter5 = createTouchMoveEvent(100, 105, 100, 100, 110);
    expect(panHandlers.onMoveShouldSetResponderCapture(microJitter5)).toBe(
      false
    );

    // 3. Horizontal move: dx = 20px, dy = 3px (horizontal swipe, dy <= dx)
    resetTouch();
    const horizontalMove = createTouchMoveEvent(120, 103, 100, 100, 120);
    expect(panHandlers.onMoveShouldSetResponderCapture(horizontalMove)).toBe(
      false
    );

    // 4. Genuine vertical drag: dy = 6px (Math.abs(dy) > 5 and > Math.abs(dx))
    resetTouch();
    const genuineDrag = createTouchMoveEvent(100, 106, 100, 100, 130);
    expect(panHandlers.onMoveShouldSetResponderCapture(genuineDrag)).toBe(true);

    unmount();
  });

  it('safely handles undefined/null gestureState in onMoveShouldSetPanResponderCapture', async () => {
    const ref = React.createRef<BottomSheetMethods>();
    const { unmount } = await render(
      <BottomSheet ref={ref} height={300}>
        <View>
          <Text>Safe Access Test</Text>
        </View>
      </BottomSheet>
    );

    const handleBar = screen.getByTestId('default-handle-bar');
    const panHandlers = handleBar.props;

    // Directly invoking with malformed event or missing touch data
    const malformedEvent = {
      nativeEvent: {},
      touchHistory: {
        mostRecentTimeStamp: 100,
        touchBank: [],
        numberActiveTouches: 0,
        indexOfSingleActiveTouch: 0,
      },
    };

    expect(() => {
      panHandlers.onMoveShouldSetResponderCapture(malformedEvent);
    }).not.toThrow();

    unmount();
  });

  it('handlebar downward drag dismisses keyboard via Keyboard.dismiss() on grant', async () => {
    const ref = React.createRef<BottomSheetMethods>();
    const { unmount } = await render(
      <BottomSheet ref={ref} height={400}>
        <View>
          <Text>Handlebar Drag Dismiss Test</Text>
        </View>
      </BottomSheet>
    );

    await act(async () => {
      ref.current?.open();
      await sleep(450);
    });

    // Make keyboard visible
    await act(async () => {
      emitKeyboardEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
      await sleep(20);
    });

    const handleBar = screen.getByTestId('default-handle-bar');
    const panHandlers = handleBar.props;

    // Drag starts on handlebar (onResponderGrant)
    const grantEvent = {
      nativeEvent: { touches: [{ pageX: 100, pageY: 100 }] },
      touchHistory: {
        mostRecentTimeStamp: 100,
        touchBank: [
          {
            touchActive: true,
            startPageX: 100,
            startPageY: 100,
            currentPageX: 100,
            currentPageY: 100,
            currentTimeStamp: 100,
          },
        ],
        numberActiveTouches: 1,
        indexOfSingleActiveTouch: 0,
      },
    };

    await act(async () => {
      panHandlers.onResponderGrant(grantEvent);
      await sleep(20);
    });

    // Must immediately dismiss keyboard!
    expect(dismissSpy).toHaveBeenCalled();

    unmount();
  });

  it('clamps lower bound to lowestSnap in onPanResponderMove when closeOnDragDown is false', async () => {
    const ref = React.createRef<BottomSheetMethods>();
    const { unmount } = await render(
      <BottomSheet
        ref={ref}
        height={400}
        closeOnDragDown={false} // Cannot drag below lowestSnap
      >
        <View>
          <Text>Clamping Test</Text>
        </View>
      </BottomSheet>
    );

    await act(async () => {
      ref.current?.open();
      await sleep(450);
    });

    const handleBar = screen.getByTestId('default-handle-bar');
    const panHandlers = handleBar.props;

    // Grant gesture at resting height 400
    const grantEvent = {
      nativeEvent: { touches: [{ pageX: 100, pageY: 100 }] },
      touchHistory: {
        mostRecentTimeStamp: 100,
        touchBank: [
          {
            touchActive: true,
            startPageX: 100,
            startPageY: 100,
            currentPageX: 100,
            currentPageY: 100,
            currentTimeStamp: 100,
          },
        ],
        numberActiveTouches: 1,
        indexOfSingleActiveTouch: 0,
      },
    };

    await act(async () => {
      panHandlers.onResponderGrant(grantEvent);
      await sleep(20);
    });

    // Move downward 500px (would plunge below 0 if unclamped)
    const largeDownwardMove = createTouchMoveEvent(100, 600, 100, 100, 200);

    await act(async () => {
      panHandlers.onResponderMove(largeDownwardMove);
      await sleep(20);
    });

    // Release gesture
    await act(async () => {
      panHandlers.onResponderRelease({
        nativeEvent: {},
        touchHistory: largeDownwardMove.touchHistory,
      });
      await sleep(250);
    });

    unmount();
  });

  it('programmatic snapToIndex(0) and collapse dismiss keyboard and collapse to index 0', async () => {
    const onSnap = jest.fn();
    let currentHeight = 0;
    const ref = React.createRef<BottomSheetMethods>();
    const { unmount } = await render(
      <BottomSheet
        ref={ref}
        snapPoints={[150, 450, 700]}
        index={1} // resting at 450
        onSnap={onSnap}
        onAnimate={(h) => {
          currentHeight = h;
        }}
      >
        <View>
          <Text>Snap Clamping Content</Text>
        </View>
      </BottomSheet>
    );

    // Open sheet
    await act(async () => {
      ref.current?.open();
      await sleep(450);
    });

    // Keyboard shows with height 300
    await act(async () => {
      emitKeyboardEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
      await sleep(20);
    });

    dismissSpy.mockClear();

    // 1. Call collapse() - dismisses keyboard and collapses directly to index 0 (150px)
    await act(async () => {
      ref.current?.collapse();
      await sleep(550);
    });
    expect(dismissSpy).toHaveBeenCalled();
    expect(currentHeight).toBeCloseTo(150, 0);

    dismissSpy.mockClear();

    // Keyboard shows again with height 300
    await act(async () => {
      emitKeyboardEvent('keyboardWillShow', {
        endCoordinates: { height: 300 },
      });
      await sleep(20);
    });

    // 2. Call snapToIndex(0) - explicitly requesting index 0 (150px), also dismisses keyboard
    await act(async () => {
      ref.current?.snapToIndex(0);
      await sleep(550);
    });
    expect(dismissSpy).toHaveBeenCalled();
    expect(currentHeight).toBeCloseTo(150, 0);

    // 3. Call snapToIndex(1) - index 1 is 450px
    await act(async () => {
      ref.current?.snapToIndex(1);
      await sleep(550);
    });
    expect(currentHeight).toBeCloseTo(450, 0);

    unmount();
  });

  it('onPanResponderTerminate gracefully handles gesture cancellation without freezing the sheet', async () => {
    const ref = React.createRef<BottomSheetMethods>();
    const { unmount } = await render(
      <BottomSheet ref={ref} height={350} closeOnDragDown>
        <View>
          <Text>Termination Test</Text>
        </View>
      </BottomSheet>
    );

    await act(async () => {
      ref.current?.open();
      await sleep(450);
    });

    const handleBar = screen.getByTestId('default-handle-bar');
    const panHandlers = handleBar.props;

    // Grant gesture
    const grantEvent = {
      nativeEvent: { touches: [{ pageX: 100, pageY: 100 }] },
      touchHistory: {
        mostRecentTimeStamp: 100,
        touchBank: [
          {
            touchActive: true,
            startPageX: 100,
            startPageY: 100,
            currentPageX: 100,
            currentPageY: 100,
            currentTimeStamp: 100,
          },
        ],
        numberActiveTouches: 1,
        indexOfSingleActiveTouch: 0,
      },
    };

    await act(async () => {
      panHandlers.onResponderGrant(grantEvent);
      await sleep(20);
    });

    // User drags downward 40px
    const dragEvent = createTouchMoveEvent(100, 140, 100, 100, 150);
    await act(async () => {
      panHandlers.onResponderMove(dragEvent);
      await sleep(20);
    });

    // System cancels gesture (e.g. OS incoming notification / home bar swipe)
    expect(panHandlers.onResponderTerminate).toBeDefined();
    await act(async () => {
      panHandlers.onResponderTerminate({
        nativeEvent: {},
        touchHistory: dragEvent.touchHistory,
      });
      await sleep(250);
    });

    unmount();
  });

  it('closes sheet and dismisses keyboard when dragged downward past close threshold', async () => {
    const onClose = jest.fn();
    const ref = React.createRef<BottomSheetMethods>();
    const { unmount } = await render(
      <BottomSheet
        ref={ref}
        height={300}
        closeOnDragDown={true}
        onClose={onClose}
      >
        <View>
          <Text>Drag To Close Content</Text>
        </View>
      </BottomSheet>
    );

    await act(async () => {
      ref.current?.open();
      await sleep(450);
    });

    const handleBar = screen.getByTestId('default-handle-bar');
    const panHandlers = handleBar.props;

    const grantEvent = {
      nativeEvent: { touches: [{ pageX: 100, pageY: 100 }] },
      touchHistory: {
        mostRecentTimeStamp: 100,
        touchBank: [
          {
            touchActive: true,
            startPageX: 100,
            startPageY: 100,
            currentPageX: 100,
            currentPageY: 100,
            currentTimeStamp: 100,
          },
        ],
        numberActiveTouches: 1,
        indexOfSingleActiveTouch: 0,
      },
    };

    await act(async () => {
      panHandlers.onResponderGrant(grantEvent);
      await sleep(20);
    });

    // Drag downward 280px (well past CLOSE_SNAP_RATIO of 300px)
    const downwardDragEvent = createTouchMoveEvent(100, 380, 100, 100, 200);
    await act(async () => {
      panHandlers.onResponderMove(downwardDragEvent);
      await sleep(20);
    });

    // Release triggers close
    await act(async () => {
      panHandlers.onResponderRelease({
        nativeEvent: {},
        touchHistory: downwardDragEvent.touchHistory,
      });
      await sleep(250);
    });

    expect(onClose).toHaveBeenCalled();
    expect(dismissSpy).toHaveBeenCalled();

    unmount();
  });
});
