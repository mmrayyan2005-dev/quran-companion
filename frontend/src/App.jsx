import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import SurahDetail from './pages/SurahDetail';
import JuzDetail from './pages/JuzDetail';
import Search from './pages/Search';
import Bookmarks from './pages/Bookmarks';
import Memorize from './pages/Memorize';
import HadithCollections from './pages/HadithCollections';
import HadithBrowse from './pages/HadithBrowse';
import HadithBookDetail from './pages/HadithBookDetail';
import HadithAll from './pages/HadithAll';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/surah/:surahId" element={<SurahDetail />} />
          <Route path="/juz/:juzNumber" element={<JuzDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/memorize" element={<Memorize />} />
          <Route path="/hadith" element={<HadithCollections />} />
          <Route path="/hadith/:collectionKey" element={<HadithBrowse />} />
          <Route path="/hadith/:collectionKey/all" element={<HadithAll />} />
          <Route path="/hadith/:collectionKey/book/:bookNumber" element={<HadithBookDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </AuthProvider>
  );
}
