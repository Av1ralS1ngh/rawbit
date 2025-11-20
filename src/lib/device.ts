const MOBILE_USER_AGENT_REGEX =
  /Mobile|Android|iP(?:ad|hone|od)|Tablet|BlackBerry|IEMobile|Opera Mini/i;

export const DESKTOP_BREAKPOINT = 1280;

export type MobileBlockContext = {
  width: number;
  userAgent?: string;
  coarsePointer?: boolean;
  userAgentDataMobile?: boolean;
};

/**
 * Returns true when the current environment looks like a touch/mobile device
 * and the viewport width is below the desktop breakpoint.
 */
export function shouldBlockMobile(context: MobileBlockContext): boolean {
  const {
    width,
    userAgent = "",
    coarsePointer = false,
    userAgentDataMobile = false,
  } = context;

  if (!Number.isFinite(width) || width <= 0) {
    return false;
  }

  const uaLooksMobile = MOBILE_USER_AGENT_REGEX.test(userAgent);
  const isLikelyTouch = Boolean(
    coarsePointer || userAgentDataMobile || uaLooksMobile
  );

  return isLikelyTouch && width < DESKTOP_BREAKPOINT;
}
