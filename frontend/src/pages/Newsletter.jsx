import { useSearchParams } from "react-router-dom";
import NewsletterSignup from "../components/NewsletterSignup";

export default function Newsletter() {
  const [params] = useSearchParams();

  return (
    <div className="bg-surface min-h-[70vh] py-10 md:py-16">
      <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop">
        {params.get("unsubscribed") && (
          <p className="mb-6 text-center text-slate-gray text-[15px]">
            You&apos;ve been unsubscribed and will no longer receive tour notifications from Mmondo Adventures.
          </p>
        )}
        <NewsletterSignup />
      </div>
    </div>
  );
}
