'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export function PushSubscriptionManager() {
  const { toast } = useToast();
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('beforeinstallprompt event fired');
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (installPrompt) {
      toast({
        title: 'Install the App!',
        description: 'For a better experience, install our app on your device.',
        action: (
          <Button onClick={handleInstallClick}>Install</Button>
        ),
        duration: 10000,
      });
    }
  }, [installPrompt]);

  const handleInstallClick = () => {
    if (!installPrompt) {
      return;
    }
    (installPrompt as any).prompt();
    (installPrompt as any).userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(swReg => {
          console.log('Service Worker is registered', swReg);
          subscribeUser(swReg);
        })
        .catch(error => {
          console.error('Service Worker Error', error);
        });
    }
  }, []);

  async function subscribeUser(swReg: ServiceWorkerRegistration) {
    try {
      const subscription = await swReg.pushManager.getSubscription();
      if (subscription === null) {
        console.log('Not subscribed, attempting to subscribe...');
        const publicKeyResponse = await fetch('/api/notifications/vapid-public-key');
        const { publicKey } = await publicKeyResponse.json();

        const newSubscription = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        console.log('New subscription: ', newSubscription);
        await sendSubscriptionToServer(newSubscription);
      } else {
        console.log('User is already subscribed.');
      }
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
    }
  }

  async function sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });
      if (response.ok) {
        console.log('Successfully sent subscription to server.');
      } else {
        console.error('Failed to send subscription to server.', await response.json());
      }
    } catch (error) {
      console.error('Error sending subscription to server: ', error);
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return null; // This component does not render anything
}