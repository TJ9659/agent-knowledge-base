import type { ArticleStatus } from '../../src/generated/prisma/enums.js';
import type { CategoryName } from './categories.js';

// nexora telecom is fictional, all names, prices and policies are made up for the demo

const DANIEL = 'editor@nexora.test';
const PRIYA = 'editor2@nexora.test';

interface SeedArticle {
  title: string;
  category: CategoryName;
  authorEmail: string;
  status: ArticleStatus;
  content: string;
}

export const articles: SeedArticle[] = [
  {
    title: 'Handling a double charge',
    category: 'Billing & Payments',
    authorEmail: DANIEL,
    status: 'PUBLISHED',
    content: `# Handling a double charge

**When to use:** the customer sees the same charge twice on their bill or bank statement.

## Steps
1. Verify the caller (see *Verifying a caller's identity*).
2. Open Billing > Transactions and confirm both charges have the same amount and date.
3. If both show as **Successful**, raise a refund request with reason "Duplicate charge".
4. Give the customer the refund reference number.

## What to tell the customer
- Refunds take **5–7 working days** to appear.
- They'll get an SMS when the refund is processed.

## Escalate if
- The amount is over RM 500, or
- The charge is more than 60 days old.`,
  },
  {
    title: 'Explaining a higher-than-usual bill',
    category: 'Billing & Payments',
    authorEmail: DANIEL,
    status: 'PUBLISHED',
    content: `# Explaining a higher-than-usual bill

**When to use:** the customer says this month's bill is higher than normal and wants to know why.

## Steps
1. Verify the caller.
2. Open Billing > Bill Breakdown and compare this bill with the previous one.
3. Check the three usual causes:
   - **Roaming:** usage outside Malaysia appears under "Roaming charges".
   - **Add-ons:** data passes, streaming bundles or IDD packs bought during the month.
   - **Pro-rated charges:** after a plan change, the first bill includes part of the old plan and part of the new one.
4. Walk the customer through each extra line item.
5. If a charge is genuinely wrong, raise a billing dispute with reason "Incorrect charge".

## What to tell the customer
- Pro-rated bills go back to normal from the next billing cycle.
- They can set a monthly spending alert in the Nexora app under Settings > Usage alerts.

## Escalate if
- The customer disputes roaming charges over RM 300, or
- The bill is more than double their usual amount with no clear cause.`,
  },
  {
    title: 'Setting up auto-debit',
    category: 'Billing & Payments',
    authorEmail: PRIYA,
    status: 'PUBLISHED',
    content: `# Setting up auto-debit

**When to use:** the customer wants their bill paid automatically every month.

## Steps
1. Verify the caller.
2. Guide them in the Nexora app: Billing > Payment method > Auto-debit.
3. Ask which method they prefer:
   - **Credit or debit card:** active immediately after the card is verified.
   - **Bank account (FPX direct debit):** needs bank approval, usually 3–5 working days.
4. Confirm the status shows **Active** before ending the call (card) or tell them to check back in a few days (bank account).

## What to tell the customer
- If they set it up after this month's bill is issued, they must **pay this bill manually**. Auto-debit starts from the next bill.
- The payment is taken on the bill due date, not the issue date.

## Escalate if
- The app shows an error after three attempts, or
- The customer was charged by auto-debit and also paid manually (treat as a double charge).`,
  },
  {
    title: 'Late payment and service suspension',
    category: 'Billing & Payments',
    authorEmail: PRIYA,
    status: 'PUBLISHED',
    content: `# Late payment and service suspension

**When to use:** the customer has missed a payment, or their service has been suspended for non-payment.

## Steps
1. Verify the caller.
2. Check Billing > Account status for the overdue amount and days overdue.
3. Explain the timeline:
   - **Day 1–14:** grace period, service keeps working.
   - **Day 15:** outgoing calls and data are suspended.
   - **Day 30:** full suspension and a RM 10 late payment fee.
4. Take payment, or guide them to pay in the app.
5. After payment, service is restored automatically within **2 hours**.

## Fee waiver rules
- You can waive the RM 10 late fee **once every 12 months** per account.
- Check Billing > Waiver history before offering it.

## What to tell the customer
- Restoring service after payment can take up to 2 hours; restarting the phone helps.

## Escalate if
- The customer asks for a second waiver within 12 months, or
- They mention financial hardship (transfer to the Collections team).`,
  },
  {
    title: "Verifying a caller's identity",
    category: 'Account & Security',
    authorEmail: DANIEL,
    status: 'PUBLISHED',
    content: `# Verifying a caller's identity

**When to use:** at the start of every call, before discussing or changing anything on an account.

## Steps
1. Ask for the account holder's **full name**.
2. Ask for the **last 4 digits of their IC or passport number**.
3. Ask for **one of**: date of birth, billing address postcode, or the amount of their last bill.
4. All three checks must match. Mark "Verified" in the call record.

## Never
- Never ask for the customer's full password, PIN or a one-time code (OTP).
- Never read account details to the caller to "help" them answer.

## What to tell the customer
- "For your security, I need to confirm a few details before we continue."

## Escalate if
- The caller fails verification twice: politely end the call and flag the account for review.
- The caller is not the account holder but says they are calling on their behalf (authorised users only).`,
  },
  {
    title: "Resetting a customer's app password",
    category: 'Account & Security',
    authorEmail: DANIEL,
    status: 'PUBLISHED',
    content: `# Resetting a customer's app password

**When to use:** the customer can't log in to the Nexora app or website.

## Steps
1. Verify the caller.
2. Confirm the email address on the account with the customer (ask them to say it, don't read it out).
3. Open Account > Security and click **Send reset link**.
4. Ask the customer to check their inbox and spam folder. The link expires in **30 minutes**.

## If the email on the account is outdated
1. Update the email address in Account > Profile (verification required).
2. Send the reset link to the new address.
3. Note the change in the call record.

## What to tell the customer
- We will never ask for their password over the phone.

## Escalate if
- The customer says someone else changed their email or password (possible account takeover): transfer to the Fraud team.`,
  },
  {
    title: 'Reporting a lost or stolen SIM',
    category: 'Account & Security',
    authorEmail: PRIYA,
    status: 'PUBLISHED',
    content: `# Reporting a lost or stolen SIM

**When to use:** the customer's phone or SIM card has been lost or stolen.

## Steps
1. Verify the caller.
2. **Bar the line immediately:** Account > Line > Temporary bar. This stops calls, SMS and data.
3. Offer a replacement SIM:
   - Collect at any Nexora store with IC (free), or
   - Delivery in 2–3 working days (RM 10).
4. Once the new SIM is active, remove the bar.

## What to tell the customer
- Their number stays the same.
- If the phone was stolen, we recommend making a **police report**. Some insurers need the report number.
- Any charges made after the bar is placed are not their responsibility.

## Escalate if
- The customer reports unknown charges made before the bar (transfer to the Fraud team).`,
  },
  {
    title: 'No internet: first-line troubleshooting',
    category: 'Technical Support',
    authorEmail: DANIEL,
    status: 'PUBLISHED',
    content: `# No internet: first-line troubleshooting

**When to use:** the customer says their home broadband or internet is down.

## Steps
1. Verify the caller.
2. **Check the outage map first:** Tools > Network status, search the customer's postcode.
   - If there is a known outage, give the estimated fix time and stop here.
3. Ask the customer to **restart the router**: switch off at the wall, wait 30 seconds, switch on, wait 3 minutes.
4. Check the **cables**: fibre cable into the ONT box, LAN cable from the ONT to the router.
5. Check the **lights** on the ONT box:
   - PON light solid green: line is fine, problem is the router or Wi-Fi.
   - LOS light red: no signal from the line, book a technician.

## What to tell the customer
- Outage updates are posted in the Nexora app under Network status.

## Escalate if
- The LOS light is red (see *Booking a technician visit*), or
- The service is still down after a restart and there is no outage in the area.`,
  },
  {
    title: 'Slow Wi-Fi speeds',
    category: 'Technical Support',
    authorEmail: PRIYA,
    status: 'PUBLISHED',
    content: `# Slow Wi-Fi speeds

**When to use:** the internet works but the customer says it is slow.

## Steps
1. Verify the caller.
2. Ask them to run a **speed test** at speedtest.nexora.test, ideally with a LAN cable plugged into the router.
   - If the wired speed is close to their plan speed, the line is fine and the issue is Wi-Fi.
3. Explain the two Wi-Fi bands:
   - **5 GHz:** faster, but shorter range. Best in the same room as the router.
   - **2.4 GHz:** slower, but reaches further through walls.
4. Ask how many **devices** are connected. More than 15 active devices can slow things down.
5. Suggest moving the router to a central, open spot, away from microwaves and thick walls.

## What to tell the customer
- Large homes may need a Wi-Fi mesh extender (available as an add-on).

## Escalate if
- The **wired** speed test is below 50% of their plan speed three times in a row: book a technician.`,
  },
  {
    title: 'Booking a technician visit',
    category: 'Technical Support',
    authorEmail: DANIEL,
    status: 'PUBLISHED',
    content: `# Booking a technician visit

**When to use:** first-line troubleshooting has failed and the problem needs someone on site.

## Eligibility
- The customer has completed the steps in *No internet: first-line troubleshooting* or *Slow Wi-Fi speeds*.
- There is **no known outage** in the area.

## Steps
1. Verify the caller.
2. Open Tools > Technician booking and choose the fault type.
3. Offer the next available slots: **9am–1pm** or **2pm–6pm**, Monday to Saturday.
4. Confirm the address and a contact number for the day.
5. Give the customer the booking reference.

## What the customer must prepare
- An adult (18+) must be home for the whole slot.
- Clear access to the router and the ONT box.

## What to tell the customer
- The visit is free if the fault is on Nexora's side. If the fault is caused by the customer's own equipment, a RM 50 call-out fee applies.

## Escalate if
- No slot is available within 5 working days.`,
  },
  {
    title: 'Upgrading or downgrading a plan',
    category: 'Plans & Orders',
    authorEmail: PRIYA,
    status: 'PUBLISHED',
    content: `# Upgrading or downgrading a plan

**When to use:** the customer wants to change to a higher or lower plan.

## Steps
1. Verify the caller.
2. Check Plans > Current plan for the contract end date.
3. **Upgrade:** allowed at any time. The new plan applies **immediately**.
4. **Downgrade:**
   - Outside the contract lock-in: applies from the **next billing cycle**.
   - Inside the 24-month lock-in: not allowed without paying the early termination fee (see *Refund and cancellation policy*).
5. Confirm the change and read out the new monthly price.

## What to tell the customer
- Upgrades are **pro-rated**: the next bill includes part of the old plan and part of the new one.
- An upgrade does not restart the contract period.

## Escalate if
- The customer wants to downgrade inside the lock-in and asks for the fee to be waived.`,
  },
  {
    title: 'Porting a number from another provider',
    category: 'Plans & Orders',
    authorEmail: DANIEL,
    status: 'PUBLISHED',
    content: `# Porting a number from another provider

**When to use:** a new customer wants to keep their mobile number when moving to Nexora.

## Documents needed
- IC or passport (must match the name registered with the old provider).
- The number to be ported.
- The account type with the old provider (prepaid or postpaid).

## Steps
1. Create the new account and choose "Port in" at the number step.
2. Enter the number and the old provider.
3. Submit the port request and give the customer the reference number.

## What to tell the customer
- Porting usually takes **1–2 working days**.
- Their old SIM keeps working until the port completes. They will get an SMS, then should put in the Nexora SIM.

## Common reasons a port fails
- The name or IC does not match the old provider's records.
- An unpaid bill with the old provider (postpaid).
- The number is still inside a contract with the old provider.

## Escalate if
- The port has not completed after 3 working days.`,
  },
  {
    title: 'Calming an angry caller',
    category: 'Customer Handling',
    authorEmail: PRIYA,
    status: 'PUBLISHED',
    content: `# Calming an angry caller

**When to use:** the customer is upset, shouting or using a raised voice.

## Steps
1. **Listen** without interrupting. Let them finish, even if it takes a while.
2. **Acknowledge** how they feel: "I understand this is frustrating, and I'm sorry you've had to call about it."
3. Keep your own voice calm, slow and low. Don't argue or take it personally.
4. **Summarise** the problem back to them so they know you heard it.
5. Offer a **clear next step** with a time frame: "I'm raising a refund now, and you'll get an SMS within 7 working days."

## Avoid
- "Calm down" or "That's our policy" on its own.
- Promises you can't keep.

## If the caller is abusive
- Give one polite warning: "I want to help, but I can't continue if the language continues."
- If it continues, end the call and log it.

## Escalate if
- The customer asks for a supervisor (see *When and how to escalate*).`,
  },
  {
    title: 'When and how to escalate',
    category: 'Customer Handling',
    authorEmail: DANIEL,
    status: 'PUBLISHED',
    content: `# When and how to escalate

**When to use:** the issue is outside what you can solve, or the customer asks for a supervisor.

## Escalate when
- The customer asks for a supervisor.
- The issue is outside your approval limit (for example refunds over RM 500).
- No knowledge base article covers the issue.
- There is a fraud, safety or legal concern.

## Steps
1. Tell the customer what will happen next: "I'm going to bring in my supervisor, who can help with this."
2. Do a **warm transfer**: brief the supervisor before connecting the customer, so they don't have to repeat themselves.
3. If no supervisor is free, raise an escalation ticket and promise a call back within **24 hours**.

## Ticket notes to include
- Customer name and account number (verified: yes/no).
- What the customer wants, in one sentence.
- What you already checked or tried.
- Any reference numbers.`,
  },
  {
    title: 'Refund and cancellation policy',
    category: 'Policies',
    authorEmail: PRIYA,
    status: 'PUBLISHED',
    content: `# Refund and cancellation policy

**When to use:** the customer wants to cancel a new plan or asks for a refund on a plan or device.

## Cooling-off period
- Customers can cancel within **14 days** of activation for a **full refund**, as long as the device is returned in its original condition.
- After 14 days, the plan **cannot be refunded**.

## Steps
1. Verify the caller.
2. Check Plans > Current plan for the activation date.
3. **Within 14 days:** raise a cancellation with reason "Cooling-off". The refund takes 5–7 working days.
4. **After 14 days:** explain that a refund is not possible. They can still cancel, but early termination fees apply.

## Early termination fees
- Inside the 24-month contract: RM 50 for every remaining month, up to RM 600.
- Outside the contract: no fee.

## Escalate if
- The customer says they were mis-sold the plan (transfer to Retention).`,
  },
  {
    title: 'eSIM activation guide',
    category: 'Technical Support',
    authorEmail: DANIEL,
    status: 'DRAFT',
    content: `# eSIM activation guide

**When to use:** the customer wants to switch to an eSIM. Not live yet, launch date to be confirmed.

## Steps
1. Verify the caller.
2. Check the phone supports eSIM.
3. Send the QR code by email.
4. TODO: confirm the activation steps with the product team.`,
  },
  {
    title: 'Holiday season promo FAQ',
    category: 'Plans & Orders',
    authorEmail: PRIYA,
    status: 'DRAFT',
    content: `# Holiday season promo FAQ

**When to use:** questions about the December holiday promo. Draft, waiting for marketing approval.

## Steps
1. Check the customer is eligible (new postpaid sign-ups only).
2. TODO: add the final promo prices.`,
  },
  {
    title: 'Updated data privacy handling',
    category: 'Policies',
    authorEmail: DANIEL,
    status: 'DRAFT',
    content: `# Updated data privacy handling

**When to use:** the customer asks what personal data we keep, or asks for it to be deleted.

## Steps
1. Verify the caller.
2. TODO: waiting for the updated policy from Legal.`,
  },
];
