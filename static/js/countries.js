/**
 * ISO country list with international dialing codes.
 * Used by payment (and reusable elsewhere).
 */
window.COUNTRIES = [
  { name: "Afghanistan", code: "AF", dial: "+93" },
  { name: "Albania", code: "AL", dial: "+355" },
  { name: "Algeria", code: "DZ", dial: "+213" },
  { name: "American Samoa", code: "AS", dial: "+1" },
  { name: "Andorra", code: "AD", dial: "+376" },
  { name: "Angola", code: "AO", dial: "+244" },
  { name: "Anguilla", code: "AI", dial: "+1" },
  { name: "Antigua and Barbuda", code: "AG", dial: "+1" },
  { name: "Argentina", code: "AR", dial: "+54" },
  { name: "Armenia", code: "AM", dial: "+374" },
  { name: "Aruba", code: "AW", dial: "+297" },
  { name: "Australia", code: "AU", dial: "+61" },
  { name: "Austria", code: "AT", dial: "+43" },
  { name: "Azerbaijan", code: "AZ", dial: "+994" },
  { name: "Bahamas", code: "BS", dial: "+1" },
  { name: "Bahrain", code: "BH", dial: "+973" },
  { name: "Bangladesh", code: "BD", dial: "+880" },
  { name: "Barbados", code: "BB", dial: "+1" },
  { name: "Belarus", code: "BY", dial: "+375" },
  { name: "Belgium", code: "BE", dial: "+32" },
  { name: "Belize", code: "BZ", dial: "+501" },
  { name: "Benin", code: "BJ", dial: "+229" },
  { name: "Bermuda", code: "BM", dial: "+1" },
  { name: "Bhutan", code: "BT", dial: "+975" },
  { name: "Bolivia", code: "BO", dial: "+591" },
  { name: "Bosnia and Herzegovina", code: "BA", dial: "+387" },
  { name: "Botswana", code: "BW", dial: "+267" },
  { name: "Brazil", code: "BR", dial: "+55" },
  { name: "British Virgin Islands", code: "VG", dial: "+1" },
  { name: "Brunei", code: "BN", dial: "+673" },
  { name: "Bulgaria", code: "BG", dial: "+359" },
  { name: "Burkina Faso", code: "BF", dial: "+226" },
  { name: "Burundi", code: "BI", dial: "+257" },
  { name: "Cabo Verde", code: "CV", dial: "+238" },
  { name: "Cambodia", code: "KH", dial: "+855" },
  { name: "Cameroon", code: "CM", dial: "+237" },
  { name: "Canada", code: "CA", dial: "+1" },
  { name: "Cayman Islands", code: "KY", dial: "+1" },
  { name: "Central African Republic", code: "CF", dial: "+236" },
  { name: "Chad", code: "TD", dial: "+235" },
  { name: "Chile", code: "CL", dial: "+56" },
  { name: "China", code: "CN", dial: "+86" },
  { name: "Colombia", code: "CO", dial: "+57" },
  { name: "Comoros", code: "KM", dial: "+269" },
  { name: "Congo - Brazzaville", code: "CG", dial: "+242" },
  { name: "Congo - Kinshasa", code: "CD", dial: "+243" },
  { name: "Cook Islands", code: "CK", dial: "+682" },
  { name: "Costa Rica", code: "CR", dial: "+506" },
  { name: "Côte d’Ivoire", code: "CI", dial: "+225" },
  { name: "Croatia", code: "HR", dial: "+385" },
  { name: "Cuba", code: "CU", dial: "+53" },
  { name: "Curaçao", code: "CW", dial: "+599" },
  { name: "Cyprus", code: "CY", dial: "+357" },
  { name: "Czechia", code: "CZ", dial: "+420" },
  { name: "Denmark", code: "DK", dial: "+45" },
  { name: "Djibouti", code: "DJ", dial: "+253" },
  { name: "Dominica", code: "DM", dial: "+1" },
  { name: "Dominican Republic", code: "DO", dial: "+1" },
  { name: "Ecuador", code: "EC", dial: "+593" },
  { name: "Egypt", code: "EG", dial: "+20" },
  { name: "El Salvador", code: "SV", dial: "+503" },
  { name: "Equatorial Guinea", code: "GQ", dial: "+240" },
  { name: "Eritrea", code: "ER", dial: "+291" },
  { name: "Estonia", code: "EE", dial: "+372" },
  { name: "Eswatini", code: "SZ", dial: "+268" },
  { name: "Ethiopia", code: "ET", dial: "+251" },
  { name: "Falkland Islands", code: "FK", dial: "+500" },
  { name: "Faroe Islands", code: "FO", dial: "+298" },
  { name: "Fiji", code: "FJ", dial: "+679" },
  { name: "Finland", code: "FI", dial: "+358" },
  { name: "France", code: "FR", dial: "+33" },
  { name: "French Guiana", code: "GF", dial: "+594" },
  { name: "French Polynesia", code: "PF", dial: "+689" },
  { name: "Gabon", code: "GA", dial: "+241" },
  { name: "Gambia", code: "GM", dial: "+220" },
  { name: "Georgia", code: "GE", dial: "+995" },
  { name: "Germany", code: "DE", dial: "+49" },
  { name: "Ghana", code: "GH", dial: "+233" },
  { name: "Gibraltar", code: "GI", dial: "+350" },
  { name: "Greece", code: "GR", dial: "+30" },
  { name: "Greenland", code: "GL", dial: "+299" },
  { name: "Grenada", code: "GD", dial: "+1" },
  { name: "Guadeloupe", code: "GP", dial: "+590" },
  { name: "Guam", code: "GU", dial: "+1" },
  { name: "Guatemala", code: "GT", dial: "+502" },
  { name: "Guernsey", code: "GG", dial: "+44" },
  { name: "Guinea", code: "GN", dial: "+224" },
  { name: "Guinea-Bissau", code: "GW", dial: "+245" },
  { name: "Guyana", code: "GY", dial: "+592" },
  { name: "Haiti", code: "HT", dial: "+509" },
  { name: "Honduras", code: "HN", dial: "+504" },
  { name: "Hong Kong", code: "HK", dial: "+852" },
  { name: "Hungary", code: "HU", dial: "+36" },
  { name: "Iceland", code: "IS", dial: "+354" },
  { name: "India", code: "IN", dial: "+91" },
  { name: "Indonesia", code: "ID", dial: "+62" },
  { name: "Iran", code: "IR", dial: "+98" },
  { name: "Iraq", code: "IQ", dial: "+964" },
  { name: "Ireland", code: "IE", dial: "+353" },
  { name: "Isle of Man", code: "IM", dial: "+44" },
  { name: "Israel", code: "IL", dial: "+972" },
  { name: "Italy", code: "IT", dial: "+39" },
  { name: "Jamaica", code: "JM", dial: "+1" },
  { name: "Japan", code: "JP", dial: "+81" },
  { name: "Jersey", code: "JE", dial: "+44" },
  { name: "Jordan", code: "JO", dial: "+962" },
  { name: "Kazakhstan", code: "KZ", dial: "+7" },
  { name: "Kenya", code: "KE", dial: "+254" },
  { name: "Kiribati", code: "KI", dial: "+686" },
  { name: "Kosovo", code: "XK", dial: "+383" },
  { name: "Kuwait", code: "KW", dial: "+965" },
  { name: "Kyrgyzstan", code: "KG", dial: "+996" },
  { name: "Laos", code: "LA", dial: "+856" },
  { name: "Latvia", code: "LV", dial: "+371" },
  { name: "Lebanon", code: "LB", dial: "+961" },
  { name: "Lesotho", code: "LS", dial: "+266" },
  { name: "Liberia", code: "LR", dial: "+231" },
  { name: "Libya", code: "LY", dial: "+218" },
  { name: "Liechtenstein", code: "LI", dial: "+423" },
  { name: "Lithuania", code: "LT", dial: "+370" },
  { name: "Luxembourg", code: "LU", dial: "+352" },
  { name: "Macao", code: "MO", dial: "+853" },
  { name: "Madagascar", code: "MG", dial: "+261" },
  { name: "Malawi", code: "MW", dial: "+265" },
  { name: "Malaysia", code: "MY", dial: "+60" },
  { name: "Maldives", code: "MV", dial: "+960" },
  { name: "Mali", code: "ML", dial: "+223" },
  { name: "Malta", code: "MT", dial: "+356" },
  { name: "Marshall Islands", code: "MH", dial: "+692" },
  { name: "Martinique", code: "MQ", dial: "+596" },
  { name: "Mauritania", code: "MR", dial: "+222" },
  { name: "Mauritius", code: "MU", dial: "+230" },
  { name: "Mayotte", code: "YT", dial: "+262" },
  { name: "Mexico", code: "MX", dial: "+52" },
  { name: "Micronesia", code: "FM", dial: "+691" },
  { name: "Moldova", code: "MD", dial: "+373" },
  { name: "Monaco", code: "MC", dial: "+377" },
  { name: "Mongolia", code: "MN", dial: "+976" },
  { name: "Montenegro", code: "ME", dial: "+382" },
  { name: "Montserrat", code: "MS", dial: "+1" },
  { name: "Morocco", code: "MA", dial: "+212" },
  { name: "Mozambique", code: "MZ", dial: "+258" },
  { name: "Myanmar", code: "MM", dial: "+95" },
  { name: "Namibia", code: "NA", dial: "+264" },
  { name: "Nauru", code: "NR", dial: "+674" },
  { name: "Nepal", code: "NP", dial: "+977" },
  { name: "Netherlands", code: "NL", dial: "+31" },
  { name: "New Caledonia", code: "NC", dial: "+687" },
  { name: "New Zealand", code: "NZ", dial: "+64" },
  { name: "Nicaragua", code: "NI", dial: "+505" },
  { name: "Niger", code: "NE", dial: "+227" },
  { name: "Nigeria", code: "NG", dial: "+234" },
  { name: "Niue", code: "NU", dial: "+683" },
  { name: "North Korea", code: "KP", dial: "+850" },
  { name: "North Macedonia", code: "MK", dial: "+389" },
  { name: "Northern Mariana Islands", code: "MP", dial: "+1" },
  { name: "Norway", code: "NO", dial: "+47" },
  { name: "Oman", code: "OM", dial: "+968" },
  { name: "Pakistan", code: "PK", dial: "+92" },
  { name: "Palau", code: "PW", dial: "+680" },
  { name: "Palestine", code: "PS", dial: "+970" },
  { name: "Panama", code: "PA", dial: "+507" },
  { name: "Papua New Guinea", code: "PG", dial: "+675" },
  { name: "Paraguay", code: "PY", dial: "+595" },
  { name: "Peru", code: "PE", dial: "+51" },
  { name: "Philippines", code: "PH", dial: "+63" },
  { name: "Poland", code: "PL", dial: "+48" },
  { name: "Portugal", code: "PT", dial: "+351" },
  { name: "Puerto Rico", code: "PR", dial: "+1" },
  { name: "Qatar", code: "QA", dial: "+974" },
  { name: "Réunion", code: "RE", dial: "+262" },
  { name: "Romania", code: "RO", dial: "+40" },
  { name: "Russia", code: "RU", dial: "+7" },
  { name: "Rwanda", code: "RW", dial: "+250" },
  { name: "Saint Barthélemy", code: "BL", dial: "+590" },
  { name: "Saint Helena", code: "SH", dial: "+290" },
  { name: "Saint Kitts and Nevis", code: "KN", dial: "+1" },
  { name: "Saint Lucia", code: "LC", dial: "+1" },
  { name: "Saint Martin", code: "MF", dial: "+590" },
  { name: "Saint Pierre and Miquelon", code: "PM", dial: "+508" },
  { name: "Saint Vincent and the Grenadines", code: "VC", dial: "+1" },
  { name: "Samoa", code: "WS", dial: "+685" },
  { name: "San Marino", code: "SM", dial: "+378" },
  { name: "São Tomé and Príncipe", code: "ST", dial: "+239" },
  { name: "Saudi Arabia", code: "SA", dial: "+966" },
  { name: "Senegal", code: "SN", dial: "+221" },
  { name: "Serbia", code: "RS", dial: "+381" },
  { name: "Seychelles", code: "SC", dial: "+248" },
  { name: "Sierra Leone", code: "SL", dial: "+232" },
  { name: "Singapore", code: "SG", dial: "+65" },
  { name: "Sint Maarten", code: "SX", dial: "+1" },
  { name: "Slovakia", code: "SK", dial: "+421" },
  { name: "Slovenia", code: "SI", dial: "+386" },
  { name: "Solomon Islands", code: "SB", dial: "+677" },
  { name: "Somalia", code: "SO", dial: "+252" },
  { name: "South Africa", code: "ZA", dial: "+27" },
  { name: "South Korea", code: "KR", dial: "+82" },
  { name: "South Sudan", code: "SS", dial: "+211" },
  { name: "Spain", code: "ES", dial: "+34" },
  { name: "Sri Lanka", code: "LK", dial: "+94" },
  { name: "Sudan", code: "SD", dial: "+249" },
  { name: "Suriname", code: "SR", dial: "+597" },
  { name: "Sweden", code: "SE", dial: "+46" },
  { name: "Switzerland", code: "CH", dial: "+41" },
  { name: "Syria", code: "SY", dial: "+963" },
  { name: "Taiwan", code: "TW", dial: "+886" },
  { name: "Tajikistan", code: "TJ", dial: "+992" },
  { name: "Tanzania", code: "TZ", dial: "+255" },
  { name: "Thailand", code: "TH", dial: "+66" },
  { name: "Timor-Leste", code: "TL", dial: "+670" },
  { name: "Togo", code: "TG", dial: "+228" },
  { name: "Tokelau", code: "TK", dial: "+690" },
  { name: "Tonga", code: "TO", dial: "+676" },
  { name: "Trinidad and Tobago", code: "TT", dial: "+1" },
  { name: "Tunisia", code: "TN", dial: "+216" },
  { name: "Türkiye", code: "TR", dial: "+90" },
  { name: "Turkmenistan", code: "TM", dial: "+993" },
  { name: "Turks and Caicos Islands", code: "TC", dial: "+1" },
  { name: "Tuvalu", code: "TV", dial: "+688" },
  { name: "U.S. Virgin Islands", code: "VI", dial: "+1" },
  { name: "Uganda", code: "UG", dial: "+256" },
  { name: "Ukraine", code: "UA", dial: "+380" },
  { name: "United Arab Emirates", code: "AE", dial: "+971" },
  { name: "United Kingdom", code: "GB", dial: "+44" },
  { name: "United States", code: "US", dial: "+1" },
  { name: "Uruguay", code: "UY", dial: "+598" },
  { name: "Uzbekistan", code: "UZ", dial: "+998" },
  { name: "Vanuatu", code: "VU", dial: "+678" },
  { name: "Vatican City", code: "VA", dial: "+39" },
  { name: "Venezuela", code: "VE", dial: "+58" },
  { name: "Vietnam", code: "VN", dial: "+84" },
  { name: "Wallis and Futuna", code: "WF", dial: "+681" },
  { name: "Yemen", code: "YE", dial: "+967" },
  { name: "Zambia", code: "ZM", dial: "+260" },
  { name: "Zimbabwe", code: "ZW", dial: "+263" }
];

window.fillCountrySelects = function fillCountrySelects(options = {}) {
  const countries = window.COUNTRIES || [];
  const nationality = document.getElementById(options.nationalityId || "nationality");
  const dialCode = document.getElementById(options.dialCodeId || "phone-code");
  const defaultCode = options.defaultCode || "UG";
  const existingPhone = (options.existingPhone || "").trim();

  if (nationality) {
    nationality.innerHTML = "";
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.name;
      option.dataset.code = country.code;
      option.dataset.dial = country.dial;
      option.textContent = country.name;
      if (country.code === defaultCode) option.selected = true;
      nationality.appendChild(option);
    });
  }

  if (dialCode) {
    dialCode.innerHTML = "";
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.dial;
      option.dataset.code = country.code;
      option.textContent = `${country.code} ${country.dial}`;
      option.title = `${country.name} (${country.dial})`;
      if (country.code === defaultCode) option.selected = true;
      dialCode.appendChild(option);
    });
  }

  // Prefer dial code already present on a saved phone number.
  if (dialCode && existingPhone) {
    const match = countries
      .slice()
      .sort((a, b) => b.dial.length - a.dial.length)
      .find((country) => existingPhone.startsWith(country.dial));
    if (match) {
      dialCode.value = match.dial;
      if (nationality) {
        const natOption = Array.from(nationality.options).find(
          (opt) => opt.dataset.code === match.code
        );
        if (natOption) nationality.value = natOption.value;
      }
      return match.dial;
    }
  }

  return defaultCode;
};

window.stripDialCode = function stripDialCode(phone, dial) {
  if (!phone) return "";
  let value = phone.trim();
  if (dial && value.startsWith(dial)) {
    value = value.slice(dial.length).trim();
  }
  return value.replace(/^\+/, "").replace(/^0+/, "");
};

window.composePhoneNumber = function composePhoneNumber(dial, localNumber) {
  const local = (localNumber || "").replace(/\s+/g, "").replace(/^0+/, "");
  if (!local) return "";
  return `${dial}${local}`;
};
