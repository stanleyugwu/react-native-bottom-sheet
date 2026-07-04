import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import { Dimensions, View, Text } from 'react-native';
import { render, screen, act } from '@testing-library/react-native';
import resolveSnapPoints from '../utils/resolveSnapPoints';
import { DEFAULT_HANDLE_BAR_DEFAULT_HEIGHT } from '../components/defaultHandleBar';
import BottomSheet from '../components/bottomSheet';
import type { BottomSheetMethods } from '../types.d';

// `convertHeight` (used by `resolveSnapPoints`) reads the device screen height to decide
// when to deduct the drag handle from the top-most point, so pin it to a known value.
const SCREEN_HEIGHT = 800;

beforeAll(() => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    height: SCREEN_HEIGHT,
    width: 400,
    scale: 1,
    fontScale: 1,
  } as ReturnType<typeof Dimensions.get>);
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('resolveSnapPoints', () => {
  it('resolves a mix of percentages and pixels into ascending pixel heights', () => {
    // container height differs from screen height -> no handle-bar deduction
    expect(resolveSnapPoints(['50%', 200, '25%'], 1000, true)).toEqual([
      200, 250, 500,
    ]);
  });

  it('de-duplicates points that resolve to the same height', () => {
    // 200px and '20%' of 1000 both resolve to 200
    expect(resolveSnapPoints([200, '20%', 200], 1000, true)).toEqual([200]);
  });

  it('clamps points that exceed the container height', () => {
    expect(resolveSnapPoints([2000, '90%'], 1000, true)).toEqual([900, 1000]);
  });

  it('deducts the drag handle from the top point when container is the full screen', () => {
    expect(resolveSnapPoints(['100%'], SCREEN_HEIGHT, false)).toEqual([
      SCREEN_HEIGHT - DEFAULT_HANDLE_BAR_DEFAULT_HEIGHT,
    ]);
  });

  it('does not deduct the drag handle when it is hidden', () => {
    expect(resolveSnapPoints(['100%'], SCREEN_HEIGHT, true)).toEqual([
      SCREEN_HEIGHT,
    ]);
  });

  it('skips invalid entries instead of throwing', () => {
    expect(resolveSnapPoints(['abc', '50%', 'xx%xx'], 1000, true)).toEqual([
      500,
    ]);
  });

  it('drops non-positive points (closed/negative heights)', () => {
    expect(resolveSnapPoints([0, -5, '0%', 300], 1000, true)).toEqual([300]);
  });

  it('returns an empty array for empty or non-array input', () => {
    expect(resolveSnapPoints([], 1000, true)).toEqual([]);
    // @ts-expect-error testing defensive non-array guard
    expect(resolveSnapPoints(undefined, 1000, true)).toEqual([]);
  });
});

describe('BottomSheet Component', () => {
  it('renders correctly and handles basic open/close lifecycle and callbacks', async () => {
    const onOpen = jest.fn();
    const onClose = jest.fn();
    const onSnap = jest.fn();
    const ref = React.createRef<BottomSheetMethods>();

    await render(
      <BottomSheet
        ref={ref}
        height={300}
        onOpen={onOpen}
        onClose={onClose}
        onSnap={onSnap}
      >
        <View>
          <Text>Content inside BottomSheet</Text>
        </View>
      </BottomSheet>
    );

    // Verify it renders the content
    expect(screen.queryByText('Content inside BottomSheet')).toBeTruthy();

    // Initially closed, so callbacks shouldn't have been called
    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(onSnap).not.toHaveBeenCalled();

    // Open sheet
    await act(async () => {
      ref.current?.open();
    });

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onSnap).toHaveBeenCalledWith(0);

    // Call open again while open (should be guarded and not re-fire onOpen)
    await act(async () => {
      ref.current?.open();
    });
    expect(onOpen).toHaveBeenCalledTimes(1); // Still 1

    // Close sheet
    await act(async () => {
      ref.current?.close();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSnap).toHaveBeenCalledWith(-1);

    // Call close again when already closed (should be guarded and do nothing)
    await act(async () => {
      ref.current?.close();
    });
    expect(onClose).toHaveBeenCalledTimes(1); // Still 1
  });

  it('handles programmatic snapToIndex, expand, collapse, and index clamping', async () => {
    const onSnap = jest.fn();
    const ref = React.createRef<BottomSheetMethods>();

    await render(
      <BottomSheet
        ref={ref}
        snapPoints={['30%', '60%', '90%']}
        index={0}
        onSnap={onSnap}
      >
        <View>
          <Text>Content</Text>
        </View>
      </BottomSheet>
    );

    // Opening the sheet programmatically (without arguments, defaults to index prop = 0)
    await act(async () => {
      ref.current?.open();
    });
    expect(onSnap).toHaveBeenLastCalledWith(0);

    // snapToIndex(1)
    await act(async () => {
      ref.current?.snapToIndex(1);
    });
    expect(onSnap).toHaveBeenLastCalledWith(1);

    // expand() goes to last snap point (index 2)
    await act(async () => {
      ref.current?.expand();
    });
    expect(onSnap).toHaveBeenLastCalledWith(2);

    // collapse() goes to first snap point (index 0)
    await act(async () => {
      ref.current?.collapse();
    });
    expect(onSnap).toHaveBeenLastCalledWith(0);

    // snapToIndex with out of bounds clamps to index 2
    await act(async () => {
      ref.current?.snapToIndex(5);
    });
    expect(onSnap).toHaveBeenLastCalledWith(2);

    // snapToIndex(-1) closes sheet
    await act(async () => {
      ref.current?.snapToIndex(-1);
    });
    expect(onSnap).toHaveBeenLastCalledWith(-1);
  });

  it('synchronizes activeSnapIndex and triggers callbacks on dynamic snapPoints changes', async () => {
    const onSnap = jest.fn();
    const ref = React.createRef<BottomSheetMethods>();

    const { rerender } = await render(
      <BottomSheet
        ref={ref}
        snapPoints={['30%', '60%', '90%']}
        index={2}
        onSnap={onSnap}
      >
        <View>
          <Text>Content</Text>
        </View>
      </BottomSheet>
    );

    // Open sheet (should land on index 2)
    await act(async () => {
      ref.current?.open();
    });
    expect(onSnap).toHaveBeenLastCalledWith(2);

    // Dynamically change snapPoints to only have 2 points (index 2 becomes out of bounds)
    onSnap.mockClear();
    await act(async () => {
      await rerender(
        <BottomSheet
          ref={ref}
          snapPoints={['30%', '60%']}
          index={2}
          onSnap={onSnap}
        >
          <View>
            <Text>Content</Text>
          </View>
        </BottomSheet>
      );
    });

    // Verify it clamped to index 1 and called onSnap
    expect(onSnap).toHaveBeenCalledWith(1);
  });

  it('handles zero height/lowestSnap gracefully without division by zero errors', async () => {
    const ref = React.createRef<BottomSheetMethods>();
    await render(
      <BottomSheet ref={ref} height={0} closeOnDragDown>
        <View>
          <Text>Zero Height Content</Text>
        </View>
      </BottomSheet>
    );

    // Open it, shouldn't crash
    await act(async () => {
      ref.current?.open();
    });
    // Close it, shouldn't crash
    await act(async () => {
      ref.current?.close();
    });
  });

  it('gracefully fades out and back in during snapToIndex when using fade animation', async () => {
    const onSnap = jest.fn();
    const ref = React.createRef<BottomSheetMethods>();

    await render(
      <BottomSheet
        ref={ref}
        snapPoints={['30%', '60%', '90%']}
        animationType="fade"
        index={0}
        onSnap={onSnap}
      >
        <View>
          <Text>Content</Text>
        </View>
      </BottomSheet>
    );

    // Open sheet
    await act(async () => {
      ref.current?.open();
    });
    expect(onSnap).toHaveBeenLastCalledWith(0);

    // Snap to 1, should fire onSnap
    await act(async () => {
      ref.current?.snapToIndex(1);
    });
    expect(onSnap).toHaveBeenLastCalledWith(1);
  });
});
