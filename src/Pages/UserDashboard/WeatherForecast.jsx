import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MapWithWeather from '../../Components/MapWithWeather';

const WeatherForecast = () => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('ag_lang') || 'en'; } catch(_) { return 'en'; }
  });

  const t = {
    en: {
      title: 'Weather Forecast 🌤️',
      subtitle: 'Interactive weather map to help you plan your farming activities based on current and forecasted weather conditions.',
      clickHint: 'Click on the map to view weather data',
      inIndia: 'for any location in India',
      mapTitle: 'Interactive Weather Map',
      tipsTitle: 'Weather-Based Farming Tips',
      rainy: 'Rainy Weather',
      rainyTips: ['Avoid heavy machinery on wet soil','Check drainage systems','Monitor for disease outbreaks','Consider delayed planting'],
      hotDry: 'Hot & Dry Weather',
      hotDryTips: ['Increase irrigation frequency','Apply mulch to retain moisture','Water early morning or evening','Monitor soil moisture levels'],
      windy: 'Windy Conditions',
      windyTips: ['Secure greenhouse structures','Avoid spraying pesticides','Check for wind damage','Consider windbreaks'],
      temp: 'Temperature Changes',
      tempTips: ['Monitor frost warnings','Adjust planting schedules','Protect sensitive crops','Plan harvest timing']
    },
    ml: {
      title: 'കാലാവസ്ഥ പ്രവചനം 🌤️',
      subtitle: 'ഇന്ററാക്ടീവ് കാലാവസ്ഥ മാപ് ഉപയോഗിച്ച് നിലവിലെ/പ്രവചിച്ച കാലാവസ്ഥ അടിസ്ഥാനമാക്കി കൃഷി പ്രവർത്തനങ്ങൾ പ്ലാൻ ചെയ്യാം.',
      clickHint: 'കാലാവസ്ഥ ഡാറ്റ കാണാൻ മാപ്പിൽ ക്ലിക്ക് ചെയ്യുക',
      inIndia: 'ഇന്ത്യയിലെ ഏതൊരു സ്ഥലത്തിനും',
      mapTitle: 'ഇന്ററാക്ടീവ് കാലാവസ്ഥ മാപ്പ്',
      tipsTitle: 'കാലാവസ്ഥയെ അടിസ്ഥാനമാക്കിയുള്ള കൃഷി നിർദ്ദേശങ്ങൾ',
      rainy: 'മഴക്കാലാവസ്ഥ',
      rainyTips: ['നനഞ്ഞ മണ്ണിൽ ഭാരമുള്ള യന്ത്രങ്ങൾ ഒഴിവാക്കുക','ഡ്രെയിനേജ് സംവിധാനം പരിശോധിക്കുക','രോഗാവസ്ഥ നിരീക്ഷിക്കുക','വിത്തിടൽ വൈകിപ്പിക്കൽ പരിഗണിക്കുക'],
      hotDry: 'ചൂടും വരണ്ടതും',
      hotDryTips: ['ജലസേചനം വർധിപ്പിക്കുക','തേൻചട്ട (മൾച്ച്) ഉപയോഗിച്ച് ഈർപ്പം നിലനിർത്തുക','പുലർച്ചെ/വൈകുന്നേരം വെള്ളം നൽകുക','മണ്ണിലെ ഈർപ്പം നിരീക്ഷിക്കുക'],
      windy: 'കാറ്റുള്ള അവസ്ഥ',
      windyTips: ['ഗ്രീൻഹൗസ് ഘടനകൾ ഉറപ്പിക്കുക','കീടനാശിനി തളിക്കുക ഒഴിവാക്കുക','കാറ്റ് നാശം പരിശോധിക്കുക','കാറ്റുതടയണികൾ പരിഗണിക്കുക'],
      temp: 'താപനില മാറ്റങ്ങൾ',
      tempTips: ['ഫ്രോസ്റ്റ് മുന്നറിയിപ്പ് ശ്രദ്ധിക്കുക','വിത്തിടൽ ഷെഡ്യൂളുകൾ ക്രമീകരിക്കുക','സെൻസിറ്റീവ് വിളകൾ സംരക്ഷിക്കുക','റീപ്പിംഗ് സമയം പ്ലാൻ ചെയ്യുക']
    }
  }[lang];

  useEffect(() => {
    const handler = (e) => setLang(e?.detail || 'en');
    window.addEventListener('langChanged', handler);
    return () => window.removeEventListener('langChanged', handler);
  }, []);
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
        <div className="pointer-events-none absolute -left-12 -bottom-20 w-72 h-72 rounded-full opacity-10 ag-cta-gradient blur-3xl" />
        <div className="ag-hero-gradient p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="ag-display text-2xl md:text-3xl font-bold text-gray-900">{t.title}</h2>
              <p className="text-gray-600 mt-1 text-sm md:text-base">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm text-gray-600">{t.clickHint}</p>
                <p className="text-xs text-gray-500">{t.inIndia}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weather Map */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="ag-card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.mapTitle}</h3>
        <MapWithWeather />
      </motion.div>

      {/* Weather Tips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="ag-card p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t.tipsTitle}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t.rainy}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {t.rainyTips.map((tip, i) => (<li key={`r-${i}`}>• {tip}</li>))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t.hotDry}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {t.hotDryTips.map((tip, i) => (<li key={`h-${i}`}>• {tip}</li>))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t.windy}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {t.windyTips.map((tip, i) => (<li key={`w-${i}`}>• {tip}</li>))}
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">{t.temp}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {t.tempTips.map((tip, i) => (<li key={`t-${i}`}>• {tip}</li>))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WeatherForecast;
