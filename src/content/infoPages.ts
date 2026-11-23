import { INSTAGRAM_HANDLE, INSTAGRAM_URL, STORE_EMAIL, STORE_MAPS_URL, STORE_PHONE, STORE_WHATSAPP_URL } from "@/lib/storefront";

// Text for the information pages linked from the footer. Written in the simple format that
// src/components/content/SimpleMarkdown.tsx renders (### headings, **bold**, - bullets, | tables |).

export type InfoSection = "Quick Links" | "Customer Care" | "About" | "Legal Information";

export interface InfoPage {
  slug: string;
  path: string;
  title: string;
  tagline?: string;
  section: InfoSection;
  body: string;
  /** Shown as an intro on another page instead of having its own page. */
  blurbOnly?: boolean;
}

const CONTACT_LINES = `WhatsApp: ${STORE_PHONE}

WhatsApp Link: ${STORE_WHATSAPP_URL}`;

export const INFO_PAGES: InfoPage[] = [
  {
    slug: "shop-all",
    path: "/products",
    title: "Shop All",
    tagline: "Discover Your Perfect Style",
    section: "Quick Links",
    blurbOnly: true,
    body: `Welcome to Hayaat Emporium, your destination for women's ethnic wear and modest fashion in Hyderabad.

Explore our thoughtfully curated collection of ready-to-wear Pakistani suits, elegant ethnic outfits, contemporary co-ord sets, modest clothing, premium hijabs, hijab accessories, and beautiful anti-tarnish jewelry.

Whether you are looking for comfortable everyday outfits, elegant festive wear, or stylish pieces for special occasions, discover fashion that brings together traditional charm and contemporary elegance.

### Explore Our Fashion Categories

**Pakistani Suits**

Discover beautifully designed Pakistani suits featuring elegant prints, intricate embroidery, and graceful silhouettes. Perfect for everyday elegance, family gatherings, festive celebrations, and special occasions.

**Women's Ethnic Wear**

Celebrate timeless tradition with our curated selection of ethnic outfits that combine classic designs with contemporary styling.

**Co-ord Sets**

Make everyday dressing effortless with stylish matching co-ord sets designed for comfort, versatility, and modern elegance.

**Modest Fashion**

Discover graceful outfits that combine comfortable coverage with beautiful designs, allowing you to express your personal style confidently.

**Premium Hijabs**

Complete your wardrobe with breathable, comfortable, and beautifully selected hijabs suitable for everyday wear and special occasions.

**Hijab Accessories**

Find practical and stylish accessories that make hijab styling easier, more secure, and comfortable.

**Anti-Tarnish Jewelry**

Add the perfect finishing touch to your outfit with elegant anti-tarnish jewelry that complements traditional and contemporary looks.

### Fashion for Every Occasion

From everyday essentials to festive favourites, Hayaat Emporium brings together styles that make you feel confident, comfortable, and beautiful.

Discover your favourite looks and experience the beauty of modest fashion.

**Hayaat Emporium – Elegance in Every Fold.**`,
  },
  {
    slug: "new-arrivals",
    path: "/new-arrivals",
    title: "New Arrivals",
    tagline: "Fresh Styles. New Inspirations. Timeless Elegance.",
    section: "Quick Links",
    body: `Discover what's new at Hayaat Emporium!

Explore our latest additions to women's ethnic wear and modest fashion, featuring beautiful Pakistani suits, contemporary co-ord sets, elegant modest outfits, premium hijabs, and thoughtfully selected accessories.

Our latest collections bring together traditional inspiration, modern trends, and effortless styling to help you refresh your wardrobe with beautiful new looks.

### Discover What's New

**Latest Pakistani Suits**

Explore fresh designs featuring beautiful prints, elegant embroidery, and sophisticated detailing.

**New Ethnic Wear**

Discover traditional-inspired outfits with contemporary touches for everyday wear and special occasions.

**Latest Co-ord Sets**

Refresh your everyday wardrobe with stylish matching sets that make dressing effortless.

**New Hijab Collections**

Explore beautiful hijab colours, textures, and styles designed for comfortable and elegant styling.

**New Accessories**

Complete your look with carefully selected hijab accessories and elegant anti-tarnish jewelry.

### Find Your Next Favourite Look

Whether you love traditional elegance or contemporary modest fashion, our latest arrivals bring you fresh inspiration for every occasion.

Explore our newest styles and discover something beautiful at Hayaat Emporium.

**New Arrivals. New Elegance. Your Signature Style.**`,
  },
  {
    slug: "collections",
    path: "/collections",
    title: "Collections",
    tagline: "Curated Collections for Every Occasion",
    section: "Quick Links",
    blurbOnly: true,
    body: `At Hayaat Emporium, we bring together traditional beauty and contemporary modest fashion through collections thoughtfully selected for women who appreciate elegance, comfort, and personal style.

Explore our different collections and find beautiful outfits and accessories for every mood and occasion.

### Our Collections

**Pakistani Suits**

Discover the timeless beauty of Pakistani fashion with elegant prints, intricate embroidery, beautiful detailing, and graceful silhouettes.

**Ethnic Wear**

Explore traditional-inspired outfits that celebrate cultural elegance while embracing contemporary fashion.

**Co-ord Sets**

Enjoy effortless styling with beautifully coordinated outfits designed for everyday comfort and modern appeal.

**Modest Wear**

Discover elegant clothing that combines comfortable coverage, versatile styling, and graceful designs.

**Premium Hijabs**

Explore breathable and comfortable hijabs in beautiful colours and styles to complement your modest wardrobe.

**Hijab Accessories**

Find useful styling essentials designed to make your hijab experience comfortable and effortless.

**Anti-Tarnish Jewelry**

Discover elegant jewelry pieces that add a sophisticated finishing touch to everyday and occasion wear.

### Style That Reflects You

Every collection at Hayaat Emporium is an opportunity to express your individuality through beautiful fashion.

Explore our collections and find the styles that make every moment special.`,
  },
  {
    slug: "style-guides",
    path: "/style-guides",
    title: "Style Guides",
    tagline: "The Hayaat Style Journal — Find Your Style. Embrace Your Elegance.",
    section: "Quick Links",
    body: `Welcome to the Hayaat Emporium Style Guide, your destination for fashion inspiration, styling tips, and ideas to create beautiful looks with confidence.

Whether you love traditional Pakistani outfits, contemporary co-ord sets, or elegant modest fashion, discover simple ways to style your favourite pieces.

### 1. Pakistani Suit Styling Tips

Pakistani suits are loved for their graceful silhouettes, beautiful prints, and intricate detailing.

Here are some ways to style them:

- Pair embroidered suits with simple, complementary hijabs.
- Choose delicate jewelry for an elegant everyday look.
- Add statement accessories for festive occasions.
- Match your footwear with the overall outfit.
- Choose complementary colours for a coordinated appearance.

### 2. Everyday Modest Fashion

Create comfortable and elegant everyday looks with versatile wardrobe essentials.

- Choose breathable and comfortable clothing.
- Experiment with neutral and earthy colour combinations.
- Pair relaxed outfits with coordinating hijabs.
- Keep accessories simple and elegant.
- Choose versatile outfits suitable for different occasions.

### 3. Hijab Styling Inspiration

The right hijab can beautifully complete your outfit.

- Choose hijab colours that complement your clothing.
- Experiment with different draping styles.
- Select breathable materials for everyday comfort.
- Use suitable hijab accessories for secure styling.
- Explore neutral shades for versatile wardrobe combinations.

### 4. Co-ord Set Styling

Co-ord sets make dressing stylish and effortless.

- Pair matching sets with minimal accessories.
- Choose complementary hijabs.
- Add simple jewelry for a polished appearance.
- Style with comfortable footwear.
- Experiment with different layering options.

### 5. Jewelry Styling Tips

The right jewelry adds elegance to any outfit.

- Choose delicate pieces for everyday styling.
- Pair elegant jewelry with traditional outfits.
- Use statement pieces for festive occasions.
- Coordinate jewelry with your outfit colours.
- Keep heavily embroidered outfits balanced with simple accessories.

### 6. Styling for Special Occasions

Create beautiful looks for different moments.

**Family Gatherings:** Choose elegant Pakistani suits with delicate accessories.

**Festive Celebrations:** Explore beautifully detailed ethnic outfits with complementary jewelry.

**Everyday Outings:** Choose comfortable co-ord sets and breathable hijabs.

**Casual Occasions:** Keep your look simple with minimal accessories and versatile outfits.

### Discover Your Signature Style

Fashion is personal, and every woman has her own way of expressing elegance.

At Hayaat Emporium, we believe the most beautiful style is the one that makes you feel confident, comfortable, and truly yourself.

**Stay Inspired. Stay Elegant. Stay You.**`,
  },
  {
    slug: "contact",
    path: "/contact",
    title: "Contact Us",
    tagline: "We're Here to Help!",
    section: "Customer Care",
    body: `At Hayaat Emporium, your shopping experience matters to us.

Whether you have questions about our latest collections, need assistance choosing an outfit, want product information, or require help with an existing order, our team is happy to assist you.

We believe shopping should always feel simple, comfortable, and enjoyable.

### Get in Touch With Us

**WhatsApp Us**

Have a product enquiry or need quick assistance? Connect with us directly on WhatsApp.

WhatsApp Number: ${STORE_PHONE}

WhatsApp Link: ${STORE_WHATSAPP_URL}

**Call Us**

Prefer speaking with our team directly? Give us a call for product enquiries, shopping assistance, and customer support.

Phone Number: ${STORE_PHONE}

**Email Us**

For business enquiries, product questions, and customer assistance, reach us through email.

Email: ${STORE_EMAIL}

**Follow Us on Instagram**

Stay connected with Hayaat Emporium and explore our latest arrivals, Pakistani suits, modest fashion inspiration, styling ideas, and new collections.

Instagram: ${INSTAGRAM_HANDLE}

Instagram Link: ${INSTAGRAM_URL}

### Visit Our Store in Hyderabad

We welcome you to visit Hayaat Emporium and discover our carefully curated collections in person.

Explore beautiful Pakistani suits, ethnic wear, co-ord sets, premium hijabs, hijab accessories, and elegant jewelry.

Location: Hyderabad, Telangana, India.

Google Maps Location: ${STORE_MAPS_URL}

### How Can We Help You?

Our team can assist you with:

- Product information and availability.
- Size and fit guidance.
- New arrivals and collections.
- Order-related enquiries.
- Shipping and delivery assistance.
- Returns and exchange enquiries.

Thank you for choosing Hayaat Emporium. We look forward to helping you discover your perfect style!

**Hayaat Emporium – Elegance in Every Fold.**`,
  },
  {
    slug: "size-guide",
    path: "/size-guide",
    title: "Size Guide",
    tagline: "Find Your Perfect Fit",
    section: "Customer Care",
    body: `At Hayaat Emporium, we believe that looking beautiful should always feel comfortable.

Finding the right size is an important part of enjoying your favourite outfits. Our size guide is designed to help you understand your measurements and choose clothing that suits your preferred fit.

### How to Measure Yourself

**1. Bust**

Measure around the fullest part of your bust. Keep the measuring tape straight and comfortably fitted.

**2. Waist**

Measure around your natural waistline, usually the narrowest part of your torso.

**3. Hips**

Measure around the fullest part of your hips while keeping the measuring tape level.

**4. Shoulder**

Measure from one shoulder edge to the other across your back.

**5. Outfit Length**

Measure from the highest point of your shoulder down to your desired outfit length.

**6. Sleeve Length**

Measure from your shoulder point to your preferred sleeve ending.

### General Women's Size Reference

| Size | Bust (inches) | Waist (inches) |
|---|---|---|
| XS | 32–34 | 26–28 |
| S | 34–36 | 28–30 |
| M | 36–38 | 30–32 |
| L | 38–40 | 32–34 |
| XL | 40–42 | 34–36 |
| XXL | 42–44 | 36–38 |

*This is a general reference chart, not a verified measurement chart for every Hayaat Emporium product. Always refer to the individual product measurements.*

### Helpful Tips for Choosing the Right Size

- Take accurate measurements before ordering.
- Check the size chart provided on the product page.
- Consider your preferred relaxed or regular fit.
- Remember that different designs may have different measurements.
- If you are between sizes, ask our team for guidance.

### Need Help Finding Your Size?

We are happy to help you choose the right fit.

${CONTACT_LINES}

**Comfortable Fit. Confident Style. Beautiful You.**`,
  },
  {
    slug: "shipping",
    path: "/shipping",
    title: "Shipping Info",
    tagline: "Shipping & Delivery — Your Favourite Styles, Delivered to Your Doorstep.",
    section: "Customer Care",
    body: `At Hayaat Emporium, we want your shopping experience to be convenient from the moment you place your order until your favourite products arrive at your doorstep.

Whether you are shopping from Hyderabad or another part of India, we aim to make receiving your favourite ethnic wear and modest fashion simple and hassle-free.

### 1. Nationwide Shipping

We offer shipping across India, allowing customers from different cities and locations to shop our collections online.

### 2. Order Processing

Once your order is successfully placed and confirmed, our team begins preparing it for dispatch.

Processing times may vary depending on product availability, order volume, and operational requirements.

### 3. Delivery Timelines

Delivery timelines may vary depending on your location, courier availability, processing time, and other logistical conditions.

Your estimated delivery information will be communicated through the available order confirmation or tracking details.

### 4. Shipping Charges

Applicable shipping charges, if any, will be displayed during checkout before you complete your purchase.

### 5. Order Tracking

Once your order has been dispatched, tracking details may be shared using the contact information provided during checkout.

Customers can use the tracking information to follow their shipment.

### 6. Accurate Delivery Information

Please ensure that your name, phone number, and complete shipping address are accurate when placing an order.

Providing correct details helps us ensure a smoother delivery experience.

### 7. Delayed Deliveries

Although we aim to deliver orders within the estimated timeline, unexpected delays may occur due to courier operations, weather conditions, holidays, or other logistical circumstances.

### 8. Need Shipping Assistance?

If you have questions about your order or delivery, our team is happy to help.

WhatsApp: ${STORE_PHONE}

Email: ${STORE_EMAIL}

Thank you for shopping with Hayaat Emporium.

**Beautiful Fashion, Delivered with Care.**`,
  },
  {
    slug: "returns",
    path: "/returns",
    title: "Returns & Exchanges",
    tagline: "Your Satisfaction Matters to Us",
    section: "Customer Care",
    body: `At Hayaat Emporium, we want you to love every purchase you make.

We understand that choosing clothing online can sometimes come with questions about colour, fit, and product details. Our customer care team is here to help you with eligible return and exchange enquiries.

### 1. Return Eligibility

Products may be eligible for returns according to the applicable Hayaat Emporium return policy.

General conditions may include:

- Products must be unused and unworn.
- Original tags should remain attached.
- Original packaging should be retained.
- Products must be in their original condition.
- Order details or proof of purchase must be available.

### 2. Damaged or Incorrect Products

If you receive a damaged, defective, or incorrect product, please contact us as soon as possible.

Share the following information:

- Your order number.
- A description of the issue.
- Clear photographs of the product.
- Photographs of the packaging, if relevant.

Our team will review your request and guide you through the next steps.

### 3. Exchange Requests

Exchange requests may be considered subject to product availability and the applicable exchange policy.

### 4. Refund Information

Approved refunds, where applicable, will be processed according to the original payment method or applicable refund procedure.

The time taken for a refund to reflect may depend on the payment provider or bank.

### 5. Products With Special Return Conditions

Certain product categories, including hijabs, hijab accessories, and jewelry, may have specific return or exchange restrictions due to hygiene and personal-use considerations.

Please review the conditions displayed on the relevant product page.

### 6. How to Request a Return

**Step 1:** Contact our customer care team.

**Step 2:** Share your order number.

**Step 3:** Explain the reason for your request.

**Step 4:** Provide product photographs if required.

**Step 5:** Wait for confirmation and further instructions.

### 7. Contact Customer Care

For return and exchange enquiries:

WhatsApp: ${STORE_PHONE}

Email: ${STORE_EMAIL}

We appreciate your understanding and look forward to making your shopping experience better.`,
  },
  {
    slug: "about",
    path: "/about",
    title: "Our Story",
    tagline: "The Story Behind Hayaat Emporium — Elegance in Every Fold.",
    section: "About",
    body: `Welcome to Hayaat Emporium, a women's ethnic wear and modest fashion boutique based in Hyderabad, India.

We believe fashion is more than just clothing. It is a beautiful expression of individuality, culture, confidence, and personal style.

Hayaat Emporium brings together the timeless charm of traditional ethnic wear and the effortless beauty of contemporary modest fashion.

Our boutique offers a carefully curated selection of ready-to-wear Pakistani suits, festive outfits, trendy daily-wear co-ord sets, breathable premium hijabs, hijab accessories, and elegant anti-tarnish jewelry.

### Our Fashion Philosophy

We believe every woman deserves clothing that makes her feel comfortable, confident, and beautiful.

Our collections are selected to celebrate different styles and preferences, whether you love traditional elegance, contemporary simplicity, or a combination of both.

From beautifully embroidered Pakistani suits to versatile everyday outfits, we aim to bring together styles that make dressing effortless and enjoyable.

### What We Offer

**Pakistani Suits**

Discover elegant Pakistani-inspired outfits featuring beautiful prints, embroidery, and sophisticated detailing.

**Ethnic Wear**

Celebrate tradition with timeless ethnic outfits designed for different occasions.

**Co-ord Sets**

Explore modern matching outfits that bring comfort and effortless styling together.

**Modest Fashion**

Discover graceful outfits that combine comfortable coverage with contemporary elegance.

**Premium Hijabs**

Complete your modest wardrobe with breathable and beautifully selected hijabs.

**Hijab Accessories**

Find practical essentials for comfortable and convenient hijab styling.

**Anti-Tarnish Jewelry**

Add a sophisticated finishing touch to your favourite outfits with elegant jewelry.

### Our Commitment to You

At Hayaat Emporium, we aim to offer:

- Carefully curated fashion collections.
- Beautiful traditional and contemporary designs.
- Comfortable modest fashion choices.
- A welcoming boutique shopping experience.
- Convenient online shopping.
- Nationwide delivery across India.

### Visit Us or Shop Online

Based in Hyderabad, Hayaat Emporium welcomes you to explore our collections in person or shop online from anywhere across India.

We are delighted to be part of your fashion journey.

**Hayaat Emporium – Where Tradition Meets Contemporary Elegance.**`,
  },
  {
    slug: "sustainability",
    path: "/sustainability",
    title: "Sustainability",
    tagline: "Our Approach to Thoughtful Fashion — Timeless Style. Thoughtful Choices. Lasting Elegance.",
    section: "About",
    body: `At Hayaat Emporium, we believe that true style goes beyond changing trends.

Fashion should be something you appreciate, enjoy, and feel confident wearing. We value timeless designs, versatile styling, and thoughtful purchasing choices.

Our approach to fashion celebrates pieces that can be enjoyed across different occasions and styled in different ways.

### Our Values

**1. Timeless Fashion**

We appreciate traditional ethnic designs and modest fashion styles that remain beautiful beyond temporary trends.

**2. Thoughtful Shopping**

We encourage customers to choose pieces they genuinely love and can enjoy as part of their wardrobe.

**3. Quality-Focused Selection**

We value carefully selected clothing, beautiful detailing, and products chosen with attention to their design and appeal.

**4. Versatile Wardrobe Choices**

We appreciate outfits that can be styled for everyday wear, family gatherings, festive occasions, and special moments.

**5. Conscious Fashion Choices**

We believe thoughtful shopping decisions can contribute to a more considered fashion experience.

**6. Continuous Improvement**

Our journey towards more responsible fashion is ongoing. We look forward to exploring meaningful opportunities to improve our approach as our business grows.

### Our Vision

At Hayaat Emporium, we believe that elegance and thoughtful choices go hand in hand.

We aim to celebrate fashion that feels personal, versatile, and timeless.

**Choose Thoughtfully. Dress Beautifully. Embrace Timeless Elegance.**`,
  },
  {
    slug: "privacy",
    path: "/privacy",
    title: "Privacy Policy",
    tagline: "Last Updated: 24 November 2026",
    section: "Legal Information",
    body: `At Hayaat Emporium, we respect your privacy and are committed to protecting the personal information you share with us when visiting our website or purchasing our products.

This Privacy Policy explains how we collect, use, process, and protect your personal information.

### 1. Information We Collect

Depending on how you interact with our website, we may collect:

**Personal Information**

- Full name.
- Phone number.
- Email address.
- Billing address.
- Shipping address.

**Order Information**

- Products purchased.
- Order number.
- Purchase history.
- Payment status.
- Delivery details.

**Technical Information**

- IP address.
- Browser type.
- Device information.
- Website usage information.
- Cookies and similar technologies, where applicable.

**Customer Communication**

Information voluntarily shared through contact forms, WhatsApp, email, and other customer support channels.

### 2. How We Use Your Information

We may use your information to:

- Process and fulfil orders.
- Arrange shipping and delivery.
- Provide order confirmations and updates.
- Respond to customer enquiries.
- Assist with returns and exchanges.
- Improve our website and shopping experience.
- Prevent fraudulent transactions.
- Comply with applicable legal requirements.

### 3. Payment Information

Payments may be processed through third-party payment gateway providers.

Payment information is handled according to the security and privacy practices of the relevant payment service provider.

### 4. Cookies and Website Technologies

Our website may use cookies and similar technologies to improve functionality and customer experience.

These may help us remember shopping preferences, maintain cart functionality, understand website performance, and improve browsing experiences.

Customers may manage cookies through available website settings or browser preferences.

### 5. Sharing of Information

We may share relevant information with trusted third-party service providers when necessary to operate our business.

These may include:

- Payment gateway providers.
- Courier and delivery partners.
- Website hosting providers.
- Analytics providers.
- Customer support service providers.

We do not sell customer personal information to third parties.

### 6. Data Security

We take reasonable technical and organizational measures to protect customer information against unauthorized access, misuse, alteration, and disclosure.

However, no method of electronic transmission or storage can be guaranteed to be completely secure.

### 7. Data Retention

We retain personal information for as long as reasonably necessary for order fulfilment, customer support, business operations, record-keeping, and applicable legal requirements.

### 8. Your Privacy Rights

Subject to applicable laws, you may request:

- Access to your personal information.
- Correction of inaccurate information.
- Deletion of information where legally permissible.
- Withdrawal of consent where applicable.
- Information about how your data is processed.

### 9. Third-Party Websites

Our website may contain links to third-party websites and services.

Hayaat Emporium is not responsible for the privacy practices of independent third-party platforms.

### 10. Children's Privacy

Our website is intended for general customers and is not specifically designed to collect personal information from children.

Applicable parental consent requirements will be followed where necessary.

### 11. Changes to This Privacy Policy

We may update this policy from time to time to reflect changes in our business operations, website features, or applicable laws.

Updated information will be published on this page.

### 12. Contact Us

For privacy-related questions or requests:

Hayaat Emporium

Email: ${STORE_EMAIL}

Phone: ${STORE_PHONE}

WhatsApp: ${STORE_WHATSAPP_URL}

Location: Hyderabad, Telangana, India.`,
  },
  {
    slug: "terms",
    path: "/terms",
    title: "Terms & Conditions",
    tagline: "Last Updated: 24 November 2026",
    section: "Legal Information",
    body: `Welcome to Hayaat Emporium.

These Terms & Conditions govern your access to and use of the Hayaat Emporium website and online shopping services.

By browsing our website or placing an order, you agree to the terms described below, subject to applicable laws.

### 1. About Hayaat Emporium

Hayaat Emporium is a women's ethnic wear and modest fashion boutique based in Hyderabad, Telangana, India.

Our collections include Pakistani suits, ethnic wear, co-ord sets, modest clothing, premium hijabs, hijab accessories, and anti-tarnish jewelry.

We offer in-store shopping and online shopping with nationwide shipping across India.

### 2. Website Usage

Customers agree to use our website for lawful purposes and provide accurate information when placing orders.

Unauthorized use, fraudulent activities, and attempts to interfere with website functionality are not permitted.

### 3. Product Information

We make reasonable efforts to display accurate product descriptions, photographs, prices, colours, and other details.

However, slight differences may occur due to lighting conditions, photography, screen settings, and product variations.

Customers are encouraged to read individual product descriptions before purchasing.

### 4. Product Availability

All products are subject to availability.

Product availability may change depending on stock levels and demand.

If an ordered product becomes unavailable, we will contact the customer regarding the available options, subject to applicable law.

### 5. Pricing and Payments

All product prices will be displayed on the website.

Applicable taxes, shipping charges, and additional fees will be communicated during checkout as required.

Available payment methods will be displayed during the shopping process.

### 6. Order Confirmation

Once an order is placed, customers may receive an order confirmation through the contact information provided.

Orders are subject to product availability and payment verification where applicable.

### 7. Order Cancellation

Cancellation requests must be communicated through official customer support channels.

Whether an order can be cancelled depends on its processing and dispatch status and the applicable cancellation policy.

Approved refunds will be handled according to the relevant refund procedure.

### 8. Shipping and Delivery

Hayaat Emporium offers nationwide shipping across India.

Delivery timelines may vary depending on destination, courier availability, order processing time, and other logistical conditions.

Please refer to our Shipping Information page for additional details.

### 9. Returns and Exchanges

Returns and exchanges are governed by our published Returns & Exchanges Policy.

Customers should review the applicable conditions before completing a purchase.

### 10. Refunds

Approved refunds, where applicable, will be processed according to the relevant payment method and refund procedure.

Processing timelines may depend on the payment provider or banking institution.

### 11. Intellectual Property

All original website content belonging to Hayaat Emporium, including brand elements, graphics, product descriptions, original photographs, and website content, is protected by applicable intellectual property laws.

Such content may not be copied, reproduced, distributed, or commercially used without prior written permission.

### 12. Third-Party Services

Our website may use third-party services, including payment providers, shipping partners, website hosting services, and analytics platforms.

These providers may have their own terms and privacy policies.

### 13. Customer Responsibilities

Customers are responsible for providing accurate contact, billing, and shipping information.

Customers should review their order details before completing a purchase.

### 14. Limitation of Liability

To the extent permitted by applicable law, Hayaat Emporium shall not be responsible for losses resulting from circumstances beyond its reasonable control.

Nothing in these terms limits any customer rights that cannot legally be excluded.

### 15. Force Majeure

Hayaat Emporium shall not be held responsible for delays or interruptions caused by events beyond reasonable control, including natural disasters, transportation disruptions, government restrictions, and other unforeseen circumstances, subject to applicable law.

### 16. Changes to Terms

We may update these Terms & Conditions when necessary.

Any revised terms will be published on this page.

### 17. Governing Law

These Terms & Conditions are governed by the laws of India.

Disputes will be subject to the jurisdiction of competent courts in accordance with applicable laws and consumer protection requirements.

### 18. Contact Information

For questions about these Terms & Conditions, please contact:

Hayaat Emporium

Email: ${STORE_EMAIL}

Phone: ${STORE_PHONE}

WhatsApp: ${STORE_WHATSAPP_URL}

Location: Hyderabad, Telangana, India.`,
  },
];

export const infoPage = (slug: string) => INFO_PAGES.find((p) => p.slug === slug);

/** Pages with their own URL, grouped for the footer and the page sidebar. */
export const INFO_SECTIONS: InfoSection[] = ["Quick Links", "Customer Care", "About", "Legal Information"];
export const routedInfoPages = INFO_PAGES.filter((p) => !p.blurbOnly);
