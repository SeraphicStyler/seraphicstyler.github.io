#!/usr/bin/env python3
"""Builds terms.html and privacy.html from the content below.

Edit the words here, then run:  python3 tools/build-legal.py
Styles live in css/legal.css. Bump EFFECTIVE and VERSION whenever the
substance changes, so a client can tell which version applied to their order.
"""
import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EFFECTIVE = '1 October 2026'
VERSION = '1.0'
EMAIL = 'seraphicstyler@gmail.com'
MAIL = f'<a href="mailto:{EMAIL}">{EMAIL}</a>'

def ul(*items, alpha=False):
    cls = 'lg-bul lg-alpha' if alpha else 'lg-bul'
    return f'<ul class="{cls}">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'

def p(x): return f'<p>{x}</p>'

def d(term): return f'<span class="lg-def">{term}</span>'

def table(head, rows):
    h = ''.join(f'<th scope="col">{x}</th>' for x in head)
    body = ''
    for r in rows:
        cells = f'<th scope="row">{r[0]}</th>' + ''.join(
            f'<td data-l="{head[i + 1]}">{c}</td>' for i, c in enumerate(r[1:]))
        body += f'<tr>{cells}</tr>'
    return f'<table class="lg-tbl"><thead><tr>{h}</tr></thead><tbody>{body}</tbody></table>'

def dl(pairs):
    return '<dl class="lg-dl">' + ''.join(f'<div><dt>{a}</dt><dd>{b}</dd></div>' for a, b in pairs) + '</dl>'


# ─────────────────────────────── TERMS OF SERVICE ───────────────────────────────

TERMS = dict(
    slug='terms',
    title='Terms of Service',
    desc='The Terms of Service governing sourcing, styling, gift cards, group orders and boutique buying with Seraphic Styler: quotes, approval, payment, agency, shipping, credit, liability and disputes.',
    eyebrow='Legal · Terms of Service',
    h1='Terms of <em>Service</em>',
    lead='These Terms form the agreement between you and Seraphic Styler for every request, quotation, payment and service, and for your use of this website. They are written to be read, not skimmed past. Each article opens with a short summary in plain English.',
    glance=[
        '<strong>Nothing is bought without your approval.</strong> You see the piece, the price and the size first.',
        '<strong>I buy as your agent.</strong> Pieces are bought at the seller’s price, never marked up; my fee is always shown separately.',
        '<strong>Services are prepaid</strong>, in the stages set out in your written Quote.',
        '<strong>Most Vietnamese boutiques are final sale.</strong> Refunds and credit follow the <a href="policy">Returns &amp; Credit Policy</a>.',
        '<strong>Duties and import taxes are yours</strong> unless your Quote says otherwise.',
        '<strong>Your written Quote prevails</strong> where it differs from these Terms.',
    ],
    articles=[
        ('agreement', 'The agreement', 'By booking, paying or using this website, you accept these Terms.', [
            p(f'These Terms of Service (the “{d("Terms")}”) govern the services offered by Seraphic Styler (“{d("Seraphic Styler")}”, “I”, “me”, “my”) and your use of seraphicstyler.com and its pages (the “{d("Website")}”).'),
            p('You accept these Terms when you submit a request and pay for any Service, redeem a Gift Card, or otherwise use the Website. If you do not agree, please do not use the Services.'),
            p('You confirm that you are at least 18 years old, or the age of majority where you live, and able to enter a binding contract. If you act for a business, you confirm you are authorised to bind it, and “you” includes that business.'),
            p(f'These Terms are read together with the <a href="policy">Returns &amp; Credit Policy</a>, the <a href="privacy">Privacy Policy</a>, the <a href="pay">payment page</a> and, for trade buyers, the <a href="for-boutiques">boutique terms</a> (together, the “{d("Policies")}”).'),
        ]),
        ('definitions', 'Definitions', 'The capitalised words used throughout, defined once.', [
            dl([
                ('Client', 'The person or business who requests, pays for or receives a Service, and any recipient of a Gift Card who redeems it.'),
                ('Services', 'Sourcing and purchasing assistance, The Trace, styling services, gift cards, group and bulk orders, and boutique buying and scouting, each as described on the Website.'),
                ('Piece', 'Any garment, accessory or other item bought on a Client’s behalf.'),
                ('Seller', 'The designer, boutique, atelier, market vendor or other third party from whom a Piece is bought.'),
                ('Quote', 'My written confirmation, by email or message, of the scope, Pieces, prices, fees, payment stages and timing for an order.'),
                ('Fee', 'My charge for a Service, shown separately from the price of any Piece.'),
                ('Piece Credit', 'The portion of a styling booking reserved for buying Pieces at cost.'),
                ('Credit', 'Store credit issued under the Returns &amp; Credit Policy or by Gift Card.'),
                ('Deposit', 'An amount paid before work begins on an order.'),
                ('Scouting Fee', 'The fee for a boutique scouting round, paid before the round begins and not deducted from the order.'),
                ('Buying Window', 'An announced period during which I am in Vietnam and can inspect Pieces in person.'),
            ]),
        ]),
        ('services', 'The Services', 'What I do, and what I will not do.', [
            p('Seraphic Styler is an independent personal shopping, styling and buying-agent service specialising in Vietnamese fashion. The Services available, and their current prices, are those published on the Website at the time of your Quote.'),
            p('I am not affiliated with, endorsed by, or an authorised representative of any brand or Seller, unless I say so expressly in writing. Brand names are used only to identify the Pieces you ask for.'),
            p('I will not knowingly source counterfeit, replica or infringing goods, items that are unlawful to export from Vietnam or to import into your country, or items whose sale would breach a Seller’s rights.'),
            p('I may decline or end any request at my discretion, including where a request falls outside the Services, cannot be fulfilled reliably, or is made abusively. Submitting a form, sending a message or paying does not by itself oblige me to begin work. Where I decline after payment and no money has been committed, you receive a full refund.'),
        ]),
        ('agency', 'How I buy: agency and ownership', 'I buy on your behalf. You own the Piece; the Seller’s own terms still apply to it.', [
            p('When I purchase a Piece for you, I act as your <strong>purchasing agent</strong>. I do not hold inventory or resell goods from stock. Pieces are bought at the Seller’s price, which is passed to you without mark-up; any Seller receipt is available on request.'),
            p('Ownership of a Piece passes to you when it is purchased for you. Until the order is fully paid, I may hold the Piece and need not dispatch it.'),
            p('Each purchase is also subject to the Seller’s own terms, including any final-sale, exchange, deposit or lead-time conditions. I cannot grant you rights the Seller does not offer, but I will tell you of any material condition known to me before you approve the purchase.'),
            p('Where a Seller offers discounts, stockist terms or wholesale pricing, they are negotiated for your benefit and passed on in full.'),
        ]),
        ('quotes', 'Requests, Quotes and approval', 'You approve everything in writing before money is committed.', [
            p('Your order is defined by the Quote. Prices shown on the Website, estimators or calculators are guides only; the Quote is binding once you accept it and pay as it requires.'),
            p('Unless stated otherwise, a Quote remains valid for <strong>seven (7) days</strong> or until the relevant Buying Window closes, whichever is earlier. Seller prices and stock change, and an expired Quote may need to be re-confirmed.'),
            p('No Piece is purchased without your approval of its photograph, price and size. Approval may be given by any written means, including a message reply.'),
            p('If a clear error appears in a Quote or on the Website, such as an obviously wrong price, I will tell you promptly and you may accept the corrected terms or cancel for a full refund of any sums not yet committed.'),
        ]),
        ('fees', 'Prices and Fees', 'Published prices apply; Pieces at cost, Fees shown separately.', [
            p('Fees are those published on the Website on the date of your Quote. Prices may change at any time, but a change never affects an accepted Quote or a Gift Card already sold.'),
            p('<strong>Styling bookings</strong> combine a styling Fee and a Piece Credit, as shown for each tier. The Piece Credit is applied only toward Pieces bought at cost within that booking and is not redeemable for cash.'),
            p('<strong>Boutique and trade buying</strong> begins with a Scouting Fee of <strong>US$250</strong> per scouting round, paid before the round begins and not deducted from the order. The buying fee is <strong>15%</strong> of the Pieces (20% for rush or made-to-measure work), subject to the published minimum fees. Exploratory research before a buy is defined is charged at the published hourly rate, prepaid.'),
            p('Where prices are expressed in Vietnamese đồng, they are converted at the rate stated on the Website or in your Quote. Fees do not include shipping, duties, taxes or Seller-imposed charges unless the Quote says so.'),
        ]),
        ('payment', 'Payment', 'Prepaid, in stages, by the methods listed. Please talk to me before disputing a charge.', [
            p('All Services are <strong>prepaid</strong>. Styling bookings, The Trace, research time and Scouting Fees are paid before work starts. Sourcing and buying orders are paid in the stages set out in the Quote, and no Piece is dispatched until the balance and shipping have been paid.'),
            p('I accept the methods listed on the <a href="pay">payment page</a>, which may include card payment through Stripe, PayPal, Wise, Payoneer, bank transfer and Zelle. Processing fees charged by a payment provider are shown before you pay and are not refundable once incurred.'),
            p('Work begins only when payment has cleared. If a payment stage remains unpaid, I may pause the order; an unpaid Quote lapses at expiry; and Pieces already bought for you will be held, not shipped, until paid.'),
            p('If you have a concern about a charge, please contact me first so it can be resolved directly. Raising a chargeback or payment dispute for a Service that has been delivered as agreed is a breach of these Terms; I may suspend Services while it is resolved and provide the payment provider with the records of your order.'),
        ]),
        ('cancellation', 'Cancellation, refunds and Credit', 'Unspent money returns as money; spent money returns as Credit.', [
            p('Cancellations, refunds and Credit are governed by the <a href="policy">Returns &amp; Credit Policy</a>, which forms part of these Terms. In summary:'),
            ul('money not yet committed on your behalf is refunded, less any non-refundable processing fee;',
               'money already committed to a Seller, atelier or carrier is returned as Credit at the rate stated in the Policy;',
               'where an error is mine, you may choose a full refund or enhanced Credit, as the Policy describes;',
               'styling work already delivered, shipping already performed, duties and taxes, and atelier deposits once cutting has begun are not refundable as cash.', alpha=True),
            p('Nothing in this Article removes any right to cancel or obtain a refund that the law where you live gives you and that cannot be excluded.'),
        ]),
        ('shipping', 'Shipping, risk and customs', 'Carrier cost, honest declarations, duties paid by you.', [
            p('Shipping is charged at the carrier’s actual cost on the date of dispatch, including any fuel, peak-season or demand surcharges the carrier applies, and is confirmed before dispatch. Shipping figures shown earlier, including in estimators and Quotes, are estimates and may change with those surcharges. Delivery dates are carrier estimates and are not guaranteed.'),
            p('Risk of loss or damage passes to you when the Piece is handed to the carrier or forwarder for delivery to you. Declared-value insurance is available at cost on request, and I will help you pursue any claim with the carrier.'),
            p('Every parcel is declared truthfully, at the price actually paid. I will not under-declare, mislabel or split a shipment to avoid duties, and requests to do so will be refused.'),
            p('You are the importer of record unless the Quote states otherwise. Import duties, taxes, brokerage and customs fees in your country are your responsibility, as is ensuring that the Pieces may lawfully be imported there. Customs decisions are made by the destination country, and I cannot control their timing or outcome.'),
            p('Please report a wrong or damaged Piece within <strong>forty-eight (48) hours</strong> of delivery, with photographs and, where possible, an unboxing video. Trade buyers have the fault-report window stated in their Quote.'),
        ]),
        ('client', 'Your responsibilities', 'Accurate details, timely replies.', [
            p('You agree to:'),
            ul('provide accurate measurements, sizes, addresses and contact details, and update them if they change;',
               'review and respond to photographs, Quotes and payment requests within the time stated;',
               'comply with the laws of your country on importing, reselling and using the Pieces; and',
               'treat me, Sellers and carriers with courtesy.', alpha=True),
            p('I am not responsible for delay, mis-fit or loss caused by inaccurate information supplied by you, or by a delay in your approval or payment.'),
        ]),
        ('gifts', 'Gift Cards and Credit', 'They do not expire and keep the value they were bought with.', [
            p('Gift Cards and Credit may be used toward any Service and Pieces, do not expire, and are not redeemable for cash except where the Returns &amp; Credit Policy or applicable law requires.'),
            p('A Gift Card keeps the value and inclusions it was sold with, even if prices later change. Credit may be transferred once to a named person on written request.'),
            p('Please keep your Gift Card code private. I am not responsible for a code used by someone you have shared it with, but will help where I reasonably can.'),
        ]),
        ('styling', 'Styling and creative work', 'Styling is expert opinion, delivered for your personal use.', [
            p('Styling recommendations, lookbooks and edits reflect professional judgement and your brief. They are subjective by nature, and dissatisfaction with taste is not in itself a defect in the Service. Each tier includes the revisions described for it.'),
            p('The number of Pieces offered depends on your tier, your budget, and genuine availability, and is not a promise of unlimited searching or a fixed number of options.'),
            p('Fit across unfamiliar brands is assessed against Seller size charts and your measurements, but cannot be guaranteed. Colours in photographs may differ slightly from the Piece.'),
            p('Lookbooks and styling documents are licensed to you for personal use. They may not be republished commercially without my written consent.'),
        ]),
        ('trade', 'Boutique, group and bulk orders', 'Trade orders follow the boutique terms and your Quote.', [
            p('Boutique buying, scouting, research and group or bulk orders are governed by the terms published on the <a href="for-boutiques">boutique page</a> and in the relevant Quote, together with these Terms.'),
            p('Where Pieces are bought for resale, you are responsible for your own pricing, retail compliance, product labelling and import obligations. Territory exclusivity and wholesale pricing are never assumed and apply only where expressly confirmed in writing by the Seller.'),
            p('Inspection is carried out in the manner stated in your Quote: in person during a Buying Window, or against the Seller’s photographs and measurements between windows.'),
        ]),
        ('ip', 'Intellectual property and your content', 'My work stays mine; your photos stay yours and stay private.', [
            p('The Website, its text, design, photographs, graphics and tools are owned by or licensed to Seraphic Styler and protected by intellectual-property law. You may view and share pages for personal, non-commercial use. Resources expressly published under an open licence, such as the open dataset, may be used on the terms of that licence.'),
            p('Brand names, logos and product images belong to their respective owners.'),
            p('You keep all rights in photographs, measurements and other material you send me. You grant me a limited licence to use that material solely to provide the Services. I will not publish your image, name or order in any portfolio, social media post or testimonial without your separate written consent.'),
        ]),
        ('website', 'Use of the Website', 'Use the site fairly; its tools are estimates.', [
            p('You agree not to misuse the Website, including by attempting to gain unauthorised access, interfering with its operation, introducing malicious code, or harvesting its content by automated means beyond what an open licence permits.'),
            p('Estimators, calculators, quizzes and guides provide indicative figures only. Features that use automated or AI-assisted tools may produce inaccurate results and should not be relied on as advice; your Quote is the only authoritative statement of price.'),
            p('Links to third-party sites are provided for convenience. I am not responsible for their content, availability or practices.'),
        ]),
        ('warranty', 'Disclaimers', 'I take care, but cannot guarantee what Sellers and carriers do.', [
            p('I will perform the Services with reasonable care and skill. Beyond that, and to the fullest extent permitted by law, the Services and the Website are provided “as is” and “as available”, and I make no other warranties, express or implied, including of merchantability, fitness for a particular purpose or uninterrupted availability.'),
            p('Pieces are manufactured by Sellers, not by me. Any product warranty is the Seller’s. I do not guarantee stock, Seller lead times, carrier performance or customs outcomes.'),
        ]),
        ('liability', 'Limitation of liability', 'My total responsibility is capped at what you paid me for the order.', [
            p('To the fullest extent permitted by law, I am not liable for any indirect, incidental, special or consequential loss, or for loss of profit, revenue, business or opportunity, arising from the Services or the Website.'),
            p('My total liability for any claim relating to an order is limited to the total amount you paid me for that order, including amounts paid for Pieces.'),
            p('Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited, including liability for fraud, or for death or personal injury caused by negligence, or your statutory rights as a consumer.'),
        ]),
        ('indemnity', 'Indemnity', 'You are responsible for what you ask me to do unlawfully.', [
            p('You agree to indemnify Seraphic Styler against losses, claims and reasonable costs arising from your breach of these Terms, from information you supply that is false or infringing, or from your import, resale or use of Pieces in breach of applicable law.'),
        ]),
        ('force', 'Events beyond control', 'Storms, strikes and shutdowns pause obligations; they do not end them.', [
            p('I am not in breach of these Terms for delay or failure caused by events beyond my reasonable control, including natural disasters, severe weather, epidemics, government action, customs or postal disruption, carrier failure, strikes, power or network outages, or a Seller’s closure.'),
            p('I will notify you promptly and resume as soon as practicable. If the delay continues for more than sixty (60) days, either of us may cancel the affected order, and any unspent sums will be refunded under the Returns &amp; Credit Policy.'),
        ]),
        ('disputes', 'Disputes and governing law', 'Talk first. California law applies, without removing your local protections.', [
            p(f'If something goes wrong, please write to {MAIL}. We each agree to try in good faith to resolve any dispute informally within thirty (30) days before starting formal proceedings.'),
            p('These Terms and any dispute arising from them are governed by the laws of the State of California, USA, without regard to its conflict-of-laws rules. Subject to the next clause, the state and federal courts located in Orange County, California have exclusive jurisdiction, and either party may bring a qualifying claim in small-claims court.'),
            p('If you are a consumer, you also benefit from any mandatory protections of the law of the country where you live, and you may bring proceedings in your local courts where that law allows.'),
        ]),
        ('general', 'General provisions', 'The housekeeping that keeps the rest working.', [
            p('<strong>Order of precedence.</strong> If documents conflict, they apply in this order: your accepted Quote; the service-specific terms on the Website; the Returns &amp; Credit Policy; these Terms.'),
            p('<strong>Entire agreement.</strong> The Quote, these Terms and the Policies are the whole agreement between us about the order and replace any earlier discussion.'),
            p('<strong>Severability.</strong> If any provision is found unenforceable, it is modified to the minimum extent necessary, and the rest remains in effect.'),
            p('<strong>No waiver.</strong> A failure or delay in enforcing a right is not a waiver of it.'),
            p('<strong>Assignment.</strong> You may not transfer your rights under an order without my consent, except Credit as permitted above. I may transfer my rights and obligations to a successor operating the Services, with notice to you.'),
            p('<strong>Electronic communications.</strong> You agree that Quotes, approvals, notices and records may be given electronically, by email or direct message, and satisfy any requirement that they be in writing.'),
            p('<strong>Independent parties.</strong> Nothing in these Terms creates a partnership, joint venture or employment relationship.'),
        ]),
        ('changes', 'Changes to these Terms', 'The version in force when you pay governs that order.', [
            p('I may update these Terms from time to time. The updated version takes effect when published on this page, with a new effective date. The version in force when you accepted a Quote continues to govern that order.'),
        ]),
    ],
)


# ─────────────────────────────── PRIVACY POLICY ───────────────────────────────

LS = table(['Key (example)', 'Purpose', 'Kept'], [
    ['<code>ss-theme</code>, <code>ss-contrast</code>, <code>ss-textsize</code>, <code>ss-motion</code>', 'Display and accessibility preferences', 'Until you clear it'],
    ['<code>ss-lang</code>', 'Your chosen language', 'Until you clear it'],
    ['<code>ss-basket</code>, <code>fd-saved</code>, <code>fd-basket-dock</code>', 'Pieces and houses you save or add to an estimate', 'Until you clear it'],
    ['<code>ss-find-key</code>, <code>ss-find-history</code>', 'Your own AI key and recent searches for the photo finder, if you use it', 'Until you remove it'],
    ['<code>ss-letter-shortcuts</code>, <code>fd-vc</code>', 'Interface conveniences in the directory', 'Until you clear it'],
])

PRIVACY = dict(
    slug='privacy',
    title='Privacy Policy',
    desc='How Seraphic Styler collects, uses, shares, protects and deletes personal information, with your rights under California, EU and UK law. No advertising or tracking cookies.',
    eyebrow='Legal · Privacy Policy',
    h1='Privacy, <em>kept small</em>',
    lead='I collect only what I need to source, style and deliver for you, and I keep it no longer than I must. This Policy explains exactly what that is, who sees it, and how you can see, correct or delete it.',
    glance=[
        '<strong>No selling, no sharing for advertising.</strong> Ever.',
        '<strong>No tracking or advertising cookies.</strong> Preferences stay in your own browser.',
        '<strong>I never see your full card number.</strong> Payment providers handle it.',
        '<strong>Your photos and measurements</strong> are used only for your order.',
        '<strong>Sellers and couriers receive only what they need</strong> to make and deliver your order.',
        f'<strong>Ask for a copy or deletion at any time</strong>: {MAIL}.',
    ],
    articles=[
        ('controller', 'Who is responsible', 'Seraphic Styler decides how your information is used and answers for it.', [
            p(f'Seraphic Styler (“I”, “me”) is the controller of personal information collected through seraphicstyler.com, its request forms, and correspondence about the Services. You can reach me about privacy at {MAIL}.'),
            p('This Policy applies to clients, gift recipients, trade buyers, and visitors to the Website. It does not cover third-party sites linked from the Website, which have their own policies.'),
        ]),
        ('collect', 'Information I collect', 'What you tell me, and what is needed to deliver.', [
            p('I collect the following categories of personal information:'),
            table(['Category', 'Examples', 'Source'], [
                ['Identity and contact', 'Name; email; Instagram handle; Zalo or phone number', 'You'],
                ['Request details', 'Items wanted, links, photographs, moodboards, budget, occasion, deadlines', 'You'],
                ['Fit information', 'Sizes, body measurements, fit preferences, style profile answers', 'You'],
                ['Delivery', 'Shipping address, recipient name and phone number', 'You, or the person sending a gift'],
                ['Transactions', 'Amounts, dates, payment method and reference; never the full card number', 'Payment providers'],
                ['Trade information', 'Store name, market, buying budget, sell-through notes', 'Trade buyers'],
                ['Correspondence', 'Messages, approvals and feedback', 'You'],
                ['Technical', 'IP address, browser type and request logs held by hosting providers', 'Automatically'],
            ]),
            p('I do not ask for, and ask you not to send, government identification numbers, financial account credentials or health information beyond what is relevant to fit.'),
        ]),
        ('use', 'How and why I use it', 'To do the work you ask for, and to keep lawful records.', [
            p('I use personal information only for the purposes below. Where the EU or UK GDPR applies, the legal basis is shown.'),
            table(['Purpose', 'Legal basis'], [
                ['Responding to requests and preparing Quotes', 'Steps taken at your request before a contract'],
                ['Sourcing, purchasing, styling and delivering your order', 'Performance of a contract'],
                ['Processing payments, refunds and Credit', 'Performance of a contract'],
                ['Keeping tax, accounting and transaction records', 'Legal obligation'],
                ['Preventing fraud and protecting the business from chargebacks and abuse', 'Legitimate interests'],
                ['Improving the Services from feedback you choose to give', 'Legitimate interests'],
                ['Featuring your photo, name or order publicly', 'Your consent, given separately in writing'],
            ]),
            p('I do not use personal information for automated decision-making that produces legal or similarly significant effects, and I do not build advertising profiles.'),
        ]),
        ('share', 'Who receives it', 'Only what each step needs, and never for sale.', [
            p('I share personal information only as follows:'),
            table(['Recipient', 'What they receive', 'Why'], [
                ['Sellers and ateliers in Vietnam', 'Sizes or measurements; your name only if required', 'To make, alter or reserve your Pieces'],
                ['Couriers and forwarders', 'Name, address, phone, parcel contents and value', 'Delivery and customs clearance'],
                ['Customs authorities', 'Commercial invoice and declaration details', 'Required by law for import'],
                ['Payment providers: Stripe, PayPal, Wise, Payoneer, banks', 'Payment details you enter with them', 'Processing payments and refunds'],
                ['Service providers: Tally, Google, Meta/Instagram, GitHub, Cloudflare', 'Form submissions, email, messages, website requests', 'Running forms, email, messaging, hosting and the site assistant'],
                ['Professional advisers and authorities', 'Information reasonably required', 'Legal, tax and accounting compliance, or to establish or defend legal claims'],
            ]),
            p('Service providers act under their own terms and privacy commitments, and process information to provide their services to me. If the business were ever transferred to a successor, client records would transfer with it under the protections of this Policy, with notice to you.'),
            p('<strong>I do not sell personal information, and I do not share it for cross-context behavioural advertising</strong>, as those terms are defined under California law.'),
        ]),
        ('transfers', 'International transfers', 'The business spans California and Vietnam, so information crosses borders.', [
            p('Because I operate between the United States and Vietnam and use international service providers, your information may be transferred to, stored in and processed in countries other than your own, including the United States and Vietnam, whose data-protection laws may differ from yours.'),
            p('Where the EU or UK GDPR applies, transfers to service providers rely on the safeguards those providers maintain, such as Standard Contractual Clauses or adequacy frameworks, and transfers to Sellers and couriers are made because they are necessary to perform the contract you requested.'),
        ]),
        ('retention', 'How long I keep it', 'Records the law requires; everything else, only while useful.', [
            table(['Information', 'Retention'], [
                ['Order, payment and tax records', 'For as long as tax and accounting law requires (typically up to seven years)'],
                ['Measurements, fit notes and style profile', 'While you remain a client, or until you ask me to delete them'],
                ['Photos, moodboards and uploads', 'For the life of the order and any after-care, then deleted'],
                ['Enquiries that do not proceed', 'Up to twelve months, then deleted'],
                ['Gift Card and Credit records', 'Until redeemed in full, plus the record-keeping period above'],
            ]),
        ]),
        ('security', 'Security', 'Reasonable protection, honestly described.', [
            p('I protect personal information with reasonable measures appropriate to a small business, including using established providers for payments, forms and email, encrypted connections (HTTPS) for the Website, keeping access to client records to my own accounts, and sharing with each recipient only what it needs.'),
            p('No method of transmission or storage is completely secure. If a breach affecting your information occurs, I will notify you and any relevant authority where the law requires.'),
        ]),
        ('website', 'Cookies and browser storage', 'No tracking cookies; your settings stay on your device.', [
            p('The Website does not use advertising, analytics or cross-site tracking cookies. It stores a small number of settings in your browser’s local storage so the site remembers your choices. This information stays on your device, is never sent to me, and can be cleared at any time in your browser settings.'),
            LS,
            p('Fonts are served by Google Fonts and the Website is hosted on GitHub Pages; like any web request, those providers receive your IP address and browser information when a page loads. Payment pages and forms are hosted by Stripe and Tally under their own cookie policies.'),
            p('Because there is no tracking to opt out of, Global Privacy Control and Do-Not-Track signals require no further action, and are respected in any case.'),
        ]),
        ('ai', 'Assistant and AI-assisted tools', 'What happens to the questions and photos you enter.', [
            ul('<strong>Site assistant.</strong> Questions you type are sent to my server on Cloudflare to generate an answer and are not used to identify you. Please do not include personal details in them.',
               '<strong>Photo finder.</strong> If you choose to add your own AI provider key, your photo and query are sent directly from your browser to that provider, under its terms. Your key is stored only in your browser. I do not receive the key, the photo or the result.'),
        ]),
        ('rights', 'Your rights', 'See it, correct it, delete it, take it with you.', [
            p('Subject to applicable law, you have the right to:'),
            ul('<strong>access</strong> the personal information I hold about you and receive a copy;',
               '<strong>correct</strong> information that is inaccurate or incomplete;',
               '<strong>delete</strong> your information, except records I must keep by law;',
               '<strong>port</strong> information you provided, in a commonly used format;',
               '<strong>object to or restrict</strong> processing based on legitimate interests;',
               '<strong>withdraw consent</strong> at any time, where processing relies on consent; and',
               '<strong>complain</strong> to your data-protection authority, although I would welcome the chance to put things right first.', alpha=True),
            p(f'To exercise a right, email {MAIL}. I will verify your request using the contact details already on file, and respond within thirty (30) days, or within the period your local law requires.'),
            p('<strong>California residents.</strong> Under the California Consumer Privacy Act, as amended, you may request to know the categories and specific pieces of personal information collected, the sources, purposes and recipients described above; to delete or correct it; and to opt out of sale or sharing, although I do not sell or share it. I use fit measurements only to provide the Services you request. You may use an authorised agent, and you will not be treated differently for exercising any right.'),
        ]),
        ('marketing', 'Marketing messages', 'Only if you ask for them.', [
            p('I do not send newsletters or promotional messages unless you have asked to receive them, and every such message lets you stop them. Messages about an order you have placed are service messages, not marketing.'),
        ]),
        ('children', 'Children', 'Services are for adults.', [
            p(f'The Services are intended for adults. I do not knowingly collect personal information from children under sixteen. A gift for a young person is arranged through the adult who purchases it. If you believe a child has sent me information, please contact {MAIL} and it will be deleted.'),
        ]),
        ('changes', 'Changes to this Policy', 'A new date at the top whenever it changes.', [
            p('I may update this Policy as the Services or the law change. The current version is always on this page with its effective date. Where a change materially affects how your existing information is used, I will tell you directly.'),
        ]),
    ],
)


# ─────────────────────────────── RENDER ───────────────────────────────

src = open(os.path.join(ROOT, 'policy.html'), encoding='utf-8').read()
HEAD = src.split('<script type="application/ld+json">')[0]
MARK = re.search(r'<svg class="pc-mark".*?</svg>', src, re.S).group(0).replace('pc-mark', 'lg-mark')

def render(doc):
    s, t = doc['slug'], doc['title']
    h = HEAD
    h = re.sub(r'<title>.*?</title>', f'<title>{t} · Seraphic Styler</title>', h)
    h = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + doc['desc'], h)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + t + ' — Seraphic Styler', h)
    h = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + doc['desc'], h)
    h = h.replace('seraphicstyler.com/policy"', f'seraphicstyler.com/{s}"')
    h += f'  <link rel="stylesheet" href="css/legal.css?v=2026-10-01" />\n'
    h += '  <script src="js/i18n-site.js?v=2026-09-12" defer></script>\n  <script src="js/geo-lang.js?v=2026-10-02" defer></script>\n</head>\n'

    toc = ''.join(f'<li><a href="#{a[0]}"><span>{i + 1}</span>{a[1]}</a></li>' for i, a in enumerate(doc['articles']))
    arts = ''
    for i, (aid, title, brief, clauses) in enumerate(doc['articles'], 1):
        cl = ''.join(f'<li><span class="lg-cn">{i}.{j}</span><div>{c}</div></li>' for j, c in enumerate(clauses, 1))
        arts += f'''
      <article class="lg-art" id="{aid}" aria-labelledby="{aid}-h">
        <header><span class="lg-num" aria-hidden="true">{i}</span><h2 id="{aid}-h"><span class="sr-only">Article {i}. </span>{title}</h2>
          <p class="lg-brief"><b>In brief</b>{brief}</p></header>
        <ol class="lg-cl">{cl}</ol>
      </article>'''

    def cur(x): return ' aria-current="page"' if x == s else ''
    body = f'''<body id="top">
  <div class="grain" aria-hidden="true"></div>
  <header class="lg lg-top">
    {MARK}
    <a class="brand-lockup" href="./" aria-label="Seraphic Styler home">
      <span class="brand-seraphic">Seraphic</span>
      <span class="brand-styler">Styler</span>
    </a>
  </header>

  <main class="lg">
    <div class="lg-hero">
      <span class="lg-eyebrow">{doc['eyebrow']}</span>
      <h1 class="lg-h1">{doc['h1']}</h1>
      <p class="lg-lead">{doc['lead']}</p>
      <ul class="lg-meta">
        <li>Effective <b>{EFFECTIVE}</b></li>
        <li>Version <b>{VERSION}</b></li>
        <li><b>{len(doc['articles'])}</b> articles</li>
      </ul>
    </div>

    <section class="lg-glance" aria-labelledby="glance-h">
      <h2 id="glance-h">At a glance</h2>
      {ul(*doc['glance'])}
      <p class="lg-fine">This summary is for convenience. The articles below govern.</p>
    </section>

    <div class="lg-body">
      <nav class="lg-toc" aria-label="Contents">
        <details open><summary>Contents</summary><ol>{toc}</ol></details>
      </nav>
      <div class="lg-arts">{arts}
      </div>
    </div>

    <section class="lg-close" aria-labelledby="close-h">
      <span class="lg-eyebrow">Notices &amp; questions</span>
      <h2 id="close-h">Write to me</h2>
      <p>Questions, requests and formal notices under this document may be sent by email. I reply within two business days.</p>
      <address>Seraphic Styler<br>{MAIL}<br><a href="https://instagram.com/seraphicstyler" target="_blank" rel="noopener">@seraphicstyler</a></address>
    </section>
  </main>

  <footer class="lg-foot">
    <a href="terms"{cur('terms')}>Terms of Service</a>
    <a href="privacy"{cur('privacy')}>Privacy Policy</a>
    <a href="policy">Returns &amp; Credit</a>
    <a href="pay">Payment</a>
    <a href="./">Home</a>
  </footer>
  <a class="lg-top-link" href="#top" aria-label="Back to top">↑</a>
  <script>
    /* Contents rail: open on wide screens, collapsed on phones. */
    (function () {{ var d = document.querySelector('.lg-toc details');
      if (d && window.matchMedia && !window.matchMedia('(min-width: 960px)').matches) d.removeAttribute('open'); }})();
  </script>
</body>
</html>
'''
    with open(os.path.join(ROOT, s + '.html'), 'w', encoding='utf-8') as f:
        f.write(h + body)
    print('wrote', s + '.html', f'({len(doc["articles"])} articles)')

render(TERMS)
render(PRIVACY)
