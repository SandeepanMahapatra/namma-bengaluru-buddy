window.DATA_TASKS = [
  // ── Housing ──────────────────────────────────────────────────────────────
  {
    id: "shortlist_areas",
    title: "Shortlist 3–5 areas near {{office_area}}",
    defaultWeek: 1,
    lagDays: 2,
    category: "Housing",
    depends_on: [],
    required_if: {},
    description: "Use the Area Finder above to pick neighbourhoods that fit your commute, budget (₹{{budget_rent}}/mo), and lifestyle. Visit at least 2 in person.",
    tips: ["Walk the streets on a weekday morning to gauge traffic noise.", "Check if the main road floods during rain (ask locals)."]
  },
  {
    id: "flat_hunting",
    title: "Visit flats in {{top_area_1}} and {{top_area_2}}",
    defaultWeek: 1,
    lagDays: 3,
    category: "Housing",
    depends_on: ["shortlist_areas"],
    required_if: {},
    description: "Schedule visits via NoBroker, MagicBricks, or local brokers. Budget ₹{{budget_rent}}/mo for rent excluding maintenance.",
    tips: ["Ask if owner is veg-only/family-only before visiting.", "Check water supply timings and pressure."]
  },
  {
    id: "sign_agreement",
    title: "Sign rental agreement (register if ≥ 12 months)",
    defaultWeek: 1,
    lagDays: 2,
    category: "Housing",
    depends_on: ["flat_hunting"],
    required_if: {},
    description: "Use the Agreement Checker above before signing. Agreements ≥ 12 months must be registered at the Sub-Registrar Office.",
    tips: ["Negotiate deposit to 2–3 months' rent.", "Get a 11-month agreement to skip mandatory registration if landlord agrees."]
  },
  {
    id: "pay_deposit",
    title: "Pay deposit and collect keys",
    defaultWeek: 1,
    lagDays: 1,
    category: "Housing",
    depends_on: ["sign_agreement"],
    required_if: {},
    description: "Pay via IMPS/NEFT — keep the transaction receipt. Take photos of the flat condition before moving in.",
    tips: ["Photo every wall, appliance, and fixture — share with landlord over WhatsApp for a timestamp."]
  },
  {
    id: "move_in",
    title: "Move in and do a full inventory check",
    defaultWeek: 2,
    lagDays: 1,
    category: "Housing",
    depends_on: ["pay_deposit"],
    required_if: {},
    description: "Compare against the inventory list in your agreement. Report any missing or broken items in writing within 24 hours.",
    tips: ["Check all lights, fans, geysers, and taps work before the owner leaves."]
  },
  {
    id: "parking_sticker",
    title: "Get parking sticker from housing society",
    defaultWeek: 2,
    lagDays: 1,
    category: "Housing",
    depends_on: ["move_in"],
    required_if: { vehicle: ["Two-wheeler", "Car"] },
    description: "Contact the apartment association office with vehicle RC copy and agreement copy.",
    tips: []
  },

  // ── Paperwork / Admin ─────────────────────────────────────────────────────
  {
    id: "police_verification",
    title: "Submit police verification form to landlord",
    defaultWeek: 1,
    lagDays: 2,
    category: "Paperwork",
    depends_on: ["sign_agreement"],
    required_if: {},
    description: "Bangalore City Police requires tenant verification. Your landlord must file this; ensure they do it within 7 days of move-in.",
    tips: ["Download Form 22 from the BBMP portal; keep a copy for yourself."]
  },
  {
    id: "aadhaar_update",
    title: "Update Aadhaar address to new Bengaluru flat",
    defaultWeek: 2,
    lagDays: 7,
    category: "Paperwork",
    depends_on: ["sign_agreement"],
    required_if: {},
    description: "Book an Aadhaar appointment at a nearby Enrolment Centre or use the myAadhaar portal for online update. Needs rental agreement as address proof.",
    tips: ["Online update (myAadhaar) takes 7–10 days and is free.", "Aadhaar update is a prerequisite for bank address change and gas connection."]
  },
  {
    id: "bank_address",
    title: "Update bank account address",
    defaultWeek: 3,
    lagDays: 2,
    category: "Paperwork",
    depends_on: ["aadhaar_update"],
    required_if: {},
    description: "Walk into your bank branch with updated Aadhaar + agreement copy. Most banks now accept digital Aadhaar.",
    tips: ["If your salary account is with a different bank, update that one first."]
  },
  {
    id: "gas_connection",
    title: "Transfer or new gas connection (Indane/Bharat/HP)",
    defaultWeek: 3,
    lagDays: 3,
    category: "Paperwork",
    depends_on: ["aadhaar_update"],
    required_if: {},
    description: "If transferring from another state, surrender old connection first. Apply online at the respective oil company portal with updated Aadhaar as address proof.",
    tips: ["HP Gas transfers typically take 2 weeks.", "Keep your old passbook / consumer number handy."]
  },
  {
    id: "vehicle_re_registration",
    title: "Re-register vehicle in Karnataka (within 1 year of arrival)",
    defaultWeek: 4,
    lagDays: 5,
    category: "Paperwork",
    depends_on: ["bank_address"],
    required_if: { home_state_outside_karnataka: true },
    description: "Vehicles from other states must be re-registered in Karnataka within 1 year. Book a slot at the nearest RTO. Carry NOC from home-state RTO, PUC, insurance, and updated Aadhaar.",
    tips: ["Start the NOC process with the home-state RTO online — it can take 2–3 weeks.", "Hire an RTO agent to save a full day of paperwork."]
  },
  {
    id: "school_search",
    title: "Research and visit schools near {{top_area_1}}",
    defaultWeek: 1,
    lagDays: 5,
    category: "Admin",
    depends_on: ["shortlist_areas"],
    required_if: { household: "Family" },
    description: "CBSE, ICSE, and state board schools fill up fast. Start admission enquiries before finalising the flat.",
    tips: ["Check school calendars — admissions often open in Dec–Jan for the next academic year."]
  },
  {
    id: "school_enrol",
    title: "Complete school enrolment and document submission",
    defaultWeek: 2,
    lagDays: 3,
    category: "Admin",
    depends_on: ["school_search", "sign_agreement"],
    required_if: { household: "Family" },
    description: "Submit TC from previous school, birth certificate, Aadhaar, photos, and address proof.",
    tips: []
  },

  // ── Commute ───────────────────────────────────────────────────────────────
  {
    id: "metro_card",
    title: "Get a Namma Metro smart card",
    defaultWeek: 1,
    lagDays: 1,
    category: "Commute",
    depends_on: [],
    required_if: { vehicle: "None" },
    description: "Available at any metro station ticket counter. Minimum balance ₹50, card costs ₹50 refundable deposit.",
    tips: ["Keep ₹300–500 loaded for a week of commutes."]
  },
  {
    id: "commute_trial",
    title: "Do a trial commute to {{office_area}} before Day 1",
    defaultWeek: 1,
    lagDays: 1,
    category: "Commute",
    depends_on: ["move_in"],
    required_if: {},
    description: "Travel your planned route at the same time you'd commute on a workday. Time it accurately — Bengaluru traffic varies hugely by hour.",
    tips: ["If trial time > 60 min, reconsider the flat before the agreement is signed."]
  },
  {
    id: "vehicle_insurance_check",
    title: "Verify vehicle insurance and PUC are valid",
    defaultWeek: 1,
    lagDays: 1,
    category: "Commute",
    depends_on: [],
    required_if: { vehicle: ["Two-wheeler", "Car"] },
    description: "Traffic police in Bengaluru check PUC and insurance regularly. Renew if expiring within 60 days.",
    tips: ["PUC centres are common near petrol stations — costs ~₹60 for two-wheelers."]
  },

  // ── Food & Daily Life ─────────────────────────────────────────────────────
  {
    id: "find_groceries",
    title: "Find nearest supermarket and local market",
    defaultWeek: 1,
    lagDays: 1,
    category: "Daily Life",
    depends_on: ["move_in"],
    required_if: {},
    description: "Identify a D-Mart or Reliance Smart for bulk shopping and a local sabzi mandi for fresh produce.",
    tips: ["Big Basket and Swiggy Instamart are widely used for daily needs."]
  },
  {
    id: "find_veg_food",
    title: "Find reliable Udupi/darshini restaurants nearby",
    defaultWeek: 1,
    lagDays: 1,
    category: "Daily Life",
    depends_on: ["move_in"],
    required_if: { diet: "Veg" },
    description: "Bengaluru has excellent South Indian vegetarian food. Udupi joints and darshinis serve fresh, cheap breakfasts and tiffin.",
    tips: ["Meals at darshinis cost ₹60–120. Great for quick weekday mornings."]
  },
  {
    id: "find_nonveg_food",
    title: "Locate non-veg restaurants and meat shops near home",
    defaultWeek: 1,
    lagDays: 1,
    category: "Daily Life",
    depends_on: ["move_in"],
    required_if: { diet: "Non-veg" },
    description: "Some areas (Jayanagar, Malleshwaram) are predominantly vegetarian. {{top_area_1}} has better non-veg options if you've picked it.",
    tips: ["Friday Market in many areas has fresh fish and meat at lower prices."]
  },
  {
    id: "find_vegan_food",
    title: "Find vegan-friendly restaurants and stores",
    defaultWeek: 1,
    lagDays: 1,
    category: "Daily Life",
    depends_on: ["move_in"],
    required_if: { diet: "Vegan" },
    description: "Bengaluru has a growing vegan scene — check Vegan Bengaluru groups on social media for nearby options.",
    tips: []
  },

  // ── Language & Local ──────────────────────────────────────────────────────
  {
    id: "learn_kannada_basics",
    title: "Learn 20 essential Kannada phrases",
    defaultWeek: 1,
    lagDays: 3,
    category: "Local",
    depends_on: [],
    required_if: { outside_karnataka: true },
    description: "Even 'Namaskara', 'Gottilla' (don't know), 'Hogi' (go) and numbers 1–10 will help enormously with autos, kirana shops, and neighbours.",
    tips: ["The app 'Learn Kannada' on Play Store is a quick starter."]
  },
  {
    id: "join_local_group",
    title: "Join a Bengali/North Indian community group in Bengaluru",
    defaultWeek: 2,
    lagDays: 2,
    category: "Local",
    depends_on: ["move_in"],
    required_if: { language_bengali: true },
    description: "Groups on Facebook, WhatsApp, and Meetup help with recommendations, movers, and settling in.",
    tips: ["Search 'Bengalis in Bangalore' on Facebook for active groups."]
  },
  {
    id: "emergency_contacts",
    title: "Save local emergency contacts and find nearest hospital",
    defaultWeek: 1,
    lagDays: 1,
    category: "Local",
    depends_on: [],
    required_if: {},
    description: "Save BBMP helpline (080-22221188), Bengaluru Police (100), nearest government hospital, and a trusted auto/cab contact.",
    tips: []
  },

  // ── Office / Work ─────────────────────────────────────────────────────────
  {
    id: "office_onboarding",
    title: "Complete HR onboarding at {{office_area}} office",
    defaultWeek: 2,
    lagDays: 2,
    category: "Admin",
    depends_on: ["sign_agreement"],
    required_if: {},
    description: "Submit address proof (agreement), bank details, PAN, and Aadhaar for payroll. Submit updated address as soon as Aadhaar update is done.",
    tips: ["Check if your company reimburses relocation costs — submit receipts early."]
  },
  {
    id: "update_hr_address",
    title: "Update HR records with new Bengaluru address",
    defaultWeek: 4,
    lagDays: 1,
    category: "Admin",
    depends_on: ["aadhaar_update"],
    required_if: {},
    description: "Once Aadhaar is updated, send a formal email to HR with updated address for Form 16 and salary slips.",
    tips: []
  }
];
