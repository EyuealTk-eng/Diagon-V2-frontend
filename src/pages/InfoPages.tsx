import { Link } from "react-router-dom";

import { useI18n } from "../app/i18n";
import { ButtonLink } from "../components/ui";

function Prose({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="card mx-auto max-w-3xl space-y-4 p-6 leading-relaxed sm:p-10 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">
      <h1 className="text-3xl font-bold">{title}</h1>
      {children}
    </article>
  );
}

export function AboutPage() {
  const { t } = useI18n();
  return (
    <Prose title={t("footer.about")}>
      <p>Diagon turns the buying and selling that already happens in campus Telegram groups into organized, searchable listings that don't get buried.</p>
      <p>It starts with Addis Ababa University — every campus in one marketplace, with campus as a filter rather than a separate site. Other Ethiopian universities will follow.</p>
      <p>Listings are free for students. Buyers contact sellers directly on Telegram; Diagon doesn't handle payments.</p>
    </Prose>
  );
}

export function SafetyPage() {
  const { t } = useI18n();
  return (
    <Prose title={t("footer.safety")}>
      <ul>
        <li>Meet in a busy, public place on campus during the day.</li>
        <li>Inspect the item — and test electronics — before you pay.</li>
        <li>Never send money in advance or share passwords or verification codes.</li>
        <li>The verified badge means the seller confirmed an AAU email address. It is not a guarantee of honesty, item quality or transaction safety.</li>
        <li>If something feels wrong, use “Report listing” so moderators can review it.</li>
      </ul>
      <p>Diagon does not guarantee transactions.</p>
    </Prose>
  );
}

export function HelpPage() {
  const { t } = useI18n();
  return (
    <Prose title={t("footer.help")}>
      <h2>Selling</h2>
      <p>Create an account, then choose <Link className="text-clay-dark underline" to="/sell">Sell</Link>. Add a title, price, campus, at least one photo and your Telegram username, preview it and publish.</p>
      <h2>Buying</h2>
      <p>Search or browse, then tap “Contact on Telegram” on a listing to message the seller directly.</p>
      <h2 id="contact">Contact</h2>
      <p>Questions or problems? Message the Diagon team through the Telegram bot's /help command.</p>
    </Prose>
  );
}

export function TermsPage() {
  const { t } = useI18n();
  return (
    <Prose title={t("footer.terms")}>
      <p>Draft placeholder — replace with reviewed terms of use and a privacy policy before public launch.</p>
      <ul>
        <li>Only list items and services you have the right to sell, and describe them honestly.</li>
        <li>Prohibited: illegal items, weapons, drugs, counterfeit goods, academic dishonesty services and anything unsafe.</li>
        <li>Moderators may reject, suspend or remove listings and suspend accounts that break these rules.</li>
        <li>Diagon is a listing service and is not a party to transactions between students.</li>
      </ul>
    </Prose>
  );
}

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="card mx-auto max-w-md space-y-4 p-10 text-center">
      <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
      <p className="text-muted">{t("notFound.body")}</p>
      <ButtonLink to="/">{t("nav.home")}</ButtonLink>
    </div>
  );
}
