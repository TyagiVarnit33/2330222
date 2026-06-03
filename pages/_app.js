import '../styles/globals.css';
import { CssBaseline } from '@mui/material';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <CssBaseline />
      <Component {...pageProps} />
    </>
  );
}
