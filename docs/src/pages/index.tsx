import React, { useState } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import CodeBlock from '@theme/CodeBlock';
import SheetDemo from '@site/src/components/SheetDemo';
import styles from './index.module.css';

const INSTALL = 'npx expo install @lodev09/react-native-true-sheet';

const USAGE = `import { TrueSheet } from '@lodev09/react-native-true-sheet'

export const App = () => {
  const sheet = useRef<TrueSheet>(null)

  const present = async () => {
    await sheet.current?.present()
    console.log('presented')
  }

  const dismiss = async () => {
    await sheet.current?.dismiss()
    console.log('dismissed')
  }

  return (
    <View>
      <Button onPress={present} title="Present" />
      <TrueSheet ref={sheet} detents={['auto', 1]}>
        <Button onPress={dismiss} title="Dismiss" />
      </TrueSheet>
    </View>
  )
}`;

const PLATFORMS = [
  {
    name: 'iOS',
    backing: 'UISheetPresentationController',
    text: 'The same controller Apple Maps and Photos use. Detents, grabber, dimming, and Liquid Glass on iOS 26 come from the system.',
  },
  {
    name: 'Android',
    backing: 'BottomSheetBehavior',
    text: 'Material Components under a CoordinatorLayout. Edge to edge, back gestures, and nested scrolling behave like any other Android sheet.',
  },
  {
    name: 'Web',
    backing: 'DOM renderer',
    text: 'The same component and props, rendered in the browser with drag, snap, and keyboard support. One import across all three.',
  },
];

const FEATURES = [
  {
    title: 'Built on Fabric',
    text: 'Layout state and shadow nodes live in C++ shared by both platforms. Content resizes in the same frame as the sheet.',
    to: '/intro',
  },
  {
    title: 'Detents that fit',
    text: 'Size by fraction, fixed height, or auto. Auto measures your content, including scroll views and lists.',
    to: '/guides/resizing',
  },
  {
    title: 'Keyboard aware',
    text: 'The sheet and its scrollables move out of the way when the keyboard shows. No listeners to wire up.',
    to: '/guides/keyboard',
  },
  {
    title: 'Reanimated ready',
    text: 'Read the sheet position as a shared value and drive your own animations on the UI thread.',
    to: '/guides/reanimated',
  },
  {
    title: 'Sheets as screens',
    text: 'A sheet navigator for React Navigation and a Sheet layout for Expo Router. Push, pop, and pass params.',
    to: '/guides/navigation',
  },
  {
    title: 'Stack and overlay',
    text: 'Present sheets over sheets. Render toasts and dialogs above them with TrueSheetOverlay.',
    to: '/guides/stacking',
  },
  {
    title: 'Liquid Glass',
    text: 'Native background blur and Liquid Glass on iOS 26, featured on the Expo blog.',
    to: '/guides/liquid-glass',
  },
  {
    title: 'Accessible by default',
    text: 'Screen readers announce detents. Grabber labels, hints, and actions are yours to customize.',
    to: '/reference/types#accessibilityoptions',
  },
];

function InstallCommand() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(INSTALL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={styles.install}>
      <code>{INSTALL}</code>
      <button type="button" onClick={copy} className={styles.copy} aria-label="Copy install command">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function Home(): React.ReactElement {
  return (
    <Layout
      title="React Native True Sheet"
      description="The true native bottom sheet for React Native. UISheetPresentationController on iOS, BottomSheetBehavior on Android, and a matching renderer on web."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={clsx('container', styles.heroInner)}>
            <div className={styles.heroCopy}>
              <h1 className={styles.headline}>
                Bottom sheets that are actually native.
              </h1>
              <p className={styles.lede}>
                TrueSheet hands your content to the sheet the platform already ships. Real detents, real
                gestures, real accessibility. One component for iOS, Android, and web.
              </p>
              <InstallCommand />
              <div className={styles.actions}>
                <Link className={clsx(styles.button, styles.buttonPrimary)} to="/intro">
                  Read the docs
                </Link>
                <Link
                  className={clsx(styles.button, styles.buttonGhost)}
                  href="https://github.com/lodev09/react-native-true-sheet"
                >
                  View on GitHub
                </Link>
              </div>
            </div>
            <div className={styles.heroDemo}>
              <SheetDemo />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.title}>One component. Three native sheets.</h2>
            <div className={styles.platforms}>
              {PLATFORMS.map((p) => (
                <div key={p.name} className={styles.platform}>
                  <div className={styles.platformName}>{p.name}</div>
                  <div className={styles.platformBacking}>{p.backing}</div>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={clsx(styles.section, styles.sectionTint)}>
          <div className={clsx('container', styles.usage)}>
            <div className={styles.usageCopy}>
              <h2 className={styles.title}>Present. Await. Dismiss.</h2>
              <p>
                Attach a ref and call it. Every method returns a promise that resolves when the native
                animation finishes, so you can sequence work without guessing.
              </p>
              <p>
                Prefer events? Lifecycle, drag, focus, and detent events fire from the native side with the
                same timing your users feel.
              </p>
              <Link to="/reference/methods" className={styles.textLink}>
                Browse the methods and events
              </Link>
            </div>
            <div className={styles.usageCode}>
              <CodeBlock language="tsx">{USAGE}</CodeBlock>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.title}>Everything a sheet should do.</h2>
            <ul className={styles.features}>
              {FEATURES.map((f) => (
                <li key={f.title} className={styles.feature}>
                  <Link to={f.to} className={styles.featureTitle}>
                    {f.title}
                  </Link>
                  <p>{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={clsx(styles.section, styles.sectionBeta)}>
          <div className={clsx('container', styles.beta)}>
            <div>
              <h2 className={styles.title}>Version 4 is in beta.</h2>
              <p>
                A rewritten layout engine sizes content synchronously per detent and tracks the sheet while
                dragging. Auto detents now measure scroll views. Expo Router gets a first class Sheet layout.
              </p>
              <div className={styles.actions}>
                <Link className={clsx(styles.button, styles.buttonPrimary)} to="/next/intro">
                  Read the v4 docs
                </Link>
                <Link className={clsx(styles.button, styles.buttonGhost)} to="/next/migration">
                  Migration guide
                </Link>
              </div>
            </div>
            <div className={styles.betaCode}>
              <CodeBlock language="sh">{`${INSTALL}@beta`}</CodeBlock>
              <p className={styles.betaNote}>
                Teach your coding agent the library too:
              </p>
              <CodeBlock language="sh">npx skills add lodev09/react-native-true-sheet</CodeBlock>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
