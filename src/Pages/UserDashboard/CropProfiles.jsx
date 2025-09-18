import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const CropProfiles = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }
  });

  // Fallback Malayalam translations for common crops
  const malayalamFallbacks = {
    'sweet potato': {
      name: 'ചക്കരക്കിഴങ്ങ്',
      description: 'ചക്കരക്കിഴങ്ങ് ഒരു അന്നജം കൂടുതലുള്ള, പോഷകസമൃദ്ധമായ വേരുകൾ വിളയാണ്. ചൂടുള്ള കാലാവസ്ഥയിൽ വളരുന്ന ഇത് ഭക്ഷണത്തിനും മൃഗാഹാരത്തിനും ഉപയോഗിക്കുന്നു.',
      tips: [
        '20-30°C താപനിലയുള്ള ചൂടുള്ള കാലാവസ്ഥ ആവശ്യമാണ്.',
        'നിലം 2-3 തവണ കുഴിച്ച് നടാനുള്ള റിഡ്ജുകൾ തയ്യാറാക്കുക.',
        'ആരോഗ്യമുള്ള വൈൻ കട്ടിംഗുകൾ (20-30 സെ.മീ. നീളം) പ്രചരണത്തിന് ഉപയോഗിക്കുക.'
      ]
    },
    'carrot': {
      name: 'കാരറ്റ്',
      description: 'കാരറ്റ് ഒരു വേരുകൾ പച്ചക്കറിയാണ്. ഇളകുന്ന മണൽ മണ്ണിൽ വളരുന്ന ഇത് ക്രിസ്പ്പ് ടെക്സ്ചറും മധുരമുള്ള രുചിയും ഉയർന്ന വിറ്റാമിൻ A ഉള്ളടക്കവും ഉണ്ട്.',
      tips: [
        'ഉചിതമായ മണ്ണ്: ഓർഗാനിക് മാറ്റർ കൂടുതലുള്ള ഇളകുന്ന മണൽ ലോം മണ്ണ്',
        'വിത്തിടൽ: ശരിയായ ഇടവേളയിൽ വരികളിൽ നേരിട്ട് വിത്തിടുക',
        'ജലസേചനം: മണ്ണ് ഈർപ്പമുള്ളതായി നിലനിർത്താൻ ലഘുവും പതിവുമായ ജലസേചനം'
      ]
    },
    'rice': {
      name: 'അരി',
      description: 'അരി കൃഷി എന്നത് ജലം നിറഞ്ഞ വയലുകളിൽ അരി വളർത്തുന്ന പ്രക്രിയയാണ്. ഭൂമി തയ്യാറാക്കൽ മുതൽ വിളവെടുപ്പ് വരെ, ലോകത്തിലെ പകുതിയിലധികം ജനങ്ങളുടെ പ്രധാന ഭക്ഷണമായി സേവിക്കുന്നു.',
      tips: [
        'സമൃദ്ധമായ കളിമണ്ണ് അല്ലെങ്കിൽ ലോം മണ്ണ് ആവശ്യമാണ്.',
        'ചൂടുള്ള കാലാവസ്ഥയിൽ (20-35°C) കൂടുതൽ ജലത്തോടെ മികച്ച വളർച്ച',
        'ധാന്യങ്ങൾ സ്വർണ്ണനിറമാകുമ്പോൾ വിളവെടുപ്പ് നടത്തുക'
      ]
    }
  };

  const t = {
    en: {
      title: 'Crop Profiles',
      subtitle: 'Explore detailed information about different crops, their cultivation methods, and growing tips.',
      loading: 'Loading...',
      none: 'No crops available yet.',
      cultivationTips: 'Cultivation Tips'
    },
    ml: {
      title: 'വിള പ്രൊഫൈലുകൾ',
      subtitle: 'വിവിധ വിളകളെക്കുറിച്ചുള്ള വിശദ വിവരങ്ങൾ, കൃഷി രീതികൾ, വളർച്ചാ നിർദ്ദേശങ്ങൾ പര്യവേക്ഷണം ചെയ്യുക.',
      loading: 'ലോഡ് ചെയ്യുന്നു...',
      none: 'ഇനിയും വിള പ്രൊഫൈലുകൾ ലഭ്യമല്ല.',
      cultivationTips: 'കൃഷി നിർദ്ദേശങ്ങൾ'
    }
  }[lang];

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);
        const res = await api.get('/farmer/crop-profiles');
        setCrops(res.data?.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load crop profiles');
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  useEffect(() => {
    const handler = (e) => setLang(e?.detail || 'en');
    window.addEventListener('langChanged', handler);
    return () => window.removeEventListener('langChanged', handler);
  }, []);

  if (loading) return <div className="p-4">{t.loading}</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="ag-card overflow-hidden relative"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20 ag-cta-gradient blur-3xl" />
        <div className="ag-hero-gradient p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">{t.title}</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Crop Profiles Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {crops.length === 0 && (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-600">{t.none}</div>
          </div>
        )}
      {crops.map((c) => {
        const base = (api.defaults.baseURL || '').replace(/\/?api\/?$/, '');
        const imageSrc = c.imageUrl && !c.imageUrl.startsWith('http')
          ? `${base}${c.imageUrl}`
          : (c.imageUrl || '');
        return (
          <motion.div key={c._id} className="ag-card overflow-hidden" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            {imageSrc ? (
              <img src={imageSrc} alt={c.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 w-full bg-gray-100" />
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {(() => {
                  if (lang === 'ml') {
                    // Try database Malayalam field first, then fallback
                    if (c.name_ml) return c.name_ml;
                    const fallback = malayalamFallbacks[c.name?.toLowerCase()];
                    return fallback?.name || c.name;
                  }
                  return c.name;
                })()}
              </h3>
              {(c.description || c.description_ml) && (
                <p className="text-gray-600 text-sm mt-1">
                  {(() => {
                    if (lang === 'ml') {
                      // Try database Malayalam field first, then fallback
                      if (c.description_ml) return c.description_ml;
                      const fallback = malayalamFallbacks[c.name?.toLowerCase()];
                      return fallback?.description || c.description;
                    }
                    return c.description;
                  })()}
                </p>
              )}
              {Array.isArray(c.cultivationTips) && c.cultivationTips.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">{t.cultivationTips}</h4>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                    {(() => {
                      if (lang === 'ml') {
                        // Try database Malayalam field first, then fallback
                        if (c.cultivationTips_ml && c.cultivationTips_ml.length > 0) {
                          return c.cultivationTips_ml;
                        }
                        const fallback = malayalamFallbacks[c.name?.toLowerCase()];
                        return fallback?.tips || c.cultivationTips;
                      }
                      return c.cultivationTips;
                    })().slice(0, 4).map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
      </div>
    </div>
  );
};

export default CropProfiles;


