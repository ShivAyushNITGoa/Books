import { VideoArchive, LibraryBook } from './types';

export interface ThinkingLevel {
  level: number;
  name: string;
  hindiName: string;
  question: string;
  explanation: string;
  hindiExplanation: string;
}

export interface ThinkingCaseStudy {
  id: string;
  title: string;
  hindiTitle: string;
  category: string;
  levels: ThinkingLevel[];
  chandradiptiQuote: string;
}

export interface VideoArchiveExtended extends VideoArchive {
  family: 'Why India?' | 'How India Works' | 'The Hidden System' | 'The Path' | 'The Uncomfortable Truth';
  hindiFamily: string;
  question: string;
  hindiQuestion: string;
  hiddenSystemSummary: string;
  consequence: string;
  chandradiptiReflection: string;
}

export const T2S_VIDEO_FAMILIES = [
  {
    id: 'all',
    name: 'All Documentaries',
    hindiName: 'सभी वृत्तचित्र',
    description: 'Explore deep structural investigations into Indian society and human systems.'
  },
  {
    id: 'why_india',
    name: 'Why India?',
    hindiName: 'भारत ऐसा क्यों है?',
    description: 'Everyday Indian behaviours, customs, and deep social norms decoded.'
  },
  {
    id: 'how_india_works',
    name: 'How India Works',
    hindiName: 'भारत कैसे चलता है?',
    description: 'The invisible economic and organizational engines running daily Indian life.'
  },
  {
    id: 'hidden_system',
    name: 'The Hidden System',
    hindiName: 'अदृश्य व्यवस्था',
    description: 'What lies underneath the ordinary things we take for granted every day.'
  },
  {
    id: 'the_path',
    name: 'The Path',
    hindiName: 'जीवन मार्ग',
    description: 'Life choices, unseen trade-offs, career paths, and navigating reality consciously.'
  },
  {
    id: 'uncomfortable_truth',
    name: 'The Uncomfortable Truth',
    hindiName: 'कड़वी सच्चाई',
    description: 'Reality without sensationalism: prestige, success, and social status examined.'
  }
];

export const DEFAULT_T2S_ARCHIVES: VideoArchiveExtended[] = [
  // 1. WHY INDIA?
  {
    id: 'why-salary',
    title: 'Why Do Indians Ask Your Salary?',
    family: 'Why India?',
    hindiFamily: 'भारत ऐसा क्यों है?',
    duration: '18:45',
    views: '240K',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'Why does an inquiry about your personal income happen so naturally in Indian social interactions?',
    hindiQuestion: 'भारतीय समाज में वेतन पूछना इतना स्वाभाविक और आम क्यों है?',
    hiddenSystemSummary: 'Salary in India functions as a rapid socioeconomic proxy in a high-hierarchy society to establish caste/class standing, marriage eligibility, and conversational pecking order.',
    consequence: 'Individuals tie their psychological self-worth to a number and make life choices purely to project an acceptable baseline.',
    chandradiptiReflection: 'When you understand that the question is about their anxiety of where to place you, you stop feeling offended and start seeing the social hierarchy at work.',
    isPremium: false
  },
  {
    id: 'why-bargain',
    title: 'Why Do We Bargain?',
    family: 'Why India?',
    hindiFamily: 'भारत ऐसा क्यों है?',
    duration: '16:20',
    views: '185K',
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'Why is price negotiation in India not just an economic transaction, but a cultural ritual of trust and competence?',
    hindiQuestion: 'हम मोलभाव क्यों करते हैं? यह केवल पैसे बचाने की बात है या सामाजिक विश्वास की?',
    hiddenSystemSummary: 'Informal markets lack standardized price verification, creating information asymmetry. Bargaining is an iterative game that verifies the merchant is not exploiting the buyer.',
    consequence: 'Bargaining reinforces social agility and personal engagement, but can devalue small producers while supermarket fixed pricing gets unquestioned acceptance.',
    chandradiptiReflection: 'Notice how easily people pay ₹250 for popcorn in a multiplex without a word, but argue over ₹5 with a vendor who woke up at 4 AM.',
    isPremium: false
  },
  {
    id: 'why-log-kya-kahenge',
    title: 'Why Does "Log Kya Kahenge" Rule Our Lives?',
    family: 'Why India?',
    hindiFamily: 'भारत ऐसा क्यों है?',
    duration: '21:10',
    views: '320K',
    thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'What is the actual structural mechanism behind the phrase "Log Kya Kahenge"?',
    hindiQuestion: "'लोग क्या कहेंगे' का डर भारतीय परिवारों के निर्णयों को कैसे नियंत्रित करता है?",
    hiddenSystemSummary: 'In the absence of a comprehensive state social safety net, the community/biradari acts as insurance. Social compliance is the premium paid to maintain membership.',
    consequence: 'Generations sacrifice individual potential, career risk, and genuine relationships to preserve family standing in a collective tribunal.',
    chandradiptiReflection: 'The "Log" (people) are not watching you because they care; they are policing boundaries to ensure nobody escapes the compromises they themselves had to make.',
    isPremium: false
  },
  {
    id: 'why-remove-shoes',
    title: 'Why Do We Remove Our Shoes?',
    family: 'Why India?',
    hindiFamily: 'भारत ऐसा क्यों है?',
    duration: '14:35',
    views: '110K',
    thumbnail: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'What psychological and physical boundary does the threshold of an Indian home represent?',
    hindiQuestion: 'घर की दहलीज पर जूते उतारने के पीछे स्वच्छता के अलावा कौन सी गहरी सामाजिक व्यवस्था है?',
    hiddenSystemSummary: 'The threshold (dehleez) demarcates the chaotic, uncontrolled public square from the sacred, hygienic domestic haven.',
    consequence: 'A visible transition from external public persona to internal authentic self.',
    chandradiptiReflection: 'Every physical ritual in India encodes an invisible psychological boundary. When you see the boundary, you understand the culture.',
    isPremium: true
  },

  // 2. HOW INDIA WORKS
  {
    id: 'how-mandi-works',
    title: 'How Does an Indian Mandi Work?',
    family: 'How India Works',
    hindiFamily: 'भारत कैसे चलता है?',
    duration: '24:15',
    views: '290K',
    thumbnail: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'How do thousands of tonnes of fresh produce get auctioned, sorted, and dispatched before the sun rises?',
    hindiQuestion: 'मंडी की विशाल व्यवस्था सुबह सूरज उगने से पहले कैसे काम करती है?',
    hiddenSystemSummary: 'The APMC commission agents (arhtiyas) do not just facilitate trades; they provide informal credit, harvest loans, and risk absorption in a cash-fluid ecosystem.',
    consequence: 'Farmers get guaranteed liquidity but are structurally dependent on commission agents who control price discovery.',
    chandradiptiReflection: 'Before criticizing a system as "outdated", understand the centuries of informal credit networks that keep food on 1.4 billion plates every single morning.',
    isPremium: false
  },
  {
    id: 'how-kirana-survives',
    title: 'How Does a Kirana Store Survive Against Giants?',
    family: 'How India Works',
    hindiFamily: 'भारत कैसे चलता है?',
    duration: '19:40',
    views: '210K',
    thumbnail: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'Why could multi-billion dollar quick-commerce apps and hypermarts never eliminate the corner Kirana?',
    hindiQuestion: 'अरबों डॉलर की ई-कॉमर्स कंपनियां भी गली के किराना स्टोर को क्यों खत्म नहीं कर सकीं?',
    hiddenSystemSummary: 'The kirana runs on relationship capital, interest-free ledger credit (khata), fractional packaging, and hyper-local spatial efficiency with near-zero overhead.',
    consequence: 'It remains the financial shock-absorber for lower and middle-class households during lean weeks.',
    chandradiptiReflection: 'Algorithms optimize for transaction speed; the kirana optimizes for human relationship and community trust.',
    isPremium: false
  },
  {
    id: 'how-milk-reaches',
    title: 'How Milk Reaches 1.4 Billion Homes Daily',
    family: 'How India Works',
    hindiFamily: 'भारत कैसे चलता है?',
    duration: '22:05',
    views: '340K',
    thumbnail: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'How does India operate the largest perishable logistics cold-chain on planet Earth without failing a single day?',
    hindiQuestion: 'भारत का दुग्ध आपूर्ति नेटवर्क हर सुबह बिना रुके 140 करोड़ लोगों तक कैसे पहुंचता है?',
    hiddenSystemSummary: 'The cooperative federation model integrates millions of smallholders with decentralized bulk chillers, railway milk tankers, and automated pouching plants.',
    consequence: 'Direct transfer of urban consumer expenditure straight into rural women dairy farmers’ bank accounts daily.',
    chandradiptiReflection: 'When institutions are designed around collective ownership rather than speculative extraction, stability becomes indestructible.',
    isPremium: true
  },

  // 3. THE HIDDEN SYSTEM
  {
    id: 'hidden-chai-20',
    title: 'The Hidden System Behind Your ₹20 Chai',
    family: 'The Hidden System',
    hindiFamily: 'अदृश्य व्यवस्था',
    duration: '17:50',
    views: '410K',
    thumbnail: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'What global and domestic machinery powers the roadside tea stall where an entire nation pauses?',
    hindiQuestion: 'सड़क किनारे ₹20 की चाय की टपरी के पीछे कौन सा अदृश्य सामाजिक व आर्थिक ढांचा काम करता है?',
    hiddenSystemSummary: 'CTC tea processing, cooperative milk dispatch, sugar subsidies, and municipal street vendor licensing intersect at the roadside stall as the great democratic equalizer.',
    consequence: 'A neutral third place where laborers, bureaucrats, students, and executives converse on equal ground.',
    chandradiptiReflection: 'Chai is not a beverage in India; it is a temporary truce between social classes.',
    isPremium: false
  },
  {
    id: 'hidden-indian-weddings',
    title: 'The Hidden System Behind Indian Weddings',
    family: 'The Hidden System',
    hindiFamily: 'अदृश्य व्यवस्था',
    duration: '26:30',
    views: '480K',
    thumbnail: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'Why do Indian families routinely spend 20% to 50% of their entire lifetime net worth on a 3-day event?',
    hindiQuestion: 'भारतीय परिवार जीवन भर की पूंजी एक 3-दिन की शादी में खर्च करने के लिए क्यों विवश होते हैं?',
    hiddenSystemSummary: 'A wedding is not romantic self-expression; it is an alliance summit, a public solvency declaration, and a reciprocal debt network that locks extended kin into obligation.',
    consequence: 'Young couples and parents take debilitating high-interest personal loans to avoid social delegitimization.',
    chandradiptiReflection: 'When prestige is public and debt is private, people will choose poverty over embarrassment every time.',
    isPremium: true
  },
  {
    id: 'hidden-coaching-kota',
    title: 'The Hidden System Behind Kota & Coaching Factories',
    family: 'The Hidden System',
    hindiFamily: 'अदृश्य व्यवस्था',
    duration: '25:15',
    views: '520K',
    thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'How did competitive exam preparation transform into a multi-billion dollar industrial manufacturing complex?',
    hindiQuestion: 'प्रतियोगी परीक्षाओं की तैयारी एक बहु-अरब डॉलर की औद्योगिक मशीन कैसे बन गई?',
    hiddenSystemSummary: 'High demographic pressure paired with limited seats in formal institutions creates artificial scarcity. Coaching centers sell insurance against middle-class downward mobility.',
    consequence: 'Millions of young minds burn their formative years memorizing patterns rather than developing original creative intellect.',
    chandradiptiReflection: 'The system does not test your intelligence; it tests your tolerance for repetitive psychological friction.',
    isPremium: false
  },

  // 4. THE PATH
  {
    id: 'path-career-status',
    title: 'The Hidden Cost of Choosing a Career for Status',
    family: 'The Path',
    hindiFamily: 'जीवन मार्ग',
    duration: '20:45',
    views: '275K',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'What actually happens to your life when your career choice is driven by what sounds prestigious to your relatives?',
    hindiQuestion: 'जब करियर का चुनाव रिश्तेदारों को प्रभावित करने के लिए किया जाता है, तो उसकी वास्तविक कीमत क्या होती है?',
    hiddenSystemSummary: 'Status-seeking careers trade current personal autonomy for external prestige. Once locked in by lifestyle inflation, exit costs become psychologically prohibitive.',
    consequence: 'Chronic professional burnout masked by social respectability.',
    chandradiptiReflection: 'Prestige is what other people think you should want. Purpose is what you would do if nobody could ever applaud.',
    isPremium: false
  },
  {
    id: 'path-moving-big-city',
    title: 'What Nobody Tells You About Moving to a Big City',
    family: 'The Path',
    hindiFamily: 'जीवन मार्ग',
    duration: '18:10',
    views: '310K',
    thumbnail: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'What is the real economic and psychological tax of migration to India’s tier-1 metros?',
    hindiQuestion: 'महानगरों की चकाचौंध के पीछे का अनकहा सच और छुपा हुआ मूल्य क्या है?',
    hiddenSystemSummary: 'High rents extract 40% of early-career earnings, spatial distance weakens family support, and commercialized leisure replaces spontaneous community life.',
    consequence: 'Financial velocity increases, but resilience against health and psychological shocks drops sharply.',
    chandradiptiReflection: 'The city gives you opportunities, but charges you in time, air quality, and solitude. Count the cost before you celebrate the salary.',
    isPremium: false
  },
  {
    id: 'path-identity-job',
    title: 'What Happens When Your Job Becomes Your Entire Identity?',
    family: 'The Path',
    hindiFamily: 'जीवन मार्ग',
    duration: '16:50',
    views: '195K',
    thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'Why is tying your self-worth to a corporate designation the most precarious risk you can take?',
    hindiQuestion: 'जब आपकी पहचान ही आपकी नौकरी बन जाए, तो जीवन में क्या जोखिम पैदा होता है?',
    hiddenSystemSummary: 'Corporations actively encourage emotional identity investment because it extracts voluntary overtime and unconditional loyalty at zero marginal cost.',
    consequence: 'A layoff or organizational restructuring causes an existential identity collapse rather than a temporary economic challenge.',
    chandradiptiReflection: 'A job is an economic contract, not your soul. Never love an institution that cannot love you back.',
    isPremium: true
  },

  // 5. THE UNCOMFORTABLE TRUTH
  {
    id: 'truth-prestige',
    title: 'The Uncomfortable Truth About Prestige',
    family: 'The Uncomfortable Truth',
    hindiFamily: 'कड़वी सच्चाई',
    duration: '22:15',
    views: '380K',
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'Why does society reward the appearance of importance far more than genuine utility?',
    hindiQuestion: 'समाज वास्तविक उपयोगिता से ज्यादा प्रतिष्ठा और दिखावे को क्यों पुरस्कृत करता है?',
    hiddenSystemSummary: 'Prestige is a social coordination signal designed to reduce evaluation costs. Those who master the codes of prestige capture disproportionate institutional resources.',
    consequence: 'Talented individuals spend more energy signaling competence than building true capability.',
    chandradiptiReflection: 'True authority does not need to perform. The moment you need a badge to prove you matter, you have already surrendered power.',
    isPremium: false
  },
  {
    id: 'truth-success',
    title: 'The Uncomfortable Truth About Success in India',
    family: 'The Uncomfortable Truth',
    hindiFamily: 'कड़वी सच्चाई',
    duration: '25:40',
    views: '450K',
    thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&auto=format&fit=crop',
    videoUrl: '',
    question: 'What are the compounding variables of success that conventional meritocracy narratives completely ignore?',
    hindiQuestion: 'सफलता की पारंपरिक कहानियों में कौन से अदृश्य सामाजिक कारक कभी नहीं बताए जाते?',
    hiddenSystemSummary: 'Cultural capital, familial network access, downside protection, and geographic location account for more variance in life outcomes than raw effort alone.',
    consequence: 'Strugglers blame their personal willpower for systemic bottlenecks.',
    chandradiptiReflection: 'Recognizing systemic advantages is not an excuse to quit; it is the prerequisite for strategizing without illusions.',
    isPremium: true
  }
];

export const FOUNDATIONAL_BOOKS: LibraryBook[] = [
  {
    id: 'book-untouchable',
    title: 'Untouchable / अस्पृश्य',
    author: 'A. K. Chandradipti',
    category: 'Foundational Manual (Stage 1)',
    excerpt: 'The Immune Self: Building absolute psychological immunity from collective noise, social shame, and herd validation. Before you can understand society, you must become unshakeable within it.',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop',
    isPremium: false
  },
  {
    id: 'book-command',
    title: 'Command / आदेश',
    author: 'A. K. Chandradipti',
    category: 'Foundational Manual (Stage 2)',
    excerpt: 'The Law of Execution: Developing ruthless personal discipline, clarity of focus, and decisive action. Moving from passive awareness to structured execution in a distracted world.',
    coverUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&auto=format&fit=crop',
    isPremium: false
  },
  {
    id: 'book-maya',
    title: 'Maya / माया',
    author: 'A. K. Chandradipti',
    category: 'Foundational Manual (Stage 3)',
    excerpt: 'The Web of Illusions: Deconstructing social illusions, status games, consumer traps, artificial prestige, and the manufactured desires of modern consumerist society.',
    coverUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=400&auto=format&fit=crop',
    isPremium: true
  },
  {
    id: 'book-chkravyuh',
    title: 'Chkravyuh / चक्रव्यूह',
    author: 'A. K. Chandradipti',
    category: 'Foundational Manual (Stage 4)',
    excerpt: 'The Institutional Maze: Navigating complex Indian systems: the coaching industry, education rat-races, bureaucratic inertia, and mapping the hidden exit routes.',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&auto=format&fit=crop',
    isPremium: true
  },
  {
    id: 'book-vaibhav',
    title: 'Vaibhav / वैभव',
    author: 'A. K. Chandradipti',
    category: 'Foundational Manual (Stage 5)',
    excerpt: 'Sovereignty & True Worth: Achieving ultimate self-sovereignty from nothing. Building internal authority, economic resilience, and conscious contribution beyond societal approval.',
    coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&auto=format&fit=crop',
    isPremium: true
  },
  {
    id: 'book-braudel',
    title: 'The Structures of Everyday Life',
    author: 'Fernand Braudel',
    category: 'Social Reality & Systems',
    excerpt: 'Limits of the Possible: How the invisible biological and material constraints of daily food, housing, and commerce shape civilizational destiny across centuries.',
    coverUrl: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&auto=format&fit=crop',
    isPremium: false
  },
  {
    id: 'book-berger',
    title: 'The Social Construction of Reality',
    author: 'Peter L. Berger & Thomas Luckmann',
    category: 'Mental Models & Philosophy',
    excerpt: 'A Treatise in the Sociology of Knowledge: How everyday human interaction creates institutional reality, and how that reality then turns back to shape its creators.',
    coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=400&auto=format&fit=crop',
    isPremium: false
  },
  {
    id: 'book-kahneman',
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    category: 'Decision Awareness',
    excerpt: 'The two systems that drive the way we think: the intuitive, emotional System 1, and the slow, deliberate, and logical System 2.',
    coverUrl: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400&auto=format&fit=crop',
    isPremium: false
  }
];

export const LOW_HIGH_THINKING_CASE_STUDIES: ThinkingCaseStudy[] = [
  {
    id: 'salary_obsession',
    title: 'Why Do Indians Ask Your Salary?',
    hindiTitle: 'सैलरी पूछने के पीछे का पदानुक्रम',
    category: 'Social Norms',
    chandradiptiQuote: 'When you understand that society asks for numbers to place you in its mental caste matrix, you stop taking it personally and see the game for what it is.',
    levels: [
      {
        level: 1,
        name: 'Everyday Observation',
        hindiName: 'दैनिक अवलोकन',
        question: 'What is the immediate, observable behavior?',
        explanation: 'At family gatherings, train journeys, or weddings, distant relatives and even strangers ask: "Package kitna hai?" without hesitation.',
        hindiExplanation: 'शादी-ब्याह, रेल यात्रा या पारिवारिक समारोहों में परिचित या अजनबी बिना झिझक पूछते हैं: "कितना कमा लेते हो?"'
      },
      {
        level: 2,
        name: 'Personal Experience',
        hindiName: 'व्यक्तिगत अनुभव',
        question: 'How does it affect ordinary people emotionally?',
        explanation: 'If the number is high, people suddenly show respect and compliance. If it is low, their tone turns dismissive or pitying.',
        hindiExplanation: 'यदि आंकड़ा बड़ा हो तो लोग सम्मान देते हैं; यदि कम हो तो उपेक्षा या दया का भाव प्रकट करते हैं।'
      },
      {
        level: 3,
        name: 'Social Mechanism',
        hindiName: 'सामाजिक तंत्र',
        question: 'What interpersonal social force causes this?',
        explanation: 'In a deeply hierarchical society, individuals feel anxious until they know where you rank relative to them, so they know which social protocol to apply.',
        hindiExplanation: 'पदानुक्रम वाले समाज में लोग तब तक असहज रहते हैं जब तक वे यह न जान लें कि आप उनसे ऊपर हैं या नीचे।'
      },
      {
        level: 4,
        name: 'Economic & Institutional Structure',
        hindiName: 'आर्थिक व संस्थागत ढांचा',
        question: 'What institutional incentives maintain this pattern?',
        explanation: 'In India, formal credit ratings and public background checks are scarce. Income is the primary currency for marriage eligibility and family creditworthiness.',
        hindiExplanation: 'विवाह बाजार और सामाजिक साख में औपचारिक क्रेडिट स्कोर न होने के कारण वेतन ही सबसे बड़ा पैमाना बन जाता है।'
      },
      {
        level: 5,
        name: 'Historical & Cultural Context',
        hindiName: 'ऐतिहासिक व सांस्कृतिक संदर्भ',
        question: 'How did this evolve historically?',
        explanation: 'Colonial administrative grades (Class 1 gazetted vs non-gazetted) created an obsession with defined pay scales as proxies for state authority.',
        hindiExplanation: 'औपनिवेशिक काल के प्रशासनिक पे-स्केल और सरकारी ओहदों ने वेतन को सामाजिक अधिकार का प्रतीक बना दिया।'
      },
      {
        level: 6,
        name: 'Structural Understanding',
        hindiName: 'संरचनात्मक समझ',
        question: 'What larger operating pattern is revealed?',
        explanation: 'Society substitutes easily quantifiable metrics (salary, marks, rank) for complex, unmeasurable qualities like wisdom, integrity, and happiness.',
        hindiExplanation: 'समाज जटिल मानवीय गुणों (चरित्र, संतोष) की जगह मापने योग्य आसान अंकों (वेतन, रैंक) को प्राथमिकता देता है।'
      },
      {
        level: 7,
        name: 'Personal Implication & Trade-offs',
        hindiName: 'व्यक्तिगत प्रभाव व विकल्प',
        question: 'What choices and trade-offs exist for you?',
        explanation: 'You can spend your life playing the salary signaling game for superficial praise, or optimize for genuine autonomy, skill, and peace of mind.',
        hindiExplanation: 'आप या तो दिखावे के लिए वेतन बढ़ाने की चूहा-दौड़ में लगे रह सकते हैं, या स्वायत्तता और आत्म-संतोष को चुन सकते हैं।'
      },
      {
        level: 8,
        name: 'Reflection & Conscious Decision',
        hindiName: 'चिंतन और सचेत निर्णय',
        question: 'What is really going on & what will you choose?',
        explanation: 'Their question reflects their boundary anxiety, not your worth. Answer neutrally, protect your inner peace, and choose your career by your own compass.',
        hindiExplanation: 'उनका सवाल उनकी अपनी असुरक्षा को दर्शाता है। शांत भाव से उत्तर दें और अपनी दिशा समाज की तालियों के बजाय अपने मूल्यों से तय करें।'
      }
    ]
  },
  {
    id: 'sarkari_naukri',
    title: 'Why Millions Chase Government Exams',
    hindiTitle: 'सरकारी नौकरी का सामाजिक आकर्षण',
    category: 'Institutions',
    chandradiptiQuote: 'People do not chase government jobs because they love public administration; they chase them because Indian society offers no other defense against structural precarity.',
    levels: [
      {
        level: 1,
        name: 'Everyday Observation',
        hindiName: 'दैनिक अवलोकन',
        question: 'What is the immediate, observable behavior?',
        explanation: 'Millions of young graduates spend 4-7 years in small rented rooms studying 14 hours a day for exam seats with a 0.05% selection rate.',
        hindiExplanation: 'लाखों युवा सालों तक छोटे कमरों में 0.05% चयन दर वाली परीक्षाओं के लिए दिन-रात रटाई करते हैं।'
      },
      {
        level: 2,
        name: 'Personal Experience',
        hindiName: 'व्यक्तिगत अनुभव',
        question: 'How does it affect ordinary people emotionally?',
        explanation: 'Repeated rejections trigger deep isolation, family friction, age anxiety, and feelings of worthlessness as productive youth passes away.',
        hindiExplanation: 'लगातार विफलताएं भारी तनाव, पारिवारिक ताने और उम्र बीतने की गहरी घबराहट पैदा करती हैं।'
      },
      {
        level: 3,
        name: 'Social Mechanism',
        hindiName: 'सामाजिक तंत्र',
        question: 'What interpersonal social force causes this?',
        explanation: 'In Indian kinship networks, a government employee brings immediate institutional protection, social prestige, and dowry premium to the entire clan.',
        hindiExplanation: 'सरकारी ओहदा केवल एक व्यक्ति का नहीं, बल्कि पूरे कुनबे का रुतबा और सामाजिक सुरक्षा कवच बन जाता है।'
      },
      {
        level: 4,
        name: 'Economic & Institutional Structure',
        hindiName: 'आर्थिक व संस्थागत ढांचा',
        question: 'What institutional incentives maintain this pattern?',
        explanation: 'Private sector contracts in India offer weak severance, high informal precarity, and little social security. The state job remains the only lifelong tenure.',
        hindiExplanation: 'निजी क्षेत्र में असुरक्षा और श्रम अधिकारों की कमी सरकारी नौकरी को एकमात्र सुरक्षित जीवन बीमा बना देती है।'
      },
      {
        level: 5,
        name: 'Historical & Cultural Context',
        hindiName: 'ऐतिहासिक व सांस्कृतिक संदर्भ',
        question: 'How did this evolve historically?',
        explanation: 'The Mughal and British state apparatus established the "Mai-Baap Sarkar" ethos where authority belongs strictly to those holding imperial office.',
        hindiExplanation: 'औपनिवेशिक राज की सत्ता संरचना ने यह मानसिकता गढ़ी कि समाज पर हुकूमत वही कर सकता है जो सरकार का हिस्सा हो।'
      },
      {
        level: 6,
        name: 'Structural Understanding',
        hindiName: 'संरचनात्मक समझ',
        question: 'What larger operating pattern is revealed?',
        explanation: 'A multi-billion dollar coaching and rental economy profits off demographic anxiety by selling a ticket to a lottery with astronomical odds.',
        hindiExplanation: 'कोचिंग और हॉस्टल का विशाल उद्योग युवाओं की हताशा को भुनाकर एक दुर्लभ लॉटरी का सपना बेचता है।'
      },
      {
        level: 7,
        name: 'Personal Implication & Trade-offs',
        hindiName: 'व्यक्तिगत प्रभाव व विकल्प',
        question: 'What choices and trade-offs exist for you?',
        explanation: 'You must set a strict timebox (e.g. 2 attempts max) and build transferable real-world skills rather than gambling your entire 20s away.',
        hindiExplanation: 'एक निश्चित समय-सीमा (अधिकतम 2 प्रयास) तय करें और वास्तविक कौशल सीखें ताकि जीवन भर का दांव न लग जाए।'
      },
      {
        level: 8,
        name: 'Reflection & Conscious Decision',
        hindiName: 'चिंतन और सचेत निर्णय',
        question: 'What is really going on & what will you choose?',
        explanation: 'Recognize the system for what it is: an artificial scarcity machine. You do not need the state stamp to build a sovereign, useful life.',
        hindiExplanation: 'यह समझें कि यह एक कृत्रिम संकट है। एक सार्थक और स्वतंत्र जीवन जीने के लिए सरकारी मुहर की अनिवार्यता नहीं है।'
      }
    ]
  },
  {
    id: 'chai_network',
    title: 'The Hidden System Behind Your ₹20 Chai',
    hindiTitle: '₹20 की चाय के पीछे का विशाल नेटवर्क',
    category: 'Hidden Systems',
    chandradiptiQuote: 'A humble cup of chai is not just tea; it is the daily social treaty holding the Indian unorganized economy together.',
    levels: [
      {
        level: 1,
        name: 'Everyday Observation',
        hindiName: 'दैनिक अवलोकन',
        question: 'What is the immediate, observable behavior?',
        explanation: 'People of all ranks gather at the roadside tapri multiple times a day for a quick glass of boiling ginger chai.',
        hindiExplanation: 'अमीर-गरीब हर कोई दिन में कई बार नुक्कड़ की टपरी पर खड़े होकर कुल्हड़ या कांच के गिलास में चाय पीता है।'
      },
      {
        level: 2,
        name: 'Personal Experience',
        hindiName: 'व्यक्तिगत अनुभव',
        question: 'How does it affect ordinary people emotionally?',
        explanation: 'It offers a 10-minute micro-break from work friction, an informal gossip hub, and an accessible sense of belonging.',
        hindiExplanation: 'यह काम की थकान से १० मिनट की राहत और सहज सामाजिक संवाद का माध्यम बनता है।'
      },
      {
        level: 3,
        name: 'Social Mechanism',
        hindiName: 'सामाजिक तंत्र',
        question: 'What interpersonal social force causes this?',
        explanation: 'The tea stall acts as the great democratic equalizer where corporate executives and auto drivers stand side by side without social friction.',
        hindiExplanation: 'चाय की टपरी एक ऐसा मंच है जहाँ वर्ग और पदानुक्रम की दीवारें १० मिनट के लिए लुप्त हो जाती हैं।'
      },
      {
        level: 4,
        name: 'Economic & Institutional Structure',
        hindiName: 'आर्थिक व संस्थागत ढांचा',
        question: 'What institutional incentives maintain this pattern?',
        explanation: 'Street vendors operate in a shadow cash economy, paying municipal and local police informal fees while keeping retail prices hyper-affordable.',
        hindiExplanation: 'अनौपचारिक अर्थव्यवस्था, स्थानीय तंत्र और न्यूनतम ओवरहेड मिलकर इसे हर जेब के अनुकूल बनाए रखते हैं।'
      },
      {
        level: 5,
        name: 'Historical & Cultural Context',
        hindiName: 'ऐतिहासिक व सांस्कृतिक संदर्भ',
        question: 'How did this evolve historically?',
        explanation: 'The British Tea Board promoted CTC tea in India in the early 20th century to dump industrial supply, which Indians adapted by boiling with milk and spices.',
        hindiExplanation: '२०वीं सदी में अंग्रेजों ने चाय की खपत बढ़ाने का प्रचार किया, जिसे भारतीयों ने दूध और मसालों के साथ अपनी पहचान बना लिया।'
      },
      {
        level: 6,
        name: 'Structural Understanding',
        hindiName: 'संरचनात्मक समझ',
        question: 'What larger operating pattern is revealed?',
        explanation: 'Modern formal corporate culture separates people into glass cubicles; the informal Indian street naturally reinvents community.',
        hindiExplanation: 'कॉर्पोरेट व्यवस्था इंसानों को अलग करती है; भारतीय सड़क अनौपचारिक रूप से उन्हें फिर से जोड़ देती है।'
      },
      {
        level: 7,
        name: 'Personal Implication & Trade-offs',
        hindiName: 'व्यक्तिगत प्रभाव व विकल्प',
        question: 'What choices and trade-offs exist for you?',
        explanation: 'Learn from the street vendor’s hyper-efficiency and customer rapport, but guard against the unthinking habit of sugar and endless passive gossip.',
        hindiExplanation: 'टपरी की आत्मीयता और कार्यकुशलता से सीखें, परंतु समय बर्बाद करने और अत्यधिक चीनी की लत से बचें।'
      },
      {
        level: 8,
        name: 'Reflection & Conscious Decision',
        hindiName: 'चिंतन और सचेत निर्णय',
        question: 'What is really going on & what will you choose?',
        explanation: 'Observe how the simplest everyday habits carry immense economic and social meaning. Look at the ordinary with extraordinary curiosity.',
        hindiExplanation: 'साधारण चीजों के पीछे छिपी असाधारण व्यवस्था को पहचानें। अपनी दिनचर्या को मात्र आदत नहीं, सजग अवलोकन बनाएं।'
      }
    ]
  }
];

export interface CompetitorProfile {
  id: string;
  name: string;
  category: string;
  primaryReference: string;
  whatToStudy: string;
  hindiWhatToStudy: string;
  t2sDifference: string;
  hindiT2sDifference: string;
  avatarText: string;
  accentColor: string;
}

export const LOCKED_COMPETITORS: CompetitorProfile[] = [
  {
    id: 'nitish-rajput',
    name: 'Nitish Rajput',
    category: 'Case-Study / Investigation',
    primaryReference: 'Research-driven storytelling + social awareness + case-study structure.',
    whatToStudy: 'Research → Simplification → Narrative → Evidence → Conclusion.',
    hindiWhatToStudy: 'गहन शोध → सरलीकरण → सम्मोहक कथा प्रवाह → ठोस साक्ष्य → तार्किक निष्कर्ष।',
    t2sDifference: 'Talk2Society is less dependent on politics/history and more focused on everyday life, social reality, and personal conscious guidance.',
    hindiT2sDifference: 'राजनीति या इतिहास के बजाय दैनिक जीवन, सामाजिक यथार्थ और व्यावहारिक जीवन-मार्गदर्शन पर केंद्रित।',
    avatarText: 'NR',
    accentColor: '#ef4444'
  },
  {
    id: 'open-letter',
    name: 'Open Letter',
    category: 'Analytical Explainer',
    primaryReference: 'Questioning conventional thinking + jargon-free explanations + relatable stories.',
    whatToStudy: 'Question → Investigation → Accessible explanation without academic snobbery.',
    hindiWhatToStudy: 'पारंपरिक धारणाओं पर सवाल → निष्पक्ष जांच → बिना क्लिष्ट शब्दावली के सहज व्याख्या।',
    t2sDifference: 'Talk2Society features a stronger life-guidance / reality-navigation component and avoids dependence on day-to-day political controversies.',
    hindiT2sDifference: 'समसामयिक विवादों से ऊपर उठकर व्यवस्था को समझने और स्वयं के सचेत निर्णय लेने पर बल।',
    avatarText: 'OL',
    accentColor: '#f59e0b'
  },
  {
    id: 'soch-mohak',
    name: 'Soch by Mohak Mangal',
    category: 'Fact-Led Social Issues',
    primaryReference: 'Fact-led social awareness + challenging accepted public assumptions.',
    whatToStudy: 'Rigorous data synthesis + social issue framing + balanced neutral perspective.',
    hindiWhatToStudy: 'तथ्यात्मक सामाजिक जागरूकता + आम मान्यताओं को चुनौती + संतुलित विश्लेषण।',
    t2sDifference: 'Talk2Society avoids becoming primarily political/current-affairs commentary, anchoring deeply in human incentives and structural systems.',
    hindiT2sDifference: 'न्यूज-कमेंट्री के बजाय सामाजिक ढांचे, प्रलोभनों और व्यक्ति के जीवन विकल्पों पर स्थायी फोकस।',
    avatarText: 'MM',
    accentColor: '#3b82f6'
  },
  {
    id: 'abhi-niyu',
    name: 'Abhi & Niyu',
    category: 'Solution & Positive Action',
    primaryReference: 'India-focused social issues + accessible explanation + practical/positive orientation.',
    whatToStudy: 'Hyper-Indian relevance + rapid accessibility + actionable citizen empowerment.',
    hindiWhatToStudy: 'विशुद्ध भारतीय संदर्भ + जनसुलभ प्रस्तुति + सकारात्मक व रचनात्मक दृष्टिकोण।',
    t2sDifference: 'Talk2Society investigates: Reality → Systems → Consequences → Possible Paths, rather than primarily positive celebratory storytelling.',
    hindiT2sDifference: 'सिर्फ सकारात्मकता नहीं, बल्कि यथार्थ → छिपी व्यवस्था → दुष्प्रभाव → वास्तविक विकल्प का विश्लेषण।',
    avatarText: 'AN',
    accentColor: '#10b981'
  },
  {
    id: 'think-school',
    name: 'Think School / Think School Hindi',
    category: 'Systems & Case Studies',
    primaryReference: 'Systems thinking + complex subjects made simple + case-study documentary storytelling.',
    whatToStudy: 'Mechanism breakdown → Story narrative → System loop → Clear takeaways.',
    hindiWhatToStudy: 'सिस्टम थिंकिंग + जटिल विषयों का सरलीकरण + केस-स्टडी आधारित डॉक्युमेंट्री प्रारूप।',
    t2sDifference: "Talk2Society's center is society and life choices, not corporate business models or geopolitical battles.",
    hindiT2sDifference: 'कॉर्पोरेट बिजनेस मॉडल के बजाय समाज, व्यक्तिगत जीवन और मानसिक आजादी केंद्र में है।',
    avatarText: 'TS',
    accentColor: '#8b5cf6'
  },
  {
    id: 'labour-law-advisor',
    name: 'Labour Law Advisor (LLA)',
    category: 'Public Utility & Jagrukta',
    primaryReference: 'Practical awareness for ordinary Indians and actionable citizen rights.',
    whatToStudy: '“Jagruk” / Public-awareness positioning + high practical everyday utility.',
    hindiWhatToStudy: '"जागरूक नागरिक" की स्थिति + रोजमर्रा की अत्यधिक व्यावहारिक उपयोगिता।',
    t2sDifference: 'Talk2Society goes beyond legal/financial utility into deeper social forces, reality decoding, and conscious mental models.',
    hindiT2sDifference: 'कानूनी-वित्तीय सीमाओं से आगे जाकर सामाजिक दबाव, मानसिक मॉडल और जीवन रणनीति का मार्गदर्शन।',
    avatarText: 'LLA',
    accentColor: '#06b6d4'
  },
  {
    id: 'sarthak-documentaries',
    name: 'Sarthak / Sarthak Documentaries',
    category: 'Documentary Journalism',
    primaryReference: 'Accessible documentary storytelling + grounding in real-world human issues.',
    whatToStudy: 'Evocative storytelling + cinematic pacing + deep social relevance.',
    hindiWhatToStudy: 'आकर्षक डॉक्युमेंट्री शैली + जमीनी मुद्दों से जुड़ाव + प्रभावी दृश्य कथावाचन।',
    t2sDifference: 'Talk2Society does not become a news/current-affairs channel; it extracts universal principles and actionable thinking models.',
    hindiT2sDifference: 'न्यूज-डॉक्युमेंट्री बनने से बचते हुए समाज के स्थायी नियमों और वैचारिक सिद्धांतों को उजागर करना।',
    avatarText: 'SD',
    accentColor: '#ec4899'
  },
  {
    id: 'the-better-india',
    name: 'The Better India',
    category: 'Community & Grassroots',
    primaryReference: 'Indian people + grassroots communities + social change + real-life stories.',
    whatToStudy: 'Deep Indian relatability + human-first storytelling + grassroots connection.',
    hindiWhatToStudy: 'भारतीय जनजीवन से आत्मीय जुड़ाव + मानवीय कहानियां + जमीनी बदलाव।',
    t2sDifference: 'Talk2Society asks “Why does this happen?” and investigates the underlying invisible system rather than profiling individuals.',
    hindiT2sDifference: 'व्यक्तिगत कहानियों की जगह यह सवाल कि "यह व्यवस्था ऐसे क्यों चलती है?" और इसका समाधान क्या है।',
    avatarText: 'TBI',
    accentColor: '#f97316'
  }
];

export const AUTHORITY_HIERARCHY_LEVELS = [
  {
    tier: 1,
    title: 'Official Data & Constitutional Institutions',
    hindiTitle: 'आधिकारिक आंकड़े एवं संस्थागत रिपोर्ट',
    sources: 'RBI, Census of India, NSSO, NFHS, Supreme Court Judgments, CAG, NITI Aayog',
    weight: 'Primary Foundation (सर्वोच्च प्राथमिकता)',
    badge: 'Tier 1 Official',
    color: 'emerald'
  },
  {
    tier: 2,
    title: 'Peer-Reviewed Academic Research',
    hindiTitle: 'समकक्ष-समीक्षित शोध पत्र',
    sources: 'Economic & Political Weekly (EPW), IIM/IIT Faculty Research, J-PAL, Sociology & Economics Journals',
    weight: 'Methodological Rigor (विधि सम्मत साक्ष्य)',
    badge: 'Tier 2 Academic',
    color: 'blue'
  },
  {
    tier: 3,
    title: 'Independent Research Think-Tanks',
    hindiTitle: 'स्वतंत्र विचार मंच एवं संस्थान',
    sources: 'Centre for Policy Research (CPR), ORF, Brookings India, CEEW, Vidhi Legal',
    weight: 'Policy & Structural Insights',
    badge: 'Tier 3 Think-Tanks',
    color: 'indigo'
  },
  {
    tier: 4,
    title: 'Credible Investigative Journalism',
    hindiTitle: 'विश्वसनीय खोजी पत्रकारिता',
    sources: 'The Hindu, The Indian Express, Livemint, Business Standard, Frontline, Scroll, The Caravan',
    weight: 'Ground Reality & Human Accounts',
    badge: 'Tier 4 Journalism',
    color: 'amber'
  },
  {
    tier: 5,
    title: 'Specialist Books & Economic Histories',
    hindiTitle: 'विशेषज्ञ पुस्तकें एवं ऐतिहासिक ग्रंथ',
    sources: 'Fernand Braudel, Peter Berger, Daniel Kahneman, Amartya Sen, Foundational Sociology Texts',
    weight: 'Theoretical Frameworks & Mental Models',
    badge: 'Tier 5 Literature',
    color: 'purple'
  },
  {
    tier: 6,
    title: 'Supplementary Field Verification',
    hindiTitle: 'जमीनी सत्यापन एवं अनौपचारिक अवलोकन',
    sources: 'Direct market observations, anonymized vendor interviews, grassroots trade protocols',
    weight: 'Nuance & Context (अंतिम सत्यापन)',
    badge: 'Tier 6 Ground Field',
    color: 'zinc'
  }
];

export const GUIDANCE_VS_SELF_HELP_RULES = [
  {
    aspect: 'Core Approach',
    selfHelp: '“Do this and you will succeed.” (Prescriptive & dogmatic)',
    hindiSelfHelp: '“यह करो और तुम सफल हो जाओगे।” (अधिकारवादी उपदेश)',
    t2s: '“This is what is happening. These forces shape it. These are consequences & paths. Now think and decide consciously.”',
    hindiT2s: '“यह हो रहा है। ये शक्तियां इसे चला रही हैं। ये परिणाम हैं। अब स्वयं सोचें और सचेत निर्णय लें।”',
    isAllowed: true
  },
  {
    aspect: 'Psychological Tone',
    selfHelp: 'Hype, emotional manipulation, dark psychology, manufactured fear of missing out.',
    hindiSelfHelp: 'भावनाओं का शोषण, गुप्त चालबाजियां, भय और झूठी प्रेरणा।',
    t2s: 'Calm reality education, clear mental models, structural clarity, zero hysteria.',
    hindiT2s: 'शांत यथार्थवादी शिक्षा, स्पष्ट मानसिक मॉडल, संरचनात्मक पारदर्शिता, बिना किसी सनसनीखेज दावे के।',
    isAllowed: true
  },
  {
    aspect: 'Authority Signal',
    selfHelp: '“They don’t want you to know”, fake expertise, conspiracy framing, secret formulas.',
    hindiSelfHelp: '“वे तुमसे यह छुपाते हैं”, गुप्त रहस्य, षड्यंत्र का जाल, बनावटी विशेषज्ञता।',
    t2s: 'Documented empirical data, academic citations, historical mechanics, verified institutions.',
    hindiT2s: 'आधिकारिक आंकड़े, अकादमिक संदर्भ, संस्थागत रिपोर्ट और ऐतिहासिक तथ्य।',
    isAllowed: true
  },
  {
    aspect: 'View of Failure',
    selfHelp: 'Blames individual willpower: “You did not hustle hard enough!”',
    hindiSelfHelp: 'व्यक्ति की इच्छाशक्ति को दोष देना: “तुमने पर्याप्त मेहनत नहीं की!”',
    t2s: 'Separates systemic bottlenecks (scarcity, networks, incentives) from personal responsibility.',
    hindiT2s: 'व्यवस्था की रुकावटों (संसाधनों की कमी, नेटवर्क) और व्यक्तिगत प्रयासों के अंतर को स्पष्ट करना।',
    isAllowed: true
  },
  {
    aspect: 'End Objective',
    selfHelp: 'Follow the guru, buy the course, stay dependent on external validation.',
    hindiSelfHelp: 'गुरु का अंधानुकरण, कोर्स खरीदना, बाहरी स्वीकृति पर निर्भर रहना।',
    t2s: 'Complete personal sovereignty: See. Understand. Think. Choose.',
    hindiT2s: 'पूर्ण बौद्धिक संप्रभुता: देखें → समझें → सोचें → चुनें।',
    isAllowed: true
  }
];

export const VIEWER_JOURNEY_STAGES = [
  {
    stage: 1,
    name: 'Recognition',
    hindiName: 'पहचान (स्वीकार्यता)',
    thought: '“I’ve seen this happening around me every day.”',
    hindiThought: '“मैंने यह दृश्य अपने चारों ओर हर दिन देखा है।”',
    visualDesc: 'Ordinary stick-figure encountering a familiar Indian social scenario (e.g. salary question, marriage expenditure).'
  },
  {
    stage: 2,
    name: 'Question',
    hindiName: 'जिज्ञासा (प्रश्न)',
    thought: '“Wait... why does society actually do this?”',
    hindiThought: '“लेकिन समाज वास्तव में ऐसा क्यों करता है?”',
    visualDesc: 'Character pauses, breaks the herd line, and looks up at the structural question.'
  },
  {
    stage: 3,
    name: 'Awareness',
    hindiName: 'जागरूकता (नया दृष्टिकोण)',
    thought: '“I never looked at it this way before.”',
    hindiThought: '“मैंने इसे कभी इस नजरिए से नहीं देखा था।”',
    visualDesc: 'Zooming out to reveal the invisible ropes and incentives pulling the characters.'
  },
  {
    stage: 4,
    name: 'Understanding',
    hindiName: 'बोध (व्यवस्था की समझ)',
    thought: '“Now I understand the hidden system and its history.”',
    hindiThought: '“अब मुझे समझ आया कि यह व्यवस्था किस कारण से बनी है।”',
    visualDesc: 'Data nodes, economic loops, and institutional pillars forming a clear blueprint.'
  },
  {
    stage: 5,
    name: 'Consequence',
    hindiName: 'परिणाम (व्यक्तिगत प्रभाव)',
    thought: '“This directly affects my life, money, and mental peace.”',
    hindiThought: '“इसका सीधा असर मेरे जीवन, धन और मानसिक शांति पर पड़ता है।”',
    visualDesc: 'The individual calculating the unseen psychological and financial taxes paid to social conformity.'
  },
  {
    stage: 6,
    name: 'Perspective',
    hindiName: 'दृष्टिकोण (संभावनाएं)',
    thought: '“There are other ways to live and think about this.”',
    hindiThought: '“इस स्थिति से निपटने के वैकल्पिक और बेहतर रास्ते भी मौजूद हैं।”',
    visualDesc: 'Diverging pathways opening up outside the traditional conveyor belt.'
  },
  {
    stage: 7,
    name: 'Reflection',
    hindiName: 'चिंतन (सचेत चुनाव)',
    thought: '“I need to decide consciously, not automatically.”',
    hindiThought: '“मुझे भीड़ के पीछे भागने के बजाय सोच-समझकर अपना निर्णय लेना है।”',
    visualDesc: 'Sovereign stick-figure taking an intentional step forward on their chosen path.'
  }
];

export const IDEAL_VIDEO_STRUCTURE_STEPS = [
  {
    step: 1,
    title: 'Observation',
    hindiTitle: 'अवलोकन',
    desc: 'Starts with something ordinary and instantly relatable from daily Indian life.',
    hindiDesc: 'दैनिक भारतीय जीवन की किसी साधारण व जानी-पहचानी घटना से शुरुआत।'
  },
  {
    step: 2,
    title: 'Question',
    hindiTitle: 'मूल प्रश्न',
    desc: 'The central hook: “Why does this happen?” “What is really going on?”',
    hindiDesc: 'गहरा सवाल: ऐसा क्यों होता है? इसके पीछे कौन सी शक्तियां काम कर रही हैं?'
  },
  {
    step: 3,
    title: 'Relatable Story',
    hindiTitle: 'भारतीय उदाहरण / कहानी',
    desc: 'A grounded Indian story showing how ordinary people experience this friction.',
    hindiDesc: 'एक वास्तविक भारतीय प्रसंग जिससे दर्शक तुरंत भावनात्मक रूप से जुड़ सके।'
  },
  {
    step: 4,
    title: 'Investigation',
    hindiTitle: 'गहन पड़ताल एवं साक्ष्य',
    desc: 'Empirical data, historical origins, economic incentives, and official citations.',
    hindiDesc: 'आधिकारिक आंकड़े, ऐतिहासिक विकास और संस्थागत साक्ष्यों की निष्पक्ष जांच।'
  },
  {
    step: 5,
    title: 'The System',
    hindiTitle: 'अदृश्य व्यवस्था का ढांचा',
    desc: 'What larger operating machinery or social contract creates and sustains this pattern?',
    hindiDesc: 'कौन सी बड़ी संरचना और आर्थिक-सामाजिक दबाव इस चक्र को चलाए रखते हैं?'
  },
  {
    step: 6,
    title: 'Consequence',
    hindiTitle: 'दैनिक जीवन पर प्रभाव',
    desc: 'How does it affect ordinary people’s wallets, sanity, family dynamics, and freedom?',
    hindiDesc: 'यह व्यवस्था आम व्यक्ति की जेब, मानसिक स्वास्थ्य और भविष्य पर क्या असर डालती है?'
  },
  {
    step: 7,
    title: 'The Path & Trade-offs',
    hindiTitle: 'विकल्प एवं समझौते',
    desc: 'What realistic choices and trade-offs exist? Not fairy tales, but conscious navigation.',
    hindiDesc: 'वास्तविक विकल्प क्या हैं? हर रास्ते की कीमत और फायदे का स्पष्ट विश्लेषण।'
  },
  {
    step: 8,
    title: 'Chandradipti Reflection',
    hindiTitle: 'चंद्रदीप्ति का चिंतन',
    desc: 'A closing philosophical question that stays with the viewer long after the video ends.',
    hindiDesc: 'एक ऐसा विचारोत्तेजक सवाल जो वीडियो खत्म होने के बाद भी दर्शक के मन में गूंजता रहे।'
  }
];

export const CHANDRADIPTI_PROFILE = {
  name: 'A. K. Chandradipti',
  role: 'Observer • Investigator • Guide',
  hindiRole: 'अवलोकनकर्ता • अन्वेषक • मार्गदर्शक',
  brand: 'Talk2Society',
  format: 'Faceless Intellectual Explainer',
  voice: 'AI Voice (Calm, Measured, Incisive, Respectful)',
  visualLanguage: 'Stick figures + Structural Diagrams + Maps + Official Documents + Charts + AI Visuals',
  worldview: 'Indian society is a web of unwritten contracts, historical layers, and informal security networks. When you observe without emotion and understand the incentives, social anxiety turns into strategic clarity.',
  hindiWorldview: 'भारतीय समाज अलिखित नियमों, ऐतिहासिक परतों और सुरक्षा तंत्रों का एक जटिल जाल है। जब आप बिना किसी पूर्वाग्रह के इसे देखते हैं, तो सामाजिक दबाव अपने आप समाप्त हो जाता है।',
  notPresentedAs: [
    'Psychologist (मनोवैज्ञानिक नहीं)',
    'Professor / Academic Snob (अहंकारी प्रोफेसर नहीं)',
    'Historian (केवल इतिहासकार नहीं)',
    'Spiritual Guru (धार्मिक गुरु नहीं)',
    'Political Commentator (राजनीतिक प्रवक्ता नहीं)',
    'Motivational Speaker (खोखले मोटिवेटर नहीं)'
  ],
  operationalLoop: [
    { step: 'Observe', desc: 'Notice ordinary Indian behaviors that everyone takes for granted.' },
    { step: 'Question', desc: 'Ask “What is really going on underneath the surface?”' },
    { step: 'Investigate', desc: 'Pull official records, economic mechanics, and academic studies.' },
    { step: 'Explain', desc: 'Translate complex systemic realities into clear stick-figure visual diagrams.' },
    { step: 'Reveal', desc: 'Uncover the unseen costs, incentives, and structural traps.' },
    { step: 'Reflect', desc: 'Prompt the individual to choose their own conscious path.' }
  ]
};

export const FIVE_FOUNDATIONAL_MANUALS_DETAILS = [
  {
    stage: 1,
    title: 'Untouchable / अस्पृश्य',
    coreTheme: 'The Immune Self (अभेद्य व्यक्तित्व)',
    tagline: 'Building absolute psychological immunity from collective noise, social shame, and herd validation.',
    hindiTagline: 'सामाजिक तानों, झूठे सम्मान और भीड़ के दबाव से पूर्ण मानसिक स्वतंत्रता।',
    focus: 'Worldview & Psychological Immunity',
    howItInfluences: 'Before you can understand society, you must become unshakeable within it. Untouchable gives the viewer the internal armor to observe social judgment without absorbing its toxins.',
    keyRule: 'Never let people who made compromises dictate your standards.'
  },
  {
    stage: 2,
    title: 'Command / आदेश',
    coreTheme: 'The Law of Execution (संकल्प एवं क्रियान्वयन)',
    tagline: 'Developing ruthless personal discipline, clarity of focus, and decisive action in a distracted world.',
    hindiTagline: 'ध्यान भटकाने वाली दुनिया में कठोर अनुशासन और सटीक क्रियान्वयन।',
    focus: 'Execution & Strategic Focus',
    howItInfluences: 'Awareness without execution is just intellectual entertainment. Command transforms structural understanding into daily habits, focused work blocks, and deliberate craft.',
    keyRule: 'Action is the only argument that reality respects.'
  },
  {
    stage: 3,
    title: 'Maya / माया',
    coreTheme: 'The Web of Illusions (सामाजिक भ्रमों का भंडाफोड़)',
    tagline: 'Deconstructing status games, consumer traps, artificial prestige, and the manufactured desires of modern society.',
    hindiTagline: 'दिखावे की दुनिया, स्टेटस गेम और कृत्रिम उपभोग के जाल की गहरी समझ।',
    focus: 'Status Games & Consumerism',
    howItInfluences: 'Deconstructs why people take debt for 3-day weddings, buy luxury to impress people they dislike, and measure life by corporate badges.',
    keyRule: 'Prestige is what other people want you to buy; sovereignty is what you build for yourself.'
  },
  {
    stage: 4,
    title: 'Chkravyuh / चक्रव्यूह',
    coreTheme: 'The Institutional Maze (संस्थागत व्यूह रचना)',
    tagline: 'Navigating complex Indian systems: the coaching industry, education rat-races, bureaucratic inertia, and mapping hidden exits.',
    hindiTagline: 'कोचिंग माफिया, परीक्षा चक्रव्यूह और संस्थागत बाधाओं से सुरक्षित निकलने का खाका।',
    focus: 'Systems & Institutional Literacy',
    howItInfluences: 'Shows how Indian institutions create artificial scarcity to extract compliance. Provides viewers with the analytical compass to spot systemic bottlenecks and design asymmetrical career bets.',
    keyRule: 'When the game is rigged, stop trying to win the race and change the playing field.'
  },
  {
    stage: 5,
    title: 'Vaibhav / वैभव',
    coreTheme: 'Sovereignty & True Worth (संप्रभुता एवं वास्तविक मूल्य)',
    tagline: 'Achieving ultimate self-sovereignty from nothing. Building internal authority, economic resilience, and conscious contribution.',
    hindiTagline: 'शून्य से संप्रभुता का निर्माण: आंतरिक अधिकार, आर्थिक आत्मनिर्भरता और सचेत जीवन।',
    focus: 'Sovereignty & Conscious Life',
    howItInfluences: 'The culmination of the 5 stages. Moving from understanding power to embodying calm, ethical, self-reliant leadership that serves society without being enslaved by it.',
    keyRule: 'True authority does not shout. It creates its own reality.'
  }
];

export const DEFAULT_SHOP_PRODUCTS: import('./types').ShopProduct[] = [
  {
    id: 'prod_journal',
    name: 'Stoic Deep Work Journal (हार्डबाउंड चिंतन डायरी)',
    description: 'A premium 120-GSM hardbound daily tracking notebook engineered for the 100-Day Consciousness Framework and nightly reflections.',
    price: '₹499',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
    affiliateUrl: 'https://www.amazon.in/s?k=hardbound+journal+notebook',
    category: 'Stationery',
    platform: 'Amazon',
    clicks: 142
  },
  {
    id: 'prod_reading_stand',
    name: 'Bamboo Reading Stand & Book Rest (मैनुस्क्रिप्ट स्टैंड)',
    description: 'Multi-angle adjustable bamboo desktop easel for prolonged reading of classical manuscripts, philosophy texts, and sacred manuals.',
    price: '₹699',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
    affiliateUrl: 'https://www.amazon.in/s?k=bamboo+book+stand',
    category: 'Tools',
    platform: 'Amazon',
    clicks: 89
  },
  {
    id: 'prod_blue_cut',
    name: 'Anti-Blue Light Focus Spectacles (नाइट शील्ड चश्मा)',
    description: 'Zero-power anti-fatigue eye armor protecting circadian rhythm and melatonin during late-night documentary review sessions.',
    price: '₹899',
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600',
    affiliateUrl: 'https://www.amazon.in/s?k=blue+light+blocking+glasses',
    category: 'Gear',
    platform: 'Amazon',
    clicks: 215
  },
  {
    id: 'prod_posture_cushion',
    name: 'Ergonomic Meditation & Posture Seat (आसन कुशन)',
    description: 'High-density buckwheat meditation and spine-alignment cushion for morning breathwork, silence, and sovereign contemplation.',
    price: '₹1,299',
    imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600',
    affiliateUrl: 'https://www.amazon.in/s?k=meditation+cushion',
    category: 'Wellness',
    platform: 'Amazon',
    clicks: 67
  }
];

