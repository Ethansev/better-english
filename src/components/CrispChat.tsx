import Script from "next/script";

export default function CrispChat() {
  return (
    <Script id="crisp-chat" strategy="afterInteractive">
      {`
        window.$crisp = [];
        window.CRISP_WEBSITE_ID = "4142dc08-dd61-4c23-8ad3-c05f30b468cf";
        (function() {
          var d = document;
          var s = d.createElement("script");
          s.src = "https://client.crisp.chat/l.js";
          s.async = 1;
          d.getElementsByTagName("head")[0].appendChild(s);
        })();
      `}
    </Script>
  );
}
