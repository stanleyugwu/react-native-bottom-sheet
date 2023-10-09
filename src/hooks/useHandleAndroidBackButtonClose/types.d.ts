export type HookReturn = void;

/**
 * Function type
 */
export type UseHandleAndroidBackButtonClose = (
  /** Whether to close sheet when back button is pressed*/
  shouldClose: boolean,
  /** Function to call to close the sheet */
  closeSheet: () => void
) => HookReturn;
