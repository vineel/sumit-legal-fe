export const intakeSchema = [
  {
    clause_type: "Nature of NDA (Mutual vs. Unilateral)",
    question_text: "Will both parties be sharing confidential information (mutual), or only one party (unilateral)?",
    field_required: true,
    input_required_for_drafting: true,
    available_variants: ["Standard Mutual", "Flexible Mutual with Carveouts", "Unilateral Discloser-Only"],
    additional_notes:
      "Mutual NDAs provide symmetrical protection. Unilateral NDAs favor the Discloser and should be used when only one side shares sensitive information.",
  },
  {
    clause_type: "Definitions",
    question_text: "What level of specificity should be used to define 'Confidential Information'?",
    field_required: true,
    input_required_for_drafting: true,
    available_variants: ["Comprehensive", "Lean Definitions", "Minimal Definitions"],
    additional_notes:
      "Comprehensive definitions cover a broader scope of information. Minimal definitions are narrower and may exclude oral or unmarked disclosures.",
  },
  {
    clause_type: "Confidentiality Obligations",
    question_text: "What standard of care should apply for protecting Confidential Information?",
    field_required: true,
    input_required_for_drafting: true,
    available_variants: [
      "Mutual Balanced",
      "Strict Mutual (Enhanced Care Standard)",
      "Unilateral Recipient Obligations",
    ],
    additional_notes: "Strict care standards offer stronger protection but may be burdensome in practice.",
  },
  {
    clause_type: "Purpose of Disclosure",
    question_text: "What is the intended purpose for sharing Confidential Information under this NDA?",
    field_required: true,
    input_required_for_drafting: true,
    available_variants: ["Specific Purpose", "General Purpose", "Internal Evaluation Only"],
    additional_notes:
      "A specific purpose restricts use more tightly. Internal use restrictions are often favored by Disclosers in early-stage or sensitive discussions.",
  },
  {
    clause_type: "Use Restrictions",
    question_text: "How tightly should the Recipient's use of Confidential Information be restricted?",
    field_required: true,
    input_required_for_drafting: true,
    available_variants: ["Purpose-Bound Use", "Internal Use Only", "Restricted Commercial Use"],
    additional_notes:
      "Use restrictions directly impact enforceability in competitive situations. Tighter controls are common in tech or IP-sensitive deals.",
  },
  // Additional clauses would be added here in a complete implementation
]
