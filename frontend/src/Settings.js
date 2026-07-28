import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, Bell, Shield, LifeBuoy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { showToast } from './axios';
import i18n from './translations/i18n';
import { useTranslation } from 'react-i18next';

function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [settingsForm, setSettingsForm] = useState({
    language: 'en',
    theme: 'Light',
    timezone: '(GMT+05:30) Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12 Hour',
    autoSave: true
  });
  useEffect(() => {

    const savedSettings = localStorage.getItem("appSettings");

    if (savedSettings) {

      const settings = JSON.parse(savedSettings);

      setSettingsForm(settings);

      i18n.changeLanguage(settings.language);

    }

  }, []);

  const handleSave = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "appSettings",
      JSON.stringify(settingsForm)
    );

    // Theme apply
    if (settingsForm.theme === "Dark") {
      document.documentElement.classList.add("dark");
    }
    else {
      document.documentElement.classList.remove("dark");
    }

    i18n.changeLanguage(settingsForm.language);

    showToast("Settings saved successfully!");
  };

  const tabs = [
    { id: 'general', label: t("generalSettings"), icon: SettingsIcon },
    { id: 'profile', label: t("profileSettings"), icon: User },
    { id: 'password', label: t("changePassword"), icon: Lock },
    { id: 'notifications', label: t("notificationSettings"), icon: Bell },
    { id: 'privacy', label: t("privacySettings"), icon: Shield }
  ];
  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans bg-transparent">
      {/* Sticky top navbar */}
      <Navbar />

      {/* Main Settings Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col lg:flex-row gap-8">
        {/* Left Settings Sidebar */}
        <aside className="w-full lg:w-72 flex flex-col gap-6 flex-shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1.5 backdrop-blur-md shadow-xl">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'profile') {
                      navigate('/profile');
                      return;
                    }
                    setActiveTab(tab.id);
                    if (tab.id !== 'general') {
                      showToast(`Opened ${tab.label} tab`);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                    }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Need Help Box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                {t("needHelp")}
              </h4>

              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t("contactSupportDesc")}
              </p>
            </div>
            <button
              onClick={() => showToast('Connecting to Support Chat...', 'success')}
              className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-semibold rounded-xl text-xs transition-all mt-2"
            >
              {t("contactSupport")}
            </button>
          </div>
        </aside>

        {/* Right Settings Form */}
        <section className="flex-1 bg-white text-slate-800 rounded-2xl shadow-2xl border border-white/20 p-8 max-w-4xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {t("settings")}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t("managePreferences")}
            </p>
          </div>

          {activeTab === 'general' ? (
            <form onSubmit={handleSave} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {t("generalSettings")}
                </h3>
              </div>

              {/* Language Preference */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {t("language")}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t("chooseLanguage")}</p>
                </div>
                <select
                  value={settingsForm.language}
                  onChange={(e) => {

                    const selectedLanguage = e.target.value;

                    setSettingsForm({
                      ...settingsForm,
                      language: selectedLanguage
                    });

                  }}
                  className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                </select>
              </div>

              {/* Theme Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {t("theme")}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{t("selectTheme")}</p>
                </div>
                <select
                  value={settingsForm.theme}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      theme: e.target.value
                    })
                  }
                  className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                  <option value="Glass">Glassmorphism</option>
                </select>
              </div>

              {/* Time Zone */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {t("timeZone")}
                  </h4>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {t("selectTimeZone")}
                  </p>
                </div>
                <select
                  value={settingsForm.timezone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                  className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="(GMT+05:30) Asia/Kolkata">(GMT+05:30) Asia/Kolkata</option>
                  <option value="(GMT+00:00) UTC">(GMT+00:00) UTC</option>
                  <option value="(GMT-05:00) EST">(GMT-05:00) EST</option>
                  <option value="(GMT+09:00) JST">(GMT+09:00) JST</option>
                </select>
              </div>

              {/* Date Format */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {t("dateFormat")}
                  </h4>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {t("chooseDateFormat")}
                  </p>
                </div>
                <select
                  value={settingsForm.dateFormat}
                  onChange={(e) => setSettingsForm({ ...settingsForm, dateFormat: e.target.value })}
                  className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              {/* Time Format */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {t("timeFormat")}
                  </h4>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {t("chooseTimeFormat")}
                  </p>
                </div>
                <select
                  value={settingsForm.timeFormat}
                  onChange={(e) => setSettingsForm({ ...settingsForm, timeFormat: e.target.value })}
                  className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="12 Hour">12 Hour</option>
                  <option value="24 Hour">24 Hour</option>
                </select>
              </div>

              {/* Auto Save Toggle */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {t("autoSave")}
                  </h4>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {t("autoSaveDesc")}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.autoSave}
                    onChange={(e) => {

                      const updated = {
                        ...settingsForm,
                        autoSave: e.target.checked
                      };

                      setSettingsForm(updated);

                      if (updated.autoSave) {
                        localStorage.setItem(
                          "appSettings",
                          JSON.stringify(updated)
                        );
                      }

                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Save changes Button */}
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01]"
                >
                  {t("saveChanges")}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <SettingsIcon className="w-12 h-12 text-slate-300 animate-spin" />
              <p className="font-semibold text-slate-700">Tab Content is Coming Next Attempt</p>
              <button
                onClick={() => setActiveTab('general')}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold"
              >
                Go back to General
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default Settings;
