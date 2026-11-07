/* Approved service answers shared by the browser and optional model backend. */
export const topics = {
    difference: {
      answer:'Sourcing is for a ready-made, in-stock piece with a link and a price: I buy it as listed, with no customising and no back-and-forth. The Trace is a personal concierge for one piece with no price, or one that needs a custom size: I talk with you and the house until it is settled, for $50 per item, paid first. Styling is all-inclusive and longer-term, and the only service with piece credit.',
      scene:'difference',
      actions:[['Get a sourcing price','estimate'],['See the styling tiers','prices#styling']]
    },
    sourcing: {
      answer:'Sourcing is purchase help for a ready-made, in-stock item, bought exactly as listed. Paste the shop link and price into the estimator to see your total. If there is no price, the shop says “DM for price”, or you need a custom size or made-to-measure, that is The Trace.',
      scene:'sourcing',
      actions:[['Get your price','estimate'],['Only a photo? The Trace','prices#trace']]
    },
    trace: {
      answer:'The Trace investigates one specific item for $50 per item, paid before I start. It is a personal concierge: I find the house, message them in Vietnamese and go back and forth with you and with them on price, sizes and custom measurements (made-to-measure adds $25 a garment and is final sale). It pays for that conversation, so it does not come off an order and carries no piece credit. A match is not guaranteed.',
      scene:'trace',
      actions:[['Start The Trace','https://tally.so/r/gD10Kl?about=I%20need%20The%20Trace%20for%20item%20identification&source=trace'],['How The Trace is priced','prices#trace']]
    },
    photo: {
      answer:'Would you like that exact item identified, or would you like similar pieces selected around your taste? Identification begins with The Trace. Using the image as inspiration belongs to styling.',
      scene:'photo',
      actions:[['Identify this item','https://tally.so/r/gD10Kl?about=I%20need%20The%20Trace%20for%20item%20identification&source=trace'],['Find similar pieces','prices#styling']]
    },
    styling: {
      answer:'Styling is for selection, outfits and wardrobe direction. It is all-inclusive and longer-term: sourcing and tracing are included, and it is the only service with piece credit. Compare tiers from $235; each shows its styling fee, clothing credit, and scope before you book.',
      scene:'styling',
      actions:[['See the styling tiers','prices#styling'],['Book styling','#lane-styling']]
    },
    pricing: {
      answer:'A sourcing quote separates the store price, service fees, and shipping. Styling bookings combine a styling fee with clothing credit for approved purchases. Shipping is separate, and any additional clothing budget is agreed before purchase.',
      scene:'pricing',
      actions:[['Every price','prices'],['Get a sourcing price','estimate']]
    },
    gift: {
      answer:'Yes. Choose a styling tier and leave a note. The recipient uses a private gift code and begins with a style intake when they are ready. Custom Wardrobe gifts are scoped before their booking is confirmed.',
      scene:'gift',
      actions:[['Explore gift styling','#gift'],['Plan a gift','service-request.html?service=gift']]
    },
    verification: {
      answer:'The actual pieces are checked in person and photographed according to the agreed process. Garments require your approval before purchase. Research and styling fees follow their own confirmed payment terms.',
      scene:'verification',
      actions:[['See how it works','#process'],['Read service terms','policy']]
    },
    shipping: {
      answer:'Tracked international delivery is available. Your destination, parcel, and timing determine the options and cost. Shipping is confirmed for your request, and the final carrier amount follows the packed weight.',
      scene:'shipping',
      actions:[['Shipping, answered','free-international-shipping'],['Get your price','estimate']]
    },
    stock: {
      answer:'Live availability needs to be checked with the identified seller. Send the direct shop link, item, size, and destination so the request can be reviewed. This guide cannot confirm current stock.',
      scene:'stock',
      actions:[['Send the item','estimate']]
    },
    group: {
      answer:'Group buying is for a defined shared order, such as matching pieces for an event or team. The scope, item budget, service fee, and consolidated delivery are quoted for the group. Boutique resale follows a separate buying-agent structure.',
      scene:'group',
      actions:[['Plan a group order','service-request.html?service=bulk'],['See group buying','#bulk']]
    },
    boutique: {
      answer:'Boutique buying supports stores and resellers sourcing a considered Vietnamese range. It can include showroom work, ordering, checks, and consolidated export against an agreed buy brief. Its buying-agent fees are separate from personal group pricing.',
      scene:'boutique',
      actions:[['Price your boutique buy','boutique-calculator'],['How a buying round works','for-boutiques']]
    },
    groupgift: {
      answer:'For one recipient, gift styling begins with a private code and style intake. For gifts to a larger group, use the group-buying route so quantities, sizes, budget, and delivery can be scoped together.',
      scene:'groupgift',
      actions:[['Gift one experience','service-request.html?service=gift'],['Plan group gifting','service-request.html?service=bulk']]
    },
    fallback: {
      answer:'This guide explains the published services. For a specific item, deadline, or personal recommendation, send a short request and the right next step can be confirmed.',
      scene:'',
      actions:[['Ask me','service-request.html?service=unsure'],['Every price','prices']]
    }
  };
