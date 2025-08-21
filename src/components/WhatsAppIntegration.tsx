import { useEffect } from "react";
import { supabase } from "@/supabase/client";
import { Translate as T } from "react-dialect";

export default function WhatsAppIntegration({
  orgId,
  onSuccess,
  setLoading,
}: {
  orgId: string;
  onSuccess: () => void;
  setLoading: (loading: boolean) => void;
}) {
  useEffect(() => {
    (window as any).fbAsyncInit = function () {
      (window as any).FB.init({
        appId: "629323992623834",
        autoLogAppEvents: true,
        xfbml: true,
        version: process.env.NEXT_PUBLIC_FB_API_VERSION,
      });
    };

    // Copy-pasted from the Embedded Signup integration helper
    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as any;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");

    return () => {
      (window as any).fbAsyncInit = undefined;
    };
  }, []);

  // Facebook Login with JavaScript SDK
  function launchWhatsAppSignup() {
    // Launch Facebook login
    (window as any).FB.login(
      function (response: any) {
        if (response.authResponse) {
          // Exchange this code for a business integration system user access token
          const code = response.authResponse.code;

          if (!code) {
            console.log("User cancelled login or did not fully authorize.");
            return;
          }

          setLoading(true);

          supabase.functions
            .invoke("whatsapp-management", {
              body: { code, organization_id: orgId },
            })
            .then(onSuccess)
            .finally(() => setLoading(false));
        } else {
          console.log("User cancelled login or did not fully authorize.");
        }
      },
      {
        config_id: "791770266269455", // Configuration ID obtained in https://developers.facebook.com/apps/629323992623834/business-login/configurations/?business_id=153181867762503
        response_type: "code", // Must be set to 'code' for System User access token
        override_default_response_type: true,
        extras: {
          //featureType: "only_waba_sharing", // Bypass phone number selection
          setup: {
            // Prefilled data can go here
          },
        },
      },
    );
  }

  return (
    <div>
      <T
        as="button"
        style={{
          background: "#4267b2",
          borderRadius: "7.5px",
          color: "white",
          height: "40px",
          textAlign: "center",
          width: "250px",
        }}
        onClick={launchWhatsAppSignup}
      >
        Continuar con Facebook
      </T>
    </div>
  );
}
