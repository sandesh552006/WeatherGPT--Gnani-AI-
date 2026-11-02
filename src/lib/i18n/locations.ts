import { GeoLocation } from '@/lib/types';
import { SupportedLanguage } from './types';

export type LocalizedNames = Partial<Record<SupportedLanguage, string>> & {
  en: string;
};

export interface IndianLocationEntry {
  id: string;
  name: LocalizedNames;
  state: LocalizedNames;
  country: LocalizedNames;
  latitude: number;
  longitude: number;
  timezone: string;
  aliases: string[];
}

export const COUNTRY_NAMES: Record<string, LocalizedNames> = {
  india: {
    en: 'India',
    hi: 'भारत',
    mr: 'भारत',
    gu: 'ભારત',
    ta: 'இந்தியா',
    te: 'భారతదేశం',
    ml: 'ഇന്ത്യ',
    kn: 'ಭಾರತ',
    bn: 'ভারত',
    pa: 'ਭਾਰਤ',
    or: 'ଭାରତ',
    as: 'ভাৰত',
  },
};

export const INDIAN_STATES: Record<string, LocalizedNames> = {
  maharashtra: { en: 'Maharashtra', hi: 'महाराष्ट्र', mr: 'महाराष्ट्र', gu: 'મહારાષ્ટ્ર', ta: 'மகாராஷ்டிரா', te: 'మహారాష్ట్ర', ml: 'മഹാരാഷ്ട്ര', kn: 'ಮಹಾರಾಷ್ಟ್ರ', bn: 'মহারাষ্ট্র', pa: 'ਮਹਾਰਾਸ਼ਟਰ', or: 'ମହାରାଷ୍ଟ୍ର', as: 'মহাৰাষ্ট্ৰ' },
  delhi: { en: 'Delhi', hi: 'दिल्ली', mr: 'दिल्ली', gu: 'દિલ્હી', ta: 'தில்லி', te: 'ఢిల్లీ', ml: 'ഡൽഹി', kn: 'ದೆಹಲಿ', bn: 'দিল্লি', pa: 'ਦਿੱਲੀ', or: 'ଦିଲ୍ଲୀ', as: 'দিল্লী' },
  karnataka: { en: 'Karnataka', hi: 'कर्नाटक', mr: 'कर्नाटक', gu: 'કર્ણાટક', ta: 'கர்நாடகா', te: 'కర్ణాటక', ml: 'കർണാടക', kn: 'ಕರ್ನಾಟಕ', bn: 'কর্ণাটক', pa: 'ਕਰਨਾਟਕ', or: 'କର୍ଣ୍ଣାଟକ', as: 'কৰ্ণাটক' },
  'tamil nadu': { en: 'Tamil Nadu', hi: 'तमिलनाडु', mr: 'तमिळनाडू', gu: 'તમિલનાડુ', ta: 'தமிழ்நாடு', te: 'తమిళనాడు', ml: 'തമിഴ്നാട്', kn: 'ತಮಿಳುನಾಡು', bn: 'তামিলনাড়ু', pa: 'ਤਾਮਿਲਨਾਡੂ', or: 'ତାମିଲନାଡୁ', as: 'তামিলনাডু' },
  'west bengal': { en: 'West Bengal', hi: 'पश्चिम बंगाल', mr: 'पश्चिम बंगाल', gu: 'પશ્ચિમ બંગાળ', ta: 'மேற்கு வங்கம்', te: 'పశ్ಚಿம బెంగాల్', ml: 'പശ്ചിമ ബംഗാൾ', kn: 'ಪಶ್ಚಿಮ ಬಂಗಾಳ', bn: 'পশ্চিমবঙ্গ', pa: 'ਪੱਛਮੀ ਬੰਗਾਲ', or: 'ପଶ୍ଚିମ ବଙ୍ଗ', as: 'পশ্চিমবংগ' },
  gujarat: { en: 'Gujarat', hi: 'गुजरात', mr: 'गुजरात', gu: 'ગુજરાત', ta: 'குஜராத்', te: 'గుజరాత్', ml: 'ഗുജറാത്ത്', kn: 'ಗುಜರಾತ್', bn: 'গুজরাত', pa: 'ਗੁਜਰਾਤ', or: 'ଗୁଜରାଟ', as: 'গুজৰাট' },
  rajasthan: { en: 'Rajasthan', hi: 'राजस्थान', mr: 'राजस्थान', gu: 'રાજસ્થાન', ta: 'ராஜஸ்தான்', te: 'రాజస్థాన్', ml: 'രാജസ്ഥാൻ', kn: 'ರಾಜಸ್ಥಾನ', bn: 'রাজস্থান', pa: 'ਰਾਜਸਥਾਨ', or: 'ରାଜସ୍ଥାନ', as: 'ৰাজস্থান' },
  'uttar pradesh': { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश', mr: 'उत्तर प्रदेश', gu: 'ઉત્તર પ્રદેશ', ta: 'உத்தரப் பிரதேசம்', te: 'ఉత్తరప్రదేశ్', ml: 'ഉത്തർപ്രദേശ്', kn: 'ಉತ್ತರ ಪ್ರದೇಶ', bn: 'উত্তরপ্রদেশ', pa: 'ਉੱਤਰ ਪ੍ਰਦੇਸ਼', or: 'ଉତ୍ତର ପ୍ରଦେଶ', as: 'উত্তৰ প্ৰদেশ' },
  'madhya pradesh': { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश', mr: 'मध्य प्रदेश', gu: 'મધ્ય પ્રદેશ', ta: 'மத்தியப் பிரதேசம்', te: 'మధ్యప్రదేశ్', ml: 'മധ്യപ്രദേശ്', kn: 'ಮಧ್ಯ ಪ್ರದೇಶ', bn: 'মধ্যপ্রদেশ', pa: 'ਮੱਧ ਪ੍ਰਦੇਸ਼', or: 'ମଧ୍ୟ ପ୍ରଦେଶ', as: 'মধ্য প্ৰদেশ' },
  bihar: { en: 'Bihar', hi: 'बिहार', mr: 'बिहार', gu: 'બિહાર', ta: 'பீகார்', te: 'బీహార్', ml: 'ബിഹാർ', kn: 'ಬಿಹಾರ', bn: 'বিহার', pa: 'ਬਿਹਾਰ', or: 'ବିହାର', as: 'বিহাৰ' },
  punjab: { en: 'Punjab', hi: 'पंजाब', mr: 'पंजाब', gu: 'ਪੰజాਬ', ta: 'பஞ்சாப்', te: 'పంజాబ్', ml: 'പഞ്ചാബ്', kn: 'ಪಂಜಾಬ್', bn: 'পাঞ্জাব', pa: 'ਪੰਜਾਬ', or: 'ପଞ୍ଜାବ', as: 'পঞ্জাৱ' },
  haryana: { en: 'Haryana', hi: 'हरियाणा', mr: 'हरियाणा', gu: 'હરિયાણા', ta: 'ஹரியானா', te: 'హర్యానా', ml: 'ഹരിയാന', kn: 'ಹರಿಯಾಣ', bn: 'হরিয়ানা', pa: 'ਹਰਿਆਣਾ', or: 'ହରିୟାଣା', as: 'হাৰিয়ানা' },
  kerala: { en: 'Kerala', hi: 'केरल', mr: 'केरळ', gu: 'કેરળ', ta: 'கேரளா', te: 'కేరళ', ml: 'കേരളം', kn: 'ಕೇರಳ', bn: 'কেরল', pa: 'ਕੇਰਲ', or: 'କେରଳ', as: 'কেৰালা' },
  'andhra pradesh': { en: 'Andhra Pradesh', hi: 'आंध्र प्रदेश', mr: 'आंध्र प्रदेश', gu: 'આંધ્ર પ્રદેશ', ta: 'ஆந்திரப் பிரதேசம்', te: 'ఆంధ్రప్రదేశ్', ml: 'ആന്ധ്രാപ്രദേശ്', kn: 'ಆಂಧ್ರಪ್ರದೇಶ', bn: 'অন্ধ্রপ্রদেশ', pa: 'ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼', or: 'ଆନ୍ଧ୍ର ପ୍ରଦେଶ', as: 'অন্ধ্ৰ প্ৰদেশ' },
  telangana: { en: 'Telangana', hi: 'तेलंगाना', mr: 'तेलंगणा', gu: 'તેલંગાણા', ta: 'தெலுங்கானா', te: 'తెలంగాణ', ml: 'തെലങ്കാന', kn: 'ತೆಲಂಗಾಣ', bn: 'তেলেঙ্গানা', pa: 'ਤੇਲੰਗਾਨਾ', or: 'ତେଲେଙ୍ଗାନା', as: 'তেলেংগানা' },
  odisha: { en: 'Odisha', hi: 'ओडिशा', mr: 'ओडिशा', gu: 'ઓડિશા', ta: 'ஒடிசா', te: 'ఒడిశా', ml: 'ഒഡീഷ', kn: 'ಒಡಿಶಾ', bn: 'ওড়িশা', pa: 'ਓਡੀਸ਼ਾ', or: 'ଓଡ଼ିଶା', as: 'ওড়িশা' },
  assam: { en: 'Assam', hi: 'असम', mr: 'आसाम', gu: 'આસામ', ta: 'அசாம்', te: 'அస్సాం', ml: 'അസം', kn: 'ಅಸ್ಸಾಂ', bn: 'আসাম', pa: 'ਅਸਾਮ', or: 'ଆସାମ', as: 'অসম' },
  goa: { en: 'Goa', hi: 'गोवा', mr: 'गोवा', gu: 'ગોવા', ta: 'கோவா', te: 'గోవా', ml: 'ഗോവ', kn: 'ಗೋವಾ', bn: 'গোয়া', pa: 'ਗੋਆ', or: 'ଗୋଆ', as: 'গোৱা' },
  'jammu and kashmir': { en: 'Jammu and Kashmir', hi: 'जम्मू और कश्मीर', mr: 'जम्मू आणि काश्मीर', gu: 'જમ્મુ અને કાશ્મીર', ta: 'ஜம்மு காஷ்மீர்', te: 'జమ్మూ కాశ్మీర్', ml: 'ജമ്മു കശ്മീർ', kn: 'ಜಮ್ಮು ಮತ್ತು ಕಾಶ್ಮೀರ', bn: 'জম্মু ও কাশ্মীর', pa: 'ਜੰਮੂ ਅਤੇ ਕਸ਼ਮੀਰ', or: 'ଜମ୍ମୁ ଓ କାଶ୍ମୀର', as: 'জম্মু আৰু কাশ্মীৰ' },
  'jammu & kashmir': { en: 'Jammu & Kashmir', hi: 'जम्मू और कश्मीर', mr: 'जम्मू आणि काश्मीर', gu: 'જમ્મુ અને કાશ્મીર', ta: 'ஜம்மு காஷ்மீர்', te: 'జమ్మూ కాశ్మీర్', ml: 'ജമ്മു കശ്മീർ', kn: 'ಜಮ್ಮು ಮತ್ತು ಕಾಶ್ಮೀರ', bn: 'জম্মু ও কাশ্মীর', pa: 'ਜੰਮੂ ਅਤੇ ਕਸ਼ਮੀਰ', or: 'ଜମ୍ମୁ ଓ କାଶ୍ମୀର', as: 'জম্মু আৰু কাশ্মীৰ' },
  'himachal pradesh': { en: 'Himachal Pradesh', hi: 'हिमाचल प्रदेश', mr: 'हिमाचल प्रदेश', gu: 'હિમાચલ પ્રદેશ', ta: 'இமாச்சலப் பிரதேசம்', te: 'హిమాచల్ ప్రదేశ్', ml: 'ഹിമാചൽ പ്രദേശ്', kn: 'ಹಿಮಾಚಲ ಪ್ರದೇಶ', bn: 'হিমাচল প্রদেশ', pa: 'ਹਿਮਾਚਲ ਪ੍ਰਦੇਸ਼', or: 'ହିମାଚଳ ପ୍ରଦେଶ', as: 'হিমাচল প্ৰদেশ' },
  uttarakhand: { en: 'Uttarakhand', hi: 'उत्तराखंड', mr: 'उत्तराखंड', gu: 'ઉત્તરાખંડ', ta: 'உத்தரகாண்ட்', te: 'ఉత్తరాఖండ్', ml: 'ഉത്തരാഖണ്ഡ്', kn: 'ಉತ್ತರಾಖಂಡ', bn: 'উত্তরাখণ্ড', pa: 'ਉੱਤਰਾਖੰਡ', or: 'ଉତ୍ତରାଖଣ୍ଡ', as: 'উত্তৰাখণ্ড' },
  jharkhand: { en: 'Jharkhand', hi: 'झारखंड', mr: 'झारखंड', gu: 'ઝારખંડ', ta: 'ஜார்கண்ட்', te: 'జార్ఖండ్', ml: 'ജാർഖണ്ഡ്', kn: 'ಜಾರ್ಖಂಡ್', bn: 'ঝাড়খণ্ড', pa: 'ਝਾਰਖੰਡ', or: 'ଝାଡ଼ଖଣ୍ଡ', as: 'ঝাৰখণ্ড' },
  chhattisgarh: { en: 'Chhattisgarh', hi: 'छत्तीसगढ़', mr: 'छत्तीसगड', gu: 'છત્તીસગઢ', ta: 'சத்தீஸ்கர்', te: 'ఛత్తీస్‌గఢ్', ml: 'ഛത്തീസ്ഗഡ്', kn: 'ಛತ್ತೀಸ್‌ಗಢ', bn: 'ছত্তিশগড়', pa: 'ਛੱਤੀਸਗੜ੍ਹ', or: 'ଛତିଶଗଡ଼', as: 'ছত্তীশগড়' },
};

export const INDIAN_CITIES: IndianLocationEntry[] = [
  {
    id: 'new-delhi',
    name: {
      en: 'New Delhi',
      hi: 'नई दिल्ली',
      mr: 'नवी दिल्ली',
      gu: 'નવી દિલ્હી',
      ta: 'புது தில்லி',
      te: 'న్యూఢిల్లీ',
      ml: 'ന്യൂഡൽഹി',
      kn: 'ಹೊಸ ದೆಹಲಿ',
      bn: 'নয়াদিল্লি',
      pa: 'ਨਵੀਂ ਦਿੱਲੀ',
      or: 'ନୂଆଦିଲ୍ଲୀ',
      as: 'নতুন দিল্লী',
    },
    state: INDIAN_STATES['delhi'],
    country: COUNTRY_NAMES.india,
    latitude: 28.6139,
    longitude: 77.209,
    timezone: 'Asia/Kolkata',
    aliases: ['delhi', 'dilli', 'new delhi', 'नई दिल्ली', 'नवी दिल्ली', 'दिल्ली', 'દિલ્હી', 'தில்லி', 'ఢిల్లీ'],
  },
  {
    id: 'mumbai',
    name: {
      en: 'Mumbai',
      hi: 'मुंबई',
      mr: 'मुंबई',
      gu: 'મુંબઈ',
      ta: 'மும்பை',
      te: 'ముంబై',
      ml: 'മുംബൈ',
      kn: 'ಮುಂಬೈ',
      bn: 'মুম্বই',
      pa: 'ਮੁੰਬਈ',
      or: 'ମୁମ୍ବାଇ',
      as: 'মুম্বাই',
    },
    state: INDIAN_STATES['maharashtra'],
    country: COUNTRY_NAMES.india,
    latitude: 19.076,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
    aliases: ['bombay', 'mumbai', 'मुंबई', 'બોમ્બે', 'பாம்பே'],
  },
  {
    id: 'pune',
    name: {
      en: 'Pune',
      hi: 'पुणे',
      mr: 'पुणे',
      gu: 'પુણે',
      ta: 'புனே',
      te: 'పూణే',
      ml: 'പൂനെ',
      kn: 'ಪುಣೆ',
      bn: 'পুনে',
      pa: 'ਪੁਣੇ',
      or: 'ପୁଣେ',
      as: 'পুনে',
    },
    state: INDIAN_STATES['maharashtra'],
    country: COUNTRY_NAMES.india,
    latitude: 18.5204,
    longitude: 73.8567,
    timezone: 'Asia/Kolkata',
    aliases: ['poona', 'pune', 'पुणे', 'પુણે', 'புனே'],
  },
  {
    id: 'bengaluru',
    name: {
      en: 'Bengaluru',
      hi: 'बेंगलुरु',
      mr: 'बेंगळुरू',
      gu: 'બેંગલુરુ',
      ta: 'பெங்களூரு',
      te: 'బెంగళూరు',
      ml: 'ബെംഗളൂരു',
      kn: 'ಬೆಂಗಳೂರು',
      bn: 'বেঙ্গালুরু',
      pa: 'ਬੈਂਗਲੁਰੂ',
      or: 'ବେଙ୍ଗାଲୁରୁ',
      as: 'বেংগালুৰু',
    },
    state: INDIAN_STATES['karnataka'],
    country: COUNTRY_NAMES.india,
    latitude: 12.9716,
    longitude: 77.5946,
    timezone: 'Asia/Kolkata',
    aliases: ['bangalore', 'bengaluru', 'बेंगलुरु', 'ಬೆಂಗಳೂರು', 'பெங்களூரு'],
  },
  {
    id: 'chennai',
    name: {
      en: 'Chennai',
      hi: 'चेन्नई',
      mr: 'चेन्नई',
      gu: 'ચેન્નાઈ',
      ta: 'சென்னை',
      te: 'చెన్నై',
      ml: 'ചെന്നൈ',
      kn: 'ಚೆನ್ನೈ',
      bn: 'চেন্নাই',
      pa: 'ਚੇਨਈ',
      or: 'ଚେନ୍ନାଇ',
      as: 'চেন্নাই',
    },
    state: INDIAN_STATES['tamil nadu'],
    country: COUNTRY_NAMES.india,
    latitude: 13.0827,
    longitude: 80.2707,
    timezone: 'Asia/Kolkata',
    aliases: ['madras', 'chennai', 'चेन्नई', 'சென்னை', 'చెన్నై'],
  },
  {
    id: 'kolkata',
    name: {
      en: 'Kolkata',
      hi: 'कोलकाता',
      mr: 'कोलकाता',
      gu: 'કોલકાતા',
      ta: 'கொல்கத்தா',
      te: 'కోల్‌కతా',
      ml: 'കൊൽക്കത്ത',
      kn: 'ಕೋಲ್ಕತ್ತಾ',
      bn: 'কলকাতা',
      pa: 'ਕੋਲਕਾਤਾ',
      or: 'କୋଲକାତା',
      as: 'কলকাতা',
    },
    state: INDIAN_STATES['west bengal'],
    country: COUNTRY_NAMES.india,
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: 'Asia/Kolkata',
    aliases: ['calcutta', 'kolkata', 'কলকাতা', 'কলিকাতা', 'कोलकाता'],
  },
  {
    id: 'hyderabad',
    name: {
      en: 'Hyderabad',
      hi: 'हैदराबाद',
      mr: 'हैदराबाद',
      gu: 'હૈદરાબાદ',
      ta: 'ஹைதராபாத்',
      te: 'హైదరాబాద్',
      ml: 'ഹൈദരാബാദ്',
      kn: 'ಹೈದರಾಬಾದ್',
      bn: 'হায়দ্রাবাদ',
      pa: 'ਹੈਦਰਾਬਾਦ',
      or: 'ହାଇଦ୍ରାବାଦ',
      as: 'হায়দৰাবাদ',
    },
    state: INDIAN_STATES['telangana'],
    country: COUNTRY_NAMES.india,
    latitude: 17.385,
    longitude: 78.4867,
    timezone: 'Asia/Kolkata',
    aliases: ['hyderabad', 'हैदराबाद', 'హైదరాబాద్', 'ஹைதராபாத்'],
  },
  {
    id: 'ahmedabad',
    name: {
      en: 'Ahmedabad',
      hi: 'अहमदाबाद',
      mr: 'अहमदाबाद',
      gu: 'અમદાવાદ',
      ta: 'அகமதாபாத்',
      te: 'అహ్మదాబాద్',
      ml: 'അഹമ്മദാബാദ്',
      kn: 'ಅಹಮದಾಬಾದ್',
      bn: 'আমেদাবাদ',
      pa: 'ਅਹਿਮਦਾਬਾਦ',
      or: 'ଅହମ୍ମଦାବାଦ',
      as: 'আহমেদাবাদ',
    },
    state: INDIAN_STATES['gujarat'],
    country: COUNTRY_NAMES.india,
    latitude: 23.0225,
    longitude: 72.5714,
    timezone: 'Asia/Kolkata',
    aliases: ['amdavad', 'ahmedabad', 'અમદાવાદ', 'अहमदाबाद'],
  },
  {
    id: 'jaipur',
    name: {
      en: 'Jaipur',
      hi: 'जयपुर',
      mr: 'जयपूर',
      gu: 'જયપુર',
      ta: 'ஜெய்ப்பூர்',
      te: 'జైపూర్',
      ml: 'ജയ്പൂർ',
      kn: 'ಜೈಪುರ',
      bn: 'জয়পুর',
      pa: 'ਜੈਪੁਰ',
      or: 'ଜୟପୁର',
      as: 'জয়পুৰ',
    },
    state: INDIAN_STATES['rajasthan'],
    country: COUNTRY_NAMES.india,
    latitude: 26.9124,
    longitude: 75.7873,
    timezone: 'Asia/Kolkata',
    aliases: ['jaipur', 'जयपुर', 'जयपूर', 'pink city'],
  },
  {
    id: 'lucknow',
    name: { en: 'Lucknow', hi: 'लखनऊ', mr: 'लखनौ' },
    state: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश', mr: 'उत्तर प्रदेश' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 26.8467,
    longitude: 80.9462,
    timezone: 'Asia/Kolkata',
    aliases: ['lucknow', 'लखनऊ', 'लखनौ'],
  },
  {
    id: 'nagpur',
    name: { en: 'Nagpur', hi: 'नागपुर', mr: 'नागपूर' },
    state: { en: 'Maharashtra', hi: 'महाराष्ट्र', mr: 'महाराष्ट्र' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 21.1458,
    longitude: 79.0882,
    timezone: 'Asia/Kolkata',
    aliases: ['nagpur', 'नागपुर', 'नागपूर'],
  },
  {
    id: 'surat',
    name: { en: 'Surat', hi: 'सूरत', mr: 'सुरत' },
    state: { en: 'Gujarat', hi: 'गुजरात', mr: 'गुजरात' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 21.1702,
    longitude: 72.8311,
    timezone: 'Asia/Kolkata',
    aliases: ['surat', 'सूरत', 'सुरत'],
  },
  {
    id: 'indore',
    name: { en: 'Indore', hi: 'इंदौर', mr: 'इंदूर' },
    state: { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश', mr: 'मध्य प्रदेश' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 22.7196,
    longitude: 75.8577,
    timezone: 'Asia/Kolkata',
    aliases: ['indore', 'इंदौर', 'इंदूर'],
  },
  {
    id: 'bhopal',
    name: { en: 'Bhopal', hi: 'भोपाल', mr: 'भोपाळ' },
    state: { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश', mr: 'मध्य प्रदेश' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 23.2599,
    longitude: 77.4126,
    timezone: 'Asia/Kolkata',
    aliases: ['bhopal', 'भोपाल', 'भोपाळ'],
  },
  {
    id: 'patna',
    name: { en: 'Patna', hi: 'पटना', mr: 'पाटणा' },
    state: { en: 'Bihar', hi: 'बिहार', mr: 'बिहार' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 25.5941,
    longitude: 85.1376,
    timezone: 'Asia/Kolkata',
    aliases: ['patna', 'पटना', 'पाटणा'],
  },
  {
    id: 'chandigarh',
    name: { en: 'Chandigarh', hi: 'चंडीगढ़', mr: 'चंदीगड' },
    state: { en: 'Punjab', hi: 'पंजाब', mr: 'पंजाब' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 30.7333,
    longitude: 76.7794,
    timezone: 'Asia/Kolkata',
    aliases: ['chandigarh', 'चंडीगढ़', 'चंदीगड'],
  },
  {
    id: 'nashik',
    name: { en: 'Nashik', hi: 'नासिक', mr: 'नाशिक' },
    state: { en: 'Maharashtra', hi: 'महाराष्ट्र', mr: 'महाराष्ट्र' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 19.9975,
    longitude: 73.7898,
    timezone: 'Asia/Kolkata',
    aliases: ['nasik', 'nashik', 'नासिक', 'नाशिक'],
  },
  {
    id: 'panaji',
    name: { en: 'Panaji', hi: 'पणजी', mr: 'पणजी' },
    state: { en: 'Goa', hi: 'गोवा', mr: 'गोवा' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 15.4909,
    longitude: 73.8278,
    timezone: 'Asia/Kolkata',
    aliases: ['goa', 'panjim', 'panaji', 'पणजी', 'गोवा'],
  },
  {
    id: 'srinagar',
    name: { en: 'Srinagar', hi: 'श्रीनगर', mr: 'श्रीनगर' },
    state: { en: 'Jammu & Kashmir', hi: 'जम्मू और कश्मीर', mr: 'जम्मू आणि काश्मीर' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 34.0837,
    longitude: 74.7973,
    timezone: 'Asia/Kolkata',
    aliases: ['srinagar', 'श्रीनगर'],
  },
  {
    id: 'shimla',
    name: { en: 'Shimla', hi: 'शिमला', mr: 'शिमला' },
    state: { en: 'Himachal Pradesh', hi: 'हिमाचल प्रदेश', mr: 'हिमाचल प्रदेश' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 31.1048,
    longitude: 77.1734,
    timezone: 'Asia/Kolkata',
    aliases: ['shimla', 'simla', 'शिमला'],
  },
  {
    id: 'jodhpur',
    name: { en: 'Jodhpur', hi: 'जोधपुर', mr: 'जोधपूर' },
    state: { en: 'Rajasthan', hi: 'राजस्थान', mr: 'राजस्थान' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 26.2389,
    longitude: 73.0243,
    timezone: 'Asia/Kolkata',
    aliases: ['jodhpur', 'जोधपुर', 'जोधपूर'],
  },
  {
    id: 'raipur',
    name: { en: 'Raipur', hi: 'रायपुर', mr: 'रायपूर' },
    state: { en: 'Chhattisgarh', hi: 'छत्तीसगढ़', mr: 'छत्तीसगड' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 21.2514,
    longitude: 81.6296,
    timezone: 'Asia/Kolkata',
    aliases: ['raipur', 'रायपुर', 'रायपूर'],
  },
  {
    id: 'varanasi',
    name: { en: 'Varanasi', hi: 'वाराणसी', mr: 'वाराणसी' },
    state: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश', mr: 'उत्तर प्रदेश' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 25.3176,
    longitude: 82.9739,
    timezone: 'Asia/Kolkata',
    aliases: ['banaras', 'kashi', 'varanasi', 'वाराणसी', 'बनारस', 'काशी'],
  },
  {
    id: 'bhubaneswar',
    name: { en: 'Bhubaneswar', hi: 'भुवनेश्वर', mr: 'भुवनेश्वर' },
    state: { en: 'Odisha', hi: 'ओडिशा', mr: 'ओडिशा' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 20.2961,
    longitude: 85.8245,
    timezone: 'Asia/Kolkata',
    aliases: ['bhubaneswar', 'भुवनेश्वर'],
  },
  {
    id: 'guwahati',
    name: { en: 'Guwahati', hi: 'गुवाहाटी', mr: 'गुवाहाटी' },
    state: { en: 'Assam', hi: 'असम', mr: 'आसाम' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 26.1445,
    longitude: 91.7362,
    timezone: 'Asia/Kolkata',
    aliases: ['guwahati', 'gauhati', 'गुवाहाटी'],
  },
  {
    id: 'kochi',
    name: { en: 'Kochi', hi: 'कोच्चि', mr: 'कोची' },
    state: { en: 'Kerala', hi: 'केरल', mr: 'केरळ' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 9.9312,
    longitude: 76.2673,
    timezone: 'Asia/Kolkata',
    aliases: ['cochin', 'kochi', 'कोच्चि', 'कोची'],
  },
  {
    id: 'thiruvananthapuram',
    name: { en: 'Thiruvananthapuram', hi: 'तिरुवनंतपुरम', mr: 'तिरुवनंतपूरम' },
    state: { en: 'Kerala', hi: 'केरल', mr: 'केरळ' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 8.5241,
    longitude: 76.9366,
    timezone: 'Asia/Kolkata',
    aliases: ['trivandrum', 'thiruvananthapuram', 'तिरुवनंतपुरम', 'तिरुवनंतपूरम'],
  },
  {
    id: 'thane',
    name: { en: 'Thane', hi: 'ठाणे', mr: 'ठाणे' },
    state: { en: 'Maharashtra', hi: 'महाराष्ट्र', mr: 'महाराष्ट्र' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 19.2183,
    longitude: 72.9781,
    timezone: 'Asia/Kolkata',
    aliases: ['thane', 'ठाणे'],
  },
  {
    id: 'chhatrapati-sambhajinagar',
    name: { en: 'Chhatrapati Sambhajinagar', hi: 'छत्रपति संभाजीनगर', mr: 'छत्रपती संभाजीनगर' },
    state: { en: 'Maharashtra', hi: 'महाराष्ट्र', mr: 'महाराष्ट्र' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 19.8762,
    longitude: 75.3433,
    timezone: 'Asia/Kolkata',
    aliases: ['aurangabad', 'sambhajinagar', 'औरंगाबाद', 'छत्रपति संभाजीनगर', 'छत्रपती संभाजीनगर'],
  },
  {
    id: 'solapur',
    name: { en: 'Solapur', hi: 'सोलापुर', mr: 'सोलापूर' },
    state: { en: 'Maharashtra', hi: 'महाराष्ट्र', mr: 'महाराष्ट्र' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 17.6599,
    longitude: 75.9064,
    timezone: 'Asia/Kolkata',
    aliases: ['solapur', 'sholapur', 'सोलापुर', 'सोलापूर'],
  },
  {
    id: 'kolhapur',
    name: { en: 'Kolhapur', hi: 'कोल्हापुर', mr: 'कोल्हापूर' },
    state: { en: 'Maharashtra', hi: 'महाराष्ट्र', mr: 'महाराष्ट्र' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 16.705,
    longitude: 74.2433,
    timezone: 'Asia/Kolkata',
    aliases: ['kolhapur', 'कोल्हापुर', 'कोल्हापूर'],
  },
  {
    id: 'amritsar',
    name: { en: 'Amritsar', hi: 'अमृतसर', mr: 'अमृतसर' },
    state: { en: 'Punjab', hi: 'पंजाब', mr: 'पंजाब' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 31.634,
    longitude: 74.8723,
    timezone: 'Asia/Kolkata',
    aliases: ['amritsar', 'अमृतसर'],
  },
  {
    id: 'agra',
    name: { en: 'Agra', hi: 'आगरा', mr: 'आग्रा' },
    state: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश', mr: 'उत्तर प्रदेश' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 27.1767,
    longitude: 78.0081,
    timezone: 'Asia/Kolkata',
    aliases: ['agra', 'आगरा', 'आग्रा'],
  },
  {
    id: 'kanpur',
    name: { en: 'Kanpur', hi: 'कानपुर', mr: 'कानपूर' },
    state: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश', mr: 'उत्तर प्रदेश' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 26.4499,
    longitude: 80.3319,
    timezone: 'Asia/Kolkata',
    aliases: ['kanpur', 'cawnpore', 'कानपुर', 'कानपूर'],
  },
  {
    id: 'dehradun',
    name: { en: 'Dehradun', hi: 'देहरादून', mr: 'डेहराडून' },
    state: { en: 'Uttarakhand', hi: 'उत्तराखंड', mr: 'उत्तराखंड' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 30.3165,
    longitude: 78.0322,
    timezone: 'Asia/Kolkata',
    aliases: ['dehradun', 'देहरादून', 'डेहराडून'],
  },
  {
    id: 'ranchi',
    name: { en: 'Ranchi', hi: 'रांची', mr: 'रांची' },
    state: { en: 'Jharkhand', hi: 'झारखंड', mr: 'झारखंड' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 23.3441,
    longitude: 85.3096,
    timezone: 'Asia/Kolkata',
    aliases: ['ranchi', 'रांची'],
  },
  {
    id: 'visakhapatnam',
    name: { en: 'Visakhapatnam', hi: 'विशाखापट्टनम', mr: 'विशाखापट्टणम' },
    state: { en: 'Andhra Pradesh', hi: 'आंध्र प्रदेश', mr: 'आंध्र प्रदेश' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 17.6868,
    longitude: 83.2185,
    timezone: 'Asia/Kolkata',
    aliases: ['visakhapatnam', 'vizag', 'विशाखापट्टनम', 'विशाखापट्टणम'],
  },
  {
    id: 'coimbatore',
    name: { en: 'Coimbatore', hi: 'कोयंबटूर', mr: 'कोइम्बतूर' },
    state: { en: 'Tamil Nadu', hi: 'तमिलनाडु', mr: 'तमिळनाडू' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 11.0168,
    longitude: 76.9558,
    timezone: 'Asia/Kolkata',
    aliases: ['coimbatore', 'kovai', 'कोयंबटूर', 'कोइम्बतूर'],
  },
  {
    id: 'madurai',
    name: { en: 'Madurai', hi: 'मदुरै', mr: 'मदुराई' },
    state: { en: 'Tamil Nadu', hi: 'तमिलनाडु', mr: 'तमिळनाडू' },
    country: { en: 'India', hi: 'भारत', mr: 'भारत' },
    latitude: 9.9252,
    longitude: 78.1198,
    timezone: 'Asia/Kolkata',
    aliases: ['madurai', 'मदुरै', 'मदुराई'],
  },
];

// Lookup maps for fast O(1) resolution
const CITY_LOOKUP = new Map<string, IndianLocationEntry>();
const ALIAS_LOOKUP = new Map<string, IndianLocationEntry>();

INDIAN_CITIES.forEach((entry) => {
  CITY_LOOKUP.set(entry.id.toLowerCase(), entry);
  Object.values(entry.name).forEach((val) => {
    if (val) CITY_LOOKUP.set(val.toLowerCase(), entry);
  });

  entry.aliases.forEach((alias) => {
    ALIAS_LOOKUP.set(alias.toLowerCase(), entry);
  });
});

/**
 * Normalizes location search string
 */
function normalizeStr(str: string): string {
  return str.trim().toLowerCase().replace(/[,.-]/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Finds matching Indian location entry from string or GeoLocation
 */
export function findIndianLocation(
  loc: GeoLocation | { name?: string } | string | null | undefined
): IndianLocationEntry | null {
  if (!loc) return null;

  const rawName = typeof loc === 'string' ? loc : loc.name || '';
  if (!rawName) return null;

  const clean = normalizeStr(rawName);

  // Exact matches
  if (CITY_LOOKUP.has(clean)) return CITY_LOOKUP.get(clean)!;
  if (ALIAS_LOOKUP.has(clean)) return ALIAS_LOOKUP.get(clean)!;

  // Split tokens (e.g. "Pune, India" -> "pune")
  const firstToken = clean.split(' ')[0];
  if (CITY_LOOKUP.has(firstToken)) return CITY_LOOKUP.get(firstToken)!;
  if (ALIAS_LOOKUP.has(firstToken)) return ALIAS_LOOKUP.get(firstToken)!;

  // Substring / prefix matching across Indian cities
  for (let i = 0; i < INDIAN_CITIES.length; i++) {
    const entry = INDIAN_CITIES[i];
    const matchesName = Object.values(entry.name).some(
      (val) => val && (clean.includes(val.toLowerCase()) || val.toLowerCase().includes(clean))
    );
    if (matchesName) {
      return entry;
    }
    for (let j = 0; j < entry.aliases.length; j++) {
      const alias = entry.aliases[j].toLowerCase();
      if (clean.includes(alias) || alias.includes(clean)) {
        return entry;
      }
    }
  }

  return null;
}

/**
 * Returns localized city name according to the active language
 */
export function getLocalizedLocationName(
  loc: GeoLocation | { name?: string } | string | null | undefined,
  lang: SupportedLanguage = 'en'
): string {
  const entry = findIndianLocation(loc);
  if (entry) {
    return entry.name[lang] || entry.name.en;
  }

  const rawName = typeof loc === 'string' ? loc : loc?.name || '';
  if (rawName) return rawName;

  const defaultEntry = findIndianLocation('New Delhi');
  return defaultEntry?.name[lang] || 'New Delhi';
}

/**
 * Returns localized country name (e.g. India -> भारत, இந்தியா, ইত্যাদি)
 */
export function getLocalizedCountry(
  country: string | null | undefined,
  lang: SupportedLanguage = 'en'
): string {
  if (!country) return COUNTRY_NAMES.india[lang] || 'India';
  const clean = country.trim().toLowerCase();
  if (clean === 'india' || clean === 'in' || clean === 'bharat' || clean === 'भारत') {
    return COUNTRY_NAMES.india[lang] || 'India';
  }
  return country;
}

/**
 * Returns localized state / province name
 */
export function getLocalizedAdmin1(
  admin1: string | null | undefined,
  lang: SupportedLanguage = 'en'
): string {
  if (!admin1) return '';
  const clean = admin1.trim().toLowerCase();
  const state = INDIAN_STATES[clean];
  if (state) {
    return state[lang] || state.en;
  }
  return admin1;
}

/**
 * Returns full localized string e.g. "नई दिल्ली, भारत" or "पुणे, महाराष्ट्र, भारत"
 */
export function getLocalizedLocationFull(
  loc: GeoLocation | null | undefined,
  lang: SupportedLanguage = 'en',
  includeState = false
): string {
  if (!loc) {
    return lang === 'hi' ? 'नई दिल्ली, भारत' : lang === 'mr' ? 'नवी दिल्ली, भारत' : 'New Delhi, India';
  }

  const cityName = getLocalizedLocationName(loc, lang);
  const countryName = getLocalizedCountry(loc.country, lang);

  if (includeState && loc.admin1) {
    const stateName = getLocalizedAdmin1(loc.admin1, lang);
    if (stateName && stateName !== cityName) {
      return `${cityName}, ${stateName}, ${countryName}`;
    }
  }

  return `${cityName}, ${countryName}`;
}

/**
 * Resolves a query typed in English, Hindi, or Marathi to matching locations
 */
export function searchMultilingualLocations(
  query: string,
  lang: SupportedLanguage = 'en'
): GeoLocation[] {
  const clean = normalizeStr(query);
  if (!clean || clean.length < 1) return [];

  const matchedEntries: IndianLocationEntry[] = [];
  const seenIds = new Set<string>();

  // Check matching against all cities and aliases
  for (const entry of INDIAN_CITIES) {
    const stateEn = entry.state.en.toLowerCase();
    const matchesName = Object.values(entry.name).some(
      (val) => val && val.toLowerCase().includes(clean)
    );
    const matches =
      matchesName ||
      stateEn.includes(clean) ||
      entry.aliases.some((a) => a.toLowerCase().includes(clean));

    if (matches && !seenIds.has(entry.id)) {
      matchedEntries.push(entry);
      seenIds.add(entry.id);
    }
  }

  return matchedEntries.map((e) => ({
    name: e.name.en, // Keep stable English identity for APIs
    latitude: e.latitude,
    longitude: e.longitude,
    country: e.country.en,
    admin1: e.state.en,
    timezone: e.timezone,
  }));
}

/**
 * Translates a Devanagari (Hindi/Marathi) city query to standard English for geocoding
 */
export function getEnglishQueryForGeocoding(query: string): string {
  const match = findIndianLocation(query);
  if (match) {
    return match.name.en;
  }
  return query;
}

/**
 * Popular Indian cities with standard stable coordinates
 */
export const POPULAR_LOCATIONS: GeoLocation[] = [
  { name: 'New Delhi', country: 'India', admin1: 'Delhi', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' },
  { name: 'Mumbai', country: 'India', admin1: 'Maharashtra', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Pune', country: 'India', admin1: 'Maharashtra', latitude: 18.5204, longitude: 73.8567, timezone: 'Asia/Kolkata' },
  { name: 'Bengaluru', country: 'India', admin1: 'Karnataka', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { name: 'Chennai', country: 'India', admin1: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { name: 'Kolkata', country: 'India', admin1: 'West Bengal', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { name: 'Hyderabad', country: 'India', admin1: 'Telangana', latitude: 17.385, longitude: 78.4867, timezone: 'Asia/Kolkata' },
  { name: 'Ahmedabad', country: 'India', admin1: 'Gujarat', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata' },
];
