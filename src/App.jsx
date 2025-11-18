import React, { useState, useEffect } from 'react';
import { Users, Clock, AlertCircle, Plus, Minus, Trash2, LogOut, UserPlus, Loader, Cloud } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase bağlantısı
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [members, setMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', telegramId: '', duration: 1 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn === 'true') {
      setIsLoggedIn(true);
      loadMembers();
    } else {
      setLoading(false);
    }
  }, []);

  const loadMembers = async () => {
    try {
      setSyncing(true);
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      alert('Veriler yüklenirken hata oluştu!');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // Birden fazla admin ekleyebilirsin
    const validUsers = [
      { username: 'admin', password: 'admin123' },
      { username: 'admin2', password: 'admin456' }
    ];

    const isValid = validUsers.some(
      user => user.username === username && user.password === password
    );

    if (isValid) {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      loadMembers();
    } else {
      alert('Kullanıcı adı veya şifre hatalı!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    setUsername('');
    setPassword('');
  };

  const addMember = async () => {
    if (!newMember.name || !newMember.telegramId) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    try {
      setSyncing(true);
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + newMember.duration);

      const member = {
        id: Date.now(),
        name: newMember.name,
        telegram_id: newMember.telegramId,
        start_date: today.toISOString(),
        end_date: endDate.toISOString(),
        duration: newMember.duration
      };

      const { error } = await supabase.from('members').insert([member]);
      if (error) throw error;

      await loadMembers();
      setShowAddModal(false);
      setNewMember({ name: '', telegramId: '', duration: 1 });
    } catch (error) {
      console.error('Üye ekleme hatası:', error);
      alert('Üye eklenirken hata oluştu!');
    } finally {
      setSyncing(false);
    }
  };

  const adjustDays = async (memberId, days) => {
    try {
      setSyncing(true);
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const newEndDate = new Date(member.end_date);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from('members')
        .update({ end_date: newEndDate.toISOString() })
        .eq('id', memberId);

      if (error) throw error;
      await loadMembers();
    } catch (error) {
      console.error('Gün güncelleme hatası:', error);
      alert('Güncelleme yapılırken hata oluştu!');
    } finally {
      setSyncing(false);
    }
  };

  const deleteMember = async (memberId) => {
    if (!window.confirm('Bu üyeyi silmek istediğinizden emin misiniz?')) return;

    try {
      setSyncing(true);
      const { error } = await supabase.from('members').delete().eq('id', memberId);
      if (error) throw error;
      await loadMembers();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Üye silinirken hata oluştu!');
    } finally {
      setSyncing(false);
    }
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getFilteredMembers = () => {
    return members.filter(member => {
      const daysRemaining = getDaysRemaining(member.end_date);
      if (activeTab === 'active') return daysRemaining > 7;
      if (activeTab === 'expiring') return daysRemaining >= 0 && daysRemaining <= 7;
      if (activeTab === 'expired') return daysRemaining < 0;
      return false;
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem', color: '#3b82f6' }} size={48} />
          <p style={{ fontSize: '1.25rem', color: '#f9f9fa' }}>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' }}>
        <div style={{ width: '100%', maxWidth: '28rem', padding: '2rem', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', backgroundColor: '#1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Cloud size={48} style={{ color: '#3b82f6' }} />
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.5rem', color: '#f9f9fa' }}>
            Telegram Üyelik Yönetimi
          </h1>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#9ca3af' }}>
            ☁️ Bulut Tabanlı - Supabase
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#f9f9fa' }}>
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', outline: 'none', backgroundColor: '#374151', color: '#f9f9fa', border: '2px solid #4b5563' }}
                placeholder="admin"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#f9f9fa' }}>
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', outline: 'none', backgroundColor: '#374151', color: '#f9f9fa', border: '2px solid #4b5563' }}
                placeholder="••••••••"
              />
            </div>
            <button
              onClick={handleLogin}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', backgroundColor: '#3b82f6', color: '#f9f9fa', border: 'none' }}
            >
              Giriş Yap
            </button>
          </div>
          <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
            Admin 1: admin / admin123<br />
            Admin 2: admin2 / admin456
          </p>
        </div>
      </div>
    );
  }

  const filteredMembers = getFilteredMembers();

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem', backgroundColor: '#111827' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#f9f9fa', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Üyelik Yönetim Paneli
              {syncing && <Loader style={{ animation: 'spin 1s linear infinite' }} size={24} />}
            </h1>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cloud size={16} style={{ color: '#10b981' }} />
              Bulut Tabanlı - Her yerden erişilebilir
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: '#10b981', color: '#f9f9fa', border: 'none' }}
            >
              <UserPlus size={20} />
              Yeni Üye Ekle
            </button>
            <button
              onClick={handleLogout}
              style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', backgroundColor: '#ef4444', color: '#f9f9fa', border: 'none' }}
            >
              <LogOut size={20} />
              Çıkış
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              backgroundColor: activeTab === 'active' ? '#10b981' : '#1f2937',
              color: '#f9f9fa',
              border: 'none',
              opacity: activeTab === 'active' ? 1 : 0.6
            }}
          >
            <Users size={20} />
            Aktif Üyeler ({members.filter(m => getDaysRemaining(m.end_date) > 7).length})
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              backgroundColor: activeTab === 'expiring' ? '#f59e0b' : '#1f2937',
              color: '#f9f9fa',
              border: 'none',
              opacity: activeTab === 'expiring' ? 1 : 0.6
            }}
          >
            <Clock size={20} />
            Bitmek Üzere ({members.filter(m => {
              const days = getDaysRemaining(m.end_date);
              return days >= 0 && days <= 7;
            }).length})
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              backgroundColor: activeTab === 'expired' ? '#ef4444' : '#1f2937',
              color: '#f9f9fa',
              border: 'none',
              opacity: activeTab === 'expired' ? 1 : 0.6
            }}
          >
            <AlertCircle size={20} />
            Süresi Bitmiş ({members.filter(m => getDaysRemaining(m.end_date) < 0).length})
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', borderRadius: '0.75rem', backgroundColor: '#1f2937' }}>
              <p style={{ fontSize: '1.125rem', color: '#9ca3af' }}>
                Bu kategoride üye bulunmuyor
              </p>
            </div>
          ) : (
            filteredMembers.map(member => {
              const daysRemaining = getDaysRemaining(member.end_date);
              return (
                <div
                  key={member.id}
                  style={{ padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#1f2937' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#f9f9fa' }}>
                        {member.name}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', color: '#9ca3af' }}>
                        <p>Telegram ID: {member.telegram_id}</p>
                        <p>Başlangıç: {formatDate(member.start_date)}</p>
                        <p>Bitiş: {formatDate(member.end_date)}</p>
                        <p style={{
                          fontWeight: '600',
                          color: daysRemaining > 7 ? '#10b981' : daysRemaining >= 0 ? '#f59e0b' : '#ef4444'
                        }}>
                          {daysRemaining >= 0
                            ? `${daysRemaining} gün kaldı`
                            : `${Math.abs(daysRemaining)} gün geçti`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => adjustDays(member.id, 1)}
                        disabled={syncing}
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', cursor: syncing ? 'not-allowed' : 'pointer', backgroundColor: '#10b981', color: '#f9f9fa', border: 'none', opacity: syncing ? 0.5 : 1 }}
                        title="1 Gün Ekle"
                      >
                        <Plus size={20} />
                      </button>
                      <button
                        onClick={() => adjustDays(member.id, -1)}
                        disabled={syncing}
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', cursor: syncing ? 'not-allowed' : 'pointer', backgroundColor: '#f59e0b', color: '#f9f9fa', border: 'none', opacity: syncing ? 0.5 : 1 }}
                        title="1 Gün Çıkar"
                      >
                        <Minus size={20} />
                      </button>
                      <button
                        onClick={() => deleteMember(member.id)}
                        disabled={syncing}
                        style={{ padding: '0.75rem', borderRadius: '0.5rem', cursor: syncing ? 'not-allowed' : 'pointer', backgroundColor: '#ef4444', color: '#f9f9fa', border: 'none', opacity: syncing ? 0.5 : 1 }}
                        title="Üyeyi Sil"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div style={{ width: '100%', maxWidth: '28rem', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', backgroundColor: '#1f2937' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#f9f9fa' }}>
              Yeni Üye Ekle
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#f9f9fa' }}>
                  İsim Soyisim
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', outline: 'none', backgroundColor: '#374151', color: '#f9f9fa', border: '2px solid #4b5563' }}
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#f9f9fa' }}>
                  Telegram ID
                </label>
                <input
                  type="text"
                  value={newMember.telegramId}
                  onChange={(e) => setNewMember({ ...newMember, telegramId: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', outline: 'none', backgroundColor: '#374151', color: '#f9f9fa', border: '2px solid #4b5563' }}
                  placeholder="@ahmetyilmaz"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#f9f9fa' }}>
                  Üyelik Süresi
                </label>
                <select
                  value={newMember.duration}
                  onChange={(e) => setNewMember({ ...newMember, duration: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', outline: 'none', backgroundColor: '#374151', color: '#f9f9fa', border: '2px solid #4b5563' }}
                >
                  <option value={1}>1 Ay</option>
                  <option value={2}>2 Ay</option>
                  <option value={3}>3 Ay</option>
                  <option value={6}>6 Ay</option>
                  <option value={12}>12 Ay</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                onClick={addMember}
                disabled={syncing}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', cursor: syncing ? 'not-allowed' : 'pointer', backgroundColor: '#10b981', color: '#f9f9fa', border: 'none', opacity: syncing ? 0.5 : 1 }}
              >
                {syncing ? 'Ekleniyor...' : 'Ekle'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewMember({ name: '', telegramId: '', duration: 1 });
                }}
                disabled={syncing}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: '600', cursor: syncing ? 'not-allowed' : 'pointer', backgroundColor: '#6b7280', color: '#f9f9fa', border: 'none', opacity: syncing ? 0.5 : 1 }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;