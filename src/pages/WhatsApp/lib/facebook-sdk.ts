// Extend Window interface to include FB properties
declare global {
    interface Window {
      FB: any;
      fbAsyncInit: () => void;
    }
  }
  
  interface LoadFacebookSdkParams {
    appId: string;
    version: string;
  }
  
  // Use a variable to ensure the SDK is only loaded once
  let facebookSdkPromise: Promise<void> | null = null;
  
  export const loadFacebookSdk = ({ appId, version }: LoadFacebookSdkParams): Promise<void> => {
    if (facebookSdkPromise) {
      return facebookSdkPromise;
    }
  
    facebookSdkPromise = new Promise((resolve, reject) => {
      // If the script is already on the page, resolve immediately
      if (document.getElementById('facebook-jssdk')) {
        if (window.FB) {
          resolve();
        } else {
          // This is an edge case where the script tag exists but FB isn't on window.
          // We can try to wait for fbAsyncInit to be called.
          const timeout = setTimeout(() => {
            if (!window.FB) {
              reject(new Error('Facebook SDK script was present but failed to initialize.'));
            }
          }, 3000);
          window.fbAsyncInit = () => {
            clearTimeout(timeout);
            window.FB.init({
              appId,
              version: `v${version}`,
              cookie: true,
              xfbml: true,
            });
            console.log('Facebook SDK initialized from existing script.');
            resolve();
          };
        }
        return;
      }
  
      // Define the global fbAsyncInit function which will be called once the SDK loads
      window.fbAsyncInit = () => {
        window.FB.init({
          appId,
          version: `v${version}`,
          cookie: true,
          xfbml: true,
        });
        console.log('Facebook SDK initialized.');
        resolve();
      };
  
      // Create and inject the script tag
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => {
        reject(new Error('Failed to load the Facebook SDK script.'));
        facebookSdkPromise = null; // Reset on failure to allow retries
      };
  
      document.head.appendChild(script);
    });
  
    return facebookSdkPromise;
  };