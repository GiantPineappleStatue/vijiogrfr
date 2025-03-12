import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppLayout, MainLayout } from './components/Layout';
import ScreenCaptureView from './components/ScreenCapture/ScreenCaptureView';
import AIAssistantView from './components/AIAssistant/AIAssistantView';
import DocumentationView from './components/Documentation/DocumentationView';
import SettingsView from './components/Settings/SettingsView';
import AppInitializer from './components/App/AppInitializer';
import './App.css';

export default function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppInitializer />
        <AppLayout>
          <MainLayout>
            <Routes>
              <Route path="/" element={<ScreenCaptureView />} />
              <Route path="/assistant" element={<AIAssistantView />} />
              <Route path="/documentation" element={<DocumentationView />} />
              <Route path="/settings" element={<SettingsView />} />
            </Routes>
          </MainLayout>
        </AppLayout>
      </Router>
    </Provider>
  );
}
