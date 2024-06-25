import "../styles/globals.css";
import type { AppProps } from "next/app";
import { sfPro, inter } from "./fonts/index";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${sfPro.variable} ${inter.variable} font-sans`}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
