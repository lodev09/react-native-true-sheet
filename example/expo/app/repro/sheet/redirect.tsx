import { Redirect } from 'expo-router';

// Leaves on its first render, so the route closes before its sheet presents. It should
// be removed without showing a sheet, and the next back should leave the navigator.
export default function ReproSheetRedirect() {
  return <Redirect href="/repro/sheet" />;
}
