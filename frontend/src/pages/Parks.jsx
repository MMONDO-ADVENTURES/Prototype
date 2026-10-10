import { Link } from "react-router-dom";
import { Icon } from "../utils";

const PARKS = [
  {
    name: "Bwindi Impenetrable National Park",
    query: "Bwindi",
    region: "Southwest Uganda",
    highlight: "Mountain gorilla trekking in ancient rainforest",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuApn7rFpt9NbpMfMERtDlpRIu1ZgZtovagTuk9_-KooccfEtgPpjJJM4Csb4z7YxM0G3oSCJkjO2A6_jAZwD_dTM54taOBDob3ZGcWEzfthMvUzaNSWuRCjlvD4UmnMsobWw2ypeibuCrW7QzUPuC4wLl_akk4epyHY2ASppCxDrFLceRzaNhPTff-PJxcCIBYeEfV65H8pqFX2XbANAwhZjWK4m9IheNEuLzFQVjg6PWw1OU450RUM",
  },
  {
    name: "Queen Elizabeth National Park",
    query: "Queen Elizabeth",
    region: "Western Uganda",
    highlight: "Tree-climbing lions, Kazinga Channel boat safaris",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAc2PnvLGEF6BJS4c9VOAAHmr_lO25h4nntrjD-Iws3zz2Jw-gaxfWtVpeFuwNTyN7JDD9f15lC6bjxKmdRcVm3UJMULM7A2OJZoSSTnIP29imm1CBtwppTFENrmbLfpXP6rdR4qY1FXuioA-agn4UCUSQXmFwZBcwIjV0G8NvOptyEPqn0FLZLUHH59-vjSWTGkiI2l_iQplpeLcypT90aTDvIZSJMW572E072n8zGHXktq-uV2AL",
  },
  {
    name: "Murchison Falls National Park",
    query: "Murchison",
    region: "Northwest Uganda",
    highlight: "The Nile exploding through a 7-metre gorge",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCvGcHmyQD7B_W2bCsJ4IjlY0GWjH3b8J1k0gnVrR58gdHyYBwxtzTtYa0e9UvoU1UiYEosEWdPRxgoUGQ-ECHVuNW_oQfkodYU1Zg1uu26LgHgl83acs1NyQ-ABylvMgnYNWd7D9s_MHnrq0Ezx2mBwjVKK7dvKlGf3Baisxcuh1OotsoDC20vM_QT6xW2sgy-CmnG5fUCMW0PWOTWtIJ0H_0wspiitGwBqqwWZ8Biu38RP83iVERx",
  },
  {
    name: "Kibale National Park",
    query: "Kibale",
    region: "Western Uganda",
    highlight: "Chimpanzee tracking in Uganda’s primate capital",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWJYc9mew16doeOiDGPpG0Kn9CKTsELBcqiD4Jg4dTqvaUqDunwtd5IV0-4zDxNzeD_kPYRwODhN8bKUnv5vxaSevwL5JwLCYSfviJ00TQLYkOJSrH3d_SNi4JONDvAmzyYfs8mt1f6__N4Y92gidihPcn3W0vSFauqgPeCV0-7g88ceOYI1xuTSeVt35CyNivlkdQbh2kMVaXP0qdAxvR7bA2PEaU4bW9Pr7OmvZGKUWdzS4wHseu",
  },
  {
    name: "Lake Mburo National Park",
    query: "Lake Mburo",
    region: "Western Uganda",
    highlight: "Zebras, lakeshores, and walking safaris",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-7YRpEFjv9JY3lmXmUN6iTlU2CaRvCbo9y0NvQXpoVaP_5yOAXDo5IzY8fkuk708x4b7Jru54C_PXD5qehQzRvnRFHsEUY-q1_p_dg0_iLRcRbDCMl_mLTV-jsCEr2PZYf0ue1SSqkrCKtezOEnYgYU7uZ7kfRYBGTCIw86rixXKP9-KYnLKHcLJcTq-P31yq1ULCvVTnUD7yFQ-xg_gMkiE-S6oWmUr1WeejfIRIGoBiFkQhLgGQ",
  },
  {
    name: "Kidepo Valley National Park",
    query: "Kidepo",
    region: "Northeast Uganda",
    highlight: "Remote wilderness and big-sky savannah",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBbLjL_99iU6y5ZUE7DeABMYFHb_K8BwNPP1LjZErzjI1GQ1_duQeQy5GBlFUHKGH-KngJLmeTU55HPNL1EI7cBm9tgOP9R2uFBo2ubudM6vioLn_LBdGv1ez6DO24pKEIxBkFnw8i9FmPCOLksOhjzy-Sw2cx-pF37cPCmCasQov2V6LN9W24ERB8aAPJxj4vvn6d9p7Zpiha2DKpCfOI4dZRfJ8pd3UPxVoxMIHlvmLZpDNhiHv7g",
  },
  {
    name: "Rwenzori Mountains National Park",
    query: "Rwenzori",
    region: "Western Uganda",
    highlight: "The Mountains of the Moon and glacial peaks",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYu_TtBryPr_Zx_1zglmcL3uAraW_30Xx1sqihGmyVLdF_YHgD572TayeqSFZoLgO2zBudmAJYo9hxnALFQ_8w-tMGTyBjq0t0Gxr2i8g1i8nci30Qd9xliAyugMAJaEp3SiEYLkolKpuvFTK4NEna8UFOLje7nUfpargr9duB-Mvq7OAesjo_MP3nUc7Rl8Dx5r1oWTnxD9N4U9q7nb939U6KGk9wQyaQfAytbwMxJxUMfoZUsZxY",
  },
  {
    name: "Mgahinga Gorilla National Park",
    query: "Mgahinga",
    region: "Southwest Uganda",
    highlight: "Volcano hiking and golden monkeys",
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMpb3JBsGnLht1JEdtCHkQme_HYRRhTBsCjgIlA8FVzvdv-odrD0A2m1kzIjhhiUMcVgOUwdho_aiQ6_3dAA3_Z1LGYrrxxzLg0YeFIwYJdmKKA-9uo7tVoocGHfCod8DyT-5Gd5DI3dLbWRtVwG_etlBByt3_UfbD8-SPDo4hdMv3CXiu9XTrgNjH3pKz-i4szyTQVyyjKd7qn_HJPRRNK6ymOBvVDq7ZwlUntncY8Wkp50JkMThM",
  },
];

export default function Parks() {
  return (
    <div className="w-full bg-surface">
      <section className="relative w-full h-[420px] md:h-[520px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${PARKS[2].src}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/45 to-transparent" />
        <div className="relative z-10 h-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-col justify-end pb-12 md:pb-16">
          <h1 className="font-display-lg text-[32px] md:text-[44px] leading-[1.15] text-white max-w-3xl">
            Uganda’s parks, ready for your next safari
          </h1>
          <p className="font-body-lg text-surface-container-highest max-w-2xl mt-3">
            From gorilla forests to the Nile, explore the parks our operators know best and jump straight into matching tours.
          </p>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-16 scroll-mt-16" id="parks">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PARKS.map((park) => (
            <article
              className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_24px_-12px_rgba(30,30,30,0.18)] flex flex-col scroll-mt-20"
              id={`park-${park.query.toLowerCase().replace(/\s+/g, "-")}`}
              key={park.name}
            >
              <div className="h-44 overflow-hidden">
                <img alt={park.name} className="w-full h-full object-cover" src={park.src} />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <p className="text-[13px] text-primary font-label-md">{park.region}</p>
                <h2 className="font-headline-sm text-[18px] text-charcoal mt-1 leading-snug">{park.name}</h2>
                <p className="text-[14px] text-secondary mt-2 flex-1">{park.highlight}</p>
                <Link
                  className="mt-4 inline-flex items-center gap-1 text-primary font-label-md text-[14px] hover:text-brand-secondary"
                  to={`/tours?q=${encodeURIComponent(park.query)}#packages`}
                >
                  View tours <Icon name="arrow_forward" className="text-[16px]" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
