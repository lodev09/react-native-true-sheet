import clsx from 'clsx';
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc';
import {
  Accessibility,
  Activity,
  ArrowUpRight,
  Cpu,
  Droplets,
  Keyboard,
  Layers,
  MoveVertical,
  Route,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import SheetDemo from '@/components/sheet-demo';
import { loadCodeThemes } from '@/lib/code-theme';
import { site } from '@/lib/site';
import { InstallCommand } from './install-command';
import styles from './page.module.css';

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
    icon: Cpu,
    title: 'Built on Fabric',
    text: 'Layout state and shadow nodes live in C++ shared by both platforms. Content resizes in the same frame as the sheet.',
    to: '/intro',
  },
  {
    icon: MoveVertical,
    title: 'Detents that fit',
    text: 'Size by fraction, peek, or auto. Auto measures your content, including scroll views and lists.',
    to: '/guides/resizing',
  },
  {
    icon: Keyboard,
    title: 'Keyboard aware',
    text: 'The sheet and its scrollables move out of the way when the keyboard shows. No listeners to wire up.',
    to: '/guides/keyboard',
  },
  {
    icon: Activity,
    title: 'Reanimated ready',
    text: 'Read the sheet position as a shared value and drive your own animations on the UI thread.',
    to: '/guides/reanimated',
  },
  {
    icon: Route,
    title: 'Sheets as screens',
    text: 'A sheet navigator for React Navigation and a Sheet layout for Expo Router. Push, pop, and pass params.',
    to: '/guides/navigation',
  },
  {
    icon: Layers,
    title: 'Stack and overlay',
    text: 'Present sheets over sheets. Render toasts and dialogs above them with TrueSheetOverlay.',
    to: '/guides/stacking',
  },
  {
    icon: Droplets,
    title: 'Liquid Glass',
    text: 'Native background blur and Liquid Glass on iOS 26, featured on the Expo blog.',
    to: '/guides/liquid-glass',
  },
  {
    icon: Accessibility,
    title: 'Accessible by default',
    text: 'Screen readers announce detents. Grabber labels, hints, and actions are yours to customize.',
    to: '/reference/types#accessibilityoptions',
  },
];

export const metadata: Metadata = {
  title: { absolute: site.name },
  description:
    'The true native bottom sheet for React Native. UISheetPresentationController on iOS, BottomSheetBehavior on Android, and a matching renderer on web.',
  alternates: { canonical: '/' },
};

export default async function Home() {
  const themes = await loadCodeThemes();

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={clsx(styles.container, styles.heroInner)}>
          <div className={styles.heroCopy}>
            <h1 className={styles.headline}>Bottom sheets that are actually native.</h1>
            <p className={styles.lede}>
              TrueSheet hands your content to the sheet the platform already ships. Real detents,
              real gestures, real accessibility. One component for iOS, Android, and web.
            </p>
            <InstallCommand command={INSTALL} />
            <div className={styles.actions}>
              <Link className={clsx(styles.button, styles.buttonPrimary)} href="/intro">
                Read the docs
              </Link>
              <Link className={clsx(styles.button, styles.buttonGhost)} href={site.github}>
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
        <div className={styles.container}>
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
        <div className={clsx(styles.container, styles.usage)}>
          <div className={styles.usageCopy}>
            <h2 className={styles.title}>Present. Await. Dismiss.</h2>
            <p>
              Attach a ref and call it. Every method returns a promise that resolves when the native
              animation finishes, so you can sequence work without guessing.
            </p>
            <p>
              Prefer events? Lifecycle, drag, focus, and detent events fire from the native side with
              the same timing your users feel.
            </p>
            <Link href="/reference/methods" className={styles.textLink}>
              Browse the methods and events
            </Link>
          </div>
          <div className={styles.usageCode}>
            <ServerCodeBlock
              code={USAGE}
              lang="tsx"
              themes={themes}
              codeblock={{ keepBackground: true }}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.featuresHeader}>
            <div>
              <p className={styles.eyebrow}>Features</p>
              <h2 className={styles.title}>Everything a sheet should do.</h2>
            </div>
            <p className={styles.featuresLede}>
              Native presentation on every platform, with the details handled for you. Pick a card
              to read the guide.
            </p>
          </div>
          <ul className={styles.features}>
            {FEATURES.map(({ icon: Icon, ...f }) => (
              <li key={f.title}>
                <Link href={f.to} className={styles.feature}>
                  <span className={styles.featureIcon}>
                    <Icon aria-hidden />
                  </span>
                  <h3 className={styles.featureTitle}>
                    {f.title}
                    <ArrowUpRight className={styles.featureArrow} aria-hidden />
                  </h3>
                  <p>{f.text}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={clsx(styles.section, styles.sectionBeta)}>
        <div className={clsx(styles.container, styles.beta)}>
          <div>
            <h2 className={styles.title}>Version 4 is in beta.</h2>
            <p>
              A rewritten layout engine sizes content synchronously per detent and tracks the sheet
              while dragging. Auto detents now measure scroll views. Expo Router gets a first class
              Sheet layout.
            </p>
            <div className={styles.actions}>
              <Link className={clsx(styles.button, styles.buttonPrimary)} href="/next/intro">
                Read the v4 docs
              </Link>
              <Link className={clsx(styles.button, styles.buttonGhost)} href="/next/migration">
                Migration guide
              </Link>
            </div>
          </div>
          <div className={styles.betaCode}>
            <ServerCodeBlock
              code={`${INSTALL}@beta`}
              lang="sh"
              themes={themes}
              codeblock={{ keepBackground: true }}
            />
            <p className={styles.betaNote}>Teach your coding agent the library too:</p>
            <ServerCodeBlock
              code="npx skills add lodev09/react-native-true-sheet"
              lang="sh"
              themes={themes}
              codeblock={{ keepBackground: true }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
