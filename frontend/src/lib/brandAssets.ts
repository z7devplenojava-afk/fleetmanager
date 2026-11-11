import fluxbusLogoDark from '@/assets/fluxbus-logo.png';
import fluxbusLogoLight from '@/assets/fluxbus-logo-light.png';

export const FLUXBUS_LOGO_DARK = fluxbusLogoDark;
export const FLUXBUS_LOGO_LIGHT = fluxbusLogoLight;

export function getFluxbusLogoSrc(isDark: boolean): string {
  return isDark ? FLUXBUS_LOGO_DARK : FLUXBUS_LOGO_LIGHT;
}
