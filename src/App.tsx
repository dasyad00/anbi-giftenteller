import { Provider as RollbarProvider, ErrorBoundary } from '@rollbar/react';
import rollbar from './lib/rollbar';
import { Layout } from './components/Layout';
import Home from './pages/Home';

export default function App() {
  return (
    <RollbarProvider instance={rollbar}>
      <ErrorBoundary>
        <Layout>
          <Home />
        </Layout>
      </ErrorBoundary>
    </RollbarProvider>
  );
}
