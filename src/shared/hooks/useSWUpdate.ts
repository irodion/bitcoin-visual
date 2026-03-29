import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function useSWUpdate() {
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration;
    },
  });

  useEffect(() => {
    const reg = registrationRef.current;
    if (!reg) return;
    const id = setInterval(
      () => {
        void reg.update();
      },
      60 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  const dismiss = () => setNeedRefresh(false);
  const update = () => updateServiceWorker(true);

  return { needRefresh, dismiss, update };
}
