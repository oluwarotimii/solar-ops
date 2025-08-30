import webpush from 'web-push';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:oluwarotimiadewumi@gmail.com', // Replace with your email
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys are not set. Push notifications will not work.');
}

export async function sendPushNotification(subscription: any, payload: any) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.error('Cannot send push notification because VAPID keys are not set.');
    return;
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent successfully.');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
