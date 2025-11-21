import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: '40px', color: 'white', fontFamily: 'sans-serif', textAlign: 'center', maxWidth: '800px', margin: '0 auto'}}>
          <h1 style={{fontSize: '24px', marginBottom: '20px'}}>Ops! O IsaPlanner encontrou um problema.</h1>
          <div style={{backgroundColor: 'rgba(255,0,0,0.1)', border: '1px solid #ff4444', padding: '20px', borderRadius: '8px', textAlign: 'left', marginBottom: '20px'}}>
             <p style={{fontWeight: 'bold', color: '#ff8888', marginBottom: '10px'}}>Erro técnico:</p>
             <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '14px'}}>
              {this.state.error?.toString()}
            </pre>
          </div>
          <p style={{opacity: 0.8}}>Tente recarregar a página. Se o erro persistir, verifique as configurações de API.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{marginTop: '20px', padding: '10px 20px', background: '#d946ef', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}
          >
            Recarregar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);