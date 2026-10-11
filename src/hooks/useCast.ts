import { useState, useEffect, useCallback } from 'react';
import { castService, type CastMediaOptions, type CastTargetType } from '../services/CastService';

export function useCast(videoElement?: HTMLVideoElement | null) {
  const [castState, setCastState] = useState(() => castService.getActiveDevice());
  const [capabilities, setCapabilities] = useState(() => castService.getCapabilities(videoElement));

  useEffect(() => {
    setCapabilities(castService.getCapabilities(videoElement));
    const unsubscribe = castService.subscribe(() => {
      setCastState(castService.getActiveDevice());
      setCapabilities(castService.getCapabilities(videoElement));
    });
    return unsubscribe;
  }, [videoElement]);

  const castViaGoogleCast = useCallback(
    async (options: CastMediaOptions) => {
      return castService.castViaGoogleCast(options);
    },
    []
  );

  const castViaRemotePlayback = useCallback(
    async (video: HTMLVideoElement) => {
      return castService.castViaRemotePlayback(video);
    },
    []
  );

  const castViaAirPlay = useCallback(
    (video: HTMLVideoElement) => {
      return castService.castViaAirPlay(video);
    },
    []
  );

  const stopCasting = useCallback(async () => {
    return castService.stopCasting(videoElement);
  }, [videoElement]);

  return {
    isCasting: castState.isCasting,
    activeDeviceName: castState.deviceName,
    castType: castState.type,
    capabilities,
    castViaGoogleCast,
    castViaRemotePlayback,
    castViaAirPlay,
    stopCasting,
    play: () => castService.play(),
    pause: () => castService.pause(),
    seek: (sec: number) => castService.seek(sec),
    setVolume: (vol: number) => castService.setVolume(vol)
  };
}
