window.DATA_REDFLAGS = [
  // ── REGEX rules ──────────────────────────────────────────────────────────
  {
    id: "long_lockin",
    label: "Lock-in period too long",
    severity: "high",
    type: "regex",
    patterns: [
      "lock[- ]?in[^.]{0,30}(1[2-9]|2\\d)\\s*month",
      "lock[- ]?in[^.]{0,30}(one|two|three)\\s*year",
      "lock[- ]?in[^.]{0,30}\\d+\\s*year"
    ],
    explanation: "Lock-in beyond 11 months means you cannot vacate without penalty. Standard practice is 11 months. Negotiate down to 11 months or add a mutual break clause.",
    negotiationAsk: "Please reduce the lock-in period to 11 months or include a mutual break clause after 6 months with 2 months' notice.",
    riskPoints: 25
  },
  {
    id: "tenant_only_lockin",
    label: "Lock-in binds only the tenant (not the landlord)",
    severity: "high",
    type: "regex",
    patterns: [
      "tenant\\s+shall\\s+not\\s+(vacate|terminate|leave)[^.]*lock",
      "lock[- ]?in[^.]*only\\s+on\\s+the\\s+(tenant|lessee)",
      "tenant[^.]*not\\s+(vacate|terminate)[^.]*lock[- ]?in"
    ],
    explanation: "If the lock-in applies only to you and not the landlord, they can ask you to vacate while you cannot leave. Insist on a symmetric clause.",
    negotiationAsk: "Please make the lock-in period apply equally to both parties — if I cannot leave early, the landlord should also not be able to ask me to vacate during this period.",
    riskPoints: 20
  },
  {
    id: "no_registration_long_term",
    label: "Agreement ≥ 11 months without registration",
    severity: "medium",
    type: "compound",
    patterns: [
      "(1[1-9]|2\\d|eleven|twelve)\\s*(months?)?",
      "(not\\s+registered|unregistered|no\\s+registration)"
    ],
    explanation: "In Karnataka, rental agreements for 11 months or more must be registered at the Sub-Registrar Office. An unregistered long-term agreement is not legally enforceable.",
    negotiationAsk: "As this agreement is for 11+ months, please arrange for registration at the Sub-Registrar Office to ensure it is legally valid.",
    riskPoints: 15
  },
  {
    id: "no_notice_period",
    label: "No notice period / very short notice period",
    severity: "medium",
    type: "regex",
    patterns: [
      "notice[^.]{0,20}(zero|nil|no|0)\\s*(day|month|notice)",
      "(?:without|no)\\s+(?:any\\s+)?notice"
    ],
    explanation: "Without a reasonable notice period (typically 1–2 months), either party can be caught off-guard. Ensure a minimum 1-month notice for both sides.",
    negotiationAsk: "Please include a 1-month mutual notice period for termination by either party.",
    riskPoints: 10
  },
  {
    id: "arbitrary_eviction",
    label: "Landlord can terminate without reason",
    severity: "high",
    type: "regex",
    patterns: [
      "landlord[^.]{0,60}terminate[^.]{0,60}(any|no)\\s*(reason|cause)",
      "landlord[^.]{0,60}without[^.]{0,30}(reason|cause|assigning)",
      "owner[^.]{0,60}(evict|vacate)[^.]{0,60}(at\\s*(his|her|their)\\s*discretion|without\\s*reason)"
    ],
    explanation: "A clause allowing the landlord to evict you without reason during the tenancy is one-sided. This should be replaced with specific, mutually agreed termination conditions.",
    negotiationAsk: "Please remove the clause allowing termination without reason and replace with standard termination conditions.",
    riskPoints: 20
  },
  {
    id: "maintenance_on_tenant",
    label: "Major repairs assigned to tenant",
    severity: "medium",
    type: "regex",
    patterns: [
      "tenant[^.]{0,80}(major|structural)[^.]{0,80}(bear|responsible|liable|pay)",
      "(structural|major)[^.]{0,80}(maintenance|repair)[^.]{0,80}(tenant|lessee)[^.]{0,30}(bear|responsible|pay)",
      "(major|structural)\\s+(repair|maintenance)\\s+shall\\s+be\\s+(borne|paid|met)\\s+by\\s+the\\s+(tenant|lessee)"
    ],
    explanation: "Structural repairs and major maintenance are legally the landlord's responsibility. You should only be responsible for minor upkeep like painting touch-ups or bulb replacements.",
    negotiationAsk: "Please clarify that tenant is only responsible for minor day-to-day maintenance, not major or structural repairs.",
    riskPoints: 10
  },
  {
    id: "painting_deduction",
    label: "Fixed painting/whitewash deduction from deposit",
    severity: "medium",
    type: "regex",
    patterns: [
      "deducted[^.]{0,80}(painting|whitewash)",
      "(painting|whitewash|repaint)[^.]{0,80}deduct",
      "deposit[^.]{0,80}(painting|whitewash)",
      "paint(ing)?[^.]{0,40}(deduct|charges?)[^.]{0,30}deposit"
    ],
    explanation: "If you have lived there for a full year, normal wear and paint fading are expected. A fixed deduction for painting regardless of condition is unfair.",
    negotiationAsk: "Please remove the fixed painting deduction clause. Any painting costs should only be charged if damage beyond normal wear is documented at move-out.",
    riskPoints: 10
  },

  // ── NUMERIC rules ─────────────────────────────────────────────────────────
  {
    id: "excess_deposit",
    label: "Deposit exceeds 6 months' rent",
    severity: "high",
    type: "numeric",
    extractPattern: "(?:security\\s+)?deposit[^₹\\d]{0,30}(?:of\\s+)?(?:rs\\.?|inr|₹)?\\s*([\\d,]+)",
    condition: "deposit > rent * 6",
    explanation: "Standard deposit in Bengaluru is 2–3 months' rent (up to 6 months for furnished). Anything beyond 6 months is excessive.",
    negotiationAsk: "Please reduce the deposit to 2–3 months' rent (₹{rentX3}). Deposits above 6 months' rent are not standard.",
    riskPoints: 20
  },
  {
    id: "high_annual_increase",
    label: "Annual rent increase > 10%",
    severity: "high",
    type: "numeric",
    extractPattern: "(?:increased|increment|escalat|annual|yearly)[^%\\d]{0,80}[\\(]?([\\d.]+)[\\)]?\\s*%",
    condition: "increase > 10",
    explanation: "Annual increases above 10% compound quickly and can make the flat unaffordable. 5% is the market norm in Bengaluru.",
    negotiationAsk: "Please reduce the annual rent increment to 5% or less, which is the market standard.",
    riskPoints: 20
  },
  {
    id: "medium_annual_increase",
    label: "Annual rent increase 5–10% (above typical)",
    severity: "medium",
    type: "numeric",
    extractPattern: "(?:increased|increment|escalat|annual|yearly)[^%\\d]{0,80}[\\(]?([\\d.]+)[\\)]?\\s*%",
    condition: "increase > 5 && increase <= 10",
    explanation: "Annual increases of 5–10% are above the typical 5% norm and may strain your budget over a 2–3 year stay.",
    negotiationAsk: "Please consider capping the annual increment at 5%, which is the standard market rate in Bengaluru.",
    riskPoints: 10
  }
];
