import { Link } from "react-router-dom";
import { Icon } from "../utils";

export default function Careers() {
  return (
    <div className="bg-surface min-h-[70vh]">
      <section className="bg-charcoal text-white pt-24 pb-16 md:pt-28 md:pb-20 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-[1440px] mx-auto">
          <div className="max-w-3xl">
          <h1 className="font-display-lg text-[32px] md:text-[44px] leading-[1.15] mb-4">Career</h1>
          <p className="font-headline-sm italic text-[22px] text-white/90 mb-4">Where tours find travellers</p>
          <p className="text-white/75 font-body-md text-[16px] leading-relaxed">
            Help connect Ugandan tour operators with travellers. We look for people who care about local tourism,
            hospitality, and well-run adventures.
          </p>
          </div>
        </div>
      </section>
      <section className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-14 scroll-mt-16" id="roles">
        <div className="max-w-3xl bg-white border border-surface-container rounded-xl p-8">
          <h2 className="font-headline-sm text-headline-sm text-charcoal mb-3">Open roles</h2>
          <p className="text-secondary font-body-md mb-6">
            We post openings as they come up. Send your CV and a short note about how you want to work with Mmondo
            Adventures.
          </p>
          <a
            className="inline-flex items-center gap-2 bg-primary text-white font-label-md px-6 py-3 rounded-lg hover:bg-primary-container transition-colors"
            href="mailto:info@mmondoadventures.ug?subject=Career%20at%20Mmondo%20Adventures"
          >
            Apply by email
            <Icon name="mail" className="text-[18px]" />
          </a>
          <p className="mt-6 text-secondary text-[14px]">
            Tour operators can{" "}
            <Link className="text-primary hover:text-primary-container" to="/operator#register-section">
              become a tour operator
            </Link>{" "}
            or{" "}
            <Link className="text-primary hover:text-primary-container" to="/contact">
              contact us
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
