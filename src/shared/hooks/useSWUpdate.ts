import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function useSWUpdate() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration>();

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, reg) {
      setRegistration(reg);
    },
  });

  useEffect(() => {
    if (!registration) return;
    const id = setInterval(
      () => {
        void registration.update();
      },
      60 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, [registration]);

  const dismiss = () => setNeedRefresh(false);
  const update = () => updateServiceWorker(true);

  return { needRefresh, dismiss, update };
}
