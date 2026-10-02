/* Approved service answers shared by the browser and optional model backend. */
export const topics = {
    difference: {
      answer:'Sourcing is for an exact, in-stock piece from a Vietnamese seller you can identify. Styling is for help choosing pieces, interpreting inspiration, or creating outfits. If you want a particular item identified from a photo, The Trace investigates its source for $25 per item.',
      scene:'difference',
      actions:[['Get a sourcing price','estimate'],['See the styling tiers','prices#styling']]
    },
    sourcing: {
      answer:'Sourcing is purchase help for an exact, in-stock item from an identified Vietnamese seller. Send the direct shop link or precise item details so its price, size, and availability can be confirmed. If the source is unknown, begin with The Trace.',
      scene:'sourcing',
      actions:[['Get your price','estimate'],['Only a photo? The Trace','prices#trace']]
    },
    trace: {
      answer:'The Trace investigates the source of one specific item for $25 per item, credited toward an order if you proceed. It returns an identified source and available price, or an explanation of why the piece cannot be sourced. A match is not guaranteed.',
      scene:'trace',
      actions:[['Start The Trace','service-request.html?service=trace'],['How The Trace is priced','prices#trace']]
    },
    photo: {
      answer:'Would you like that exact item identified, or would you like similar pieces selected around your taste? Identification begins with The Trace. Using the image as inspiration belongs to styling.',
      scene:'photo',
      actions:[['Identify this item','service-request.html?service=trace'],['Find similar pieces','prices#styling']]
    },
    styling: {
      answer:'For alternatives, outfits, or wardrobe direction, choose styling. Compare tiers from $235; each shows its styling fee, clothing credit, and scope before you book.',
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
