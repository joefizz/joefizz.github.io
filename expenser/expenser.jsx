const { useState } = React;

const QUESTIONS = {
  entity: {
    id: "entity",
    text: "Who is paying or being reimbursed?",
    options: [
      { label: "Company employee, director, or shareholder-employee", value: "company_employee" },
      { label: "Self-employed person or look-through company owner", value: "self_employed" },
      { label: "Not sure yet", value: "unknown" },
    ],
  },
  item: {
    id: "item",
    text: "What kind of consumable expense is it?",
    options: [
      { label: "Light refreshment, coffee, tea, snack, or non-alcoholic drink", value: "light" },
      { label: "Meal or substantial food", value: "meal" },
      { label: "Alcoholic drink, wine, beer, spirits, or bar tab", value: "alcohol" },
      { label: "Food or drink gift, hamper, voucher, or reward", value: "gift" },
      { label: "Catering or food supplied for a group", value: "catering" },
    ],
  },
  who: {
    id: "who",
    text: "Who received or consumed it?",
    options: [
      { label: "Just me", value: "solo" },
      { label: "Employees, directors, or shareholder-employees", value: "staff" },
      { label: "Clients, suppliers, prospects, or other business contacts", value: "contacts" },
      { label: "A mix of staff and business contacts", value: "mixed" },
      { label: "The public or visitors at a trade display/open event", value: "public" },
    ],
  },
  associates: {
    id: "associates",
    text: "Were any family members, partners, or associated people included?",
    options: [
      { label: "No, only business participants", value: "none" },
      { label: "Yes, family or partners of staff, directors, or shareholders", value: "staff_family" },
      { label: "Yes, family or partners of clients or business contacts", value: "contact_family" },
      { label: "Yes, a mix of family or associated people", value: "mixed_family" },
    ],
  },
  setting: {
    id: "setting",
    text: "What was the real setting?",
    options: [
      { label: "Business travel for work", value: "travel" },
      { label: "Conference, training, or education event lasting 4+ hours", value: "conference_long" },
      { label: "Short event, meeting break, or training under 4 hours", value: "conference_short" },
      { label: "At our business premises as light refreshments or a working duty", value: "premises_work" },
      { label: "Staff social event, celebration, party, or team function", value: "staff_social" },
      { label: "Offsite business meeting or relationship-building with contacts", value: "offsite_business" },
      { label: "Public promotion, trade display, or open event", value: "public_promo" },
      { label: "Employee reward, voucher, hamper, or choice-based benefit", value: "reward" },
      { label: "Personal, social, convenience, or no clear business purpose", value: "personal" },
    ],
  },
  evidence: {
    id: "evidence",
    text: "What evidence can you keep?",
    options: [
      { label: "Receipt plus attendees, business purpose, date, and event details", value: "strong" },
      { label: "Receipt only", value: "basic" },
      { label: "No reliable record", value: "weak" },
    ],
  },
};

const SOURCE_LINKS = [
  {
    title: "IRD entertainment expenses",
    url: "https://www.ird.govt.nz/income-tax/income-tax-for-businesses-and-organisations/types-of-business-expenses/entertainment-expenses",
  },
  {
    title: "IRD entertainment guide IR268",
    url: "https://www.ird.govt.nz/-/media/project/ir/home/documents/forms-and-guides/ir200---ir299/ir268/ir268-2024.pdf",
  },
  {
    title: "IRD meal expenses",
    url: "https://www.ird.govt.nz/income-tax/income-tax-for-businesses-and-organisations/types-of-business-expenses/meal-expenses",
  },
  {
    title: "IRD GST entertainment adjustments",
    url: "https://www.ird.govt.nz/gst/gst-adjustments/other-gst-debit-adjustments",
  },
  {
    title: "IRD meal and clothing allowances",
    url: "https://www.ird.govt.nz/employing-staff/deductions-from-other-payments/allowances/meal-and-clothing-allowances",
  },
  {
    title: "IRD FBT rates",
    url: "https://www.ird.govt.nz/employing-staff/deductions-from-other-payments/fringe-benefit-tax/calculating/how-fbt-is-calculated/calculation-options-and-rates",
  },
];

function getFlow(answers) {
  const flow = ["entity", "item", "who", "associates", "setting", "evidence"];
  return flow.slice(0, flow.findIndex(id => answers[id] === undefined) + 1 || flow.length);
}

function getQuestionOptions(qId, answers) {
  if (qId !== "setting") return QUESTIONS[qId].options;

  const all = QUESTIONS.setting.options;
  if (answers.item === "gift") {
    return all.filter(opt => ["reward", "offsite_business", "public_promo", "personal"].includes(opt.value));
  }
  if (answers.who === "public") {
    return all.filter(opt => ["public_promo", "conference_long", "conference_short", "personal"].includes(opt.value));
  }
  if (answers.who === "solo") {
    return all.filter(opt => !["staff_social", "public_promo", "reward"].includes(opt.value));
  }
  if (answers.who === "contacts") {
    return all.filter(opt => !["staff_social", "reward", "premises_work"].includes(opt.value));
  }
  return all;
}

function percentTag(value) {
  if (value === 100) return { label: "100% deductible", type: "green" };
  if (value === 50) return { label: "50% deductible", type: "gold" };
  if (value === 0) return { label: "Not claimable", type: "red" };
  return { label: "Apportion", type: "blue" };
}

function recordRisk(evidence) {
  if (evidence === "strong") return "Low record risk: keep the tax invoice, attendee list, business purpose, date, and event or travel details.";
  if (evidence === "basic") return "Medium record risk: a receipt helps, but IRD also expects the people entertained, date, and reason. Add a note now while it is fresh.";
  return "High record risk: without reliable records, even a technically deductible expense can be hard to defend.";
}

function associationNotes(associates, setting) {
  if (associates === "none") return null;
  if (setting === "public_promo") {
    return {
      improve: "Family or associated people are less of a problem where the public genuinely had equal access. Keep evidence that insiders did not receive better access than the public.",
      fbt: "FBT is less likely where the benefit is genuinely public promotional entertainment, not an employee-only or associate-only benefit.",
      evidence: "Record any family/associated attendees and keep proof the public could access the same food or drink on the same terms.",
      tag: { label: "Public access", type: "green" },
    };
  }
  if (associates === "contact_family") {
    return {
      improve: "Client or contact family can still be business entertainment, but the commercial purpose needs to be real. Keep the business attendee names and apportion anything that is clearly private or excessive.",
      fbt: "No FBT for non-employee client/contact family, but associated-person and private-benefit facts still matter.",
      evidence: "Record family/partner attendees separately from the business contact, and note why their attendance was connected to the business purpose.",
      tag: { label: "Contact family", type: "gold" },
    };
  }
  return {
    improve: "For family or partners of staff, directors, or shareholders, apportion private attendees unless they are genuinely part of a staff function or public/open event. A director's family portion is especially hard to defend as business unless the facts are strong.",
    fbt: "FBT risk increases where a benefit is provided to an employee's or shareholder-employee's associate, including a partner or family member.",
    evidence: "Record all associated-person attendees by name and relationship, then split private, employee-associate, client, and public portions on a reasonable basis.",
    tag: { label: "Apportion family", type: "red" },
  };
}

function result({
  verdict,
  title,
  summary,
  deduction,
  gst,
  fbt,
  improve,
  evidence,
  basis,
  tags,
}) {
  return {
    verdict,
    title,
    summary,
    deduction,
    gst,
    fbt,
    improve,
    evidence,
    basis,
    tags,
  };
}

function getResult(answers) {
  const { entity, item, who, associates, setting, evidence } = answers;
  const isSelfEmployed = entity === "self_employed";
  const hasEmployees = who === "staff" || who === "mixed";
  const hasContacts = who === "contacts" || who === "mixed";
  const isLight = item === "light";
  const isGift = item === "gift";
  const assoc = associationNotes(associates, setting);
  function finalize(base) {
    if (!assoc) return result(base);
    return result({
      ...base,
      fbt: `${base.fbt} ${assoc.fbt}`,
      improve: `${base.improve} ${assoc.improve}`,
      evidence: `${base.evidence} ${assoc.evidence}`,
      tags: [...base.tags, assoc.tag],
    });
  }

  if (setting === "personal") {
    return finalize({
      verdict: "no",
      title: "Do not claim it as a company expense",
      summary: "If the expense is private, social, convenient, or not connected to earning business income, it should not be deducted just because the business card paid for it.",
      deduction: "0% income-tax deduction. Code it to drawings/shareholder current account or repay the company if it was private.",
      gst: "No GST claim. IRD says GST follows the income-tax treatment for meal expenses, and private expenses are not claimable.",
      fbt: hasEmployees || who === "solo" ? "FBT or PAYE may be relevant if an employee or shareholder-employee received a private non-cash benefit." : "No FBT if the benefit was not provided to an employee, but it still is not a business deduction.",
      improve: "To make a future expense defensible, connect it to a real business activity before spending: a documented client meeting, a qualifying work trip, a qualifying training event, or light refreshments provided on business premises. Do not retrofit a private purchase after the fact.",
      evidence: recordRisk(evidence),
      basis: "IRD IR268: private entertainment is not deductible. IRD meal expenses: GST follows income-tax treatment.",
      tags: [percentTag(0), { label: "No GST", type: "red" }, { label: "Private risk", type: "red" }],
    });
  }

  if (setting === "travel") {
    if (hasContacts || setting === "staff_social") {
      return finalize({
        verdict: "half",
        title: "Business travel with entertainment: 50% claimable",
        summary: "Food and drink while travelling for business is normally fully deductible, but IRD reduces it to 50% when the meal involves an existing or potential business contact, or is a celebration or similar non-working occasion.",
        deduction: "50% income-tax deduction for the food and drink entertainment component.",
        gst: "Practically, only 50% of the GST should remain claimed after the annual entertainment adjustment.",
        fbt: "Generally no FBT for 50% deductible business entertainment unless the employee can choose when and where to enjoy it, or the benefit is outside New Zealand and not part of their duties.",
        improve: "If the travel meal is just for the travelling employee while they are working, keep it separate from client entertainment. If you invite a contact, document the commercial purpose and accept the 50% entertainment treatment.",
        evidence: recordRisk(evidence),
        basis: "IRD entertainment guidance: business travel meals are 100%, except business-contact meals, celebrations, receptions, or similar events are 50%.",
        tags: [percentTag(50), { label: "GST 50%", type: "gold" }, { label: "FBT usually no", type: "green" }],
      });
    }

    return finalize({
      verdict: "yes",
      title: "Business travel consumable: 100% claimable",
      summary: "An employee's meal or drink while travelling on business is treated as completely business related, unless it becomes client entertainment or a celebration.",
      deduction: "100% income-tax deduction.",
      gst: "100% GST input tax claim if the business is GST-registered and has the required tax invoice/record.",
      fbt: "No FBT where the food or drink is received in the course of employment duties.",
      improve: "Keep the travel purpose clear: itinerary, meeting reason, overnight/work-away details, and receipt. Avoid mixing private companions or celebration costs into the same claim.",
      evidence: recordRisk(evidence),
      basis: "IRD entertainment guidance: meals an employee buys while travelling on business are 100% deductible unless the exceptions apply.",
      tags: [percentTag(100), { label: "GST 100%", type: "green" }, { label: "No FBT", type: "green" }],
    });
  }

  if (setting === "conference_long") {
    return finalize({
      verdict: "yes",
      title: "Training or conference consumable: 100% claimable",
      summary: "Food and drink at a conference, education course, or similar event lasting at least 4 consecutive hours is 100% deductible, unless the event is mainly entertainment.",
      deduction: "100% income-tax deduction for food and drink connected with the qualifying event.",
      gst: "100% GST input tax claim if GST-registered and the tax invoice/record supports the claim.",
      fbt: "No FBT where the employee receives it as part of attending the work event.",
      improve: "For the cleanest position, keep the event agenda showing at least 4 consecutive hours excluding meal breaks. If buying separately, keep the receipt with the agenda and note why the refreshment was part of attending the event.",
      evidence: recordRisk(evidence),
      basis: "IRD entertainment guidance: food and drink at a 4+ hour conference, education course, or similar event is 100% deductible unless mainly entertainment.",
      tags: [percentTag(100), { label: "GST 100%", type: "green" }, { label: "Training", type: "green" }],
    });
  }

  if (setting === "conference_short") {
    if (isLight) {
      return finalize({
        verdict: "yes",
        title: "Light refreshments are usually 100% claimable",
        summary: "IRD treats light refreshments, such as morning or afternoon tea, more favourably than substantial meals. They can be 100% deductible even where the event is shorter than 4 hours.",
        deduction: "100% income-tax deduction where it is genuinely a light refreshment connected with the business event.",
        gst: "100% GST input tax claim if GST-registered and records support the business purpose.",
        fbt: "No FBT where it is consumed as part of the work event or duties.",
        improve: "Keep it light and ordinary: coffee, tea, biscuits, fruit, or a small snack. A full meal, alcohol, or social drinks after the event moves toward 50% entertainment or private treatment.",
        evidence: recordRisk(evidence),
        basis: "IRD IR268: light refreshments like morning and afternoon teas are 100% deductible, regardless of conference length.",
        tags: [percentTag(100), { label: "GST 100%", type: "green" }, { label: "Light refreshment", type: "green" }],
      });
    }

    return finalize({
      verdict: "half",
      title: "Short-event food or drink: usually 50% claimable",
      summary: "A substantial meal or social drink connected with a short event usually falls back into the food-and-drink entertainment rules unless another 100% exception applies.",
      deduction: "Usually 50% income-tax deduction if there is a real business purpose; 0% if it is just personal convenience.",
      gst: "Usually net 50% GST after the annual entertainment adjustment.",
      fbt: "Generally no FBT for 50% deductible business entertainment unless it is a choice-based employee benefit or outside NZ and not part of duties.",
      improve: "To improve the position next time, structure the session as a genuine 4+ hour training/conference, keep refreshments light, or keep the purchase tied to business travel. Buying for a business contact may support a business entertainment claim, but it normally gives 50%, not 100%.",
      evidence: recordRisk(evidence),
      basis: "IRD IR268: food and drink at a 4+ hour conference is 100%; offsite food and drink is generally 50%.",
      tags: [percentTag(50), { label: "GST 50%", type: "gold" }, { label: "Check facts", type: "blue" }],
    });
  }

  if (setting === "premises_work") {
    if (isLight) {
      return finalize({
        verdict: "yes",
        title: "On-premises light refreshment: 100% claimable",
        summary: "Light refreshments provided at work, such as coffee, tea, biscuits, fruit, or morning/afternoon tea, are 100% deductible.",
        deduction: "100% income-tax deduction.",
        gst: "100% GST input tax claim if GST-registered and records support the purchase.",
        fbt: "No FBT where staff can only consume it as part of work, at the set time/place arranged by the employer.",
        improve: "Keep the office supply ordinary and available for work purposes. Avoid treating alcohol, restaurant meals, or private take-home groceries as office refreshments.",
        evidence: recordRisk(evidence),
        basis: "IRD IR268: light refreshments at work are 100% deductible. IRD FBT guide gives no FBT for set-time staff drinks in the cafeteria.",
        tags: [percentTag(100), { label: "GST 100%", type: "green" }, { label: "No FBT", type: "green" }],
      });
    }

    if (who === "staff" || who === "mixed") {
      return finalize({
        verdict: "half",
        title: "Food at work: 50% unless a specific 100% rule applies",
        summary: "Food and drink at business premises is only 50% deductible when it is a social event or supplied in a senior/restricted dining area, except for light refreshments or light meals consumed as part of duties.",
        deduction: "Usually 50% income-tax deduction. A light working meal for senior managers as part of duties may be 100%.",
        gst: "Usually net 50% GST after the annual entertainment adjustment.",
        fbt: "Generally no FBT where the staff consume it at a set work function or as part of duties. FBT risk rises if it is a reward or they can choose when/where to enjoy it.",
        improve: "For a stronger 100% position, keep it to light refreshments, connect it to duties, and record the work purpose. For staff parties or substantial catering, assume 50%.",
        evidence: recordRisk(evidence),
        basis: "IRD IR268: light refreshments are 100%; other food and drink at work social events or restricted senior areas is 50%, with a light-duty exception.",
        tags: [percentTag(50), { label: "GST 50%", type: "gold" }, { label: "FBT usually no", type: "green" }],
      });
    }
  }

  if (setting === "staff_social") {
    return finalize({
      verdict: "half",
      title: "Staff function or social consumables: 50% claimable",
      summary: "Food and drink for staff social events, celebrations, parties, or team functions has a significant private element, so the entertainment rules generally limit the deduction to 50%.",
      deduction: "50% income-tax deduction.",
      gst: "Net 50% GST after the annual entertainment adjustment.",
      fbt: "Usually no FBT for 50% deductible staff entertainment at a set event. FBT can apply if employees can choose when and where to enjoy the benefit, or for certain overseas/non-duty benefits.",
      improve: "Make it easier to defend by inviting the relevant team consistently, recording the business reason such as morale, retention, training wrap-up, or project completion, and not disguising private meals as staff functions.",
      evidence: recordRisk(evidence),
      basis: "IRD entertainment guidance: social-event food and drink is 50%; 50% deductible business entertainment is generally not subject to FBT unless the choice/outside-NZ exception applies.",
      tags: [percentTag(50), { label: "GST 50%", type: "gold" }, { label: "FBT usually no", type: "green" }],
    });
  }

  if (setting === "offsite_business") {
    if (isGift && who !== "solo") {
      if (hasEmployees) {
        return finalize({
          verdict: "yes",
          title: "Employee reward: 100% deductible, FBT may apply",
          summary: "A reward, voucher, hamper, or choice-based benefit received by an employee because of their work is generally deductible to the business, but it can be an unclassified fringe benefit.",
          deduction: "100% income-tax deduction if it is employment-related and not private drawings.",
          gst: "GST may be claimable on acquisition, but GST on taxable fringe benefits is handled through the FBT return where applicable.",
          fbt: "FBT may apply. The single FBT rate is 63.93%; small unclassified-benefit thresholds may remove FBT if the per-employee and annual limits are not exceeded.",
          improve: "Use this deliberately for rewards, not routine meals. Track per-employee and annual unclassified-benefit totals, especially for shareholder-employees, so you do not accidentally cross FBT thresholds.",
          evidence: recordRisk(evidence),
          basis: "IRD entertainment and FBT guidance: employee rewards such as restaurant vouchers are 100% deductible and liable for FBT unless an exemption/threshold applies.",
          tags: [percentTag(100), { label: "FBT possible", type: "red" }, { label: "Track limits", type: "gold" }],
        });
      }

      return finalize({
        verdict: "half",
        title: "Food or drink gift to contacts: 50% claimable",
        summary: "Food and drink gifts that benefit the business but are enjoyed privately by the recipient are generally only 50% deductible.",
        deduction: "50% income-tax deduction for the food and drink portion. Non-food items in a hamper may be 100% if separately identifiable.",
        gst: "Net 50% GST for the food and drink portion after the annual entertainment adjustment.",
        fbt: "No FBT for gifts to non-employees, but associated-person rules can matter.",
        improve: "Separate food/drink from non-food items on the invoice where possible. Branded non-food promotional items are often cleaner than wine, food hampers, or restaurant vouchers.",
        evidence: recordRisk(evidence),
        basis: "IRD IR268: food and drink gifts enjoyed privately by recipients are 50%; non-food items may be separated and treated differently.",
        tags: [percentTag(50), { label: "GST 50%", type: "gold" }, { label: "Separate items", type: "blue" }],
      });
    }

    if (who === "solo") {
      if (isSelfEmployed) {
        return finalize({
          verdict: "no",
          title: "Own food or drink: usually not claimable",
          summary: "For self-employed people and look-through company owners, your own meals are usually private. A narrow exception can apply for extra costs caused by remote locations or unusual hours.",
          deduction: "Usually 0%. Only the extra cost may be deductible where the work requirements force additional meal costs.",
          gst: "No GST claim unless the income-tax deduction is available; GST follows the income-tax treatment for meal expenses.",
          fbt: "No FBT for self-employed/LTC treatment, but the expense can still be private and non-deductible.",
          improve: "Use a company/employee reimbursement model only where it reflects the real legal relationship. Otherwise, claim only genuinely additional costs from remote work or unusual hours and keep evidence of why the cost was unavoidable.",
          evidence: recordRisk(evidence),
          basis: "IRD meal expenses and IS 21/06: self-employed meal expenses are generally private, with a narrow extra-cost exception.",
          tags: [percentTag(0), { label: "No GST", type: "red" }, { label: "Narrow exception", type: "blue" }],
        });
      }

      return finalize({
        verdict: "info",
        title: "Solo local consumable: only claim if it fits a work exception",
        summary: "A solo coffee, drink, or meal during an ordinary work day is weak as a company claim unless it is part of business travel, a qualifying training/conference event, an allowance/reimbursement exemption, or genuinely light refreshments provided by the employer.",
        deduction: "0% to 100% depending on the real exception. Without an exception, treat it as private or an employee benefit rather than a normal company expense.",
        gst: "GST follows the deductible treatment. If the expense is not deductible, do not claim GST.",
        fbt: "If the company directly provides a private benefit to an employee/shareholder-employee, FBT can be relevant. If it reimburses a personal expense in cash, PAYE treatment may be relevant instead.",
        improve: "For future claims, anchor the spend to a recognised bucket: business travel, 4+ hour training, light refreshments normally provided by the employer, or genuine business entertainment with another person. Buying for a real business contact may support 50% entertainment treatment, but do not add a person just to manufacture a claim.",
        evidence: recordRisk(evidence),
        basis: "IRD meal expenses: own meals are usually private unless a specific employment/travel/training/allowance rule applies.",
        tags: [{ label: "Depends", type: "blue" }, { label: "GST follows", type: "blue" }, { label: "Document purpose", type: "gold" }],
      });
    }

    return finalize({
      verdict: "half",
      title: "Offsite business entertainment: 50% claimable",
      summary: "Food and drink away from business premises for clients, suppliers, prospects, or staff is generally business entertainment with a significant private element.",
      deduction: "50% income-tax deduction.",
      gst: "Net 50% GST after the annual entertainment adjustment.",
      fbt: hasEmployees ? "Generally no FBT for 50% deductible business entertainment unless staff can choose when/where to enjoy it, or it is outside NZ and not part of their duties." : "No FBT for benefits to non-employees such as clients or suppliers.",
      improve: "The defensible approach is to make the commercial purpose obvious: invite a genuine business contact, note the agenda or relationship, and keep attendees. Buying a drink for another person can make a private solo drink into business entertainment only if that person is genuinely being entertained for business.",
      evidence: recordRisk(evidence),
      basis: "IRD IR268: offsite food and drink is 50% deductible. Client/contact entertainment is a common 50% entertainment expense.",
      tags: [percentTag(50), { label: "GST 50%", type: "gold" }, { label: "Business purpose", type: "blue" }],
    });
  }

  if (setting === "public_promo") {
    return finalize({
      verdict: "yes",
      title: "Public promotion consumables: usually 100% claimable",
      summary: "Entertainment that promotes your business to the public can be 100% deductible if the public has the same opportunity to enjoy it as employees, contacts, or associated people.",
      deduction: "100% income-tax deduction where public access is genuinely equal. If insiders get better access, reduce to 50%.",
      gst: "100% GST input tax claim if the 100% deduction applies and records support the purchase.",
      fbt: "No FBT where the public promotion is not an employee-only benefit.",
      improve: "Keep evidence that the public had equal access: event listing, booth materials, photos, sampling policy, and stock used. Coffee or snacks secondary to a public trade display is a strong fact pattern.",
      evidence: recordRisk(evidence),
      basis: "IRD entertainment guidance: public promotional entertainment and secondary trade-display entertainment can be 100% deductible if public access is not less than insiders' access.",
      tags: [percentTag(100), { label: "GST 100%", type: "green" }, { label: "Public access", type: "green" }],
    });
  }

  if (setting === "reward" || isGift) {
    if (hasEmployees || who === "solo") {
      return finalize({
        verdict: "yes",
        title: "Employee reward: 100% deductible, FBT may apply",
        summary: "A reward, voucher, hamper, or choice-based benefit received by an employee because of their work is generally deductible to the business, but it can be an unclassified fringe benefit.",
        deduction: "100% income-tax deduction if it is employment-related and not private drawings.",
        gst: "GST may be claimable on acquisition, but GST on taxable fringe benefits is handled through the FBT return where applicable.",
        fbt: "FBT may apply. The single FBT rate is 63.93%; small unclassified-benefit thresholds may remove FBT if the per-employee and annual limits are not exceeded.",
        improve: "Use this deliberately for rewards, not routine meals. Track per-employee and annual unclassified-benefit totals, especially for shareholder-employees, so you do not accidentally cross FBT thresholds.",
        evidence: recordRisk(evidence),
        basis: "IRD entertainment and FBT guidance: employee rewards such as restaurant vouchers are 100% deductible and liable for FBT unless an exemption/threshold applies.",
        tags: [percentTag(100), { label: "FBT possible", type: "red" }, { label: "Track limits", type: "gold" }],
      });
    }

    return finalize({
      verdict: "half",
      title: "Food or drink gift to contacts: 50% claimable",
      summary: "Food and drink gifts that benefit the business but are enjoyed privately by the recipient are generally only 50% deductible.",
      deduction: "50% income-tax deduction for the food and drink portion. Non-food items in a hamper may be 100% if separately identifiable.",
      gst: "Net 50% GST for the food and drink portion after the annual entertainment adjustment.",
      fbt: "No FBT for gifts to non-employees, but associated-person rules can matter.",
      improve: "Separate food/drink from non-food items on the invoice where possible. Branded non-food promotional items are often cleaner than wine, food hampers, or restaurant vouchers.",
      evidence: recordRisk(evidence),
      basis: "IRD IR268: food and drink gifts enjoyed privately by recipients are 50%; non-food items may be separated and treated differently.",
      tags: [percentTag(50), { label: "GST 50%", type: "gold" }, { label: "Separate items", type: "blue" }],
    });
  }

  return finalize({
    verdict: "info",
    title: "Needs apportionment or advice",
    summary: "This fact pattern does not fit one clean bucket. Split the receipt between 100%, 50%, and non-claimable parts where possible.",
    deduction: "Apportion based on the real use and recipients. Do not force the whole receipt into the most favourable category.",
    gst: "GST follows the deductible treatment. Entertainment expenses that are only 50% deductible need an annual GST debit adjustment for the non-deductible amount.",
    fbt: "FBT depends on whether employees received a benefit, whether it was a choice-based benefit, and whether an exemption or threshold applies.",
    improve: "Separate receipts next time: office refreshments, client entertainment, staff rewards, and private items should be paid and recorded separately.",
    evidence: recordRisk(evidence),
    basis: "IRD guidance requires judging the category and keeping records; mixed expenses should be split on a reasonable basis.",
    tags: [{ label: "Apportion", type: "blue" }, { label: "GST follows", type: "blue" }, { label: "Check FBT", type: "gold" }],
  });
}

const VERDICT_STYLES = {
  yes: { bg: "#eef7f2", border: "#2d6a4f", tagColor: "#2d6a4f", label: "Strong position" },
  no: { bg: "#fff0ed", border: "#c84b2f", tagColor: "#c84b2f", label: "Do not claim" },
  half: { bg: "#fff8e8", border: "#b8872f", tagColor: "#9b6b17", label: "Entertainment limit" },
  info: { bg: "#edf4fb", border: "#426c99", tagColor: "#426c99", label: "Depends" },
};

const TAG_STYLES = {
  green: { bg: "#e1f0e8", color: "#285f47" },
  red: { bg: "#f9ded8", color: "#ad3e28" },
  gold: { bg: "#f9edc9", color: "#8a6419" },
  grey: { bg: "#ede8dc", color: "#6f685f" },
  blue: { bg: "#e2edf7", color: "#426c99" },
};

function App() {
  const [answers, setAnswers] = useState({});

  const flow = getFlow(answers);
  const completedSteps = flow.filter(qId => answers[qId] !== undefined);
  const nextQId = flow.find(qId => answers[qId] === undefined);
  const resultData = nextQId === undefined ? getResult(answers) : null;
  const totalEstimate = 6;
  const progress = resultData ? 100 : Math.round((completedSteps.length / totalEstimate) * 100);

  function answer(qId, value) {
    setAnswers(prev => {
      const next = { ...prev, [qId]: value };
      const idx = flow.indexOf(qId);
      flow.slice(idx + 1).forEach(id => delete next[id]);
      return next;
    });
  }

  function restart() {
    setAnswers({});
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f0e8",
      fontFamily: "'Georgia', serif",
      padding: "40px 20px 80px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 640 }}>
        <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a7468", marginBottom: 10, fontFamily: "monospace" }}>
          New Zealand tax guide - IRD entertainment, GST, and FBT rules
        </p>
        <h1 style={{ fontSize: "clamp(1.9rem, 6vw, 3rem)", lineHeight: 1.12, color: "#1a1a18", marginBottom: 10 }}>
          Consumable expense <em style={{ color: "#c84b2f", fontStyle: "italic" }}>checker</em>
        </h1>
        <div style={{ width: 36, height: 2, background: "#c84b2f", margin: "16px auto" }} />
        <p style={{ fontSize: 12, color: "#6b6258", letterSpacing: "0.03em", lineHeight: 1.7, fontFamily: "monospace" }}>
          Check food, coffee, drinks, catering, gifts, GST, FBT, and record risk.
        </p>
      </div>

      <div style={{ maxWidth: 640, width: "100%", marginBottom: 24 }}>
        <div style={{ height: 2, background: "#ede8dc", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "#c84b2f", transition: "width 0.4s ease", borderRadius: 1 }} />
        </div>
      </div>

      {completedSteps.length > 0 && (
        <div style={{ maxWidth: 640, width: "100%", marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {completedSteps.map(qId => {
            const q = QUESTIONS[qId];
            const opt = q.options.find(o => o.value === answers[qId]);
            return (
              <div key={qId} style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                alignItems: "center",
                gap: 12,
                background: "white",
                border: "1px solid #c8c0b0",
                borderRadius: 2,
                padding: "10px 14px",
                fontSize: 11,
                fontFamily: "monospace",
              }}>
                <span style={{ color: "#7a7468" }}>{q.text}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ color: "#1a1a18", fontWeight: 600, maxWidth: 270, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opt?.label}</span>
                  <button
                    onClick={() => setAnswers(prev => {
                      const next = { ...prev };
                      const idx = flow.indexOf(qId);
                      flow.slice(idx).forEach(id => delete next[id]);
                      return next;
                    })}
                    style={{ background: "none", border: "none", color: "#c84b2f", cursor: "pointer", fontSize: 11, padding: "0 4px", fontFamily: "monospace" }}
                  >
                    edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!resultData && nextQId && (
        <div style={{
          background: "white",
          border: "1px solid #c8c0b0",
          borderRadius: 2,
          maxWidth: 640,
          width: "100%",
          padding: 32,
          boxShadow: "4px 4px 0 #ede8dc",
          animation: "fadeIn 0.25s ease",
        }}>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a7468", marginBottom: 10, fontFamily: "monospace" }}>
            Question {completedSteps.length + 1}
          </p>
          <p style={{ fontSize: "1.2rem", lineHeight: 1.4, color: "#1a1a18", marginBottom: 24 }}>
            {QUESTIONS[nextQId].text}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {getQuestionOptions(nextQId, answers).map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => answer(nextQId, opt.value)}
                style={{
                  background: "#f5f0e8",
                  border: "1px solid #c8c0b0",
                  borderRadius: 2,
                  padding: "13px 16px",
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#1a1a18",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.1s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#c84b2f"; e.currentTarget.style.color = "#c84b2f"; e.currentTarget.style.background = "#ede8dc"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#c8c0b0"; e.currentTarget.style.color = "#1a1a18"; e.currentTarget.style.background = "#f5f0e8"; }}
              >
                <span style={{
                  fontSize: 9,
                  letterSpacing: "0.15em",
                  color: "#7a7468",
                  background: "white",
                  border: "1px solid #c8c0b0",
                  padding: "2px 6px",
                  borderRadius: 1,
                  flexShrink: 0,
                  fontFamily: "monospace",
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {resultData && (() => {
        const vs = VERDICT_STYLES[resultData.verdict] || VERDICT_STYLES.info;
        const sections = [
          { label: "Summary", content: resultData.summary },
          { label: "Income tax", content: resultData.deduction },
          { label: "GST", content: resultData.gst },
          { label: "FBT / PAYE", content: resultData.fbt },
          { label: "Make it more defensible", content: resultData.improve },
          { label: "Records", content: resultData.evidence },
          { label: "IRD basis", content: resultData.basis },
        ];

        return (
          <div style={{ maxWidth: 640, width: "100%", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              padding: "24px 32px",
              border: `1px solid ${vs.border}`,
              borderRadius: "2px 2px 0 0",
              background: vs.bg,
              marginBottom: -1,
            }}>
              <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: vs.tagColor, marginBottom: 8, fontFamily: "monospace" }}>
                {vs.label}
              </p>
              <p style={{ fontSize: "1.55rem", lineHeight: 1.25, color: vs.tagColor, margin: 0 }}>
                {resultData.title}
              </p>
            </div>
            <div style={{
              background: "white",
              border: "1px solid #c8c0b0",
              borderTop: "none",
              borderRadius: "0 0 2px 2px",
              padding: "28px 32px",
              boxShadow: "4px 4px 0 #ede8dc",
            }}>
              {sections.map((s, i) => (
                <div key={s.label} style={{
                  marginBottom: 18,
                  paddingBottom: 18,
                  borderBottom: "1px solid #ede8dc",
                }}>
                  <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a7468", marginBottom: 6, fontFamily: "monospace" }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.75, color: "#1a1a18", fontFamily: "monospace", margin: 0 }}>
                    {s.content}
                  </p>
                </div>
              ))}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 2 }}>
                {resultData.tags.map(t => {
                  const ts = TAG_STYLES[t.type] || TAG_STYLES.grey;
                  return (
                    <span key={t.label} style={{
                      fontSize: 10,
                      padding: "4px 10px",
                      borderRadius: 1,
                      background: ts.bg,
                      color: ts.color,
                      fontFamily: "monospace",
                      letterSpacing: "0.06em",
                    }}>
                      {t.label}
                    </span>
                  );
                })}
              </div>

              <button
                onClick={restart}
                style={{
                  marginTop: 24,
                  width: "100%",
                  background: "#1a1a18",
                  color: "#f5f0e8",
                  border: "none",
                  borderRadius: 2,
                  padding: "13px 20px",
                  fontFamily: "monospace",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#c84b2f"}
                onMouseLeave={e => e.currentTarget.style.background = "#1a1a18"}
              >
                Check another expense
              </button>
            </div>
          </div>
        );
      })()}

      <div style={{
        maxWidth: 640,
        width: "100%",
        marginTop: 24,
        fontSize: 10,
        color: "#7a7468",
        textAlign: "center",
        lineHeight: 1.7,
        fontFamily: "monospace",
        letterSpacing: "0.03em",
      }}>
        <p style={{ margin: "0 0 10px" }}>
          This tool is a guide only, not tax advice. Use the actual facts and keep records.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 12px" }}>
          {SOURCE_LINKS.map(link => (
            <a key={link.title} href={link.url} target="_blank" rel="noreferrer" style={{ color: "#7a7468" }}>
              {link.title}
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 560px) {
          button span {
            white-space: normal;
          }
        }
      `}</style>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
