import React, { useState, useEffect } from 'react';
import { UserProfile, EmergencyContact } from '../types';

const INITIAL_PROFILE: UserProfile = {
  personalInfo: {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    height: '',
    weight: ''
  },
  medicalHistory: {
    allergies: [],
    conditions: [],
    medications: []
  },
  emergencyContacts: []
};

export const UserProfileView: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'medical' | 'contacts'>('personal');
  const [medicalInputs, setMedicalInputs] = useState({
    allergies: '',
    conditions: '',
    medications: ''
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('nova_user_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('nova_user_profile', JSON.stringify(profile));
    setIsEditing(false);
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addListItem = (category: 'allergies' | 'conditions' | 'medications') => {
    const value = medicalInputs[category];
    if (!value.trim()) return;
    
    setProfile(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [category]: [...prev.medicalHistory[category], value]
      }
    }));
    setMedicalInputs(prev => ({ ...prev, [category]: '' }));
  };

  const removeListItem = (category: 'allergies' | 'conditions' | 'medications', index: number) => {
    setProfile(prev => ({
      ...prev,
      medicalHistory: {
        ...prev.medicalHistory,
        [category]: prev.medicalHistory[category].filter((_, i) => i !== index)
      }
    }));
  };

  const addContact = () => {
    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: '',
      relation: '',
      phone: ''
    };
    setProfile(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, newContact]
    }));
  };

  const updateContact = (id: string, field: keyof EmergencyContact, value: string) => {
    setProfile(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const removeContact = (id: string) => {
    setProfile(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter(c => c.id !== id)
    }));
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Health Profile</h1>
          <p className="text-slate-500">Manage your personal health information</p>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isEditing 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="material-symbols-outlined">{isEditing ? 'save' : 'edit'}</span>
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        {[
          { id: 'personal', label: 'Personal Info', icon: 'person' },
          { id: 'medical', label: 'Medical History', icon: 'medical_services' },
          { id: 'contacts', label: 'Emergency Contacts', icon: 'contact_phone' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-4 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">badge</span>
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text' },
                  { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
                  { label: 'Gender', key: 'gender', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Other'] },
                  { label: 'Blood Type', key: 'bloodType', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
                  { label: 'Height (cm)', key: 'height', type: 'number' },
                  { label: 'Weight (kg)', key: 'weight', type: 'number' }
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                    {isEditing ? (
                      field.type === 'select' ? (
                        <select
                          value={(profile.personalInfo as any)[field.key]}
                          onChange={(e) => updatePersonalInfo(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={(profile.personalInfo as any)[field.key]}
                          onChange={(e) => updatePersonalInfo(field.key, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          placeholder={`Enter ${field.label}`}
                        />
                      )
                    ) : (
                      <div className="text-slate-900 py-2 border-b border-slate-100">
                        {(profile.personalInfo as any)[field.key] || <span className="text-slate-400 italic">Not set</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              {[
                { key: 'allergies', label: 'Allergies', icon: 'warning' },
                { key: 'conditions', label: 'Chronic Conditions', icon: 'healing' },
                { key: 'medications', label: 'Current Medications', icon: 'pill' }
              ].map((section) => (
                <div key={section.key} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">{section.icon}</span>
                    {section.label}
                  </h2>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(profile.medicalHistory as any)[section.key].map((item: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm flex items-center gap-2">
                        {item}
                        {isEditing && (
                          <button 
                            onClick={() => removeListItem(section.key as any, idx)}
                            className="hover:text-red-500"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        )}
                      </span>
                    ))}
                    {(profile.medicalHistory as any)[section.key].length === 0 && !isEditing && (
                      <span className="text-slate-400 italic text-sm">None recorded</span>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={(medicalInputs as any)[section.key]}
                        onChange={(e) => setMedicalInputs(prev => ({ ...prev, [section.key]: e.target.value }))}
                        placeholder={`Add ${section.label.toLowerCase()}...`}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addListItem(section.key as any);
                          }
                        }}
                      />
                      <button 
                        onClick={() => addListItem(section.key as any)}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Emergency Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600">emergency_home</span>
                  Emergency Contacts
                </h2>
                {isEditing && (
                  <button 
                    onClick={addContact}
                    className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg">add_circle</span>
                    Add Contact
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {profile.emergencyContacts.map((contact) => (
                  <div key={contact.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                    {isEditing && (
                      <button 
                        onClick={() => removeContact(contact.id)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        ) : (
                          <div className="font-medium text-slate-900">{contact.name || '-'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Relation</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={contact.relation}
                            onChange={(e) => updateContact(contact.id, 'relation', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        ) : (
                          <div className="text-slate-700">{contact.relation || '-'}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        ) : (
                          <div className="text-slate-700 font-mono">{contact.phone || '-'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {profile.emergencyContacts.length === 0 && (
                  <div className="text-center py-8 text-slate-400 italic">
                    No emergency contacts added yet.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
