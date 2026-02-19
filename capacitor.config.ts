import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d8e8851b93de422897c29d6fb1ca824e',
  appName: 'Adulting Handbook',
  webDir: 'dist',
  // Remove server URL to load app natively from built dist folder
  // server: {
  //   url: "https://d8e8851b-93de-4228-97c2-9d6fb1ca824e.lovableproject.com?forceHideBadge=true",
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#D97458",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#D97458",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    allowMixedContent: true,
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;