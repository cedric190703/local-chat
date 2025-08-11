/**
 * @file This file contains the mobile detection hooks for the local chat application.
 * It provides hooks for detecting whether the user is on a mobile device.
 */

"use client"

import { useState, useEffect } from 'react';

/**
 * A hook for detecting whether the user is on a mobile device.
 * @param query The media query to use for detecting a mobile device.
 * @returns Whether the user is on a mobile device.
 */
export const useMediaQuery = (query: string = '(max-width: 768px)') => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleResize = () => setIsMobile(mediaQuery.matches);

    handleResize();
    mediaQuery.addEventListener('change', handleResize);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [query]);

  return isMobile;
};

/**
 * A hook for detecting whether the user is on a mobile device.
 * @returns Whether the user is on a mobile device.
 */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };

    checkDevice();
  }, []);

  return isMobile;
};

export default useIsMobile;
