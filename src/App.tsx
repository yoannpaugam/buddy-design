import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useStore } from './store/store';
import { TabBar } from './components/TabBar';
import { Toasts } from './components/ui';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { FiltersPage } from './pages/Filters';
import { EventDetail, Participants } from './pages/EventDetail';
import { CallCompose, CallResponses } from './pages/Call';
import { Publish } from './pages/Publish';
import { Agenda } from './pages/Agenda';
import { Conversation, Directory, MessagesList, Requests } from './pages/Messages';
import { BuddyProfile, BuddySearch, GroupCreate, GroupDetail, GroupSettings } from './pages/Social';
import { Notifications } from './pages/Notifications';
import { Faq, MyProfile, ProfileEdit, SettingsPage, VisibilityPage } from './pages/Profile';

const TAB_ROUTES = ['/', '/explorer', '/agenda', '/messages'];

export function App() {
  const { s } = useStore();
  const loc = useLocation();

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = s.settings.dark ? 'dark' : 'light';
    el.dataset.text = s.settings.largeText ? 'large' : 'normal';
    el.dataset.motion = s.settings.reduceMotion ? 'reduce' : 'normal';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.settings.dark ? '#12121f' : '#1A1A2E');
  }, [s.settings]);

  // remonter en haut à chaque changement d'écran
  useEffect(() => {
    document.querySelector('.screen')?.scrollTo({ top: 0 });
  }, [loc.pathname]);

  if (!s.onboarded) {
    return (
      <div className="app">
        <Onboarding />
        <Toasts />
      </div>
    );
  }

  const showTabs = TAB_ROUTES.includes(loc.pathname);

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explorer" element={<Explore />} />
        <Route path="/filtres" element={<FiltersPage />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/event/:id/participants" element={<Participants />} />
        <Route path="/event/:id/appel" element={<CallCompose />} />
        <Route path="/appel/:id" element={<CallResponses />} />
        <Route path="/publier" element={<Publish />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/messages" element={<MessagesList />} />
        <Route path="/messages/demandes" element={<Requests />} />
        <Route path="/messages/annuaire" element={<Directory />} />
        <Route path="/messages/:id" element={<Conversation />} />
        <Route path="/buddy/:id" element={<BuddyProfile />} />
        <Route path="/buddies/rechercher" element={<BuddySearch />} />
        <Route path="/groupes/nouveau" element={<GroupCreate />} />
        <Route path="/groupe/:id" element={<GroupDetail />} />
        <Route path="/groupe/:id/parametres" element={<GroupSettings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profil" element={<MyProfile />} />
        <Route path="/profil/modifier" element={<ProfileEdit />} />
        <Route path="/profil/visibilite" element={<VisibilityPage />} />
        <Route path="/parametres" element={<SettingsPage />} />
        <Route path="/aide" element={<Faq />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showTabs && <TabBar />}
      <Toasts />
    </div>
  );
}
