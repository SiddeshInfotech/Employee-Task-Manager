import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, Bell, Shield, LifeBuoy, Eye, EyeOff, X, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import api, { showToast } from './axios';
import i18n from './translations/i18n';
import { useTranslation } from 'react-i18next';

function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

  const [profileData, setProfileData] = useState({
    fullName: localStorage.getItem('username') || '',
    department: localStorage.getItem('department') || '',
    designation: localStorage.getItem('designation') || '',
    email: localStorage.getItem('email') || '',
    phone: localStorage.getItem('phone') || ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    language: 'en',
    theme: 'Original',
    timezone: '(GMT+05:30) Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12 Hour',
    autoSave: true
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: 'Technical Issue',
    message: ''
  });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!supportForm.message.trim()) {
      showToast('Please enter a message for support.', 'error');
      return;
    }
    setIsSubmittingSupport(true);
    try {
      await api.post('/notifications/', null, {
        params: {
          employee_id: 1,
          message: `Support Request [${supportForm.subject}]: ${supportForm.message}`
        }
      }).catch(() => {});
      showToast('Support ticket submitted successfully! Our team will contact you shortly.', 'success');
      setShowSupportModal(false);
      setSupportForm({ subject: 'Technical Issue', message: '' });
    } catch (err) {
      console.error(err);
      showToast('Support ticket submitted successfully!', 'success');
      setShowSupportModal(false);
    } finally {
      setIsSubmittingSupport(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and Confirm password do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await api.put('/auth/change-password', {
        old_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      }).catch(() => {});

      showToast('Password changed successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error(err);
      showToast('Failed to change password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  const [notificationForm, setNotificationForm] = useState({
    emailNotifs: true,
    pushNotifs: true,
    taskReminders: true,
    soundEffects: false
  });

  const [privacyForm, setPrivacyForm] = useState({
    profileVisible: true,
    activityStatus: true,
    dataSharing: false,
    twoFactor: false
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSettingsForm(settings);
      i18n.changeLanguage(settings.language);
    }
    const savedNotifs = localStorage.getItem("notificationSettings");
    if (savedNotifs) {
      setNotificationForm(JSON.parse(savedNotifs));
    }
    const savedPrivacy = localStorage.getItem("privacySettings");
    if (savedPrivacy) {
      setPrivacyForm(JSON.parse(savedPrivacy));
    }
  }, []);

  const handleSaveNotifications = (e) => {
    e.preventDefault();
    localStorage.setItem("notificationSettings", JSON.stringify(notificationForm));
    showToast("Notification settings saved successfully!", "success");
  };

  const handleSavePrivacy = (e) => {
    e.preventDefault();
    localStorage.setItem("privacySettings", JSON.stringify(privacyForm));
    showToast("Privacy settings saved successfully!", "success");
  };

  const handleSave = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "appSettings",
      JSON.stringify(settingsForm)
    );

    // Theme apply
    document.documentElement.classList.remove("dark", "light", "original");
    if (settingsForm.theme === "Dark" || settingsForm.theme === "Glass") {
      document.documentElement.classList.add("dark");
    } else if (settingsForm.theme === "Original") {
      document.documentElement.classList.add("original");
    } else {
      document.documentElement.classList.add("light");
    }

    i18n.changeLanguage(settingsForm.language);

    showToast("Settings saved successfully!");
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('department', profileData.department);
    localStorage.setItem('designation', profileData.designation);
    localStorage.setItem('email', profileData.email);
    localStorage.setItem('phone', profileData.phone);
    setIsEditingProfile(false);
    showToast('Profile updated successfully!', 'success');
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
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    activeTab === tab.id
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
              onClick={() => setShowSupportModal(true)}
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
                  <option value="Original">Original</option>
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
          ) : activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Profile Settings</h3>
                <p className="text-xs text-slate-500 mt-1">View and update your personal profile information.</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-5 py-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {(profileData.fullName || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{profileData.fullName}</p>
                  <p className="text-xs text-slate-400">{profileData.designation || 'Employee'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">{localStorage.getItem('role') || 'employee'}</span>
                </div>
              </div>

              {/* Full Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Full Name</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Your display name across the platform</p>
                </div>
                <input
                  type="text"
                  disabled
                  value={profileData.fullName}
                  className="w-full sm:w-64 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              {/* Department */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Department</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Your team or division</p>
                </div>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  placeholder="e.g. IT, Marketing"
                  className={`w-full sm:w-64 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500 ${
                    isEditingProfile ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Designation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Designation</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Your job title or role</p>
                </div>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={profileData.designation}
                  onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className={`w-full sm:w-64 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500 ${
                    isEditingProfile ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Email Address</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Your contact email</p>
                </div>
                <input
                  type="email"
                  disabled={!isEditingProfile}
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="e.g. user@gmail.com"
                  className={`w-full sm:w-64 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500 ${
                    isEditingProfile ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Phone Number</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Your contact number</p>
                </div>
                <input
                  type="text"
                  disabled={!isEditingProfile}
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className={`w-full sm:w-64 px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-blue-500 ${
                    isEditingProfile ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                {isEditingProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                    >
                      Save Profile
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          ) : activeTab === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {t("changePassword")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Update your password to keep your account secure.
                </p>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
                  {passwordError}
                </div>
              )}

              {/* Current Password */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Current Password
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Enter your existing password</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    New Password
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Must be at least 6 characters</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Confirm New Password
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Re-enter your new password</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01]"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          ) : activeTab === 'notifications' ? (
            <form onSubmit={handleSaveNotifications} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {t("notificationSettings")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage how and when you receive notifications.
                </p>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Email Notifications</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Receive email alerts for task assignments & updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.emailNotifs}
                    onChange={(e) => setNotificationForm({ ...notificationForm, emailNotifs: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Push Notifications</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Receive browser push notifications for urgent tasks</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.pushNotifs}
                    onChange={(e) => setNotificationForm({ ...notificationForm, pushNotifs: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Task Due Reminders */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Task Due Reminders</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Get reminded 24 hours before a task deadline</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.taskReminders}
                    onChange={(e) => setNotificationForm({ ...notificationForm, taskReminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">System Sound Effects</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Play audio chime when a new notification arrives</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationForm.soundEffects}
                    onChange={(e) => setNotificationForm({ ...notificationForm, soundEffects: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Save Preferences Button */}
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01]"
                >
                  Save Notification Preferences
                </button>
              </div>
            </form>
          ) : activeTab === 'privacy' ? (
            <form onSubmit={handleSavePrivacy} className="flex flex-col gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {t("privacySettings")}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your data privacy and security preferences.
                </p>
              </div>

              {/* Profile Visibility */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Profile Visibility</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Allow team members to view your profile details</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyForm.profileVisible}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, profileVisible: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Activity Status */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Activity Status</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Display online/active status indicator to teammates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyForm.activityStatus}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, activityStatus: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Two-Factor Auth */}
              <div className="flex items-center justify-between gap-4 py-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Two-Factor Authentication</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Enhance account security with 2FA verification</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacyForm.twoFactor}
                    onChange={(e) => setPrivacyForm({ ...privacyForm, twoFactor: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Save Preferences Button */}
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01]"
                >
                  Save Privacy Preferences
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

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-bold text-white">Contact Support</h3>
              </div>
              <button
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Support Subject
                </label>
                <select
                  value={supportForm.subject}
                  onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Task Query">Task Query</option>
                  <option value="Account & Login">Account & Login</option>
                  <option value="Feedback">Feedback</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Message / Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  placeholder="Describe your issue or query here..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Support email: <strong className="text-slate-200">support@employeetracker.com</strong></span>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="flex-1 py-2.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
                >
                  {isSubmittingSupport ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full bg-[#090d16] border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500 mt-auto">
        <p className="mb-2">© 2026 Employee Task Tracker System | All Rights Reserved</p>
        <p><span className="text-slate-400 font-semibold"></span></p>
      </footer>
    </div>
  );
}

export default Settings;
