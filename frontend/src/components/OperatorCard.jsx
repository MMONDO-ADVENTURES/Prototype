import { useState } from "react";
import { Link } from "react-router-dom";
import { cldAvatar, cldThumb } from "../cloudinary";
import { Icon } from "../utils";

function uniquePhotos(urls, limit = 3) {
  const seen = new Set();
  const photos = [];
  urls.forEach((url) => {
    if (!url || seen.has(url) || photos.length >= limit) return;
    seen.add(url);
    photos.push(url);
  });
  return photos;
}

function sinceLabel(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `Since ${parsed.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;
}

function ContactRow({ compact, href, icon, label }) {
  if (!label) return null;
  const inner = (
    <>
      <span className={`${compact ? "w-6 h-6" : "w-8 h-8"} rounded-full border border-surface-container flex items-center justify-center shrink-0`}>
        <Icon name={icon} className={`text-primary ${compact ? "text-[14px]" : "text-[16px]"}`} />
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </>
  );
  const className = `flex items-center gap-2 ${compact ? "text-[12px]" : "text-[14px]"} text-charcoal`;
  if (!href) return <p className={className}>{inner}</p>;
  if (href.startsWith("/")) {
    return (
      <Link className={`${className} hover:text-primary`} to={href}>
        {inner}
      </Link>
    );
  }
  return (
    <a className={`${className} hover:text-primary`} href={href} rel="noreferrer" target={href.startsWith("http") ? "_blank" : undefined}>
      {inner}
    </a>
  );
}

function PhotoStrip({ gallery, toursHref }) {
  if (!gallery.length) return null;
  return (
    <div className="mt-auto pt-3 grid grid-cols-3 gap-1.5">
      {gallery.map((src) => {
        const image = <img alt="" className="w-full h-full object-cover" decoding="async" loading="lazy" src={cldThumb(src)} />;
        const className = "aspect-square rounded-[14px] overflow-hidden bg-surface-container-high";
        return toursHref ? (
          <Link className={className} key={src} to={toursHref}>
            {image}
          </Link>
        ) : (
          <div className={className} key={src}>
            {image}
          </div>
        );
      })}
    </div>
  );
}

export default function OperatorCard({ landscape = false, operator, photos = [], toursHref }) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const name = operator?.company_name || operator?.full_name || operator?.name || "Tour operator";
  const role = operator?.company_name && operator?.full_name && operator.full_name !== name
    ? operator.full_name
    : operator?.bio || "Tour operator";
  const picture = operator?.picture;
  const phone = operator?.phone;
  const email = operator?.email;
  const location = operator?.address || operator?.location || "Uganda";
  const since = sinceLabel(operator?.created_at);
  const gallery = uniquePhotos(photos, 3);
  const showAvatar = picture && !avatarFailed;
  const contacts = (
    <>
      <ContactRow compact={!landscape} href={phone ? `tel:${phone}` : undefined} icon="call" label={phone} />
      <ContactRow compact={!landscape} href={email ? `mailto:${email}` : undefined} icon="mail" label={email} />
      <ContactRow compact={!landscape} icon="location_on" label={location} />
      <ContactRow compact={!landscape} icon="calendar_month" label={since} />
    </>
  );

  const avatar = showAvatar ? (
    <img
      alt=""
      className={`${landscape ? "w-28 h-28" : "w-24 h-24"} rounded-full object-cover shrink-0`}
      onError={() => setAvatarFailed(true)}
      src={cldAvatar(picture)}
    />
  ) : (
    <div className={`${landscape ? "w-28 h-28" : "w-24 h-24"} rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0`}>
      <Icon name="apartment" className={landscape ? "text-[44px]" : "text-[40px]"} />
    </div>
  );

  const title = toursHref ? (
    <Link className={`font-semibold leading-tight text-charcoal hover:text-primary ${landscape ? "text-[22px]" : "text-[15px]"}`} to={toursHref}>
      {name}
    </Link>
  ) : (
    <h3 className={`font-semibold leading-tight text-charcoal ${landscape ? "text-[22px]" : "text-[15px]"}`}>{name}</h3>
  );

  if (landscape) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center gap-4 min-w-0 shrink-0">
          {avatar}
          <div className="min-w-0">
            {title}
            <p className="text-[14px] text-secondary mt-1 line-clamp-2">{role}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2 min-w-0 flex-1">{contacts}</div>
      </div>
    );
  }

  return (
    <article className="bg-white rounded-[24px] shadow-[0_18px_40px_-20px_rgba(30,30,30,0.28)] p-2.5 flex flex-col h-full w-full">
      <div className="px-2.5 pt-3 pb-2 flex flex-col flex-1">
        <div className="flex items-center gap-3">
          {avatar}
          <div className="min-w-0">
            {title}
            <p className="text-[12px] text-secondary mt-0.5 line-clamp-2">{role}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">{contacts}</div>
        <PhotoStrip gallery={gallery} toursHref={toursHref} />
      </div>
    </article>
  );
}
