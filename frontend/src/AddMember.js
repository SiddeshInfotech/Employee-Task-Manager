import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from './api';

function AddMember() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', department: '', email: '', mobile: '', skills: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if(file){
      if(file.size > 2*1024*1024){ alert('Photo 2MB peksha lahan pahijel'); return; }
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if(isSubmitting) return;
    const err = {};
    if (!form.fullName.trim()) err.fullName = true;
    if (!form.department) err.department = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = true;
    const digits = form.mobile.replace(/\D/g, '');
    if (digits.length!== 10) err.mobile = true;
    setErrors(err);
    if (Object.keys(err).length) return;
    setIsSubmitting(true);

    const avatarUrl = photoPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.fullName)}&background=1e3a8a&color=fff&size=200`;
    const payload = {
      name: form.fullName.trim(),
      department: form.department,
      email: form.email,
      phone: `+91 ${digits.slice(0,5)} ${digits.slice(5)}`,
      skills: form.skills,
      status: 'Active',
      avatar: avatarUrl,
      assigned_tasks: 0,
      completed_tasks: 0
    };

    try { await API.post('/team-members/', payload); } catch(e){ console.log("API fail", e); }

    const newMember = {
      id: Date.now(),
      name: form.fullName.trim(),
      dept: form.department,
      email: form.email,
      phone: `+91 ${digits.slice(0,5)} ${digits.slice(5)}`,
      skills: form.skills,
      assigned: 0, completed: 0, status: 'Active',
      avatar: avatarUrl,
      joinDate: new Date().toLocaleDateString()
    };
    const old = JSON.parse(localStorage.getItem('myNewMembers') || '[]');
    localStorage.setItem('myNewMembers', JSON.stringify([...old, newMember]));
    setShowSuccess(true);
    setTimeout(() => navigate('/team'), 1500);
  };

  return (
    <div style={{background:'transparent', padding:'20px'}}>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(40px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pop { 0%{ transform:scale(0) } 60%{ transform:scale(1.2) } 100%{ transform:scale(1) } }
        @keyframes shake { 0%,100%{ transform:translateX(0) } 25%{ transform:translateX(-6px) } 75%{ transform:translateX(6px) } }
        @keyframes pulse { 0%{ box-shadow:0 0 0 0 rgba(30,58,138,0.4) } 70%{ box-shadow:0 0 0 10px rgba(30,58,138,0) } 100%{ box-shadow:0 0 0 0 rgba(30,58,138,0) } }
       .form-card{ animation: slideUp 0.6s ease }
       .input-box{ transition:all 0.3s ease }
       .input-box:focus{ border-color:#1e3a8a!important; box-shadow:0 0 0 3px rgba(30,58,138,0.15) }
       .input-error{ animation: shake 0.35s ease; border-color:#ef4444!important; background:#fef2f2 }
       .btn-hov{ transition:all 0.3s ease; cursor:pointer }
       .btn-hov:hover{ transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.2) }
       .photo-upload{ border:2px dashed #d1d5db; border-radius:12px; padding:20px; text-align:center; cursor:pointer; transition:all 0.3s ease }
       .photo-upload:hover{ border-color:#1e3a8a; background:#eff6ff }
       .photo-preview{ width:90px; height:90px; border-radius:50%; object-fit:cover; border:4px solid #1e3a8a; animation: pulse 2s infinite }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/team')} className="btn-hov" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e3a8a', border: 'none', color: 'white' }}>←</button>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'white' }}>Add New Team Member</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Fill the details below to add a new member</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="form-card" style={{ background: 'white', borderRadius: '14px', width: '100%', maxWidth: '580px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

          <div style={{ marginBottom: '22px', textAlign: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', display:'block', marginBottom:'10px', textAlign:'left' }}>Profile Photo</label>
            <input type="file" id="photo" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            <label htmlFor="photo" className="photo-upload" style={{ display: 'block' }}>
              {photoPreview? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
                  <img src={photoPreview} alt="preview" className="photo-preview" />
                  <span style={{ fontSize:'12px', color:'#1e3a8a', fontWeight:'600' }}>✓ {photo?.name} - Change photo</span>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:'36px' }}>📸</div>
                  <p style={{ margin:'8px 0 4px', fontSize:'13px', fontWeight:'600' }}>Click to upload photo</p>
                  <p style={{ margin:0, fontSize:'11px', color:'#6b7280' }}>PNG, JPG up to 2MB</p>
                </div>
              )}
            </label>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700' }}>Full Name <span style={{color:'red'}}>*</span></label>
            <input value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} placeholder="Enter full name" className={`input-box ${errors.fullName?'input-error':''}`} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', outline:'none', fontSize:'13px', marginTop:'6px', boxSizing:'border-box' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700' }}>Department <span style={{color:'red'}}>*</span></label>
            <select value={form.department} onChange={e=>setForm({...form,department:e.target.value})} className={`input-box ${errors.department?'input-error':''}`} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', outline:'none', fontSize:'13px', marginTop:'6px', boxSizing:'border-box' }}>
              <option value="">Select department</option><option>Marketing</option><option>Development</option><option>Design</option><option>Computer</option><option>HR</option><option>Support</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700' }}>Email <span style={{color:'red'}}>*</span></label>
            <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Enter email" className={`input-box ${errors.email?'input-error':''}`} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', outline:'none', fontSize:'13px', marginTop:'6px', boxSizing:'border-box' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700' }}>Mobile <span style={{color:'red'}}>*</span></label>
            <input value={form.mobile} onChange={e=>setForm({...form,mobile:e.target.value})} maxLength={10} placeholder="Enter mobile number" className={`input-box ${errors.mobile?'input-error':''}`} style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', outline:'none', fontSize:'13px', marginTop:'6px', boxSizing:'border-box' }} />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700' }}>Skills</label>
            <textarea value={form.skills} onChange={e=>setForm({...form, skills:e.target.value})} placeholder="Enter skills" rows={3} className="input-box" style={{ width:'100%', padding:'10px 12px', borderRadius:'8px', border:'1px solid #d1d5db', outline:'none', fontSize:'13px', marginTop:'6px', boxSizing:'border-box' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <button className="btn-hov" onClick={() => navigate('/team')} style={{ padding:'9px 22px', borderRadius:'8px', border:'1px solid #fecaca', background:'white', color:'#dc2626', fontWeight:'700', fontSize:'12px' }}>✕ Cancel</button>
            <button className="btn-hov" onClick={handleSubmit} disabled={isSubmitting} style={{ padding:'9px 22px', borderRadius:'8px', border:'none', background: isSubmitting? '#9ca3af' : '#1e3a8a', color:'white', fontWeight:'700', fontSize:'12px' }}>{isSubmitting? 'Adding...' : '✓ Submit via API'}</button>
          </div>

        </div>
      </div>

      {showSuccess && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999 }}>
          <div style={{ background:'white', padding:'32px', borderRadius:'20px', textAlign:'center', animation:'pop 0.6s ease' }}>
            <img src={photoPreview || `https://ui-avatars.com/api/?name=${form.fullName}`} alt="added" style={{ width:'80px', height:'80px', borderRadius:'50%', margin:'0 auto 12px', display:'block', border:'3px solid #22c55e' }} />
            <h2 style={{ margin:'0 0 6px' }}>Member Added via API!</h2>
            <p style={{ margin:0, fontSize:'13px', color:'#6b7280' }}>{form.fullName} added 🎉</p>
          </div>
        </div>
      )}
    </div>
  );
}
export default AddMember;