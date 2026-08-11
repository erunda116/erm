import { useState, useEffect, useRef, useMemo } from 'react';
import { useT } from '../../lib/i18n';
import { useDesignerStore } from '../../store/useDesignerStore';

type LeadCapturePopupProps = {
  webhookPayload: any;
  onGeneratePdf: () => Promise<string>;
  onClose: () => void;
};

export default function LeadCapturePopup({ webhookPayload, onGeneratePdf, onClose }: LeadCapturePopupProps) {
  const t = useT();
  const locale = useDesignerStore((s) => s.locale);

  // Ссылка на форму для изоляции событий клавиатуры от canvas
  const formRef = useRef<HTMLFormElement>(null);

  // 1. Изолируем Space и Backspace внутри инпутов, чтобы холст их не перехватывал
  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement) return;

    const handleNativeKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Backspace') {
          // Останавливаем всплытие, чтобы глобальные слушатели canvas не реагировали
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }
    };

    // 'true' включает фазу захвата (capture), перехватывая событие до того, как оно дойдет до canvas
    formElement.addEventListener('keydown', handleNativeKeyDown, true);
    return () => {
      formElement.removeEventListener('keydown', handleNativeKeyDown, true);
    };
  }, []);

  // 1. Translate and Sort Countries dynamically based on active locale
  const translatedCountries = useMemo(() => {
    return WORLD_COUNTRY_CODES.map(c => ({
      ...c,
      translatedName: (t(c.name as any) || c.name) as string 
    })).sort((a, b) => a.translatedName.localeCompare(b.translatedName));
  }, [locale, t]);

  // 2. Store ONLY the string in state to prevent React infinite loops
  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    if (locale === 'pt') return '+351';
    if (locale === 'es') return '+34';
    return '+44'; 
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); 
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Close custom dropdown if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update default flag string if the user changes the UI language
  useEffect(() => {
    if (locale === 'pt') setSelectedCountryCode('+351');
    else if (locale === 'es') setSelectedCountryCode('+34');
    else setSelectedCountryCode('+44');
  }, [locale]);

  // Derive the active country object on the fly for the UI
  const activeCountry = translatedCountries.find(c => c.code === selectedCountryCode) || translatedCountries[0];

const getTrackingData = () => {
  const params = new URLSearchParams(window.location.search);

  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || '',
    gclid: params.get('gclid') || '',
    gbraid: params.get('gbraid') || '',
    wbraid: params.get('wbraid') || ''
  };
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Generate the PDF silently in the background
      const base64Pdf = await onGeneratePdf(); 

      // 2. Attach the customer data AND the PDF file to the payload
      const trackingData = getTrackingData();

const finalPayload = {
  ...webhookPayload,

  customer: { 
    name: name.trim(), 
    email: email.trim(), 
    phone: `${activeCountry.code} ${phoneNumber.trim()}`
  },

  tracking: trackingData,

  fileData: {
    filename: `${webhookPayload.quoteId}.pdf`,
    mimeType: 'application/pdf',
    base64: base64Pdf
  }
};

      // 3. Send everything to n8n
      const response = await fetch('https://n8n.euromuro.eu/webhook/569b8abb-3c06-428d-8de4-8fc99a7d2944', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload)
      });

      if (!response.ok) {
        throw new Error(`Webhook failed! HTTP Status: ${response.status}`);
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to generate or sync lead to n8n:', error);
      setIsSubmitted(true); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTranslatedDesc = () => {
    const rawString = (t('popupDesc' as any) || 'Where should we email your quotation {id}?');
    return rawString.replace('{id}', webhookPayload.quoteId);
  };

  return (
    <>
      <div onClick={onClose} style={{ inset: 0, position: 'fixed', background: 'rgba(0,0,0,0.6)', zIndex: 100000 }} />
      <div style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 320, 
          background: '#1a1a1a', border: '2px solid #333', borderRadius: 12, padding: '20px', 
          zIndex: 100001, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.8)'
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
            {isSubmitted ? (t('popupThankYouTitle' as any) || 'Thank You!') : (t('popupTitle' as any) || 'Get Your Quote')}
          </div>
          <button onClick={onClose} style={{ background: '#333', border: 'none', borderRadius: 6, color: '#aaa', cursor: 'pointer', fontSize: 16, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {isSubmitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40 }}>📩</div>
            <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.4 }}>
              {t('popupThankYouDesc' as any) || `Your quotation has been sent to ${email}. Please check your inbox (and spam folder) shortly!`}
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 12, padding: '10px', borderRadius: 8, border: 'none',
                background: '#333', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              {t('closeBtn' as any) || 'Close'}
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.4 }}>{getTranslatedDesc()}</div>
            <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required type="text" placeholder={t('namePlaceholder' as any) || 'Name'} value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              <input required type="email" placeholder={t('emailPlaceholder' as any) || 'Email'} value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              
              <div style={{ display: 'flex', gap: 8 }}>
                <div ref={dropdownRef} style={{ position: 'relative', width: '100px' }}>
                  <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ ...inputStyle, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '10px 8px' }}>
                    <span style={{ fontSize: 14 }}>{activeCountry.flag}</span>
                    <span style={{ fontSize: 13 }}>{activeCountry.code}</span>
                  </button>

                  {isDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, width: '220px', maxHeight: '160px', overflowY: 'auto', background: '#222', border: '1px solid #444', borderRadius: 6, zIndex: 10, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      {translatedCountries.map((country) => (
                        <div 
                          key={country.name} 
                          onClick={() => { setSelectedCountryCode(country.code); setIsDropdownOpen(false); }} 
                          style={{ padding: '8px 12px', cursor: 'pointer', color: '#fff', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #333' }} 
                          onMouseEnter={(e) => e.currentTarget.style.background = '#333'} 
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontSize: 16 }}>{country.flag}</span>
                          <span style={{ fontWeight: 600, width: '40px' }}>{country.code}</span>
                          <span style={{ color: '#aaa', fontSize: 11 }}>{country.translatedName}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input 
                  required 
                  type="tel" 
                  pattern="[0-9\s]{6,15}" 
                  title={t('phoneInvalid' as any) || 'Please enter a valid phone number (6-15 digits)'}
                  placeholder={t('phonePlaceholder' as any) || 'Phone Number'} 
                  value={phoneNumber} 
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/[^\d\s]/g, '');
                    setPhoneNumber(onlyNumbers);
                  }} 
                  style={{ ...inputStyle, flex: 1 }} 
                />
              </div>

              <button type="submit" disabled={isSubmitting} style={{ marginTop: 10, padding: '10px', borderRadius: 8, border: 'none', background: isSubmitting ? '#a1a1a1' : '#d3001b', color: '#fff', fontWeight: 700, fontSize: 13, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                {isSubmitting ? (t('sendingBtn' as any) || 'Sending...') : (t('submitBtn' as any) || 'Download Quote')}
              </button>
            </form>
          </>
        )}
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', background: '#222', border: '1px solid #444', 
  borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box'
};

const WORLD_COUNTRY_CODES = [
  { code: "+54", name: "Argentina", flag: "🇦🇷" },
  { code: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "+43", name: "Austria", flag: "🇦🇹" },
  { code: "+32", name: "Belgium", flag: "🇧🇪" },
  { code: "+55", name: "Brazil", flag: "🇧🇷" },
  { code: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "+56", name: "Chile", flag: "🇨🇱" },
  { code: "+86", name: "China", flag: "🇨🇳" },
  { code: "+57", name: "Colombia", flag: "🇨🇴" },
  { code: "+45", name: "Denmark", flag: "🇩🇰" },
  { code: "+20", name: "Egypt", flag: "🇪🇬" },
  { code: "+358", name: "Finland", flag: "🇫🇮" },
  { code: "+33", name: "France", flag: "🇫🇷" },
  { code: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "+30", name: "Greece", flag: "🇬🇷" },
  { code: "+91", name: "India", flag: "🇮🇳" },
  { code: "+353", name: "Ireland", flag: "🇮🇪" },
  { code: "+972", name: "Israel", flag: "🇮🇱" },
  { code: "+39", name: "Italy", flag: "🇮🇹" },
  { code: "+81", name: "Japan", flag: "🇯🇵" },
  { code: "+52", name: "Mexico", flag: "🇲🇽" },
  { code: "+212", name: "Morocco", flag: "🇲🇦" },
  { code: "+31", name: "Netherlands", flag: "🇳🇱" },
  { code: "+64", name: "New Zealand", flag: "🇳🇿" },
  { code: "+47", name: "Norway", flag: "🇳🇴" },
  { code: "+48", name: "Poland", flag: "🇵🇱" },
  { code: "+351", name: "Portugal", flag: "🇵🇹" },
  { code: "+40", name: "Romania", flag: "🇷🇴" },
  { code: "+27", name: "South Africa", flag: "🇿🇦" },
  { code: "+34", name: "Spain", flag: "🇪🇸" },
  { code: "+46", name: "Sweden", flag: "🇸🇪" },
  { code: "+41", name: "Switzerland", flag: "🇨🇭" },
  { code: "+90", name: "Turkey", flag: "🇹🇷" },
  { code: "+380", name: "Ukraine", flag: "🇺🇦" },
  { code: "+971", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", name: "United States", flag: "🇺🇸" }
];